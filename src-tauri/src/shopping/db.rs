use rusqlite::{Connection, Result as SqliteResult};
use std::path::Path;

/// Create or open the SQLite database and ensure the schema is set up.
pub fn initialize_database(db_path: &Path) -> SqliteResult<Connection> {
    let conn = Connection::open(db_path)?;

    // Enable WAL mode for better read concurrency
    conn.execute_batch("PRAGMA journal_mode=WAL;")?;

    // Create the shopping module content table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS shopping_module_content (
            id TEXT PRIMARY KEY,
            module_key TEXT NOT NULL UNIQUE,
            content_json TEXT NOT NULL,
            version INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            CHECK (json_valid(content_json))
        )",
        [],
    )?;

    // Seed data if the table is empty
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM shopping_module_content WHERE module_key = 'shopping'",
        [],
        |row| row.get(0),
    )?;

    if count == 0 {
        seed_shopping_data(&conn)?;
    }

    Ok(conn)
}

fn seed_shopping_data(conn: &Connection) -> SqliteResult<()> {
    let seed_json = include_str!("seed.json");
    let now = chrono_now();

    conn.execute(
        "INSERT INTO shopping_module_content (id, module_key, content_json, version, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![
            "seed-shopping-001",
            "shopping",
            seed_json,
            1,
            now,
            now,
        ],
    )?;

    Ok(())
}

/// Get current time as ISO 8601 string.
fn chrono_now() -> String {
    // Simple ISO 8601 format without external chrono dependency
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    let secs = now.as_secs();

    // Convert to a simple date-time string
    let days_since_epoch = secs / 86400;
    let time_of_day = secs % 86400;

    let hours = time_of_day / 3600;
    let minutes = (time_of_day % 3600) / 60;
    let seconds = time_of_day % 60;

    // Calculate year/month/day from days_since_epoch (simplified but works for 1970-2099)
    let mut year = 1970i64;
    let mut remaining_days = days_since_epoch as i64;

    loop {
        let days_in_year = if is_leap_year(year) { 366 } else { 365 };
        if remaining_days < days_in_year {
            break;
        }
        remaining_days -= days_in_year;
        year += 1;
    }

    let month_days = if is_leap_year(year) {
        [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    } else {
        [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    };

    let mut month = 1;
    for &md in month_days.iter() {
        if remaining_days < md {
            break;
        }
        remaining_days -= md;
        month += 1;
    }

    let day = remaining_days + 1;

    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        year, month, day, hours, minutes, seconds
    )
}

fn is_leap_year(year: i64) -> bool {
    (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)
}
