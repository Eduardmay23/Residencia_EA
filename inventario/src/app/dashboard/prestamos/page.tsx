"use client";

import { useState } from "react";
import { ClipboardList, Search, Filter, Plus, Clock, ArrowDownRight, PackageMinus, Package2, Printer } from "lucide-react";
import Link from "next/link";

const MOCK_LOANS = [
  { id: "L-001", item: "MacBook Pro 16\"", sku: "LAP-MBP-001", user: "Ana Martínez", date: "2026-06-01", status: "active", type: "Préstamo" },
  { id: "L-002", item: "Cámara Sony A7III", sku: "CAM-SNY-045", user: "Carlos López", date: "2026-05-28", status: "active", type: "Préstamo" },
];

const MOCK_CONSUMPTION = [
  { id: "C-001", item: "Cartucho Tinta Negra HP", sku: "INK-HP-001", user: "Depto. Marketing", date: "2026-06-02", qty: 2, reason: "Impresión de volantes", type: "Consumo Local" },
  { id: "C-002", item: "Resma Papel Bond", sku: "PAP-BND-500", user: "Depto. Finanzas", date: "2026-06-01", qty: 5, reason: "Reporte Mensual", type: "Consumo Local" },
];

export default function Prestamos() {
  const [activeTab, setActiveTab] = useState<"prestamos" | "consumo">("prestamos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePrintVoucher = (type: "SALIDA" | "DEVOLUCIÓN" | "CONSUMO INTERNO", data: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const html = `
      <html>
        <head>
          <title>Comprobante de ${type}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
               @page { margin: 0; }
               body { padding: 2cm; }
            }
          </style>
        </head>
        <body class="bg-white text-black p-8 font-sans">
          <div class="max-w-2xl mx-auto border-2 border-zinc-200 p-8 rounded-2xl">
            <div class="flex justify-between items-start border-b-2 border-zinc-100 pb-6 mb-6">
              <div>
                <h1 class="text-3xl font-bold uppercase tracking-wider text-zinc-800">VALE DE ${type}</h1>
                <p class="text-zinc-500 mt-1">DECD Control de Inventario</p>
              </div>
              <div class="text-right bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                <p class="font-bold text-xl text-zinc-800">Folio: ${data.id}</p>
                <p class="text-zinc-500 text-sm mt-1">Fecha: ${new Date().toLocaleDateString()}</p>
              </div>
            </div>
            
            <div class="space-y-6 mb-12">
              <div class="grid grid-cols-2 gap-6 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                <div>
                  <p class="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">Responsable</p>
                  <p class="text-lg font-semibold text-zinc-800">${data.user}</p>
                </div>
                <div>
                  <p class="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">Autorizado por</p>
                  <p class="text-lg font-semibold text-zinc-800">Administración</p>
                </div>
              </div>
              <div class="p-4 border-l-4 border-purple-500 bg-purple-50 rounded-r-xl">
                <p class="text-xs text-purple-400 font-bold uppercase tracking-wider mb-1">Detalle del Artículo</p>
                <p class="text-xl font-bold text-zinc-800">${data.item}</p>
                <p class="text-zinc-500 font-mono text-sm mt-1">SKU: ${data.sku}</p>
              </div>
            </div>

            <div class="mt-20 pt-8 grid grid-cols-2 gap-12 text-center">
              <div>
                <div class="border-b-2 border-zinc-300 w-full mb-3"></div>
                <p class="text-sm font-bold text-zinc-600">Firma de Entrega</p>
              </div>
              <div>
                <div class="border-b-2 border-zinc-300 w-full mb-3"></div>
                <p class="text-sm font-bold text-zinc-600">Firma de Conformidad</p>
              </div>
            </div>
            
            <div class="mt-16 text-center text-xs text-zinc-400 border-t border-zinc-100 pt-6">
              <p>Este documento es un comprobante oficial de ${type.toLowerCase()} de equipo/suministro.</p>
              <p>El receptor asume la responsabilidad del uso adecuado y retorno (si aplica) del artículo descrito.</p>
            </div>
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

  const filteredLoans = MOCK_LOANS.filter(loan => 
    loan.item.toLowerCase().includes(searchTerm.toLowerCase()) || 
    loan.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConsumption = MOCK_CONSUMPTION.filter(cons => 
    cons.item.toLowerCase().includes(searchTerm.toLowerCase()) || 
    cons.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cons.user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <header className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <span>/</span>
            <span className="text-zinc-300">Préstamos y Consumo</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Salidas de Inventario</h1>
          <p className="text-zinc-400 mt-1">Controla los equipos prestados y los suministros consumidos internamente.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg text-sm font-semibold transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Nueva Salida
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-6">
        <button 
          onClick={() => setActiveTab("prestamos")}
          className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === "prestamos" ? "border-white text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
        >
          Equipos Prestados
        </button>
        <button 
          onClick={() => setActiveTab("consumo")}
          className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === "consumo" ? "border-white text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
        >
          Consumo Local (Suministros)
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 mb-6 flex justify-between items-center">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Buscar por usuario, artículo o código..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 text-white rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white transition-colors">
            <Filter className="w-4 h-4" />
            Filtrar Fecha
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl overflow-hidden">
        {activeTab === "prestamos" ? (
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 border-b border-white/10 text-zinc-400 font-medium">
              <tr>
                <th className="px-6 py-4">ID Préstamo</th>
                <th className="px-6 py-4">Artículo</th>
                <th className="px-6 py-4">Asignado a</th>
                <th className="px-6 py-4">Fecha Salida</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    No se encontraron préstamos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-mono text-zinc-300">{loan.id}</td>
                    <td className="px-6 py-4 font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div>{loan.item}</div>
                        <div className="text-xs text-zinc-500 font-mono">{loan.sku}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{loan.user}</td>
                    <td className="px-6 py-4 text-zinc-400">{loan.date}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-400 text-xs font-medium border border-amber-400/20">
                        En Uso
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handlePrintVoucher("SALIDA", loan)}
                        className="text-blue-400 hover:text-blue-300 font-medium p-1.5 border border-blue-400/20 bg-blue-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Imprimir Vale de Salida"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handlePrintVoucher("DEVOLUCIÓN", loan)}
                        className="text-emerald-400 hover:text-emerald-300 font-medium text-xs border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Registrar Devolución
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 border-b border-white/10 text-zinc-400 font-medium">
              <tr>
                <th className="px-6 py-4">ID Consumo</th>
                <th className="px-6 py-4">Suministro</th>
                <th className="px-6 py-4">Departamento/Usuario</th>
                <th className="px-6 py-4 text-center">Cantidad</th>
                <th className="px-6 py-4">Fecha / Motivo</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredConsumption.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    No se encontraron registros de consumo que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredConsumption.map((cons, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-mono text-zinc-300">{cons.id}</td>
                    <td className="px-6 py-4 font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                        <PackageMinus className="w-4 h-4" />
                      </div>
                      <div>
                        <div>{cons.item}</div>
                        <div className="text-xs text-zinc-500 font-mono">{cons.sku}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{cons.user}</td>
                    <td className="px-6 py-4 text-center font-bold text-rose-400">-{cons.qty}</td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-300">{cons.date}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{cons.reason}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handlePrintVoucher("CONSUMO INTERNO", cons)}
                        className="text-blue-400 hover:text-blue-300 font-medium p-1.5 border border-blue-400/20 bg-blue-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center"
                        title="Imprimir Vale de Consumo"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Salida */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold">Registrar Nueva Salida</h2>
              <p className="text-sm text-zinc-400">Selecciona el tipo de movimiento de inventario.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Tipo de Salida</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white appearance-none">
                  <option value="prestamo" className="bg-zinc-900">Préstamo (Equipos retornables)</option>
                  <option value="consumo" className="bg-zinc-900">Consumo Local (Suministros no retornables)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Producto / Artículo</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white appearance-none">
                  <option value="" disabled selected className="bg-zinc-900 text-zinc-500">Selecciona un producto...</option>
                  <option value="1" className="bg-zinc-900">MacBook Pro 16" (Stock: 12)</option>
                  <option value="2" className="bg-zinc-900">Cartucho Tinta Negra HP (Stock: 50)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Usuario o Departamento Destino</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50" placeholder="Ej. Ana Martínez / Depto. IT" />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Motivo / Notas</label>
                <textarea className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[80px]" placeholder="Ej. Préstamo para evento en exteriores..."></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors">Cancelar</button>
              <button className="px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-colors">Confirmar Salida</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
