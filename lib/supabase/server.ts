import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for server-side DB access.
// Auth is handled by Clerk — RLS is bypassed here, callers must filter by user_id.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
