import { supabase } from "@/integrations/supabase/client";

/** @deprecated El seed automático está deshabilitado. */
export async function seedDemoDataForUser(_userId: string): Promise<void> {
  return;
}

export async function clearDemoDataForUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc("clear_demo_data_for_user", {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }
}
