import { supabase } from "@/integrations/supabase/client";

export async function seedDemoDataForUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc("seed_demo_data_for_user", {
    p_user_id: userId,
  });

  if (error) {
    console.warn("[seed] No se pudo ejecutar seed_demo_data_for_user:", error.message);
  }
}
