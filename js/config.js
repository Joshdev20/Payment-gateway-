/* Supabase configuration.

   Paste your project URL and anon key below. While they are empty the app
   stays fully functional in browser-only mode and skips every network call,
   so the pages work offline and nothing fails.

   import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

   const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); */

export const SUPABASE_URL = "";
export const SUPABASE_ANON_KEY = "";

export const supabaseConfigured = () =>
    Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/* Lazily build the client so the CDN import only happens when it is used. */
let client = null;
export async function getSupabase() {
    if (!supabaseConfigured()) return null;
    if (client) return client;
    const { createClient } = await import(
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm"
    );
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return client;
}
