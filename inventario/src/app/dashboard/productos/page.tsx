"use client";

import { useState, useRef, useEffect } from "react";
import { Package2, Search, Filter, Plus, Download, Camera, Image as ImageIcon, X, Database, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { getProducts, createProduct } from "@/lib/services/products";
import { getCategories, createCategory } from "@/lib/services/categories";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import AccessDenied from "@/components/AccessDenied";

interface ProductItem {
  id?: string;
  name: string;
  sku: string;
  cat: string;
  stock: number;
  loaned: number;
  status: "ok" | "warning" | "danger";
  image_url?: string | null;
}

export default function Productos() {
  const { isAdmin, canAccess, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDbConnected, setIsDbConnected] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [productImage, setProductImage] = useState<string | null>(null);

  // Form states for new product
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formStock, setFormStock] = useState<number>(0);
  const [formCategory, setFormCategory] = useState("");
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Form state for new category
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Camera states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cargar datos al iniciar
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const configured = isSupabaseConfigured();
      setIsDbConnected(configured);

      if (configured) {
        try {
          const [dbProducts, dbCategories] = await Promise.all([
            getProducts(),
            getCategories(),
          ]);

          setProducts(
            dbProducts.map((p) => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
              cat: p.category,
              stock: p.stock,
              loaned: p.loaned,
              image_url: p.image_url,
              status: p.stock === 0 ? "danger" : p.stock < 5 ? "warning" : "ok",
            }))
          );

          setCategories(dbCategories.map((c) => c.name));
        } catch (error) {
          console.error("Error cargando datos de Supabase:", error);
        }
      }
      setLoading(false);
    }

    loadData();
  }, []);

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      alert("No se pudo acceder a la cámara. Por favor verifica los permisos del navegador.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        setProductImage(canvas.toDataURL("image/jpeg"));
        stopCamera();
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSku.trim() || !formCategory) {
      alert("Por favor completa el nombre, SKU y categoría.");
      return;
    }

    setIsSavingProduct(true);
    try {
      if (isDbConnected) {
        const created = await createProduct({
          name: formName.trim(),
          sku: formSku.trim(),
          category_name: formCategory,
          stock: Number(formStock) || 0,
          image_url: productImage,
        });

        if (created) {
          setProducts((prev) => [
            {
              id: created.id,
              name: created.name,
              sku: created.sku,
              cat: created.category,
              stock: created.stock,
              loaned: created.loaned,
              image_url: created.image_url,
              status: created.stock === 0 ? "danger" : created.stock < 5 ? "warning" : "ok",
            },
            ...prev,
          ]);
        }
      } else {
        // Modo local/fallback si aún no conectan las credenciales
        const newLocalItem: ProductItem = {
          name: formName.trim(),
          sku: formSku.trim(),
          cat: formCategory,
          stock: Number(formStock) || 0,
          loaned: 0,
          image_url: productImage,
          status: Number(formStock) === 0 ? "danger" : Number(formStock) < 5 ? "warning" : "ok",
        };
        setProducts((prev) => [newLocalItem, ...prev]);
      }

      // Limpiar formulario y cerrar
      setFormName("");
      setFormSku("");
      setFormStock(0);
      setFormCategory("");
      setProductImage(null);
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar producto";
      alert("Error: " + msg);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;

    setIsSavingCategory(true);
    try {
      if (isDbConnected) {
        await createCategory(name);
      }
      if (!categories.includes(name)) {
        setCategories((prev) => [...prev, name]);
      }
      setFormCategory(name);
      setNewCategoryName("");
      setIsCategoryModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al crear categoría";
      alert("Error: " + msg);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const filteredData = products.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ["Producto", "SKU", "Categoría", "Stock", "Prestados"];

    const rows = filteredData.map((item) => [
      `"${item.name}"`,
      item.sku,
      item.cat,
      item.stock,
      item.loaned,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inventario_${new Date().toLocaleDateString().replace(/\//g, "-")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!authLoading && !isAdmin && !canAccess("inventory")) {
    return (
      <AccessDenied
        title="Acceso Restringido a Inventario"
        message="El Administrador no te ha otorgado permisos para ver o modificar el catálogo de productos."
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
            <span className="text-zinc-300">Productos</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight">Inventario General</h1>
            {isDbConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Database className="w-3 h-3" /> Supabase Conectado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertCircle className="w-3 h-3" /> Credenciales pendientes en .env.local
              </span>
            )}
          </div>
          <p className="text-zinc-400 mt-1">Gestiona todos los productos, préstamos y existencias en tiempo real.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-all"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg text-sm font-semibold transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </header>

      {/* Toolbar (Search & Filters) */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 mb-6 flex justify-between items-center">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 text-white rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white transition-colors">
            <Filter className="w-4 h-4" />
            Categoría
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-zinc-300 hover:text-white transition-colors">
            <Filter className="w-4 h-4" />
            Estado
          </button>
        </div>
      </div>

      {/* DataTable */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-white/5 border-b border-white/10 text-zinc-400 font-medium">
            <tr>
              <th className="px-6 py-4">Producto</th>
              <th className="px-6 py-4">SKU</th>
              <th className="px-6 py-4">Categoría</th>
              <th className="px-6 py-4 text-center">Stock</th>
              <th className="px-6 py-4 text-center">Prestados</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                    <span>Cargando productos de la base de datos...</span>
                  </div>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                  No se encontraron productos en el inventario. Da clic en &quot;Nuevo Producto&quot; para registrar uno.
                </td>
              </tr>
            ) : (
              filteredData.map((item, i) => (
                <tr key={item.id || i} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package2 className="w-5 h-5 text-zinc-500" />
                      )}
                    </div>
                    <span>{item.name}</span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 font-mono text-xs">{item.sku}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full bg-white/10 text-xs text-zinc-300">
                      {item.cat}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`font-bold ${
                        item.stock === 0
                          ? "text-red-400"
                          : item.stock < 5
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {item.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-zinc-400">{item.loaned}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-400 hover:text-blue-300 font-medium text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">Registrar Nuevo Producto</h2>
                <p className="text-sm text-zinc-400">
                  {isDbConnected
                    ? "Se guardará directamente en tu base de datos de Supabase."
                    : "Modo local: configura tus credenciales para persistir en Supabase."}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-1.5 block">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Ej. Cámara Canon EOS R5"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-300 mb-1.5 block">
                      SKU (Código único) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="CAM-CAN-001"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-300 mb-1.5 block">
                      Stock Inicial
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formStock}
                      onChange={(e) => setFormStock(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-1.5 block">
                    Categoría *
                  </label>
                  <div className="flex gap-2">
                    <select
                      required
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white appearance-none"
                    >
                      <option value="" disabled className="text-zinc-500">
                        Selecciona una categoría...
                      </option>
                      {categories.map((c) => (
                        <option key={c} value={c} className="bg-zinc-900">
                          {c}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="px-3 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" /> Nueva
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-1.5 block">
                    Fotografía del Producto
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-white/20 bg-white/5 flex items-center justify-center overflow-hidden">
                      {productImage ? (
                        <img
                          src={productImage}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-zinc-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex gap-2 mb-2 w-full">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="cursor-pointer flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-sm font-medium transition-all text-blue-400"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Cámara</span>
                        </button>
                        <label className="cursor-pointer flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-all text-zinc-300">
                          <ImageIcon className="w-4 h-4" />
                          <span>Subir</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-zinc-500 text-center">
                        JPG, PNG. Recomendado formato cuadrado.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setProductImage(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingProduct && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSavingProduct ? "Guardando..." : "Guardar Producto"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-lg font-bold">Crear Categoría</h2>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory}>
              <div className="p-6">
                <label className="text-sm font-medium text-zinc-300 mb-1.5 block">
                  Nombre de la Categoría
                </label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Ej. Drones"
                />
              </div>
              <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingCategory}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  {isSavingCategory && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Crear</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Viewfinder Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/50">
              <h2 className="text-lg font-bold">Capturar Fotografía</h2>
              <button
                onClick={stopCamera}
                className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              ></video>
              <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40"></div>
              <div className="absolute inset-0 pointer-events-none border-2 border-white/20 m-[40px] rounded-xl border-dashed"></div>
            </div>
            <div className="p-6 border-t border-white/10 bg-zinc-900/50 flex justify-center">
              <button
                onClick={capturePhoto}
                className="flex items-center gap-2 px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105"
              >
                <Camera className="w-5 h-5" />
                Tomar Fotografía
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
