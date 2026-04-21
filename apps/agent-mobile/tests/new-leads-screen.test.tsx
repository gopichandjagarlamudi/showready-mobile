import { render, waitFor } from "@testing-library/react-native"
import NewLeadsScreen from "../app/(app)/new-leads"

jest.mock("../providers/session-provider", () => ({
  useSession: jest.fn(),
  useMobileApi: jest.fn()
}))

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn()
  }
}))

const { useSession, useMobileApi } = jest.requireMock("../providers/session-provider") as {
  useSession: jest.Mock
  useMobileApi: jest.Mock
}

describe("NewLeadsScreen", () => {
  let workspaceVersion = 0
  const session = {
    user: {
      id: "agent-1"
    }
  }
  const api = {
    listNewLeads: jest.fn(async () => [])
  }

  beforeEach(() => {
    workspaceVersion = 0
    api.listNewLeads.mockClear()

    useSession.mockImplementation(() => ({
      session,
      workspaceVersion
    }))

    useMobileApi.mockImplementation(() => api)
  })

  it("reloads the review queue when the workspace refresh version changes", async () => {
    const screen = render(<NewLeadsScreen />)

    await waitFor(() => {
      expect(api.listNewLeads).toHaveBeenCalledTimes(1)
    })

    workspaceVersion = 1
    screen.rerender(<NewLeadsScreen />)

    await waitFor(() => {
      expect(api.listNewLeads).toHaveBeenCalledTimes(2)
    })
  })
})
