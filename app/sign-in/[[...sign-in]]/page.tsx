import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#060810", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <SignIn />
    </div>
  );
}
