import { createClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/services/activity';

export interface DbLoanItem {
  id: string;
  productId?: string;
  item: string;
  sku: string;
  user: string;
  date: string;
  status: 'active' | 'returned';
  type: string;
  quantity: number;
}

export interface DbConsumptionItem {
  id: string;
  item: string;
  sku: string;
  user: string;
  date: string;
  qty: number;
  reason: string;
  type: string;
}

export async function getLoans(): Promise<DbLoanItem[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('loans')
      .select(`
        id,
        product_id,
        quantity,
        loan_date,
        status,
        loaned_to,
        products (
          name,
          sku
        )
      `)
      .order('loan_date', { ascending: false });

    if (error) {
      console.error('Error fetching loans:', error);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((row: any) => ({
      id: row.id,
      productId: row.product_id,
      item: row.products?.name || 'Artículo',
      sku: row.products?.sku || 'N/A',
      user: row.loaned_to,
      date: new Date(row.loan_date).toLocaleDateString(),
      status: row.status,
      type: 'Préstamo',
      quantity: row.quantity,
    }));
  } catch (err) {
    console.warn('Supabase no disponible para préstamos:', err);
    return [];
  }
}

export async function createLoan(payload: {
  productId: string;
  loanedTo: string;
  deliveredBy: string;
  quantity: number;
}) {
  const supabase = createClient();

  // 1. Verificar stock disponible antes de crear el préstamo
  const { data: prod, error: prodErr } = await supabase
    .from('products')
    .select('stock, loaned, name')
    .eq('id', payload.productId)
    .single();

  if (prodErr || !prod) {
    throw new Error('No se encontró el producto seleccionado.');
  }

  if ((prod.stock || 0) < payload.quantity) {
    throw new Error(`Stock insuficiente de "${prod.name}". Disponible: ${prod.stock || 0} unidad(es).`);
  }

  // 2. Insertar préstamo
  const { data: loan, error: loanErr } = await supabase
    .from('loans')
    .insert([
      {
        product_id: payload.productId,
        loaned_to: payload.loanedTo,
        delivered_by: payload.deliveredBy,
        quantity: payload.quantity,
        status: 'active',
      },
    ])
    .select()
    .single();

  if (loanErr) throw loanErr;

  // 3. Incrementar préstamos y decrementar stock en el producto
  const newStock = Math.max(0, (prod.stock || 0) - payload.quantity);
  const newLoaned = (prod.loaned || 0) + payload.quantity;
  await supabase
    .from('products')
    .update({ stock: newStock, loaned: newLoaned })
    .eq('id', payload.productId);

  // Registrar actividad
  await logActivity(
    'loan_created',
    `Registró préstamo de ${payload.quantity}x "${prod.name}" para ${payload.loanedTo}`,
    payload.deliveredBy
  );

  return loan;
}

export async function returnLoan(loanId: string, productId: string, quantity: number) {
  const supabase = createClient();

  const { error: loanErr } = await supabase
    .from('loans')
    .update({ status: 'returned', return_date: new Date().toISOString() })
    .eq('id', loanId);

  if (loanErr) throw loanErr;

  const { data: prod } = await supabase
    .from('products')
    .select('stock, loaned, name')
    .eq('id', productId)
    .single();

  if (prod) {
    const newStock = (prod.stock || 0) + quantity;
    const newLoaned = Math.max(0, (prod.loaned || 0) - quantity);
    await supabase
      .from('products')
      .update({ stock: newStock, loaned: newLoaned })
      .eq('id', productId);

    await logActivity(
      'loan_returned',
      `Procesó devolución de ${quantity}x "${prod.name}"`
    );
  }
}

export async function getConsumptions(): Promise<DbConsumptionItem[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('movements')
      .select(`
        id,
        quantity,
        date,
        reason,
        requested_by,
        products (
          name,
          sku
        )
      `)
      .eq('type', 'consumption')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching movements:', error);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((row: any) => ({
      id: row.id,
      item: row.products?.name || 'Suministro',
      sku: row.products?.sku || 'N/A',
      user: row.requested_by,
      date: new Date(row.date).toLocaleDateString(),
      qty: row.quantity,
      reason: row.reason,
      type: 'Consumo Local',
    }));
  } catch (err) {
    console.warn('Supabase no disponible para consumos:', err);
    return [];
  }
}

