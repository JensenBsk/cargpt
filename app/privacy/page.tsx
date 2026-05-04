import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Torque",
  description: "Torque privacy policy",
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#060810", color: "#dce8f5", padding: "48px 24px 80px", fontFamily: "var(--font-ibm), system-ui, sans-serif" }}>
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#4a9eff", textDecoration: "none", marginBottom: "32px" }}>
          ← Back to Torque
        </a>

        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#dce8f5", marginBottom: "8px", marginTop: "0" }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: "13px", color: "#4a5c72", marginBottom: "40px" }}>
          Last updated: May 4, 2025
        </p>

        <Section title="Overview">
          Torque (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;the app&rdquo;) is an AI-powered car diagnostic assistant. We take your privacy seriously. This policy explains what data we collect, why, and how it&apos;s used.
        </Section>

        <Section title="Information We Collect">
          <Subsection title="Account information">
            If you sign in with Google, we receive your email address and display name from Google. This is used solely to identify your account and associate your garage and diagnoses with you.
          </Subsection>
          <Subsection title="Vehicle and diagnostic data">
            When you run a diagnosis, we receive the year, make, model, and symptom description you enter. This is sent to Anthropic&apos;s Claude API to generate a diagnosis. We may store the diagnosis result to show you your history.
          </Subsection>
          <Subsection title="Quote data">
            Text or photos you upload to the Quote Checker are sent to Anthropic&apos;s Claude API for analysis. Quote photos are not stored after analysis.
          </Subsection>
          <Subsection title="Outcome feedback">
            If you use the &ldquo;Did this fix it?&rdquo; feature, we store your response (yes/still working/no) and any optional notes you provide. This helps us improve diagnosis quality.
          </Subsection>
          <Subsection title="Usage data">
            We may collect anonymized usage metrics (such as how many diagnoses are run) to understand product usage. We do not sell this data.
          </Subsection>
        </Section>

        <Section title="How We Use Your Data">
          <ul style={{ margin: "0", paddingLeft: "20px", lineHeight: 2, color: "#7d8fa8", fontSize: "15px" }}>
            <li>To provide and improve the Torque service</li>
            <li>To store your garage and diagnosis history (for signed-in users)</li>
            <li>To improve diagnosis accuracy over time via outcome feedback</li>
            <li>We do not sell your data to third parties</li>
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

        <Section title="Data Retention">
          Diagnosis history is retained until you delete your account. Garage data is retained while your account is active. You can request deletion of your data at any time by emailing us.
        </Section>

        <Section title="Your Rights">
          You have the right to:
          <ul style={{ margin: "8px 0 0", paddingLeft: "20px", lineHeight: 2, color: "#7d8fa8", fontSize: "15px" }}>
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Withdraw consent at any time by deleting your account</li>
          </ul>
        </Section>

        <Section title="Cookies and Local Storage">
          Torque uses browser localStorage to save your most recent diagnosis on your device. No third-party tracking cookies are used. Auth session tokens are stored in cookies by Supabase.
        </Section>

        <Section title="Children's Privacy">
          Torque is not directed at children under 13. We do not knowingly collect data from children.
        </Section>

        <Section title="Changes to This Policy">
          We may update this policy as the product evolves. We&apos;ll update the &ldquo;last updated&rdquo; date at the top. Continued use of Torque after changes constitutes acceptance of the updated policy.
        </Section>

        <Section title="Contact">
          Questions or data requests? Email us at{" "}
          <a href="mailto:jensenbruskotter@gmail.com" style={{ color: "#4a9eff" }}>
            jensenbruskotter@gmail.com
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
