"use client";

import { useState, useEffect } from "react";
import {
  UserPlus,
  Shield,
  ShieldAlert,
  X,
  Package2,
  ClipboardList,
  BarChart3,
  Loader2,
  Lock,
  Mail,
  User,
  Sliders,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getAllUsers, createUserByAdmin, updateUserPermissions } from "@/lib/services/users";
import { UserProfile, Role } from "@/types";

export default function UsuariosPage() {
  const { profile, isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Estados Formulario Crear Usuario
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("editor");
  const [newCanInventory, setNewCanInventory] = useState(true);
  const [newCanLoans, setNewCanLoans] = useState(true);
  const [newCanReports, setNewCanReports] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Estados Formulario Editar Permisos
  const [editRole, setEditRole] = useState<Role>("editor");
  const [editCanInventory, setEditCanInventory] = useState(true);
  const [editCanLoans, setEditCanLoans] = useState(true);
  const [editCanReports, setEditCanReports] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
      setLoading(false);
    }

    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditCanInventory(Boolean(user.can_access_inventory));
    setEditCanLoans(Boolean(user.can_access_loans));
    setEditCanReports(Boolean(user.can_access_reports));
    setEditIsActive(user.is_active !== false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsUpdating(true);
    try {
      const updated = await updateUserPermissions(editingUser.id, {
        role: editRole,
        can_access_inventory: editCanInventory,
        can_access_loans: editCanLoans,
        can_access_reports: editCanReports,
        is_active: editIsActive,
      });

      if (updated) {
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? { ...u, ...updated } : u))
        );
      }
      setEditingUser(null);
    } catch (err: unknown) {
      alert("Error al actualizar permisos: " + (err instanceof Error ? err.message : "Error"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      await createUserByAdmin({
        email: newEmail,
        password: newPassword,
        fullName: newFullName,
        role: newRole,
        canAccessInventory: newCanInventory,
        canAccessLoans: newCanLoans,
        canAccessReports: newCanReports,
      });

      // Recargar lista de usuarios
      const updatedList = await getAllUsers();
      setUsers(updatedList);

      // Limpiar y cerrar
      setNewFullName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("editor");
      setNewCanInventory(true);
      setNewCanLoans(true);
      setNewCanReports(false);
      setIsCreateModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al crear usuario";
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Pantalla de bloqueo si no es Administrador
  if (!authLoading && !isAdmin) {
    return (
      <main className="flex-1 p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8 text-center backdrop-blur-md">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Acceso Restringido</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Solo el Administrador del sistema tiene autorización para ver y configurar los permisos de otros usuarios.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-2.5 bg-white text-black font-semibold rounded-xl text-sm hover:bg-zinc-200 transition-colors"
          >
            Volver al Panel Principal
          </Link>
        </div>
      </main>
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
            <span className="text-zinc-300">Control de Acceso</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight">Gestión de Usuarios</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Shield className="w-3 h-3" /> Panel del Administrador
            </span>
          </div>
          <p className="text-zinc-400 mt-1">
            Crea usuarios y define a qué apartados del inventario tiene permiso acceder cada uno.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-black hover:bg-zinc-200 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-105"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </header>

      {/* Tabla de Usuarios */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-white/5 border-b border-white/10 text-zinc-400 font-medium">
            <tr>
              <th className="px-6 py-4">Usuario</th>
              <th className="px-6 py-4">Rol</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Módulos Permitidos</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-400">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                    <span>Cargando usuarios...</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                  No hay usuarios registrados aparte del administrador.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 font-bold text-sm">
                        {u.full_name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          {u.full_name}
                          {u.id === profile?.id && (
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono">
                              TÚ
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500">{u.email || "Sin correo"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        u.role === "admin"
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}
                    >
                      {u.role === "admin" ? "Administrador" : "Usuario Estándar"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u.is_active !== false ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                        <XCircle className="w-3.5 h-3.5" /> Desactivado
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {u.role === "admin" ? (
                      <span className="text-xs text-purple-300 font-medium">
                        Acceso Total (Todos los apartados)
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {u.can_access_inventory && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-zinc-300">
                            <Package2 className="w-3 h-3 text-blue-400" /> Productos
                          </span>
                        )}
                        {u.can_access_loans && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-zinc-300">
                            <ClipboardList className="w-3 h-3 text-purple-400" /> Préstamos
                          </span>
                        )}
                        {u.can_access_reports && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-zinc-300">
                            <BarChart3 className="w-3 h-3 text-emerald-400" /> Reportes
                          </span>
                        )}
                        {!u.can_access_inventory && !u.can_access_loans && !u.can_access_reports && (
                          <span className="text-xs text-zinc-500 italic">Sin apartados permitidos</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.id !== profile?.id && (
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="text-blue-400 hover:text-blue-300 font-medium text-xs border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1"
                      >
                        <Sliders className="w-3 h-3" /> Configurar Permisos
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Crear Nuevo Usuario */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Registrar Nuevo Usuario</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Crea credenciales y asigna a qué secciones podrá ingresar.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="email"
                        required
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="usuario@empresa.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                      Contraseña Temporal
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                    Rol del Usuario
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as Role)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="editor" className="bg-zinc-900">
                      Usuario Estándar (Acceso según permisos asignados)
                    </option>
                    <option value="admin" className="bg-zinc-900">
                      Administrador (Acceso total al sistema)
                    </option>
                  </select>
                </div>

                {/* Apartados Permitidos (Checkboxes) */}
                {newRole !== "admin" && (
                  <div className="pt-2 border-t border-white/10">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 block">
                      Decidir qué apartados puede ver este usuario:
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer transition-all">
                        <div className="flex items-center gap-3">
                          <Package2 className="w-4 h-4 text-blue-400" />
                          <div>
                            <p className="text-sm font-medium text-white">Inventario (Productos)</p>
                            <p className="text-xs text-zinc-400">Ver catálogo y gestionar existencias</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={newCanInventory}
                          onChange={(e) => setNewCanInventory(e.target.checked)}
                          className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500/50"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer transition-all">
                        <div className="flex items-center gap-3">
                          <ClipboardList className="w-4 h-4 text-purple-400" />
                          <div>
                            <p className="text-sm font-medium text-white">Préstamos y Consumo</p>
                            <p className="text-xs text-zinc-400">Registrar salidas de equipos y suministros</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={newCanLoans}
                          onChange={(e) => setNewCanLoans(e.target.checked)}
                          className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500/50"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer transition-all">
                        <div className="flex items-center gap-3">
                          <BarChart3 className="w-4 h-4 text-emerald-400" />
                          <div>
                            <p className="text-sm font-medium text-white">Reportes y Auditoría</p>
                            <p className="text-xs text-zinc-400">Consultar estadísticas y trazabilidad</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={newCanReports}
                          onChange={(e) => setNewCanReports(e.target.checked)}
                          className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500/50"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-white text-black font-semibold rounded-xl text-sm hover:bg-zinc-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSaving ? "Creando..." : "Crear Usuario"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Modificar Permisos de Usuario Existente */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Modificar Permisos</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Usuario: <span className="text-white font-medium">{editingUser.full_name}</span> ({editingUser.email})
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="p-6 space-y-4">
                {/* Switch Estado Activo / Inactivo */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Estado de la Cuenta</p>
                    <p className="text-xs text-zinc-400">Si se desactiva, el usuario no podrá iniciar sesión.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditIsActive(!editIsActive)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      editIsActive
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {editIsActive ? "Cuenta Activa" : "Cuenta Desactivada"}
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                    Rol
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as Role)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="editor" className="bg-zinc-900">
                      Usuario Estándar
                    </option>
                    <option value="admin" className="bg-zinc-900">
                      Administrador (Acceso Total)
                    </option>
                  </select>
                </div>

                {editRole !== "admin" && (
                  <div className="pt-2 border-t border-white/10">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 block">
                      Apartados Permitidos:
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Package2 className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-medium text-white">Inventario (Productos)</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={editCanInventory}
                          onChange={(e) => setEditCanInventory(e.target.checked)}
                          className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-blue-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <ClipboardList className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-medium text-white">Préstamos y Consumo</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={editCanLoans}
                          onChange={(e) => setEditCanLoans(e.target.checked)}
                          className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-blue-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <BarChart3 className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm font-medium text-white">Reportes y Auditoría</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={editCanReports}
                          onChange={(e) => setEditCanReports(e.target.checked)}
                          className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-blue-500"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-2"
                >
                  {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
