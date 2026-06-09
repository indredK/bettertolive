import type {
  RelationshipCircle,
  RelationshipConnection,
  RelationshipConnectionRole,
  RelationshipConnectionStrength,
  RelationshipMap,
  RelationshipPerson,
} from "@/features/bettertolive/types"

export type RelationshipConnectionRoleInput = {
  id?: string
  note?: string
  otherRole: string
  selfRole: string
}

export type RelationshipConnectionInput = {
  id?: string
  note?: string
  otherRelationshipId: string
  roles: RelationshipConnectionRoleInput[]
  strength: RelationshipConnectionStrength
}

export type RelationshipConnectionPerspectiveRole = {
  id: string
  note: string
  otherRole: string
  selfRole: string
}

export type RelationshipConnectionPerspective = {
  id: string
  note: string
  otherRelationshipId: string
  roles: RelationshipConnectionPerspectiveRole[]
  strength: RelationshipConnectionStrength
}

const CONNECTION_STRENGTH_ORDER: Record<RelationshipConnectionStrength, number> = {
  强: 3,
  中: 2,
  弱: 1,
}

export function normalizeRelationshipsModuleData(
  relationshipsModule: RelationshipMap | undefined,
): RelationshipMap {
  const source = (relationshipsModule ?? {}) as Partial<RelationshipMap>
  const circles = (source.circles ?? []).map((circle) => ({
    ...circle,
    entries: circle.entries ?? [],
  }))
  const patterns = source.patterns ?? []
  const unsentNotes = source.unsentNotes ?? []
  const relationshipIds = new Set(getRelationshipsFromCircles(circles).map((entry) => entry.id))

  return syncUnsentLineRefs({
    circles,
    connections: normalizeRelationshipConnections(source.connections ?? [], relationshipIds),
    patterns,
    unsentNotes,
  })
}

export function normalizeRelationshipConnections(
  connections: RelationshipConnection[],
  validRelationshipIds: Set<string>,
) {
  const mergedByPair = new Map<string, RelationshipConnection>()

  connections.forEach((connection) => {
    const normalized = normalizeSingleConnection(connection, validRelationshipIds)
    if (!normalized) {
      return
    }

    const key = createRelationshipConnectionPairKey(normalized.sourceId, normalized.targetId)
    const existing = mergedByPair.get(key)

    if (!existing) {
      mergedByPair.set(key, normalized)
      return
    }

    mergedByPair.set(key, mergeRelationshipConnections(existing, normalized))
  })

  return [...mergedByPair.values()]
}

export function buildRelationshipConnectionPerspectives(
  connections: RelationshipConnection[],
  relationshipId: string,
) {
  return connections
    .filter(
      (connection) =>
        connection.sourceId === relationshipId || connection.targetId === relationshipId,
    )
    .map((connection) => {
      const isSourcePerspective = connection.sourceId === relationshipId

      return {
        id: connection.id,
        note: connection.note,
        otherRelationshipId: isSourcePerspective ? connection.targetId : connection.sourceId,
        roles: connection.roles.map((role) => ({
          id: role.id,
          note: role.note,
          otherRole: isSourcePerspective ? role.targetRole : role.sourceRole,
          selfRole: isSourcePerspective ? role.sourceRole : role.targetRole,
        })),
        strength: connection.strength,
      } satisfies RelationshipConnectionPerspective
    })
}

export function mergeConnectionsForRelationship({
  allConnections,
  relationshipId,
  rows,
}: {
  allConnections: RelationshipConnection[]
  relationshipId: string
  rows: RelationshipConnectionInput[]
}) {
  const validRelationshipIds = new Set(
    [
      relationshipId,
      ...allConnections.flatMap((connection) => [connection.sourceId, connection.targetId]),
      ...rows.map((row) => row.otherRelationshipId),
    ].filter(Boolean),
  )
  const preserved = allConnections.filter(
    (connection) =>
      connection.sourceId !== relationshipId && connection.targetId !== relationshipId,
  )
  const rebuiltConnections = rows
    .map((row) => createConnectionFromPerspectiveRow(row, relationshipId))
    .filter((connection): connection is RelationshipConnection => Boolean(connection))

  return normalizeRelationshipConnections(
    [...preserved, ...rebuiltConnections],
    validRelationshipIds,
  )
}

export function removeConnectionsForRelationship(
  connections: RelationshipConnection[],
  relationshipId: string,
) {
  return connections.filter(
    (connection) =>
      connection.sourceId !== relationshipId && connection.targetId !== relationshipId,
  )
}

export function syncUnsentLineRefs(relationshipsModule: RelationshipMap): RelationshipMap {
  return {
    ...relationshipsModule,
    circles: relationshipsModule.circles.map((circle) => ({
      ...circle,
      entries: circle.entries.map((relationship) => ({
        ...relationship,
        unsentLineIds: relationshipsModule.unsentNotes
          .filter((note) => note.relationshipId === relationship.id)
          .map((note) => note.id),
      })),
    })),
  }
}

export function getRelationshipsFromCircles(circles: RelationshipCircle[]) {
  return circles.flatMap((circle) => circle.entries)
}

