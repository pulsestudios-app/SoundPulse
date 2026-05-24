import { Text, View } from "react-native";

import { LegalScreenLayout } from "@/src/components/legal/LegalScreenLayout";
import { useLegalTextStyles } from "@/src/components/legal/useLegalTextStyles";

export default function TermsOfServiceScreen() {
  const s = useLegalTextStyles();
  return (
    <LegalScreenLayout title="Terms of Service">
      <Text style={s.p}>
        These Terms of Service (“Terms”) govern your access to and use of SoundPulse (the “Service”), including our
        mobile application, websites, and related features. By creating an account, tapping “Sign Up,” or otherwise using
        the Service, you agree to these Terms. If you do not agree, do not use SoundPulse.
      </Text>

      <Text style={s.h2}>1. Eligibility and accounts</Text>
      <Text style={s.p}>
        You must be able to form a binding contract in your jurisdiction to use the Service. You are responsible for
        maintaining the confidentiality of your credentials and for all activity under your account. Notify us promptly
        of unauthorized use.
      </Text>

      <Text style={s.h2}>2. The Service</Text>
      <Text style={s.p}>
        SoundPulse provides tools to generate AI soundscapes, mix audio layers, save content to your library, and share
        sounds with the community for relaxation, focus, and sleep. Features may change over time. We may suspend or
        discontinue parts of the Service with reasonable notice where practicable.
      </Text>

      <Text style={s.h2}>3. Acceptable use</Text>
      <Text style={s.p}>You agree not to:</Text>
      <Text style={s.bullet}>• Violate applicable law or third-party rights.</Text>
      <Text style={s.bullet}>
        • Upload, generate, publish, or share unlawful, infringing, harassing, hateful, or sexually exploitative content,
        or content you do not have rights to use or distribute.
      </Text>
      <Text style={s.bullet}>• Attempt to probe, scan, or test the vulnerability of the Service, or bypass security.</Text>
      <Text style={s.bullet}>• Reverse engineer, decompile, or attempt to extract source code except where permitted by law.</Text>
      <Text style={s.bullet}>• Resell, sublicense, or commercially redistribute the Service without our written consent.</Text>
      <Text style={s.bullet}>
        • Abuse community features (Discover, pulses, saves, or reports), including spam, manipulation of engagement
        metrics, or false or malicious reports.
      </Text>
      <Text style={s.p}>
        We may investigate violations and may remove content, suspend accounts, or terminate access where appropriate.
      </Text>

      <Text style={s.h2}>4. Community features</Text>
      <Text style={s.p}>
        SoundPulse may allow you to publish soundscapes or mixes to Discover, pulse or save community sounds, report
        content that may violate these Terms, and set a public display name shown on your profile and shared posts.
        Community content you publish may be visible to other users. You are responsible for what you share publicly.
        We may remove or restrict community content, including after trusted reports, to protect users and comply with
        law.
      </Text>

      <Text style={s.h2}>5. Subscriptions and billing</Text>
      <Text style={s.p}>
        Paid features may be offered through Google Play Billing. Prices, taxes, and billing cycles are presented at
        purchase and governed by Google’s terms. When you purchase a subscription, your payment is processed by Google;
        we receive entitlement signals needed to unlock features.
      </Text>
      <Text style={s.p}>
        Subscriptions renew automatically until canceled in your Google Play account settings. Canceling stops future
        renewals; you may retain access through the end of the current paid period as permitted by Google Play policies.
      </Text>

      <Text style={s.h2}>6. Free tier and usage limits</Text>
      <Text style={s.p}>
        Free and paid tiers may include usage limits (for example, AI soundscape generations per month). Limits are
        described in-app and may change with notice. If you exceed a limit, certain features may be unavailable until
        the next period or until you upgrade.
      </Text>

      <Text style={s.h2}>7. Intellectual property</Text>
      <Text style={s.p}>
        SoundPulse and its branding, software, and content we create (excluding your prompts, mixes, and outputs
        generated specifically for you) are owned by us and our licensors. Subject to these Terms, we grant you a limited,
        non-exclusive, non-transferable license to use the Service for personal, non-commercial purposes unless otherwise
        agreed.
      </Text>
      <Text style={s.p}>
        You retain rights in content you create or upload. To operate the Service, you grant us a license to host,
        process, transmit, and display your content as needed to provide features you request, including sending portions
        to AI providers as described in our Privacy Policy and displaying community posts you choose to publish publicly.
      </Text>

      <Text style={s.h2}>8. AI outputs and disclaimers</Text>
      <Text style={s.p}>
        AI-generated soundscapes and related outputs may not meet your expectations and may vary in quality. The Service
        is not a substitute for professional medical, therapeutic, or safety advice. You are responsible for using
        generated audio at safe volumes and in appropriate settings.
      </Text>

      <Text style={s.h2}>9. Disclaimer of warranties</Text>
      <Text style={s.p}>
        THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL
        WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR
        A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED,
        ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
      </Text>

      <Text style={s.h2}>10. Limitation of liability</Text>
      <Text style={s.p}>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, SOUNDPULSE AND ITS AFFILIATES, OFFICERS, EMPLOYEES, AND SUPPLIERS WILL NOT
        BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS,
        DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE. OUR TOTAL
        LIABILITY FOR ANY CLAIM ARISING OUT OF OR RELATING TO THE SERVICE WILL NOT EXCEED THE GREATER OF (A) THE AMOUNTS
        YOU PAID US FOR THE SERVICE IN THE TWELVE (12) MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED U.S. DOLLARS (US$100),
        UNLESS APPLICABLE LAW REQUIRES OTHERWISE.
      </Text>

      <Text style={s.h2}>11. Indemnity</Text>
      <Text style={s.p}>
        You will defend, indemnify, and hold harmless SoundPulse and its affiliates from claims, damages, liabilities,
        and expenses (including reasonable attorneys’ fees) arising from your content, your use of the Service, or your
        violation of these Terms or applicable law.
      </Text>

      <Text style={s.h2}>12. Termination</Text>
      <Text style={s.p}>
        You may stop using the Service at any time. We may suspend or terminate access if you violate these Terms, create
        risk or legal exposure, or if we discontinue the Service. Provisions that by their nature should survive
        termination will survive.
      </Text>

      <Text style={s.h2}>13. Changes to these Terms</Text>
      <Text style={s.p}>
        We may modify these Terms from time to time. We will post the updated Terms in the app and update the “Last
        updated” date. Continued use after changes become effective constitutes acceptance, except where additional notice
        or consent is required by law.
      </Text>

      <Text style={s.h2}>14. Governing law and disputes</Text>
      <Text style={s.p}>
        Unless prohibited by applicable law, these Terms are governed by the laws of the State of Delaware, USA, without
        regard to conflict-of-law principles. Courts in Delaware may have exclusive jurisdiction, unless consumer
        protection laws in your country require otherwise.
      </Text>

      <Text style={s.h2}>15. Contact</Text>
      <Text style={s.p}>
        Questions about these Terms: <Text style={s.link}>studypulse.app@gmail.com</Text>
      </Text>
      <View style={{ height: 8 }} />
    </LegalScreenLayout>
  );
}