export async function createConsumption(payload: {
  productId: string;
  requestedBy: string;
  dispatchedBy: string;
  quantity: number;
  reason: string;
}) {
  const supabase = createClient();

  // 1. Verificar stock disponible
  const { data: prod, error: prodErr } = await supabase
    .from('products')
    .select('stock, name')
    .eq('id', payload.productId)
    .single();

  if (prodErr || !prod) {
    throw new Error('No se encontró el producto seleccionado.');
  }

  if ((prod.stock || 0) < payload.quantity) {
    throw new Error(`Stock insuficiente de "${prod.name}". Disponible: ${prod.stock || 0} unidad(es).`);
  }

  // 2. Insertar consumo
  const { data, error } = await supabase
    .from('movements')
    .insert([
      {
        product_id: payload.productId,
        type: 'consumption',
        quantity: payload.quantity,
        requested_by: payload.requestedBy,
        dispatched_by: payload.dispatchedBy,
        reason: payload.reason,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  // 3. Descontar stock
  const newStock = Math.max(0, (prod.stock || 0) - payload.quantity);
  await supabase.from('products').update({ stock: newStock }).eq('id', payload.productId);

  await logActivity(
    'stock_adjusted',
    `Registró consumo interno de ${payload.quantity}x "${prod.name}" para ${payload.requestedBy}`,
    payload.dispatchedBy
  );

  return data;
}

export async function deleteLoan(loanId: string, restoreStock: boolean = true): Promise<boolean> {
  const supabase = createClient();

  // 1. Obtener detalles del préstamo antes de borrar
  const { data: loan, error: fetchErr } = await supabase
    .from('loans')
    .select('product_id, quantity, status, loaned_to, products(name)')
    .eq('id', loanId)
    .single();

  if (fetchErr) {
    console.error('Error fetching loan to delete:', fetchErr);
  }

  // 2. Eliminar préstamo (.select() devuelve las filas realmente borradas)
  const { data: deleted, error } = await supabase
    .from('loans')
    .delete()
    .eq('id', loanId)
    .select('id');

  if (error) {
    console.error('Error deleting loan:', error);
    throw error;
  }

  if (!deleted || deleted.length === 0) {
    throw new Error('No tienes permiso para eliminar este préstamo o ya no existe.');
  }

  // 3. Si estaba activo, reintegrar las unidades al producto
  if (loan && loan.status === 'active' && restoreStock && loan.product_id) {
    const { data: prod } = await supabase
      .from('products')
      .select('stock, loaned')
      .eq('id', loan.product_id)
      .single();

    if (prod) {
      const newStock = (prod.stock || 0) + (loan.quantity || 1);
      const newLoaned = Math.max(0, (prod.loaned || 0) - (loan.quantity || 1));
      await supabase
        .from('products')
        .update({ stock: newStock, loaned: newLoaned })
        .eq('id', loan.product_id);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prodName = (loan?.products as any)?.name || 'Artículo';
  await logActivity(
    'stock_adjusted',
    `Eliminó el préstamo de "${prodName}" (a ${loan?.loaned_to || 'colaborador'})`
  );

  return true;
}

export async function deleteConsumption(consumptionId: string, restoreStock: boolean = true): Promise<boolean> {
  const supabase = createClient();

  // 1. Obtener detalles del movimiento
  const { data: mov } = await supabase
    .from('movements')
    .select('product_id, quantity, requested_by, products(name)')
    .eq('id', consumptionId)
    .single();

  // 2. Eliminar movimiento
  const { data: deleted, error } = await supabase
    .from('movements')
    .delete()
    .eq('id', consumptionId)
    .select('id');

  if (error) {
    console.error('Error deleting consumption movement:', error);
    throw error;
  }

  if (!deleted || deleted.length === 0) {
    throw new Error('No tienes permiso para eliminar este registro o ya no existe.');
  }

  // 3. Reintegrar unidades al stock del producto
  if (mov && restoreStock && mov.product_id) {
    const { data: prod } = await supabase
      .from('products')
      .select('stock')
      .eq('id', mov.product_id)
      .single();

    if (prod) {
      const newStock = (prod.stock || 0) + (mov.quantity || 1);
      await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', mov.product_id);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prodName = (mov?.products as any)?.name || 'Suministro';
  await logActivity(
    'stock_adjusted',
    `Eliminó el registro de salida de "${prodName}" (solicitado por ${mov?.requested_by || 'usuario'})`
  );

  return true;
}

