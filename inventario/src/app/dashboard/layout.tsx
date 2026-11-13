"use client";

import { Package2, Users, LayoutDashboard, LogOut, ClipboardList, BarChart3, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { profile, user, isAdmin, canAccess, signOut, loading } = useAuth();

  // Comprobar visibilidad de cada apartado
  const showInventory = isAdmin || canAccess("inventory");
  const showLoans = isAdmin || canAccess("loans");
  const showReports = isAdmin || canAccess("reports");
  const showUsers = isAdmin;

  const navItems = [
    {
      href: "/dashboard",
      label: "Panel Principal",
      icon: LayoutDashboard,
      show: true,
    },
    {
      href: "/dashboard/productos",
      label: "Productos",
      icon: Package2,
      show: showInventory,
    },
    {
      href: "/dashboard/prestamos",
      label: "Préstamos y Salidas",
      icon: ClipboardList,
      show: showLoans,
    },
    {
      href: "/dashboard/reportes",
      label: "Reportes y Auditoría",
      icon: BarChart3,
      show: showReports,
    },
    {
      href: "/dashboard/usuarios",
      label: "Usuarios y Permisos",
      icon: Users,
      show: showUsers,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans overflow-hidden relative">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar */}
      <aside className="w-64 bg-white/5 border-r border-white/10 backdrop-blur-xl flex flex-col relative z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Package2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white block leading-tight">Inventario</span>
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">DECD System</span>
          </div>
        </div>

        {/* User Card */}
        <div className="px-4 mb-2">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300">
              {isAdmin ? <ShieldCheck className="w-5 h-5 text-purple-400" /> : <User className="w-5 h-5 text-blue-400" />}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">
                {profile?.full_name || user?.email?.split("@")[0] || (loading ? "Cargando..." : "Invitado")}
              </p>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1 font-medium">
                {isAdmin ? (
                  <span className="text-purple-400">Super Admin</span>
                ) : (
                  <span>Usuario Estándar</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 mt-3 overflow-y-auto">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white text-black font-semibold shadow-lg shadow-white/5"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-black" : "text-zinc-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
        </nav>

        {/* Footer (Logout) */}
        <div className="p-4 mt-auto border-t border-white/5">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content wrapper */}
      <div className="flex-1 relative z-10 flex flex-col h-screen overflow-hidden">
        {children}
      </div>
    </div>
  );
}
