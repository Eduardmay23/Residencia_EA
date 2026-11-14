"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Clock, PackageMinus, Printer, Loader2, Database, AlertCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  getLoans,
  getConsumptions,
  createLoan,
  createConsumption,
  returnLoan,
  deleteLoan,
  deleteConsumption,
  DbLoanItem,
  DbConsumptionItem,
} from "@/lib/services/loans";
import { getProducts } from "@/lib/services/products";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { Product } from "@/types";
import { useAuth } from "@/context/AuthContext";
import AccessDenied from "@/components/AccessDenied";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";

type DeleteTarget =
  | { kind: "loan"; data: DbLoanItem }
  | { kind: "consumption"; data: DbConsumptionItem };

export default function Prestamos() {
  const { profile, user, isAdmin, canAccess, canDelete, loading: authLoading } = useAuth();
  const actorName = profile?.full_name || user?.email || "Usuario";
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<"prestamos" | "consumo">("prestamos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDbConnected, setIsDbConnected] = useState(false);

  const [loans, setLoans] = useState<DbLoanItem[]>([]);
  const [consumptions, setConsumptions] = useState<DbConsumptionItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  // Form states
  const [movementType, setMovementType] = useState<"prestamo" | "consumo">("prestamo");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [formUser, setFormUser] = useState("");
  const [formQty, setFormQty] = useState(1);
  const [formReason, setFormReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const configured = isSupabaseConfigured();
      setIsDbConnected(configured);

      if (configured) {
        try {
          const [loadedLoans, loadedConsumptions, loadedProducts] = await Promise.all([
            getLoans(),
            getConsumptions(),
            getProducts(),
          ]);

          setLoans(loadedLoans);
          setConsumptions(loadedConsumptions);
          setAvailableProducts(loadedProducts);
        } catch (error) {
          console.error("Error al cargar préstamos:", error);
        }
      }
      setLoading(false);
    }

    loadData();
  }, []);

  const handlePrintVoucher = (type: "SALIDA" | "DEVOLUCIÓN" | "CONSUMO INTERNO", data: Record<string, string | number>) => {
    const printWindow = window.open("", "_blank");
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

              <div>
                <table class="w-full text-left border border-zinc-200 rounded-lg overflow-hidden">
                  <thead class="bg-zinc-50 text-xs font-bold text-zinc-500 uppercase">
                    <tr>
                      <th class="p-3">Concepto / Artículo</th>
                      <th class="p-3">Código (SKU)</th>
                      <th class="p-3 text-center">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-zinc-200 text-sm">
                    <tr>
                      <td class="p-3 font-medium">${data.item}</td>
                      <td class="p-3 font-mono text-zinc-600">${data.sku}</td>
                      <td class="p-3 text-center font-bold">${data.qty || 1}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              ${
                data.reason
                  ? `
                <div class="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                  <p class="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">Motivo</p>
                  <p class="text-sm text-zinc-700">${data.reason}</p>
                </div>
              `
                  : ""
              }
            </div>

            <div class="border-t-2 border-dashed border-zinc-200 pt-12 mt-12 grid grid-cols-2 gap-12 text-center">
              <div>
                <div class="border-b border-black w-48 mx-auto mb-2"></div>
                <p class="text-xs font-bold uppercase text-zinc-600">Firma de Quien Entrega</p>
              </div>
              <div>
                <div class="border-b border-black w-48 mx-auto mb-2"></div>
                <p class="text-xs font-bold uppercase text-zinc-600">Firma de Quien Recibe</p>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleReturn = async (loan: DbLoanItem) => {
    if (!confirm(`¿Confirmas la devolución de "${loan.item}"?`)) return;

    try {
      if (isDbConnected && loan.id && loan.productId) {
        await returnLoan(loan.id, loan.productId, loan.quantity || 1);
        setAvailableProducts(await getProducts());
      }
      setLoans((prev) =>
        prev.map((l) => (l.id === loan.id ? { ...l, status: "returned" } : l))
      );
      handlePrintVoucher("DEVOLUCIÓN", loan as unknown as Record<string, string | number>);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al procesar devolución";
      alert(msg);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !canDelete) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.kind === "loan") {
        if (isDbConnected) await deleteLoan(deleteTarget.data.id, true);
        setLoans((prev) => prev.filter((l) => l.id !== deleteTarget.data.id));
      } else {
        if (isDbConnected) await deleteConsumption(deleteTarget.data.id, true);
        setConsumptions((prev) => prev.filter((c) => c.id !== deleteTarget.data.id));
      }
      if (isDbConnected) {
        setAvailableProducts(await getProducts());
      }
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo eliminar el registro";
      alert("Error: " + msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !formUser.trim()) {
      alert("Por favor selecciona un producto y especifica el responsable.");
      return;
    }

    const prod = availableProducts.find((p) => p.id === selectedProductId);
    const qty = Number(formQty) || 1;

    if (!prod) {
      alert("Por favor selecciona un producto válido.");
      return;
    }

    if (qty <= 0) {
      alert("La cantidad debe ser mayor a 0.");
      return;
    }

    if (prod.stock < qty) {
      alert(`Stock insuficiente para "${prod.name}". Disponible: ${prod.stock} unidad(es).`);
      return;
    }

    setIsSaving(true);
    try {
      if (movementType === "prestamo") {
        if (isDbConnected) {
          const res = await createLoan({
            productId: selectedProductId,
            loanedTo: formUser.trim(),
            deliveredBy: actorName,
            quantity: qty,
          });
          setLoans((prev) => [
            {
              id: res?.id || `L-${Date.now().toString().slice(-4)}`,
              productId: selectedProductId,
              item: prod.name,
              sku: prod.sku,
              user: formUser.trim(),
              date: new Date().toLocaleDateString(),
              status: "active",
              type: "Préstamo",
              quantity: qty,
            },
            ...prev,
          ]);
        } else {
          setLoans((prev) => [
            {
              id: `L-${Date.now().toString().slice(-4)}`,
              item: prod.name,
              sku: prod.sku,
              user: formUser.trim(),
              date: new Date().toLocaleDateString(),
              status: "active",
              type: "Préstamo",
              quantity: qty,
            },
            ...prev,
          ]);
        }
      } else {
        if (isDbConnected) {
          const res = await createConsumption({
            productId: selectedProductId,
            requestedBy: formUser.trim(),
            dispatchedBy: actorName,
            quantity: qty,
            reason: formReason.trim() || "Consumo regular",
          });
          setConsumptions((prev) => [
            {
              id: res?.id || `C-${Date.now().toString().slice(-4)}`,
              item: prod.name,
              sku: prod.sku,
              user: formUser.trim(),
              date: new Date().toLocaleDateString(),
              qty: qty,
              reason: formReason.trim() || "Consumo regular",
              type: "Consumo Local",
            },
            ...prev,
          ]);
        } else {
          setConsumptions((prev) => [
            {
              id: `C-${Date.now().toString().slice(-4)}`,
              item: prod.name,
              sku: prod.sku,
              user: formUser.trim(),
              date: new Date().toLocaleDateString(),
              qty: qty,
              reason: formReason.trim() || "Consumo regular",
              type: "Consumo Local",
            },
            ...prev,
          ]);
        }
      }

      if (isDbConnected) {
        setAvailableProducts(await getProducts());
      }

      setIsModalOpen(false);
      setFormUser("");
      setFormQty(1);
      setFormReason("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrar salida";
      alert(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredLoans = loans.filter(
    (l) =>
      l.status === "active" &&
      (l.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredConsumption = consumptions.filter(
    (c) =>
      c.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!authLoading && !isAdmin && !canAccess("loans")) {
    return (
      <AccessDenied
        title="Acceso Restringido a Préstamos"
        message="El Administrador no te ha otorgado permisos para gestionar salidas o devoluciones de inventario."
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
            <span className="text-zinc-300">Movimientos y Salidas</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight">Préstamos y Consumo</h1>
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
          <p className="text-zinc-400 mt-1">Control de salidas de equipos retornables y suministros internos.</p>
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
      <div className="flex gap-4 border-b border-white/10 mb-6">
        <button
          onClick={() => setActiveTab("prestamos")}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "prestamos"
              ? "border-blue-500 text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-300"
          }`}
        >
          <Clock className="w-4 h-4" />
          Préstamos Activos
          <span className="ml-1.5 px-2 py-0.5 text-xs bg-white/10 rounded-full text-zinc-300">
            {filteredLoans.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("consumo")}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "consumo"
              ? "border-purple-500 text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-300"
          }`}
        >
          <PackageMinus className="w-4 h-4" />
          Consumo Local / Suministros
          <span className="ml-1.5 px-2 py-0.5 text-xs bg-white/10 rounded-full text-zinc-300">
            {filteredConsumption.length}
          </span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 mb-6 flex justify-between items-center">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por artículo, usuario o folio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 text-white rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex items-center justify-center gap-2 text-zinc-400">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            <span>Cargando movimientos...</span>
          </div>
        ) : activeTab === "prestamos" ? (
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 border-b border-white/10 text-zinc-400 font-medium">
              <tr>
                <th className="px-6 py-4">Folio</th>
                <th className="px-6 py-4">Equipo / Artículo</th>
                <th className="px-6 py-4">Responsable</th>
                <th className="px-6 py-4">Fecha Salida</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    No hay préstamos activos en este momento.
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-mono text-zinc-400">{loan.id}</td>
                    <td className="px-6 py-4 font-medium">
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
                        onClick={() =>
                          handlePrintVoucher(
                            "SALIDA",
                            loan as unknown as Record<string, string | number>
                          )
                        }
                        className="text-blue-400 hover:text-blue-300 font-medium p-1.5 border border-blue-400/20 bg-blue-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Imprimir Vale de Salida"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReturn(loan)}
                        className="text-emerald-400 hover:text-emerald-300 font-medium text-xs border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Registrar Devolución
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => setDeleteTarget({ kind: "loan", data: loan })}
                          className="text-red-400 hover:text-red-300 p-1.5 border border-red-400/20 bg-red-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Eliminar préstamo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
                    No se encontraron registros de consumo.
                  </td>
                </tr>
              ) : (
                filteredConsumption.map((cons) => (
                  <tr key={cons.id} className="hover:bg-white/5 transition-colors group">
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
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() =>
                            handlePrintVoucher(
                              "CONSUMO INTERNO",
                              cons as unknown as Record<string, string | number>
                            )
                          }
                          className="text-blue-400 hover:text-blue-300 font-medium p-1.5 border border-blue-400/20 bg-blue-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center"
                          title="Imprimir Vale de Consumo"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => setDeleteTarget({ kind: "consumption", data: cons })}
                            className="text-red-400 hover:text-red-300 p-1.5 border border-red-400/20 bg-red-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center"
                            title="Eliminar consumo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirmación de eliminación */}
      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        title={deleteTarget?.kind === "loan" ? "Eliminar Préstamo" : "Eliminar Consumo"}
        itemLabel={
          deleteTarget
            ? deleteTarget.kind === "loan"
              ? `${deleteTarget.data.item} — ${deleteTarget.data.quantity || 1} unidad(es) prestadas a ${deleteTarget.data.user}`
              : `${deleteTarget.data.item} — ${deleteTarget.data.qty} unidad(es) para ${deleteTarget.data.user}`
            : ""
        }
        warning={
          deleteTarget?.kind === "loan"
            ? "Las unidades prestadas se regresarán automáticamente al stock disponible del producto."
            : "Las unidades consumidas se regresarán automáticamente al stock disponible del producto."
        }
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Modal de Salida */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold">Registrar Nueva Salida</h2>
              <p className="text-sm text-zinc-400">Selecciona el tipo de movimiento de inventario.</p>
            </div>
            <form onSubmit={handleCreateMovement}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Tipo de Salida</label>
                  <select
                    value={movementType}
                    onChange={(e) => setMovementType(e.target.value as "prestamo" | "consumo")}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white appearance-none"
                  >
                    <option value="prestamo" className="bg-zinc-900">
                      Préstamo (Equipos retornables)
                    </option>
                    <option value="consumo" className="bg-zinc-900">
                      Consumo Local (Suministros no retornables)
                    </option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-1.5 block">
                    Producto / Artículo *
                  </label>
                  <select
                    required
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white appearance-none"
                  >
                    <option value="" disabled className="bg-zinc-900 text-zinc-500">
                      {availableProducts.length > 0
                        ? "Selecciona un producto..."
                        : "No hay productos en inventario. Registra uno primero en Productos."}
                    </option>
                    {availableProducts.map((p) => (
                      <option
                        key={p.id}
                        value={p.id}
                        disabled={p.stock <= 0}
                        className="bg-zinc-900 disabled:text-zinc-600"
                      >
                        {p.name} ({p.stock > 0 ? `Stock: ${p.stock}` : "Agotado"})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-300 mb-1.5 block">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={availableProducts.find((p) => p.id === selectedProductId)?.stock || undefined}
                      required
                      value={formQty}
                      onChange={(e) => setFormQty(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-300 mb-1.5 block">
                      Responsable *
                    </label>
                    <input
                      type="text"
                      required
                      value={formUser}
                      onChange={(e) => setFormUser(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      placeholder="Ej. Ana Martínez / Depto. IT"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-1.5 block">
                    Motivo / Observaciones
                  </label>
                  <textarea
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[80px]"
                    placeholder="Ej. Préstamo para evento en exteriores..."
                  ></textarea>
                </div>
              </div>
              <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSaving ? "Guardando..." : "Confirmar Salida"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
