import type { Metadata } from "next"
import { LegalPage, LegalSection, SupportMailLink } from "@/components/legal-page"
import { SUPPORT_EMAIL } from "@/lib/legal"

export const metadata: Metadata = {
  title: "Support | ShowReady",
  description: "Contact ShowReady support."
}

export default function SupportPage() {
  return (
    <LegalPage title="Support" eyebrow="ShowReady contact">
      <LegalSection title="Contact Support">
        <p>
          For app support, account questions, privacy questions, export help, or deletion requests,
          email <SupportMailLink>{SUPPORT_EMAIL}</SupportMailLink>.
        </p>
      </LegalSection>

      <LegalSection title="What To Include">
        <p>
          Include the email address on your ShowReady account, the workspace or lead involved if
          relevant, the device platform you use, and a short description of the request. Do not
          include passwords or unnecessary client details in support email.
        </p>
      </LegalSection>

      <LegalSection title="Deletion Requests">
        <p>
          Account and data deletion requests can be initiated from mobile Settings or from the
          account deletion web page. Support may ask for verification before processing a request.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
