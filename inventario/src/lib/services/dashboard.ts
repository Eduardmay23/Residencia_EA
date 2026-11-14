import { createClient } from '@/lib/supabase/client';

export interface DashboardMetrics {
  totalProducts: number;
  totalStock: number;
  lowStockAlerts: number;
  activeLoans: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  details: string;
  timeAgo: string;
}

export async function getDashboardData(): Promise<{
  metrics: DashboardMetrics;
  recentActivities: ActivityItem[];
}> {
  try {
    const supabase = createClient();

    // Consultas en paralelo
    const [productsRes, loansRes, activitiesRes] = await Promise.all([
      supabase.from('products').select('stock, low_stock_threshold'),
      supabase.from('loans').select('id').eq('status', 'active'),
      supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(5),
    ]);

    const products = productsRes.data || [];
    const totalProducts = products.length;
    const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
    const lowStockAlerts = products.filter(
      (p) => (p.stock || 0) < (p.low_stock_threshold || 5)
    ).length;

    const activeLoans = (loansRes.data || []).length;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentActivities: ActivityItem[] = (activitiesRes.data || []).map((act: any) => {
      const created = new Date(act.created_at);
      const diffMs = Date.now() - created.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);

      let timeAgo = `Hace ${diffMins} min`;
      if (diffHours > 0) timeAgo = `Hace ${diffHours} h`;
      if (diffHours > 24) timeAgo = `${Math.floor(diffHours / 24)} días`;

      return {
        id: act.id,
        title:
          act.type === 'loan_created'
            ? 'Nuevo Préstamo'
            : act.type === 'loan_returned'
            ? 'Devolución'
            : act.type === 'product_added'
            ? 'Producto Registrado'
            : 'Movimiento de Inventario',
        details: act.details,
        timeAgo,
      };
    });

    return {
      metrics: {
        totalProducts,
        totalStock,
        lowStockAlerts,
        activeLoans,
      },
      recentActivities,
    };
  } catch (err) {
    console.warn('Error cargando métricas de dashboard:', err);
    return {
      metrics: {
        totalProducts: 0,
        totalStock: 0,
        lowStockAlerts: 0,
        activeLoans: 0,
      },
      recentActivities: [],
    };
  }
}

