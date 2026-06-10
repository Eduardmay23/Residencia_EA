"use client";

import { useState } from "react";
import { BarChart3, PieChart, Activity, Download, Calendar } from "lucide-react";
import Link from "next/link";

const MOCK_AUDIT_LOG = [
  { id: "LOG-001", user: "Ana Martínez", action: "creó", item: "Producto: Cámara Sony A7III", date: "2026-06-03 10:45 AM", type: "create" },
  { id: "LOG-002", user: "Carlos López", action: "actualizó stock", item: "Producto: MacBook Pro 16\"", date: "2026-06-03 09:12 AM", type: "update" },
  { id: "LOG-003", user: "Depto. IT", action: "registró consumo", item: "Suministro: Tinta Negra HP", date: "2026-06-02 04:30 PM", type: "consume" },
  { id: "LOG-004", user: "Admin", action: "eliminó", item: "Categoría: Obsoletos", date: "2026-06-01 11:20 AM", type: "delete" },
  { id: "LOG-005", user: "Ana Martínez", action: "registró préstamo", item: "Equipo: Proyector Epson", date: "2026-06-01 08:00 AM", type: "loan" },
];

const DATA_SETS = {
  "Este Mes": {
    monthly: [
      { month: "Sem 1", value: 15 },
      { month: "Sem 2", value: 40 },
      { month: "Sem 3", value: 20 },
      { month: "Sem 4", value: 65 },
    ],
    categories: [
      { name: "Laptops", count: 45, percentage: 40, color: "bg-blue-500" },
      { name: "Audiovisual", count: 20, percentage: 30, color: "bg-purple-500" },
      { name: "Periféricos", count: 10, percentage: 20, color: "bg-emerald-500" },
      { name: "Suministros", count: 5, percentage: 10, color: "bg-rose-500" },
    ],
    logs: MOCK_AUDIT_LOG
  },
  "Mes Pasado": {
    monthly: [
      { month: "Sem 1", value: 80 },
      { month: "Sem 2", value: 50 },
      { month: "Sem 3", value: 10 },
      { month: "Sem 4", value: 90 },
    ],
    categories: [
      { name: "Laptops", count: 100, percentage: 50, color: "bg-blue-500" },
      { name: "Audiovisual", count: 50, percentage: 25, color: "bg-purple-500" },
      { name: "Periféricos", count: 30, percentage: 15, color: "bg-emerald-500" },
      { name: "Suministros", count: 20, percentage: 10, color: "bg-rose-500" },
    ],
    logs: MOCK_AUDIT_LOG.slice(0, 3)
  },
  "Últimos 6 Meses": {
    monthly: [
      { month: "Ene", value: 45 },
      { month: "Feb", value: 52 },
      { month: "Mar", value: 38 },
      { month: "Abr", value: 65 },
      { month: "May", value: 89 },
      { month: "Jun", value: 72 },
    ],
    categories: [
      { name: "Laptops", count: 145, percentage: 45, color: "bg-blue-500" },
      { name: "Audiovisual", count: 89, percentage: 25, color: "bg-purple-500" },
      { name: "Periféricos", count: 56, percentage: 15, color: "bg-emerald-500" },
      { name: "Suministros", count: 34, percentage: 10, color: "bg-rose-500" },
      { name: "Otros", count: 12, percentage: 5, color: "bg-zinc-500" },
    ],
    logs: MOCK_AUDIT_LOG
  },
  "Este Año": {
    monthly: [
      { month: "Ene", value: 95 },
      { month: "Feb", value: 102 },
      { month: "Mar", value: 88 },
      { month: "Abr", value: 115 },
      { month: "May", value: 139 },
      { month: "Jun", value: 122 },
    ],
    categories: [
      { name: "Laptops", count: 290, percentage: 45, color: "bg-blue-500" },
      { name: "Audiovisual", count: 178, percentage: 25, color: "bg-purple-500" },
      { name: "Periféricos", count: 112, percentage: 15, color: "bg-emerald-500" },
      { name: "Suministros", count: 68, percentage: 10, color: "bg-rose-500" },
      { name: "Otros", count: 24, percentage: 5, color: "bg-zinc-500" },
    ],
    logs: MOCK_AUDIT_LOG
  }
};

export default function Reportes() {
  const [dateRange, setDateRange] = useState<keyof typeof DATA_SETS>("Este Mes");

  const currentData = DATA_SETS[dateRange];

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
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
            ${currentData.categories.map(c => `
              <div class="flex justify-between border-b border-zinc-100 py-2">
                <span class="font-medium">${c.name}</span>
                <span>${c.count} items (${c.percentage}%)</span>
              </div>
            `).join('')}
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
              ${currentData.logs.map(l => `
                <tr class="border-b border-zinc-100">
                  <td class="p-3">${l.date}</td>
                  <td class="p-3 font-bold">${l.user}</td>
                  <td class="p-3 uppercase text-xs font-bold text-zinc-500">${l.action}</td>
                  <td class="p-3">${l.item}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="mt-16 text-center text-xs text-zinc-400 border-t pt-4">
            <p>Documento generado automáticamente por el Sistema de Inventario DECD.</p>
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

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <header className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <span>/</span>
            <span className="text-zinc-300">Reportes</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Reportes y Auditoría</h1>
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
        
        {/* Reporte por Mes (Gráfico de Barras Simulado) */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Movimientos por Mes</h2>
              <p className="text-sm text-zinc-400">Volumen de salidas y entradas</p>
            </div>
          </div>

          <div className="flex-1 flex items-end gap-4 h-64 mt-auto">
            {currentData.monthly.map((data, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full relative flex justify-center h-full items-end">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 bg-zinc-800 text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {data.value} mov.
                  </div>
                  {/* Bar */}
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
              <p className="text-sm text-zinc-400">Distribución de stock</p>
            </div>
          </div>

          <div className="flex-1 space-y-5">
            {currentData.categories.map((cat, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1.5 text-sm">
                  <span className="font-medium text-zinc-300">{cat.name}</span>
                  <span className="text-zinc-500">{cat.percentage}% ({cat.count})</span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
                  <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.percentage}%` }}></div>
                </div>
              </div>
            ))}
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
              <h2 className="text-xl font-bold">Auditoría de Usuarios</h2>
              <p className="text-sm text-zinc-400">Registro detallado de quién hizo qué modificaciones.</p>
            </div>
          </div>
        </div>
        
        <table className="w-full text-sm text-left">
          <thead className="bg-white/5 border-b border-white/10 text-zinc-400 font-medium">
            <tr>
              <th className="px-6 py-4">Fecha y Hora</th>
              <th className="px-6 py-4">Usuario Responsable</th>
              <th className="px-6 py-4">Acción Realizada</th>
              <th className="px-6 py-4">Elemento Afectado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {currentData.logs.map((log, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-zinc-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {log.date}
                </td>
                <td className="px-6 py-4 font-medium text-white">{log.user}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    log.type === 'create' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    log.type === 'update' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    log.type === 'delete' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-300 font-medium">{log.item}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
