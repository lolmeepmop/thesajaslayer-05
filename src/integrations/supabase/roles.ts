
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if a given user has the 'admin' role using the SEC DEF has_role function.
 */
export async function isAdmin(userId: string | undefined | null): Promise<boolean> {
  if (!userId) return false;
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) {
    console.error("has_role RPC failed:", error);
    return false;
  }
  return Boolean(data);
}
