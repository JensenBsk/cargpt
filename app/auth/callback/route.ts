import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://mchaniccarlos.com";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");
    // Only allow same-origin relative paths — anything else (absolute URLs,
    // protocol-relative "//", backslash tricks, "@host" userinfo tricks)
    // becomes an open redirect when concatenated onto origin.
    const rawNext = url.searchParams.get("next") ?? "/";
    const next = /^\/(?![/\\])[^\s]*$/.test(rawNext) ? rawNext : "/";

    if (error) {
      console.error("Auth callback OAuth error:", error, errorDescription);
      return NextResponse.redirect(`${origin}/auth/error?reason=${encodeURIComponent(error)}`);
    }

    if (!code) {
      console.error("Auth callback: no code or error param");
      return NextResponse.redirect(`${origin}/auth/error?reason=no_code`);
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Auth callback: Supabase env vars missing");
      return NextResponse.redirect(`${origin}/auth/error?reason=config`);
    }

    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Auth callback exchangeCodeForSession failed:", exchangeError.message, { code: code.slice(0, 8) + "…" });
      return NextResponse.redirect(`${origin}/auth/error?reason=${encodeURIComponent(exchangeError.message)}`);
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch (err) {
    console.error("Auth callback unhandled error:", err);
    return NextResponse.redirect(`${origin}/auth/error?reason=unexpected`);
  }
}
