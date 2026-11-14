import { createClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/services/activity';
import { Category } from '@/types';

export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories from Supabase:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase no está configurado o no se pudo conectar:', err);
    return [];
  }
}

export async function createCategory(name: string, description?: string): Promise<Category | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name, description }])
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    throw error;
  }

  await logActivity('product_added', `Creó la categoría "${name}"`);
  return data;
}

