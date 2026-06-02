import { resolveBetterToLiveApiBaseUrl } from "@/features/bettertolive/api/config"

export class BetterToLiveApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: unknown,
  ) {
    super(message)
    this.name = "BetterToLiveApiError"
  }
}

export async function requestJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${resolveBetterToLiveApiBaseUrl()}${path}`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    let payload: unknown

    try {
      payload = await response.json()
    } catch {
      payload = await response.text()
    }

    throw new BetterToLiveApiError(
      `BetterToLive API request failed: ${response.status}`,
      response.status,
      payload,
    )
  }

  return (await response.json()) as T
}
