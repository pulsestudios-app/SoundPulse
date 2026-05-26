import { Text, View } from "react-native";

import { LegalScreenLayout } from "@/src/components/legal/LegalScreenLayout";
import { useLegalTextStyles } from "@/src/components/legal/useLegalTextStyles";

export default function PrivacyPolicyScreen() {
  const s = useLegalTextStyles();
  return (
    <LegalScreenLayout title="Privacy Policy">
      <Text style={s.p}>
        SoundPulse (“we,” “us,” or “our”) respects your privacy. This Privacy Policy explains how we collect, use,
        disclose, and safeguard information when you use our mobile application and related services (collectively, the
        “Service”). By using the Service, you agree to this policy. If you do not agree, please do not use SoundPulse.
      </Text>

      <Text style={s.h2}>1. Information we collect</Text>
      <Text style={s.p}>
        We collect information you provide directly, information generated when you use the Service, and limited
        technical data from your device.
      </Text>
      <Text style={s.bullet}>
        • Account data: email address, authentication credentials (stored securely by our identity provider), and profile
        fields associated with your account (for example, plan, usage counters, and display name).
      </Text>
      <Text style={s.bullet}>
        • Content you create or save: AI-generated soundscapes, layer mixes, text prompts used for generation, saved
        library items, and community posts you choose to share publicly in Discover.
      </Text>
      <Text style={s.bullet}>
        • Community activity: public display name, pulses and saves on community sounds, reports you submit about
        community content, and related timestamps needed to operate community features.
      </Text>
      <Text style={s.bullet}>
        • Usage data: approximate timestamps of actions (for example, generating or saving soundscapes), feature usage
        needed to operate quotas (such as AI generation counts per month), feedback you submit, and diagnostic logs
        needed to maintain reliability and security.
      </Text>
      <Text style={s.bullet}>
        • Device and app data: device type, operating system version, app version, and technical identifiers needed for
        authentication, notifications, and in-app purchases when enabled.
      </Text>

      <Text style={s.h2}>2. How we use your information</Text>
      <Text style={s.p}>We use information to:</Text>
      <Text style={s.bullet}>
        • Provide, operate, and improve SoundPulse, including AI soundscape generation, layer mixing, and community
        sharing for relaxation, focus, and sleep.
      </Text>
      <Text style={s.bullet}>• Authenticate users, prevent fraud and abuse, and protect the security of the Service.</Text>
      <Text style={s.bullet}>
        • Operate Discover and other community features, including displaying public posts, pulses, saves, and profile
        display names.
      </Text>
      <Text style={s.bullet}>
        • Enforce subscription or free-tier limits, trials, and eligibility rules described in our Terms of Service.
      </Text>
      <Text style={s.bullet}>• Communicate with you about your account, updates, and support requests.</Text>
      <Text style={s.bullet}>• Comply with legal obligations and respond to lawful requests.</Text>

      <Text style={s.h2}>3. AI processing and third-party providers</Text>
      <Text style={s.p}>
        To deliver core features, SoundPulse sends portions of your content to third-party processors strictly as needed
        to perform the Service. We do not sell your personal information.
      </Text>
      <Text style={s.bullet}>
        • ElevenLabs: may process text prompts and related metadata to generate AI soundscapes according to
        ElevenLabs’ policies and your configuration.
      </Text>
      <Text style={s.bullet}>
        • Supabase: hosts authentication, database storage, and related infrastructure for accounts, saved content, and
        community data, subject to Supabase’s terms and security practices.
      </Text>
      <Text style={s.bullet}>
        • Google Play: when you purchase or manage subscriptions through Google Play Billing, Google processes payment
        information according to Google’s policies. We receive limited purchase state information needed to unlock
        features.
      </Text>
      <Text style={s.bullet}>
        • PostHog: processes product analytics events when analytics are enabled. Autocapture is disabled, and we only
        send specific non-PII events needed to understand feature usage and reliability.
      </Text>
      <Text style={s.p}>
        These providers may process data in the United States or other regions where they operate. Their use of
        information is governed by their respective privacy policies and our agreements with them.
      </Text>

      <Text style={s.h2}>4. Community and public content</Text>
      <Text style={s.p}>
        When you publish a soundscape or mix to Discover, certain information (such as your display name, the shared
        audio or mix configuration, and engagement signals like pulse counts) may be visible to other users. Reports you
        submit about community content are handled confidentially and used to review potential violations. You can manage
        some profile information, such as your display name, in the app.
      </Text>

      <Text style={s.h2}>5. Storage, retention, and deletion</Text>
      <Text style={s.p}>
        We retain information for as long as your account is active and as needed to provide the Service, comply with
        law, resolve disputes, and enforce agreements. You may delete certain saved content where the app provides
        deletion controls. You may request account deletion by contacting us; we will delete or anonymize personal
        information unless we must retain it for legal reasons.
      </Text>

      <Text style={s.h2}>6. Legal bases (where applicable)</Text>
      <Text style={s.p}>
        If applicable law requires a legal basis, we rely on performance of a contract (providing the Service),
        legitimate interests (security, product improvement, and fraud prevention), consent where required (for example,
        certain communications), and legal obligations.
      </Text>

      <Text style={s.h2}>7. Sharing of information</Text>
      <Text style={s.p}>
        We may share information with service providers who assist us in operating the Service, with professional
        advisers where permitted, and when required by law or to protect rights and safety. We may disclose information in
        connection with a merger, acquisition, or asset sale, subject to appropriate safeguards.
      </Text>

      <Text style={s.h2}>8. Security</Text>
      <Text style={s.p}>
        We implement reasonable administrative, technical, and organizational measures designed to protect personal
        information. No method of transmission or storage is completely secure; we cannot guarantee absolute security.
      </Text>

      <Text style={s.h2}>9. Children’s privacy</Text>
      <Text style={s.p}>
        SoundPulse is not directed to children under 13 (or the minimum age required in your jurisdiction). We do not
        knowingly collect personal information from children. If you believe we have collected such information,
        contact us and we will take appropriate steps to delete it.
      </Text>

      <Text style={s.h2}>10. International transfers</Text>
      <Text style={s.p}>
        If you access the Service from outside the United States, your information may be transferred to, stored in,
        and processed in the United States and other countries where we or our providers operate.
      </Text>

      <Text style={s.h2}>11. Your rights and choices</Text>
      <Text style={s.p}>
        Depending on your location, you may have rights to access, correct, delete, or export certain personal
        information; object to or restrict certain processing; withdraw consent where processing is consent-based; and
        lodge a complaint with a supervisory authority. To exercise rights, contact us using the email below. We may need
        to verify your identity before responding.
      </Text>

      <Text style={s.h2}>12. Changes to this policy</Text>
      <Text style={s.p}>
        We may update this Privacy Policy from time to time. We will post the updated policy in the app and revise the
        “Last updated” date. Material changes may require additional notice where required by law.
      </Text>

      <Text style={s.h2}>13. Contact</Text>
      <Text style={s.p}>
        Questions about this Privacy Policy or our data practices:{" "}
        <Text style={s.link}>legal@pulsestudios.app</Text>
      </Text>
      <View style={{ height: 8 }} />
    </LegalScreenLayout>
  );
}
