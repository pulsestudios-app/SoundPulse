import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL?.trim() ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
