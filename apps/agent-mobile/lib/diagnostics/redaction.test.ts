import { sanitizeDiagnosticsMetadata } from "./redaction"

describe("sanitizeDiagnosticsMetadata", () => {
  it("removes blocked keys recursively while preserving safe debugging context", () => {
    expect(
      sanitizeDiagnosticsMetadata({
        route: "/home",
        leadId: "lead-1",
        email: "buyer@example.com",
        notes: "private note",
        nested: {
          authToken: "secret-token",
          pipelineStage: "ready_to_show"
        },
        crumbs: [
          {
            address: "123 Test Street",
            route: "/pipeline"
          }
        ]
      })
    ).toEqual({
      route: "/home",
      leadId: "lead-1",
      nested: {
        pipelineStage: "ready_to_show"
      },
      crumbs: [
        {
          route: "/pipeline"
        }
      ]
    })
  })
})
