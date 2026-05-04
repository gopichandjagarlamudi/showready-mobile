import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("scale hardening SQL migrations", () => {
  it("keeps lead contact retention deletes indexed and batch bounded", () => {
    const sql = readFileSync(
      new URL("./2026-05-03-lead-contact-interactions.sql", import.meta.url),
      "utf8"
    )

    expect(sql).toContain("lead_contact_interactions_occurred_at_idx")
    expect(sql).toContain("greatest(1, least(coalesce(p_batch_size, 5000), 50000))")
  })

  it("finalizes intake submission through a transactional function", () => {
    const sql = readFileSync(
      new URL("./2026-05-01-scale-hardening.sql", import.meta.url),
      "utf8"
    )

    expect(sql).toContain("create or replace function public.finalize_submitted_invite")
    expect(sql).toContain("for update")
    expect(sql).toContain("on conflict do nothing")
    expect(sql).toContain(
      "grant execute on function public.finalize_submitted_invite(uuid, uuid, numeric, text, text, jsonb) to service_role"
    )
  })
})
