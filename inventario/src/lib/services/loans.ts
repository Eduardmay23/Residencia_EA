import { createClient } from '@/lib/supabase/client';

export interface DbLoanItem {
  id: string;
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

  // 1. Insertar préstamo
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

  // 2. Incrementar préstamos y decrementar stock en el producto
  const { data: prod } = await supabase
    .from('products')
    .select('stock, loaned, name')
    .eq('id', payload.productId)
    .single();

  if (prod) {
    const newStock = Math.max(0, (prod.stock || 0) - payload.quantity);
    const newLoaned = (prod.loaned || 0) + payload.quantity;
    await supabase
      .from('products')
      .update({ stock: newStock, loaned: newLoaned })
      .eq('id', payload.productId);

    // Registrar actividad
    await supabase.from('activities').insert([
      {
        type: 'loan_created',
        details: `Se prestó ${payload.quantity}x ${prod.name} a ${payload.loanedTo}`,
      },
    ]);
  }

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

    await supabase.from('activities').insert([
      {
        type: 'loan_returned',
        details: `Se devolvió ${quantity}x ${prod.name}`,
      },
    ]);
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

  const { data: prod } = await supabase
    .from('products')
    .select('stock, name')
    .eq('id', payload.productId)
    .single();

  if (prod) {
    const newStock = Math.max(0, (prod.stock || 0) - payload.quantity);
    await supabase.from('products').update({ stock: newStock }).eq('id', payload.productId);

    await supabase.from('activities').insert([
      {
        type: 'stock_adjusted',
        details: `Consumo interno de ${payload.quantity}x ${prod.name} para ${payload.requestedBy}`,
      },
    ]);
  }

  return data;
}

