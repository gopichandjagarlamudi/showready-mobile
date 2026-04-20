import { CreateInviteResponseSchema } from "@showready/contracts"

export function serializeInviteResponse(input: {
  token: string
  tokenExpiresAt: string
  appUrl: string
}) {
  const normalizedAppUrl = input.appUrl.trim().replace(/\/+$/, "")

  return CreateInviteResponseSchema.parse({
    token: input.token,
    shareUrl: `${normalizedAppUrl}/intake/${input.token}`,
    expiresAt: new Date(input.tokenExpiresAt).toISOString()
  })
}
