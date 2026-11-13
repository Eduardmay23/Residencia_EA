import { createClient } from '@/lib/supabase/client';

export interface CategoryStat {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface AuditLogItem {
  id: string;
  user: string;
  action: string;
  item: string;
  date: string;
  type: 'create' | 'update' | 'delete' | 'loan' | 'consume';
}

const CATEGORY_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
];

export async function getReportData(): Promise<{
  categories: CategoryStat[];
  logs: AuditLogItem[];
}> {
  try {
    const supabase = createClient();

    const [productsRes, activitiesRes] = await Promise.all([
      supabase.from('products').select('category_name'),
      supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(20),
    ]);

    const products = productsRes.data || [];
    const activities = activitiesRes.data || [];

    // Calcular distribución por categorías
    const catMap: Record<string, number> = {};
    for (const p of products) {
      const cat = p.category_name || 'Sin categoría';
      catMap[cat] = (catMap[cat] || 0) + 1;
    }

    const totalProducts = products.length || 1;
    const categories: CategoryStat[] = Object.entries(catMap).map(([name, count], index) => ({
      name,
      count,
      percentage: Math.round((count / totalProducts) * 100),
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));

    // Formatear logs de actividades
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logs: AuditLogItem[] = activities.map((act: any) => {
      let action = 'registró';
      let type: AuditLogItem['type'] = 'update';

      if (act.type === 'loan_created') {
        action = 'registró préstamo';
        type = 'loan';
      } else if (act.type === 'loan_returned') {
        action = 'devolvió equipo';
        type = 'update';
      } else if (act.type === 'product_added') {
        action = 'creó producto';
        type = 'create';
      } else if (act.type === 'stock_adjusted') {
        action = 'ajustó existencia';
        type = 'consume';
      }

      return {
        id: act.id,
        user: 'Administrador',
        action,
        item: act.details,
        date: new Date(act.created_at).toLocaleString(),
        type,
      };
    });

    return { categories, logs };
  } catch (err) {
    console.warn('Error cargando datos de reporte:', err);
    return { categories: [], logs: [] };
  }
}

