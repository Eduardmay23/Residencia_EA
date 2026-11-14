import { createClient } from '@/lib/supabase/client';
import { deleteLoan, deleteConsumption } from '@/lib/services/loans';

export interface MonthOption {
  key: string; // ej. "2026-11"
  label: string; // ej. "Noviembre 2026 (Actual)"
  year: number;
  month: number; // 0-11
}

export interface CategorySummary {
  name: string;
  productsCount: number;
  stockInMonth: number;
  exitsInMonth: number;
  loansInMonth: number;
  consumptionInMonth: number;
  percentage: number; // % del stock total en almacén
  exitsPercentage: number; // % del total de salidas del mes
  color: string;
}

export interface AuditLogItem {
  id: string;
  type: string;
  actorName: string;
  details: string;
  date: string;
}

export interface ProductReportItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  loansInMonth: number;
  consumptionInMonth: number;
  image_url?: string | null;
  status: 'ok' | 'warning' | 'danger';
}

export interface MovementReportItem {
  id: string;
  date: string;
  productName: string;
  sku: string;
  category: string;
  type: 'loan' | 'consumption' | 'addition' | 'adjustment';
  quantity: number;
  user: string;
  reason: string;
}

export interface MonthlyAnalysisReport {
  selectedMonth: MonthOption;
  selectedCategory: string; // "all" o nombre de categoría
  availableCategories: string[];
  metrics: {
    totalStockInMonth: number;
    totalExitsInMonth: number;
    totalLoansInMonth: number;
    totalConsumptionInMonth: number;
    totalEntriesInMonth: number;
  };
  categoriesSummary: CategorySummary[];
  products: ProductReportItem[];
  movements: MovementReportItem[];
  auditLogs: AuditLogItem[];
}

const CATEGORY_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-teal-500',
];

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function getAvailableMonths(count = 12): MonthOption[] {
  const options: MonthOption[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const monthStr = String(month + 1).padStart(2, '0');
    const key = `${year}-${monthStr}`;

    let label = `${MONTH_NAMES[month]} ${year}`;
    if (i === 0) label += ' (Mes Actual)';
    else if (i === 1) label += ' (Hace 1 mes)';
    else label += ` (Hace ${i} meses)`;

    options.push({ key, label, year, month });
  }

  return options;
}

