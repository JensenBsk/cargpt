"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isNativeApp, openInSystemBrowser, closeSystemBrowser, onAppUrlOpen } from "@/lib/native";

const SUPABASE_AVAILABLE = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Deep link the system browser bounces back to after native OAuth.
// Registered as CFBundleURLTypes (iOS) / an intent-filter (Android), and
// must be in the Supabase dashboard's Redirect URL allowlist.
const NATIVE_AUTH_CALLBACK = "com.mechaniccarlos.app://auth-callback";

type OAuthProvider = "google" | "apple";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  available: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: (returnTo?: string) => Promise<void>;
  signInWithApple: (returnTo?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: false,
  available: false,
  signOut: async () => {},
  signInWithGoogle: async () => { void 0; },
  signInWithApple: async () => { void 0; },
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(SUPABASE_AVAILABLE);

  useEffect(() => {
    if (!SUPABASE_AVAILABLE) return;

    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Strip OAuth params so users never see ?code= or ?error= in the URL
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (url.searchParams.has("code") || url.searchParams.has("error")) {
          url.searchParams.delete("code");
          url.searchParams.delete("error");
          url.searchParams.delete("error_description");
          window.history.replaceState({}, document.title, url.pathname + (url.search || ""));
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Native shell: OAuth finishes in the system browser sheet, which bounces
  // back here via deep link with a PKCE code. Exchange it in the WebView
  // (the code_verifier lives in this origin's storage) and dismiss the sheet.
  useEffect(() => {
    if (!SUPABASE_AVAILABLE || !isNativeApp()) return;
    return onAppUrlOpen(async (url) => {
      let code: string | null = null;
      try {
        code = new URL(url).searchParams.get("code");
      } catch {
        return;
      }
      if (!code) return;
      await closeSystemBrowser();
      const { error } = await createClient().auth.exchangeCodeForSession(code);
      if (error) console.error("Native OAuth exchange failed:", error.message);
    });
  }, []);

  async function signOut() {
    if (!SUPABASE_AVAILABLE) return;
    await createClient().auth.signOut();
  }

  async function signInWithProvider(provider: OAuthProvider, returnTo?: string) {
    if (!SUPABASE_AVAILABLE) return;
    if (isNativeApp()) {
      // Google blocks WebView logins, so run OAuth in the system browser
      // sheet and come back via deep link (handled by onAppUrlOpen above).
      const { data, error } = await createClient().auth.signInWithOAuth({
        provider,
        options: { redirectTo: NATIVE_AUTH_CALLBACK, skipBrowserRedirect: true },
      });
      if (error) {
        console.error("OAuth start failed:", error.message);
        return;
      }
      if (data?.url) await openInSystemBrowser(data.url);
      return;
    }
    const next = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";
    await createClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback${next}` },
    });
  }

  async function signInWithGoogle(returnTo?: string) {
    await signInWithProvider("google", returnTo);
  }

  async function signInWithApple(returnTo?: string) {
    await signInWithProvider("apple", returnTo);
  }

  async function signInWithEmail(email: string, password: string) {
    if (!SUPABASE_AVAILABLE) return { error: "Auth not configured" };
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUpWithEmail(email: string, password: string) {
    if (!SUPABASE_AVAILABLE) return { error: "Auth not configured" };
    const { error } = await createClient().auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        available: SUPABASE_AVAILABLE,
        signOut,
        signInWithGoogle,
        signInWithApple,
        signInWithEmail,
        signUpWithEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
