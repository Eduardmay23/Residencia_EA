import { createClient } from "@/lib/supabase/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/services/activity";
import { UserProfile, Role } from "@/types";

export interface CreateUserData {
  email: string;
  password?: string;
  fullName: string;
  role: Role;
  canAccessInventory: boolean;
  canAccessLoans: boolean;
  canAccessReports: boolean;
  canDelete?: boolean;
}

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return [];
    }
    return (data || []) as UserProfile[];
  } catch (err) {
    console.error("Exception fetching users:", err);
    return [];
  }
}

export async function updateUserPermissions(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_profiles")
    .update({
      role: updates.role,
      can_access_inventory: updates.can_access_inventory,
      can_access_loans: updates.can_access_loans,
      can_access_reports: updates.can_access_reports,
      can_delete: updates.can_delete,
      is_active: updates.is_active,
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating user permissions:", error);
    throw error;
  }

  // Registrar auditoría
  await logActivity(
    "product_updated",
    `Actualizó permisos de "${data.full_name || data.email}" (Rol: ${data.role}${data.can_delete ? ", puede eliminar" : ""})`
  );

  return data as UserProfile;
}

export async function createUserByAdmin(payload: CreateUserData): Promise<{ id: string; email: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  // Cliente aislado sin persistencia de sesión para NO cerrar la sesión del Administrador
  const isolatedAuthClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await isolatedAuthClient.auth.signUp({
    email: payload.email.trim(),
    password: payload.password || "Temp123456!",
    options: {
      data: {
        full_name: payload.fullName.trim(),
        role: payload.role,
        can_access_inventory: payload.canAccessInventory,
        can_access_loans: payload.canAccessLoans,
        can_access_reports: payload.canAccessReports,
        can_delete: payload.canDelete ?? false,
      },
    },
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("No se pudo generar el usuario.");
  }

  // Registrar auditoría con el cliente principal
  await logActivity(
    "product_added",
    `Registró al usuario "${payload.fullName}" (${payload.email}) con rol ${payload.role}`
  );

  return { id: data.user.id, email: data.user.email || payload.email };
}
