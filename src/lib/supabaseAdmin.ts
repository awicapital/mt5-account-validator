import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL!,                  // ✅ URL correta para server
  process.env.SUPABASE_SERVICE_ROLE_KEY!      // ✅ Chave de service role
);
