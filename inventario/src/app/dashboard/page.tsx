"use client";

import { useEffect, useState } from "react";
import { Package2, ArrowUpRight, Layers, AlertTriangle, ClipboardList, Database, AlertCircle } from "lucide-react";
import { getDashboardData, DashboardMetrics, ActivityItem } from "@/lib/services/dashboard";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import Image from "next/image";

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalProducts: 0,
    totalStock: 0,
    lowStockAlerts: 0,
    activeLoans: 0,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      const configured = isSupabaseConfigured();
      setIsDbConnected(configured);

      if (configured) {
        const data = await getDashboardData();
        setMetrics(data.metrics);
        setActivities(data.recentActivities);
      } else {
        // Valores de demostración mientras se configuran las credenciales
        setMetrics({
          totalProducts: 5,
          totalStock: 37,
          lowStockAlerts: 2,
          activeLoans: 2,
        });
        setActivities([
          {
            id: "1",
            title: "Actualización de Stock",
            details: "Datos de demostración (conecta Supabase en .env.local)",
            timeAgo: "Hace 1 h",
          },
        ]);
      }
      setLoading(false);
    }

    loadStats();
  }, []);

  const stats = [
    {
      label: "Productos Totales",
      value: loading ? "..." : metrics.totalProducts.toLocaleString(),
      icon: Package2,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Stock Total",
      value: loading ? "..." : metrics.totalStock.toLocaleString(),
      icon: Layers,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      label: "Alertas de Stock",
      value: loading ? "..." : metrics.lowStockAlerts.toLocaleString(),
      icon: AlertTriangle,
      color: "text-red-400",
      bg: "bg-red-400/10",
    },
    {
      label: "Préstamos Activos",
      value: loading ? "..." : metrics.activeLoans.toLocaleString(),
      icon: ClipboardList,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
  ];

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <header className="flex justify-between items-center mb-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold">Bienvenido de nuevo</h1>
            {isDbConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Database className="w-3 h-3" /> Supabase Activo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertCircle className="w-3 h-3" /> Modo Demo
              </span>
            )}
          </div>
          <p className="text-zinc-400 text-sm">Resumen dinámico del inventario y existencias.</p>
        </div>
        <div className="w-10 h-10 bg-zinc-800 rounded-full border border-white/10 flex items-center justify-center overflow-hidden">
          <Image
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
            alt="User avatar"
            width={40}
            height={40}
            unoptimized
          />
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-3xl p-6 hover:border-white/20 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-emerald-400 bg-emerald-400/10">
                <ArrowUpRight className="w-3 h-3" />
                En vivo
              </div>
            </div>
            <p className="text-zinc-400 text-sm mb-1">{stat.label}</p>
            <h3 className="text-3xl font-bold">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-3xl p-6">
        <h2 className="text-xl font-bold mb-6">Actividad Reciente</h2>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-zinc-500 text-sm py-4">No hay actividad reciente registrada aún.</p>
          ) : (
            activities.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-white/10 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                    <Package2 className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-white">{act.title}</h4>
                    <p className="text-xs text-zinc-400">{act.details}</p>
                  </div>
                </div>
                <span className="text-xs text-zinc-500">{act.timeAgo}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