export async function getMonthlyCategoryReport(
  monthKey: string,
  selectedCategory = 'all'
): Promise<MonthlyAnalysisReport> {
  const months = getAvailableMonths(12);
  const selectedMonth = months.find((m) => m.key === monthKey) || months[0];

  const startDate = new Date(selectedMonth.year, selectedMonth.month, 1, 0, 0, 0);
  const endDate = new Date(selectedMonth.year, selectedMonth.month + 1, 0, 23, 59, 59);

  try {
    const supabase = createClient();

    // 1. Consultar productos, préstamos, movimientos, categorías, auditoría y usuarios en paralelo
    const [productsRes, loansRes, movementsRes, categoriesRes, activitiesRes, profilesRes] = await Promise.all([
      supabase.from('products').select('*').order('name', { ascending: true }),
      supabase
        .from('loans')
        .select('*, products(id, name, sku, category_name)')
        .order('loan_date', { ascending: false }),
      supabase
        .from('movements')
        .select('*, products(id, name, sku, category_name)')
        .order('date', { ascending: false }),
      supabase.from('categories').select('name').order('name', { ascending: true }),
      supabase
        .from('activities')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false }),
      supabase.from('user_profiles').select('id, full_name'),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allProducts: any[] = productsRes.data || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allLoans: any[] = loansRes.data || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allMovements: any[] = movementsRes.data || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbCategories: any[] = categoriesRes.data || [];

    const userNamesMap: Record<string, string> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (profilesRes.data || []).forEach((u: any) => {
      if (u.id && u.full_name) userNamesMap[u.id] = u.full_name;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const auditLogs: AuditLogItem[] = (activitiesRes.data || []).map((a: any) => {
      const rawDetails: string = a.details || '';
      const dashIdx = rawDetails.indexOf(' — ');
      const parsedActor = dashIdx > 0 ? rawDetails.slice(0, dashIdx).trim() : '';
      const cleanDetails = dashIdx > 0 ? rawDetails.slice(dashIdx + 3).trim() : rawDetails;
      const actorName = (a.user_id && userNamesMap[a.user_id]) || parsedActor || 'Sistema';

      return {
        id: a.id,
        type: a.type,
        actorName,
        details: cleanDetails,
        date: new Date(a.created_at).toLocaleString('es-MX'),
      };
    });

    // Obtener lista única de categorías disponibles
    const catSet = new Set<string>();
    dbCategories.forEach((c) => catSet.add(c.name));
    allProducts.forEach((p) => {
      if (p.category_name) catSet.add(p.category_name);
    });
    const availableCategories = Array.from(catSet);

    // 2. Filtrar movimientos y préstamos correspondientes al mes seleccionado
    const movementsInMonth: MovementReportItem[] = [];

    allLoans.forEach((l) => {
      const loanDate = new Date(l.loan_date || l.created_at);
      if (loanDate >= startDate && loanDate <= endDate) {
        const prod = l.products || {};
        const cat = prod.category_name || 'Sin categoría';

        if (selectedCategory === 'all' || cat === selectedCategory) {
          movementsInMonth.push({
            id: l.id,
            date: loanDate.toLocaleDateString(),
            productName: prod.name || 'Artículo',
            sku: prod.sku || 'N/A',
            category: cat,
            type: 'loan',
            quantity: l.quantity || 1,
            user: l.loaned_to || 'Usuario',
            reason: `Préstamo de equipo (${l.status === 'active' ? 'En uso' : 'Devuelto'})`,
          });
        }
      }
    });

    allMovements.forEach((m) => {
      const movDate = new Date(m.date);
      if (movDate >= startDate && movDate <= endDate) {
        const prod = m.products || {};
        const cat = prod.category_name || 'Sin categoría';

        if (selectedCategory === 'all' || cat === selectedCategory) {
          movementsInMonth.push({
            id: m.id,
            date: movDate.toLocaleDateString(),
            productName: prod.name || 'Suministro',
            sku: prod.sku || 'N/A',
            category: cat,
            type: m.type as 'consumption' | 'addition' | 'adjustment',
            quantity: m.quantity || 1,
            user: m.requested_by || 'Usuario',
            reason: m.reason || 'Consumo local',
          });
        }
      }
    });

    // 3. Reconstruir stock histórico al final de ese mes para cada producto
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productStatsMap: Record<string, any> = {};

    allProducts.forEach((p) => {
      const cat = p.category_name || 'Sin categoría';

      // Reconstrucción retrospectiva del stock al corte de ese mes
      let stockAtMonthEnd = p.stock || 0;

      // Reversión de movimientos posteriores a la fecha seleccionada
      allMovements.forEach((m) => {
        if (m.product_id === p.id && new Date(m.date) > endDate) {
          if (m.type === 'consumption') {
            stockAtMonthEnd += m.quantity || 0;
          } else if (m.type === 'addition') {
            stockAtMonthEnd = Math.max(0, stockAtMonthEnd - (m.quantity || 0));
          }
        }
      });

      allLoans.forEach((l) => {
        if (l.product_id !== p.id) return;
        const loanDate = new Date(l.loan_date || l.created_at);
        const returnDate = l.return_date ? new Date(l.return_date) : null;

        if (loanDate > endDate && l.status === 'active') {
          // Préstamo posterior aún activo: hoy está fuera de stock, al cierre del mes estaba en almacén
          stockAtMonthEnd += l.quantity || 0;
        } else if (loanDate <= endDate && l.status === 'returned' && returnDate && returnDate > endDate) {
          // Préstamo hecho antes/durante el mes que se devolvió después: al cierre del mes estaba prestado
          stockAtMonthEnd = Math.max(0, stockAtMonthEnd - (l.quantity || 0));
        }
      });

      // Conteo de movimientos DENTRO del mes para este producto
      let loansCount = 0;
      let consumptionCount = 0;

      allLoans.forEach((l) => {
        if (l.product_id === p.id) {
          const lDate = new Date(l.loan_date || l.created_at);
          if (lDate >= startDate && lDate <= endDate) {
            loansCount += l.quantity || 1;
          }
        }
      });

      allMovements.forEach((m) => {
        if (m.product_id === p.id) {
          const mDate = new Date(m.date);
          if (mDate >= startDate && mDate <= endDate) {
            if (m.type === 'consumption') consumptionCount += m.quantity || 1;
          }
        }
      });

      productStatsMap[p.id] = {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: cat,
        stock: stockAtMonthEnd,
        loansInMonth: loansCount,
        consumptionInMonth: consumptionCount,
        image_url: p.image_url,
        status: stockAtMonthEnd === 0 ? 'danger' : stockAtMonthEnd < 5 ? 'warning' : 'ok',
      };
    });

    // 4. Filtrar productos según la categoría seleccionada
    const productStatsList: ProductReportItem[] = Object.values(productStatsMap).filter(
      (p) => selectedCategory === 'all' || p.category === selectedCategory
    );

    // 5. Agrupación y resumen por Categoría
    const catGroup: Record<string, CategorySummary> = {};

    Object.values(productStatsMap).forEach((p) => {
      const cat = p.category;
      if (!catGroup[cat]) {
        catGroup[cat] = {
          name: cat,
          productsCount: 0,
          stockInMonth: 0,
          exitsInMonth: 0,
          loansInMonth: 0,
          consumptionInMonth: 0,
          percentage: 0,
          exitsPercentage: 0,
          color: CATEGORY_COLORS[Object.keys(catGroup).length % CATEGORY_COLORS.length],
        };
      }
      catGroup[cat].productsCount += 1;
      catGroup[cat].stockInMonth += p.stock;
      catGroup[cat].loansInMonth += p.loansInMonth;
      catGroup[cat].consumptionInMonth += p.consumptionInMonth;
      catGroup[cat].exitsInMonth += p.loansInMonth + p.consumptionInMonth;
    });

    const totalStockGlobal = Object.values(catGroup).reduce((acc, c) => acc + c.stockInMonth, 0);
    const totalExitsGlobal = Object.values(catGroup).reduce((acc, c) => acc + c.exitsInMonth, 0);
    Object.values(catGroup).forEach((c) => {
      c.percentage = totalStockGlobal > 0 ? Math.round((c.stockInMonth / totalStockGlobal) * 100) : 0;
      c.exitsPercentage = totalExitsGlobal > 0 ? Math.round((c.exitsInMonth / totalExitsGlobal) * 100) : 0;
    });

    const categoriesSummary = Object.values(catGroup);

    // 6. Métricas totales según filtro seleccionado
    let totalStockInMonth = 0;
    let totalLoansInMonth = 0;
    let totalConsumptionInMonth = 0;
    let totalEntriesInMonth = 0;

    if (selectedCategory === 'all') {
      totalStockInMonth = categoriesSummary.reduce((acc, c) => acc + c.stockInMonth, 0);
      totalLoansInMonth = categoriesSummary.reduce((acc, c) => acc + c.loansInMonth, 0);
      totalConsumptionInMonth = categoriesSummary.reduce((acc, c) => acc + c.consumptionInMonth, 0);
    } else {
      const targetCat = catGroup[selectedCategory];
      if (targetCat) {
        totalStockInMonth = targetCat.stockInMonth;
        totalLoansInMonth = targetCat.loansInMonth;
        totalConsumptionInMonth = targetCat.consumptionInMonth;
      }
    }

    allMovements.forEach((m) => {
      const movDate = new Date(m.date);
      if (movDate >= startDate && movDate <= endDate && m.type === 'addition') {
        const cat = m.products?.category_name || 'Sin categoría';
        if (selectedCategory === 'all' || cat === selectedCategory) {
          totalEntriesInMonth += m.quantity || 1;
        }
      }
    });

    return {
      selectedMonth,
      selectedCategory,
      availableCategories,
      metrics: {
        totalStockInMonth,
        totalExitsInMonth: totalLoansInMonth + totalConsumptionInMonth,
        totalLoansInMonth,
        totalConsumptionInMonth,
        totalEntriesInMonth,
      },
      categoriesSummary,
      products: productStatsList,
      movements: movementsInMonth,
      auditLogs,
    };
  } catch (err) {
    console.error('Error calculando reporte mensual por categoría:', err);
    return {
      selectedMonth,
      selectedCategory,
      availableCategories: [],
      metrics: {
        totalStockInMonth: 0,
        totalExitsInMonth: 0,
        totalLoansInMonth: 0,
        totalConsumptionInMonth: 0,
        totalEntriesInMonth: 0,
      },
      categoriesSummary: [],
      products: [],
      movements: [],
      auditLogs: [],
    };
  }
}

export async function deleteReportMovement(movementId: string, type: string): Promise<boolean> {
  if (type === 'loan') {
    // Si el préstamo sigue activo, las unidades regresan al stock
    return deleteLoan(movementId, true);
  }
  // Los consumos regresan sus unidades al stock; ingresos/ajustes solo se borran del historial
  return deleteConsumption(movementId, type === 'consumption');
}
