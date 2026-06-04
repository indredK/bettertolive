use crate::shopping::dto::ShoppingModuleDto;
use rusqlite::Connection;

pub struct ShoppingRepository;

impl ShoppingRepository {
    /// Read the shopping module content from the database.
    /// Returns the parsed DTO, or a default empty DTO if no content is found.
    pub fn get_shopping_module(conn: &Connection) -> Result<ShoppingModuleDto, String> {
        let result: Result<String, rusqlite::Error> = conn.query_row(
            "SELECT content_json FROM shopping_module_content WHERE module_key = 'shopping' ORDER BY version DESC LIMIT 1",
            [],
            |row| row.get(0),
        );

        match result {
            Ok(json_str) => serde_json::from_str::<ShoppingModuleDto>(&json_str)
                .map_err(|e| format!("Failed to deserialize shopping module content: {}", e)),
            Err(rusqlite::Error::QueryReturnedNoRows) => {
                // Return default empty DTO if no data found
                Ok(ShoppingModuleDto::default())
            }
            Err(e) => Err(format!("Database error: {}", e)),
        }
    }
}
