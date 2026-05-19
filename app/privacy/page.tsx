import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Carlos",
  description: "Carlos privacy policy",
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#060810", color: "#dce8f5", padding: "48px 24px 80px", fontFamily: "var(--font-ibm), system-ui, sans-serif" }}>
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#4a9eff", textDecoration: "none", marginBottom: "32px" }}>
          ← Back to Carlos
        </a>

        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#dce8f5", marginBottom: "8px", marginTop: "0" }}>
          Carlos Privacy Policy
        </h1>
        <p style={{ fontSize: "13px", color: "#4a5c72", marginBottom: "40px" }}>
          Last updated: May 2026
        </p>

        <Section title="Overview">
          Carlos (Mechanic Carlos) is an AI-powered car diagnostic tool at mchaniccarlos.com. We take your privacy seriously. This policy explains what data we collect, why, and how it&apos;s used.
        </Section>

        <Section title="What We Collect">
          <Subsection title="Account information">
            We collect your email address when you create an account. This is used solely to identify your account and associate your garage and diagnoses with you.
          </Subsection>
          <Subsection title="Vehicle and diagnostic data">
            Your car diagnosis history is collected to power your Garage and sync your data across devices. When you run a diagnosis, we receive the year, make, model, and symptom description you enter. This is sent to Anthropic&apos;s Claude API to generate a diagnosis.
          </Subsection>
          <Subsection title="Quote data">
            Text or photos you upload to the Quote Checker are sent to Anthropic&apos;s Claude API for analysis. Quote photos are not stored after analysis.
          </Subsection>
        </Section>

        <Section title="What We Don't Do">
          <ul style={{ margin: "0", paddingLeft: "20px", lineHeight: 2, color: "#7d8fa8", fontSize: "15px" }}>
            <li>We never sell your personal data to third parties</li>
            <li>Your diagnosis data is used solely to provide you with the service and improve accuracy over time</li>
            <li>We do not use your data to train AI models without your consent</li>
          </ul>
        </Section>

        <Section title="Third-Party Services">
          <Subsection title="Anthropic">
            Vehicle symptoms, issues, and quote text are sent to Anthropic&apos;s Claude API for AI analysis. Anthropic&apos;s privacy policy governs their handling of this data. We do not share your personal identity with Anthropic.
          </Subsection>
          <Subsection title="Supabase">
            Account data, garage, and diagnosis history are stored in Supabase. Supabase is SOC 2 Type II certified and stores data on AWS.
          </Subsection>
          <Subsection title="Google OAuth">
            If you sign in with Google, Google&apos;s privacy policy governs the authentication process. We only receive your email and name.
          </Subsection>
          <Subsection title="Vercel">
            The app is hosted on Vercel. Vercel may collect standard server logs (IP addresses, request metadata) as part of hosting.
          </Subsection>
        </Section>

        <Section title="Your Rights">
          To delete your account and all associated data, contact us at{" "}
          <a href="mailto:hello@mchaniccarlos.com" style={{ color: "#4a9eff" }}>
            hello@mchaniccarlos.com
          </a>
          . You also have the right to access, correct, or export the personal data we hold about you.
        </Section>

        <Section title="Cookies and Local Storage">
          Carlos uses browser localStorage to save your most recent diagnosis on your device. No third-party tracking cookies are used. Auth session tokens are stored in cookies by Supabase.
        </Section>

        <Section title="Children's Privacy">
          Carlos is not directed at children under 13. We do not knowingly collect data from children.
        </Section>

        <Section title="Changes to This Policy">
          We may update this policy as the product evolves. We&apos;ll update the &ldquo;last updated&rdquo; date at the top. Continued use of Carlos after changes constitutes acceptance of the updated policy.
        </Section>

        <Section title="Contact">
          Questions or data requests? Email us at{" "}
          <a href="mailto:hello@mchaniccarlos.com" style={{ color: "#4a9eff" }}>
            hello@mchaniccarlos.com
          </a>
          .
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "36px" }}>
      <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#dce8f5", marginBottom: "12px", marginTop: "0" }}>
        {title}
      </h2>
      <div style={{ fontSize: "15px", color: "#7d8fa8", lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ fontSize: "13px", fontWeight: 600, color: "#dce8f5", marginBottom: "4px" }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}
