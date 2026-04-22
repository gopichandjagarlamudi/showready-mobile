import type { DiagnosticsStorage } from "./store"
import { createResilientDiagnosticsStorage } from "./resilient-storage"

describe("createResilientDiagnosticsStorage", () => {
  it("falls back to in-memory storage when the primary storage throws", async () => {
    const primaryStorage: DiagnosticsStorage = {
      getItem: jest.fn(async () => {
        throw new Error("Native module is null")
      }),
      setItem: jest.fn(async () => {
        throw new Error("Native module is null")
      }),
      removeItem: jest.fn(async () => {
        throw new Error("Native module is null")
      })
    }

    const storage = createResilientDiagnosticsStorage(primaryStorage)

    await expect(storage.getItem("diagnostics")).resolves.toBeNull()

    await expect(storage.setItem("diagnostics", "queued")).resolves.toBeUndefined()
    await expect(storage.getItem("diagnostics")).resolves.toBe("queued")

    await expect(storage.removeItem("diagnostics")).resolves.toBeUndefined()
    await expect(storage.getItem("diagnostics")).resolves.toBeNull()
  })
})
