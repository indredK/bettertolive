import { CURRENT_EXPORT_VERSION } from "@/features/bettertolive/api/import-export/types"

type MigrationFn = (data: Record<string, unknown>) => Record<string, unknown>

const migrations: Record<number, MigrationFn> = {
  // Future migrations go here:
  // 1: v1ToV2,
}

export function migrateToCurrent(raw: Record<string, unknown>): Record<string, unknown> {
  let version = (raw.version as number) ?? 1
  let data = raw.data as Record<string, unknown>

  if (version > CURRENT_EXPORT_VERSION) {
    throw new Error(
      `Export file is from a newer version (v${version}). Please update BetterToLive to import this file.`,
    )
  }

  while (version < CURRENT_EXPORT_VERSION) {
    const migrateFn = migrations[version]
    if (migrateFn) {
      data = migrateFn(data)
    }
    version++
  }

  return { ...raw, version: CURRENT_EXPORT_VERSION, data }
}
