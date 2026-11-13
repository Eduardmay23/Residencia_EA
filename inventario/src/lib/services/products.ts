import { createClient } from '@/lib/supabase/client';
import { Product } from '@/types';

export interface DbProduct {
  id: string;
  name: string;
  sku: string;
  category_id?: string | null;
  category_name?: string | null;
  stock: number;
  loaned: number;
  low_stock_threshold: number;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function mapDbProductToProduct(row: DbProduct): Product {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category_name || 'Sin categoría',
    stock: row.stock ?? 0,
    loaned: row.loaned ?? 0,
    lowStockThreshold: row.low_stock_threshold ?? 5,
    image_url: row.image_url ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getProducts(): Promise<Product[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return (data as DbProduct[]).map(mapDbProductToProduct);
  } catch (err) {
    console.warn('Supabase no está configurado o falló la conexión:', err);
    return [];
  }
}

export async function createProduct(payload: {
  name: string;
  sku: string;
  category_name: string;
  stock: number;
  image_url?: string | null;
}): Promise<Product | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .insert([
      {
        name: payload.name,
        sku: payload.sku,
        category_name: payload.category_name,
        stock: payload.stock,
        loaned: 0,
        low_stock_threshold: 5,
        image_url: payload.image_url,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    throw error;
  }

  return mapDbProductToProduct(data as DbProduct);
}

