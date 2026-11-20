import { createClient } from "@supabase/supabase-js";

export const supabaseAI = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_AI_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_AI_PUBLISHABLE_KEY!
);