import type { Metadata } from "next"
import { LegalList, LegalPage, LegalSection, SupportMailLink } from "@/components/legal-page"
import {
  DATA_COLLECTED,
  DATA_USE_REASONS,
  PRIVACY_EFFECTIVE_DATE,
  SUPPORT_EMAIL
} from "@/lib/legal"

export const metadata: Metadata = {
  title: "Privacy Policy | ShowReady",
  description: "ShowReady privacy policy and data handling practices."
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" eyebrow={`Effective ${PRIVACY_EFFECTIVE_DATE}`}>
      <LegalSection title="What ShowReady Collects">
        <p>
          ShowReady collects the information agents and clients provide to operate real estate
          lead intake, pipeline, appointment, notification, export, and deletion workflows.
        </p>
        <LegalList items={DATA_COLLECTED} />
      </LegalSection>

      <LegalSection title="Why We Collect It">
        <p>We use this data only for ShowReady service purposes.</p>
        <LegalList items={DATA_USE_REASONS} />
      </LegalSection>

      <LegalSection title="Storage And Security">
        <p>
          Mobile authentication sessions are stored with secure device storage, including iOS
          Keychain and Android secure storage where available. ShowReady stores application data in
          Supabase-backed systems with authenticated access controls, audit records, rate limits,
          and operational diagnostics.
        </p>
      </LegalSection>

      <LegalSection title="Tracking And Sharing">
        <p>
          ShowReady does not sell personal data, use third-party advertising SDKs, or track users
          across other apps or websites for advertising. Product events and diagnostics are
          first-party records used to operate, secure, and improve ShowReady.
        </p>
      </LegalSection>

      <LegalSection title="Permissions">
        <p>
          The mobile app uses network access to connect to ShowReady, notification permission only
          when push notifications are enabled, and vibration for native feedback. ShowReady does
          not request camera, location, contacts, microphone, or photo library permissions for its
          current workflows.
        </p>
      </LegalSection>

      <LegalSection title="Export, Deletion, And Account Removal">
        <p>
          Agents can export submitted lead data from mobile Settings and delete individual lead
          records from lead detail screens. Agents can initiate account deletion from mobile
          Settings or from the public account deletion page. Account deletion requests include the
          agent account and associated workspace data, subject to legally required retention,
          security, fraud prevention, and audit obligations.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          For privacy, support, export, or deletion questions, contact{" "}
          <SupportMailLink>{SUPPORT_EMAIL}</SupportMailLink>.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
