import type { Metadata } from "next"
import { LegalPage, LegalSection, SupportMailLink } from "@/components/legal-page"
import { SUPPORT_EMAIL } from "@/lib/legal"

export const metadata: Metadata = {
  title: "Account Deletion | ShowReady",
  description: "Request ShowReady account and data deletion."
}

export default function AccountDeletionPage() {
  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=ShowReady%20account%20deletion%20request&body=Please%20delete%20my%20ShowReady%20account.%0A%0AAccount%20email%3A%20%0AReason%20(optional)%3A%20`

  return (
    <LegalPage title="Account Deletion" eyebrow="Request removal">
      <LegalSection title="In-App Request">
        <p>
          If you can sign in, open ShowReady mobile Settings, choose Request account deletion, and
          confirm the request. This starts the authenticated deletion workflow for your account and
          associated workspace data.
        </p>
      </LegalSection>

      <LegalSection title="Outside-The-App Request">
        <p>
          If you cannot access the app, send a deletion request from this web resource. Include the
          email address on your ShowReady account so support can verify the request.
        </p>
        <p>
          <a href={mailtoHref}>Email account deletion request</a>
        </p>
      </LegalSection>

      <LegalSection title="What Deletion Covers">
        <p>
          Account deletion requests cover the agent account, profile, settings, workspace records,
          submitted leads, client contact details, intake answers, appointments, showing notes,
          notification tokens, and app records linked to the workspace. Some security, fraud
          prevention, legal, transaction, support, or audit records may be retained where required
          or permitted.
        </p>
      </LegalSection>

      <LegalSection title="Data Deletion Without Account Deletion">
        <p>
          To delete a specific lead or client record without deleting the account, use the lead
          detail delete action in the mobile app or contact{" "}
          <SupportMailLink>{SUPPORT_EMAIL}</SupportMailLink>.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
