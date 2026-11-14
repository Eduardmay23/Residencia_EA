import { createClient } from '@/lib/supabase/client';

export type ActivityType =
  | 'loan_created'
  | 'loan_returned'
  | 'product_added'
  | 'product_updated'
  | 'stock_adjusted';

export async function logActivity(
  type: ActivityType,
  details: string,
  explicitActorName?: string
): Promise<void> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let actor = explicitActorName;
    if (!actor && user) {
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      actor =
        prof?.full_name ||
        (user.user_metadata?.full_name as string | undefined) ||
        user.email?.split('@')[0] ||
        'Usuario';
    }

    const finalDetails = actor ? `${actor} — ${details}` : details;

    await supabase.from('activities').insert([
      {
        type,
        details: finalDetails,
        user_id: user?.id ?? null,
      },
    ]);
  } catch (err) {
    console.warn('No se pudo registrar actividad en bitácora:', err);
  }
}
