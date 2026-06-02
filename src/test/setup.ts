import "@testing-library/jest-dom/vitest"

function createMemoryStorage(): Storage {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key) {
      return store.has(key) ? store.get(key)! : null
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null
    },
    removeItem(key) {
      store.delete(key)
    },
    setItem(key, value) {
      store.set(key, String(value))
    },
  }
}

const localStorageShim = createMemoryStorage()
const sessionStorageShim = createMemoryStorage()

Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: localStorageShim,
})

Object.defineProperty(window, "sessionStorage", {
  configurable: true,
  value: sessionStorageShim,
})
