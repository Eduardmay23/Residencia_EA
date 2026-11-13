"use client";

import { useState, useEffect } from "react";
import { BarChart3, PieChart, Activity, Download, Calendar, Database, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { getReportData, CategoryStat, AuditLogItem } from "@/lib/services/reports";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import AccessDenied from "@/components/AccessDenied";

const DEFAULT_MONTHLY = [
  { month: "Sem 1", value: 15 },
  { month: "Sem 2", value: 40 },
  { month: "Sem 3", value: 20 },
  { month: "Sem 4", value: 65 },
];

const DEFAULT_LOGS: AuditLogItem[] = [
  { id: "LOG-001", user: "Ana Martínez", action: "creó", item: "Producto: Cámara Sony A7III", date: "2026-06-03 10:45 AM", type: "create" },
  { id: "LOG-002", user: "Carlos López", action: "actualizó stock", item: "Producto: MacBook Pro 16\"", date: "2026-06-03 09:12 AM", type: "update" },
  { id: "LOG-003", user: "Depto. IT", action: "registró consumo", item: "Suministro: Tinta Negra HP", date: "2026-06-02 04:30 PM", type: "consume" },
];

const DEFAULT_CATEGORIES: CategoryStat[] = [
  { name: "Laptops", count: 12, percentage: 40, color: "bg-blue-500" },
  { name: "Audiovisual", count: 10, percentage: 30, color: "bg-purple-500" },
  { name: "Periféricos", count: 5, percentage: 20, color: "bg-emerald-500" },
  { name: "Audio", count: 3, percentage: 10, color: "bg-rose-500" },
];

export default function Reportes() {
  const { isAdmin, canAccess, loading: authLoading } = useAuth();
  const [dateRange, setDateRange] = useState("Este Mes");
  const [loading, setLoading] = useState(true);
  const [isDbConnected, setIsDbConnected] = useState(false);

  const [categories, setCategories] = useState<CategoryStat[]>(DEFAULT_CATEGORIES);
  const [logs, setLogs] = useState<AuditLogItem[]>(DEFAULT_LOGS);

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      const configured = isSupabaseConfigured();
      setIsDbConnected(configured);

      if (configured) {
        try {
          const data = await getReportData();
          if (data.categories.length > 0) {
            setCategories(data.categories);
          }
          if (data.logs.length > 0) {
            setLogs(data.logs);
          }
        } catch (err) {
          console.error("Error al cargar reportes:", err);
        }
      }
      setLoading(false);
    }

    loadReports();
  }, []);

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Reporte de Auditoría - ${dateRange}</title>
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
              <h1 class="text-3xl font-bold uppercase text-zinc-800">Reporte de Inventario y Auditoría</h1>
              <p class="text-zinc-500 mt-1">Periodo: ${dateRange} | Fecha de generación: ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="text-right">
              <p class="font-bold text-xl text-zinc-800">DECD</p>
              <p class="text-zinc-500 text-sm">Control Interno</p>
            </div>
          </div>
          
          <h2 class="text-xl font-bold mb-4 border-b pb-2">1. Distribución por Categoría</h2>
          <div class="grid grid-cols-2 gap-4 mb-10">
            ${categories
              .map(
                (c) => `
              <div class="flex justify-between border-b border-zinc-100 py-2">
                <span class="font-medium">${c.name}</span>
                <span>${c.count} items (${c.percentage}%)</span>
              </div>
            `
              )
              .join("")}
          </div>

          <h2 class="text-xl font-bold mb-4 border-b pb-2">2. Registro de Auditoría de Usuarios</h2>
          <table class="w-full text-sm text-left border border-zinc-200">
            <thead class="bg-zinc-100 text-zinc-600">
              <tr>
                <th class="p-3 border-b text-left">Fecha y Hora</th>
                <th class="p-3 border-b text-left">Usuario</th>
                <th class="p-3 border-b text-left">Acción</th>
                <th class="p-3 border-b text-left">Elemento</th>
              </tr>
            </thead>
            <tbody>
              ${logs
                .map(
                  (l) => `
                <tr class="border-b border-zinc-100">
                  <td class="p-3">${l.date}</td>
                  <td class="p-3 font-bold">${l.user}</td>
                  <td class="p-3 uppercase text-xs font-bold text-zinc-500">${l.action}</td>
                  <td class="p-3">${l.item}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="mt-16 text-center text-xs text-zinc-400 border-t pt-4">
            <p>Documento generado automáticamente por el Sistema de Inventario.</p>
          </div>
          
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 1000);
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

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-zinc-300">Reportes</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight">Reportes y Auditoría</h1>
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
          <p className="text-zinc-400 mt-1">Analiza el rendimiento y supervisa los movimientos de los usuarios.</p>
        </div>

        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white appearance-none"
          >
            <option className="bg-zinc-900">Este Mes</option>
            <option className="bg-zinc-900">Mes Pasado</option>
            <option className="bg-zinc-900">Últimos 6 Meses</option>
            <option className="bg-zinc-900">Este Año</option>
          </select>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg text-sm font-semibold transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-105"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Movimientos por Mes */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Movimientos por Mes</h2>
              <p className="text-sm text-zinc-400">Volumen de salidas y entradas registradas</p>
            </div>
          </div>

          <div className="flex-1 flex items-end gap-4 h-64 mt-auto">
            {DEFAULT_MONTHLY.map((data, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full relative flex justify-center h-full items-end">
                  <div className="absolute -top-8 bg-zinc-800 text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {data.value} mov.
                  </div>
                  <div
                    className="w-full max-w-[3rem] bg-gradient-to-t from-blue-600/50 to-blue-400 rounded-t-md transition-all duration-500 group-hover:brightness-110"
                    style={{ height: `${data.value}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-zinc-400">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reporte por Categoría */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Por Categoría</h2>
              <p className="text-sm text-zinc-400">Distribución de stock en la base de datos</p>
            </div>
          </div>

          <div className="flex-1 space-y-5">
            {loading ? (
              <div className="py-8 text-center flex items-center justify-center gap-2 text-zinc-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span>Cargando categorías...</span>
              </div>
            ) : categories.length === 0 ? (
              <p className="text-zinc-500 text-sm py-4">Sin datos de productos.</p>
            ) : (
              categories.map((cat, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1.5 text-sm">
                    <span className="font-medium text-zinc-300">{cat.name}</span>
                    <span className="text-zinc-500">
                      {cat.percentage}% ({cat.count})
                    </span>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${cat.color} rounded-full`}
                      style={{ width: `${cat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Auditoría de Usuarios */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Auditoría de Actividad</h2>
              <p className="text-sm text-zinc-400">Registro histórico de modificaciones en la base de datos.</p>
            </div>
          </div>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-white/5 border-b border-white/10 text-zinc-400 font-medium">
            <tr>
              <th className="px-6 py-4">Fecha y Hora</th>
              <th className="px-6 py-4">Usuario Responsable</th>
              <th className="px-6 py-4">Acción Realizada</th>
              <th className="px-6 py-4">Elemento / Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Cargando registros de auditoría...</span>
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                  No hay actividades registradas en la base de datos aún.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-zinc-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {log.date}
                  </td>
                  <td className="px-6 py-4 font-medium text-white">{log.user}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        log.type === "create"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : log.type === "update"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : log.type === "delete"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-300 font-medium">{log.item}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
