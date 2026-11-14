import { createClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/services/activity';
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
  createdBy?: string;
}): Promise<Product | null> {
  const supabase = createClient();
  const actor = payload.createdBy || 'Sistema';
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

  // Registrar ingreso inicial en movimientos si hay stock > 0
  if (data && payload.stock > 0) {
    await supabase.from('movements').insert([
      {
        product_id: data.id,
        type: 'addition',
        quantity: payload.stock,
        requested_by: actor,
        dispatched_by: actor,
        reason: 'Alta inicial de producto',
      },
    ]);
  }

  // Registrar auditoría
  await logActivity(
    'product_added',
    `Registró el producto "${payload.name}" (SKU: ${payload.sku}, Stock inicial: ${payload.stock})`,
    payload.createdBy
  );

  return mapDbProductToProduct(data as DbProduct);
}

export async function updateProduct(
  productId: string,
  payload: {
    name: string;
    sku: string;
    category_name: string;
    stock: number;
    image_url?: string | null;
    updatedBy?: string;
  }
): Promise<Product | null> {
  const supabase = createClient();
  const actor = payload.updatedBy || 'Sistema';

  const { data: prev } = await supabase
    .from('products')
    .select('stock, name')
    .eq('id', productId)
    .single();

  const { data, error } = await supabase
    .from('products')
    .update({
      name: payload.name,
      sku: payload.sku,
      category_name: payload.category_name,
      stock: payload.stock,
      image_url: payload.image_url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    throw error;
  }

  if (prev) {
    const diff = payload.stock - (prev.stock || 0);
    if (diff !== 0) {
      await supabase.from('movements').insert([
        {
          product_id: productId,
          type: diff > 0 ? 'addition' : 'adjustment',
          quantity: Math.abs(diff),
          requested_by: actor,
          dispatched_by: actor,
          reason: diff > 0 ? 'Reabastecimiento / Ajuste positivo' : 'Ajuste de inventario a la baja',
        },
      ]);
    }
  }

  await logActivity(
    'product_updated',
    `Actualizó el producto "${payload.name}" (SKU: ${payload.sku}, Stock: ${payload.stock})`,
    payload.updatedBy
  );

  return mapDbProductToProduct(data as DbProduct);
}

export async function deleteProduct(productId: string): Promise<boolean> {
  const supabase = createClient();

  // 1. Obtener datos del producto para la bitácora
  const { data: prod } = await supabase
    .from('products')
    .select('name, sku')
    .eq('id', productId)
    .single();

  // 2. Eliminar de la base de datos (.select() devuelve las filas realmente borradas)
  const { data: deleted, error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .select('id');

  if (error) {
    console.error('Error deleting product:', error);
    throw error;
  }

  if (!deleted || deleted.length === 0) {
    throw new Error('No tienes permiso para eliminar este producto o ya no existe.');
  }

  // 3. Registrar auditoría
  if (prod) {
    await logActivity(
      'stock_adjusted',
      `Eliminó el producto "${prod.name}" (SKU: ${prod.sku}) del catálogo`
    );
  }

  return true;
}

