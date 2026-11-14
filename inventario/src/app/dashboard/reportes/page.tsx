"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  PieChart,
  Activity,
  Download,
  Calendar,
  Database,
  AlertCircle,
  Loader2,
  Layers,
  PackageMinus,
  ClipboardList,
  Filter,
  CheckCircle2,
  Package2,
} from "lucide-react";
import Link from "next/link";
import {
  getAvailableMonths,
  getMonthlyCategoryReport,
  MonthlyAnalysisReport,
} from "@/lib/services/reports";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import AccessDenied from "@/components/AccessDenied";

export default function Reportes() {
  const { isAdmin, canAccess, loading: authLoading } = useAuth();

  const monthOptions = getAvailableMonths(12);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(monthOptions[0].key);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [loading, setLoading] = useState(true);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [reportData, setReportData] = useState<MonthlyAnalysisReport | null>(null);

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      const configured = isSupabaseConfigured();
      setIsDbConnected(configured);

      try {
        const data = await getMonthlyCategoryReport(selectedMonthKey, selectedCategory);
        setReportData(data);
      } catch (err) {
        console.error("Error al cargar reporte:", err);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [selectedMonthKey, selectedCategory]);

  const handleExportPDF = () => {
    if (!reportData) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const categoryTitle =
      selectedCategory === "all"
        ? "Todas las Categorías (General)"
        : `Categoría: ${selectedCategory}`;

    const html = `
      <html>
        <head>
          <title>Reporte de Inventario - ${reportData.selectedMonth.label}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
               @page { margin: 1cm; size: landscape; }
               body { padding: 1cm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body class="bg-white text-black p-8 font-sans">
          <div class="border-b-2 border-zinc-200 pb-6 mb-8 flex justify-between items-end">
            <div>
              <h1 class="text-3xl font-bold uppercase text-zinc-800">Reporte Analítico de Inventario</h1>
              <p class="text-zinc-600 mt-1 font-medium">
                Período: <strong>${reportData.selectedMonth.label}</strong> | Enfoque: <strong>${categoryTitle}</strong>
              </p>
              <p class="text-zinc-400 text-xs mt-0.5">Fecha de emisión: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
            </div>
            <div class="text-right">
              <p class="font-bold text-2xl text-zinc-900">DECD</p>
              <p class="text-zinc-500 text-sm">Control Interno y Auditoría</p>
            </div>
          </div>

          <!-- Métricas Clave del Periodo -->
          <div class="grid grid-cols-4 gap-4 mb-8">
            <div class="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
              <p class="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Stock en el Período</p>
              <p class="text-2xl font-bold text-zinc-900">${reportData.metrics.totalStockInMonth}</p>
            </div>
            <div class="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
              <p class="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Total de Salidas</p>
              <p class="text-2xl font-bold text-rose-600">${reportData.metrics.totalExitsInMonth}</p>
            </div>
            <div class="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
              <p class="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Préstamos Registrados</p>
              <p class="text-2xl font-bold text-purple-600">${reportData.metrics.totalLoansInMonth}</p>
            </div>
            <div class="p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
              <p class="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Consumo Interno</p>
              <p class="text-2xl font-bold text-amber-600">${reportData.metrics.totalConsumptionInMonth}</p>
            </div>
          </div>

          <!-- Desglose según filtro -->
          ${
            selectedCategory === "all"
              ? `
            <h2 class="text-lg font-bold mb-3 border-b pb-2">1. Resumen Consolidado por Categorías</h2>
            <table class="w-full text-sm text-left border border-zinc-200 mb-8">
              <thead class="bg-zinc-100 text-zinc-700 text-xs font-bold uppercase">
                <tr>
                  <th class="p-3 border-b">Categoría</th>
                  <th class="p-3 border-b text-center">Variedad de Productos</th>
                  <th class="p-3 border-b text-center">Stock del Período</th>
                  <th class="p-3 border-b text-center">Salidas (Mes)</th>
                  <th class="p-3 border-b text-right">% del Inventario</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.categoriesSummary
                  .map(
                    (c) => `
                  <tr class="border-b border-zinc-100">
                    <td class="p-3 font-semibold">${c.name}</td>
                    <td class="p-3 text-center">${c.productsCount}</td>
                    <td class="p-3 text-center font-bold text-zinc-900">${c.stockInMonth}</td>
                    <td class="p-3 text-center text-rose-600 font-bold">${c.exitsInMonth}</td>
                    <td class="p-3 text-right font-medium">${c.percentage}%</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          `
              : `
            <h2 class="text-lg font-bold mb-3 border-b pb-2">1. Detalle de Productos en la Categoría: ${selectedCategory}</h2>
            <table class="w-full text-sm text-left border border-zinc-200 mb-8">
              <thead class="bg-zinc-100 text-zinc-700 text-xs font-bold uppercase">
                <tr>
                  <th class="p-3 border-b">Producto</th>
                  <th class="p-3 border-b">Código (SKU)</th>
                  <th class="p-3 border-b text-center">Stock del Mes</th>
                  <th class="p-3 border-b text-center">Préstamos</th>
                  <th class="p-3 border-b text-center">Consumos</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.products
                  .map(
                    (p) => `
                  <tr class="border-b border-zinc-100">
                    <td class="p-3 font-semibold">${p.name}</td>
                    <td class="p-3 font-mono text-zinc-600">${p.sku}</td>
                    <td class="p-3 text-center font-bold text-zinc-900">${p.stock}</td>
                    <td class="p-3 text-center text-purple-600">${p.loansInMonth}</td>
                    <td class="p-3 text-center text-amber-600">${p.consumptionInMonth}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          `
          }

          <!-- Registro de Movimientos del Período -->
          <h2 class="text-lg font-bold mb-3 border-b pb-2">2. Bitácora de Movimientos del Período</h2>
          <table class="w-full text-sm text-left border border-zinc-200 mb-8">
            <thead class="bg-zinc-100 text-zinc-700 text-xs font-bold uppercase">
              <tr>
                <th class="p-3 border-b">Fecha</th>
                <th class="p-3 border-b">Artículo / SKU</th>
                <th class="p-3 border-b">Categoría</th>
                <th class="p-3 border-b">Tipo</th>
                <th class="p-3 border-b text-center">Cant.</th>
                <th class="p-3 border-b">Responsable</th>
                <th class="p-3 border-b">Detalle</th>
              </tr>
            </thead>
            <tbody>
              ${
                reportData.movements.length === 0
                  ? `
                <tr>
                  <td colspan="7" class="p-4 text-center text-zinc-400">No se registraron movimientos en este período.</td>
                </tr>
              `
                  : reportData.movements
                      .map(
                        (m) => `
                <tr class="border-b border-zinc-100">
                  <td class="p-3 text-zinc-600">${m.date}</td>
                  <td class="p-3 font-semibold">${m.productName} <span class="text-xs text-zinc-500">(${m.sku})</span></td>
                  <td class="p-3">${m.category}</td>
                  <td class="p-3 uppercase text-xs font-bold ${
                    m.type === "loan"
                      ? "text-purple-600"
                      : m.type === "consumption"
                      ? "text-rose-600"
                      : "text-emerald-600"
                  }">${m.type === "loan" ? "Préstamo" : m.type === "consumption" ? "Consumo" : "Ingreso"}</td>
                  <td class="p-3 text-center font-bold">${m.quantity}</td>
                  <td class="p-3 font-medium">${m.user}</td>
                  <td class="p-3 text-xs text-zinc-600">${m.reason}</td>
                </tr>
              `
                      )
                      .join("")
              }
            </tbody>
          </table>

          <div class="mt-16 pt-10 border-t grid grid-cols-2 gap-12 text-center text-xs text-zinc-600">
            <div>
              <div class="border-b border-zinc-400 w-48 mx-auto mb-2"></div>
              <p class="font-bold uppercase">Elaborado por (Encargado)</p>
            </div>
            <div>
              <div class="border-b border-zinc-400 w-48 mx-auto mb-2"></div>
              <p class="font-bold uppercase">Supervisado por (Administración)</p>
            </div>
          </div>

          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 800);
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (!authLoading && !isAdmin && !canAccess("reports")) {
    return (
      <AccessDenied
        title="Acceso Restringido a Reportes"
        message="El Administrador no te ha otorgado permisos para consultar auditorías o reportes del inventario."
      />
    );
  }

  const currentMonthOption =
    monthOptions.find((m) => m.key === selectedMonthKey) || monthOptions[0];

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      {/* Encabezado */}
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-zinc-300">Reportes Mensuales y Análisis</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight">Reportes por Mes y Categoría</h1>
            {isDbConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Database className="w-3 h-3" /> Supabase Conectado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertCircle className="w-3 h-3" /> Modo Demo
              </span>
            )}
          </div>
          <p className="text-zinc-400 mt-1">
            Consulta el histórico de existencias de cualquier mes y filtra por categoría específica o consolidado general.
          </p>
        </div>

        {/* Filtros de Selección y Botón Exportar */}
        <div className="flex flex-wrap items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-2xl backdrop-blur-md">
          {/* Selector de Mes */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl">
            <Calendar className="w-4 h-4 text-blue-400" />
            <select
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none cursor-pointer"
            >
              {monthOptions.map((opt) => (
                <option key={opt.key} value={opt.key} className="bg-zinc-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Categoría */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl">
            <Filter className="w-4 h-4 text-purple-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-zinc-900 text-white">
                Todas las Categorías (General)
              </option>
              {reportData?.availableCategories.map((cat) => (
                <option key={cat} value={cat} className="bg-zinc-900 text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Botón Exportar */}
          <button
            onClick={handleExportPDF}
            disabled={loading || !reportData}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-105 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Exportar Reporte
          </button>
        </div>
      </header>

      {/* Banner Informativo del Período y Categoría Seleccionada */}
      <div className="bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-transparent border border-white/10 rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            Análisis Retrospectivo y Comparativo
          </div>
          <h2 className="text-2xl font-bold text-white">
            {selectedCategory === "all" ? (
              <span>Reporte General: Todas las Categorías</span>
            ) : (
              <span>
                Reporte Especializado: <span className="text-purple-400">{selectedCategory}</span>
              </span>
            )}
          </h2>
          <p className="text-zinc-400 text-sm mt-0.5">
            Período seleccionado: <strong className="text-white">{currentMonthOption.label}</strong>
          </p>
        </div>

        {selectedCategory !== "all" && (
          <button
            onClick={() => setSelectedCategory("all")}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-medium text-zinc-300 transition-colors"
          >
            Restablecer a Todas las Categorías
          </button>
        )}
      </div>

      {/* Métricas Principales del Mes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-3xl p-6 hover:border-white/20 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
              <Layers className="w-6 h-6" />
            </div>
            <span className="text-xs text-zinc-500 font-mono">Corte de mes</span>
          </div>
          <p className="text-zinc-400 text-sm mb-1">
            {selectedCategory === "all" ? "Stock Total Registrado" : `Stock en ${selectedCategory}`}
          </p>
          <h3 className="text-3xl font-bold text-white">
            {loading ? "..." : reportData?.metrics.totalStockInMonth.toLocaleString() ?? 0}
          </h3>
          <p className="text-xs text-zinc-500 mt-2">Unidades registradas en ese período</p>
        </div>

        <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-3xl p-6 hover:border-white/20 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400">
              <PackageMinus className="w-6 h-6" />
            </div>
            <span className="text-xs text-rose-400 font-mono">Total Salidas</span>
          </div>
          <p className="text-zinc-400 text-sm mb-1">Salidas en el Mes</p>
          <h3 className="text-3xl font-bold text-rose-400">
            {loading ? "..." : `-${reportData?.metrics.totalExitsInMonth.toLocaleString() ?? 0}`}
          </h3>
          <p className="text-xs text-zinc-500 mt-2">Préstamos y consumo combinados</p>
        </div>

        <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-3xl p-6 hover:border-white/20 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
              <ClipboardList className="w-6 h-6" />
            </div>
            <span className="text-xs text-purple-400 font-mono">Equipos</span>
          </div>
          <p className="text-zinc-400 text-sm mb-1">Préstamos en el Mes</p>
          <h3 className="text-3xl font-bold text-purple-400">
            {loading ? "..." : reportData?.metrics.totalLoansInMonth.toLocaleString() ?? 0}
          </h3>
          <p className="text-xs text-zinc-500 mt-2">Salidas retornables solicitadas</p>
        </div>

        <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-3xl p-6 hover:border-white/20 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-xs text-amber-400 font-mono">Suministros</span>
          </div>
          <p className="text-zinc-400 text-sm mb-1">Consumo Interno</p>
          <h3 className="text-3xl font-bold text-amber-400">
            {loading ? "..." : reportData?.metrics.totalConsumptionInMonth.toLocaleString() ?? 0}
          </h3>
          <p className="text-xs text-zinc-500 mt-2">Suministros gastados en el mes</p>
        </div>
      </div>

      {/* Contenido Principal según Filtro */}
      {selectedCategory === "all" ? (
        /* VISTA GENERAL: Consolidado de Todas las Categorías */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Gráfico de Distribución de Stock por Categoría */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 lg:col-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Distribución por Categorías</h2>
                  <p className="text-sm text-zinc-400">Existencias en {currentMonthOption.label}</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center p-12 text-zinc-400">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400 mr-2" />
                <span>Calculando existencias...</span>
              </div>
            ) : reportData?.categoriesSummary.length === 0 ? (
              <p className="text-zinc-500 text-center py-12">No hay categorías registradas aún.</p>
            ) : (
              <div className="space-y-4 my-auto">
                {reportData?.categoriesSummary.map((cat, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedCategory(cat.name)}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 cursor-pointer transition-all group"
                  >
                    <div className="flex justify-between items-center mb-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {cat.name}
                        </span>
                        <span className="text-xs text-zinc-500">
                          ({cat.productsCount} {cat.productsCount === 1 ? "artículo" : "artículos"})
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-zinc-400">
                          Stock: <strong className="text-white text-sm">{cat.stockInMonth}</strong>
                        </span>
                        <span className="text-rose-400">
                          Salidas: <strong>{cat.exitsInMonth}</strong>
                        </span>
                        <span className="font-mono text-zinc-300 w-12 text-right">
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full ${cat.color} rounded-full transition-all duration-700`}
                        style={{ width: `${Math.max(5, cat.percentage)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tarjeta de Resumen Rápido y Acceso por Categoría */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Explorador Rápido</h2>
                  <p className="text-sm text-zinc-400">Filtra una categoría con un clic</p>
                </div>
              </div>

              <p className="text-xs text-zinc-400 mb-4">
                Haz clic en cualquiera de las siguientes categorías para aislar y ver el informe específico de sus productos en {currentMonthOption.label}:
              </p>

              <div className="flex flex-wrap gap-2">
                {reportData?.availableCategories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCategory(c)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-200 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <span>{c}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 mt-6">
              💡 <strong>Tip de precisión:</strong> Al pulsar una categoría verás el balance detallado producto por producto de ese mes.
            </div>
          </div>
        </div>
      ) : (
        /* VISTA DETALLADA: Categoría Específica */
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Productos de la Categoría: {selectedCategory}
                </h2>
                <p className="text-sm text-zinc-400">
                  Existencias y rotación registradas en {currentMonthOption.label}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedCategory("all")}
              className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
            >
              ← Volver al reporte general
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 border-b border-white/10 text-zinc-400 font-medium text-xs uppercase">
                <tr>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Código (SKU)</th>
                  <th className="px-6 py-4 text-center">Stock en {currentMonthOption.label.split(" ")[0]}</th>
                  <th className="px-6 py-4 text-center">Préstamos</th>
                  <th className="px-6 py-4 text-center">Consumo</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-zinc-400">
                      Cargando productos de {selectedCategory}...
                    </td>
                  </tr>
                ) : reportData?.products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                      No hay productos registrados en esta categoría en {currentMonthOption.label}.
                    </td>
                  </tr>
                ) : (
                  reportData?.products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                          {prod.image_url ? (
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package2 className="w-5 h-5 text-zinc-500" />
                          )}
                        </div>
                        <span className="text-white font-semibold">{prod.name}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-zinc-400 text-xs">{prod.sku}</td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`font-bold text-base ${
                            prod.stock === 0
                              ? "text-red-400"
                              : prod.stock < 5
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {prod.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-purple-400">
                        {prod.loansInMonth}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-amber-400">
                        {prod.consumptionInMonth}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                            prod.stock === 0
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : prod.stock < 5
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {prod.stock === 0 ? "Sin existencias" : prod.stock < 5 ? "Stock bajo" : "Disponible"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bitácora de Movimientos del Período */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Movimientos Registrados en {currentMonthOption.label}</h2>
              <p className="text-sm text-zinc-400">
                Historial de préstamos, consumos e ingresos para {selectedCategory === "all" ? "todas las categorías" : `la categoría ${selectedCategory}`}
              </p>
            </div>
          </div>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-white/5 border-b border-white/10 text-zinc-400 font-medium">
            <tr>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Producto</th>
              <th className="px-6 py-4">Categoría</th>
              <th className="px-6 py-4">Tipo de Movimiento</th>
              <th className="px-6 py-4 text-center">Cantidad</th>
              <th className="px-6 py-4">Responsable</th>
              <th className="px-6 py-4">Detalle / Motivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Cargando movimientos...</span>
                  </div>
                </td>
              </tr>
            ) : reportData?.movements.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                  No se registraron movimientos en este período para la selección actual.
                </td>
              </tr>
            ) : (
              reportData?.movements.map((mov) => (
                <tr key={mov.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-zinc-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {mov.date}
                  </td>
                  <td className="px-6 py-4 font-medium text-white">
                    <div>
                      <div>{mov.productName}</div>
                      <div className="text-xs text-zinc-500 font-mono">{mov.sku}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-300">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs">
                      {mov.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        mov.type === "loan"
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          : mov.type === "consumption"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}
                    >
                      {mov.type === "loan" ? "Préstamo" : mov.type === "consumption" ? "Consumo" : "Ingreso"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-white">
                    {mov.type === "consumption" || mov.type === "loan" ? `-${mov.quantity}` : `+${mov.quantity}`}
                  </td>
                  <td className="px-6 py-4 text-zinc-300">{mov.user}</td>
                  <td className="px-6 py-4 text-xs text-zinc-400">{mov.reason}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
