import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#060810", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <SignUp />
    </div>
  );
}
