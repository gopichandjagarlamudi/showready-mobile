import { IntakeFlow } from "@/components/intake-flow"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { getLeadIntakeContext } from "@/lib/supabase/data"

export default async function IntakePage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = createSupabaseAdminClient()
  const context = await getLeadIntakeContext(supabase, token)

  if (!context) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Invite not found</h1>
        <p>This invite may have expired or already been removed.</p>
      </main>
    )
  }

  if (context.isExpired) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Invite expired</h1>
        <p>This intake link has expired. Please request a fresh invite from your agent.</p>
      </main>
    )
  }

  return (
    <IntakeFlow
      token={token}
      draft={context.draft}
      saleTemplate={context.templates.sale}
      rentalTemplate={context.templates.rental}
      requiredQuestions={context.questions.required}
      optionalQuestions={context.questions.optional}
    />
  )
}
