import type { Metadata } from "next"
import { LegalPage, LegalSection, SupportMailLink } from "@/components/legal-page"
import { SUPPORT_EMAIL, TERMS_EFFECTIVE_DATE } from "@/lib/legal"

export const metadata: Metadata = {
  title: "Terms of Use | ShowReady",
  description: "ShowReady terms of use."
}

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" eyebrow={`Effective ${TERMS_EFFECTIVE_DATE}`}>
      <LegalSection title="Use Of ShowReady">
        <p>
          ShowReady is a real estate lead intake and agent workflow tool. You are responsible for
          the accuracy of information you enter, for your use of lead and client records, and for
          complying with laws, brokerage rules, professional duties, and client instructions that
          apply to your real estate work.
        </p>
      </LegalSection>

      <LegalSection title="Accounts And Access">
        <p>
          Keep your sign-in credentials secure and use ShowReady only for accounts and workspaces
          you are authorized to access. ShowReady may suspend access when needed to protect the
          service, users, clients, or data.
        </p>
      </LegalSection>

      <LegalSection title="Client And Lead Data">
        <p>
          You may enter lead and client details only when you have a lawful basis and authority to
          do so. Do not enter sensitive personal information unless it is required for your
          workflow and you are permitted to collect it.
        </p>
      </LegalSection>

      <LegalSection title="Availability">
        <p>
          ShowReady may change, pause, or discontinue features. We work to keep the service
          available, but do not guarantee uninterrupted access or that every lead, notification, or
          export will be delivered without delay.
        </p>
      </LegalSection>

      <LegalSection title="Deletion Requests">
        <p>
          You can initiate account deletion in the mobile app or outside the app from the account
          deletion web page. Deletion is handled according to the Privacy Policy, support
          verification, and applicable retention obligations.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these terms can be sent to{" "}
          <SupportMailLink>{SUPPORT_EMAIL}</SupportMailLink>.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