export function createRelationshipConnectionPairKey(sourceId: string, targetId: string) {
  const [stableSourceId, stableTargetId] = sortRelationshipPair(sourceId, targetId)
  return `${stableSourceId}::${stableTargetId}`
}

export function sortRelationshipPair(sourceId: string, targetId: string) {
  return sourceId <= targetId ? [sourceId, targetId] : [targetId, sourceId]
}

export function createRelationshipScopedId(prefix: string) {
  const randomId =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  return `${prefix}-${randomId}`
}

function normalizeSingleConnection(
  connection: RelationshipConnection,
  validRelationshipIds: Set<string>,
) {
  const sourceId = `${connection.sourceId ?? ""}`.trim()
  const targetId = `${connection.targetId ?? ""}`.trim()

  if (
    !sourceId ||
    !targetId ||
    sourceId === targetId ||
    !validRelationshipIds.has(sourceId) ||
    !validRelationshipIds.has(targetId)
  ) {
    return null
  }

  const [stableSourceId, stableTargetId] = sortRelationshipPair(sourceId, targetId)
  const shouldSwapRoles = stableSourceId !== sourceId
  const roles = dedupeConnectionRoles(
    (connection.roles ?? [])
      .map((role) => sanitizeConnectionRole(role, shouldSwapRoles))
      .filter((role): role is RelationshipConnectionRole => Boolean(role)),
  )

  if (roles.length === 0) {
    return null
  }

  return {
    id: `${connection.id ?? ""}`.trim() || createRelationshipScopedId("relationship-connection"),
    note: `${connection.note ?? ""}`.trim(),
    roles,
    sourceId: stableSourceId,
    strength: sanitizeStrength(connection.strength),
    targetId: stableTargetId,
  } satisfies RelationshipConnection
}

function sanitizeConnectionRole(role: RelationshipConnectionRole, shouldSwapRoles: boolean) {
  const sourceRole = `${role.sourceRole ?? ""}`.trim()
  const targetRole = `${role.targetRole ?? ""}`.trim()
  const note = `${role.note ?? ""}`.trim()

  if (!sourceRole || !targetRole) {
    return null
  }

  return {
    id: `${role.id ?? ""}`.trim() || createRelationshipScopedId("relationship-connection-role"),
    note,
    sourceRole: shouldSwapRoles ? targetRole : sourceRole,
    targetRole: shouldSwapRoles ? sourceRole : targetRole,
  } satisfies RelationshipConnectionRole
}

function dedupeConnectionRoles(roles: RelationshipConnectionRole[]) {
  const roleByKey = new Map<string, RelationshipConnectionRole>()

  roles.forEach((role) => {
    const key = [
      role.sourceRole.trim().toLowerCase(),
      role.targetRole.trim().toLowerCase(),
      role.note.trim().toLowerCase(),
    ].join("::")

    if (!roleByKey.has(key)) {
      roleByKey.set(key, role)
    }
  })

  return [...roleByKey.values()]
}

function mergeRelationshipConnections(
  first: RelationshipConnection,
  second: RelationshipConnection,
) {
  return {
    id: first.id,
    note: first.note || second.note,
    roles: dedupeConnectionRoles([...first.roles, ...second.roles]),
    sourceId: first.sourceId,
    strength:
      CONNECTION_STRENGTH_ORDER[first.strength] >= CONNECTION_STRENGTH_ORDER[second.strength]
        ? first.strength
        : second.strength,
    targetId: first.targetId,
  } satisfies RelationshipConnection
}

function createConnectionFromPerspectiveRow(
  row: RelationshipConnectionInput,
  relationshipId: string,
) {
  const otherRelationshipId = row.otherRelationshipId.trim()

  if (!otherRelationshipId || otherRelationshipId === relationshipId) {
    return null
  }

  const [sourceId, targetId] = sortRelationshipPair(relationshipId, otherRelationshipId)
  const isSourcePerspective = sourceId === relationshipId
  const roles = dedupeConnectionRoles(
    row.roles
      .map((role) => {
        const selfRole = role.selfRole.trim()
        const otherRole = role.otherRole.trim()
        const note = `${role.note ?? ""}`.trim()

        if (!selfRole || !otherRole) {
          return null
        }

        return {
          id: role.id?.trim() || createRelationshipScopedId("relationship-connection-role"),
          note,
          sourceRole: isSourcePerspective ? selfRole : otherRole,
          targetRole: isSourcePerspective ? otherRole : selfRole,
        } satisfies RelationshipConnectionRole
      })
      .filter((role): role is RelationshipConnectionRole => Boolean(role)),
  )

  if (roles.length === 0) {
    return null
  }

  return {
    id: row.id?.trim() || createRelationshipScopedId("relationship-connection"),
    note: `${row.note ?? ""}`.trim(),
    roles,
    sourceId,
    strength: sanitizeStrength(row.strength),
    targetId,
  } satisfies RelationshipConnection
}

function sanitizeStrength(strength: RelationshipConnectionStrength | undefined) {
  if (strength === "强" || strength === "中" || strength === "弱") {
    return strength
  }

  return "中"
}

export function createRelationshipLookup(relationships: RelationshipPerson[]) {
  return new Map(relationships.map((relationship) => [relationship.id, relationship]))
}
