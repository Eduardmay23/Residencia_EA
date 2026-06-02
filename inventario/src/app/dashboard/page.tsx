import { Package2, ArrowUpRight, Layers, AlertTriangle, ClipboardList, ArrowDownRight } from "lucide-react";

export default function Dashboard() {
  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-1">Bienvenido de nuevo</h1>
          <p className="text-zinc-400 text-sm">Aquí tienes un resumen de tu inventario.</p>
        </div>
        <div className="w-10 h-10 bg-zinc-800 rounded-full border border-white/10 flex items-center justify-center overflow-hidden">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="User" className="w-full h-full object-cover" />
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: "Productos Totales", value: "342", trend: "+12", trendUp: true, icon: Package2, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Stock Total", value: "5,280", trend: "+150", trendUp: true, icon: Layers, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Alertas de Stock", value: "12", trend: "-3", trendUp: false, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-400/10" },
          { label: "Préstamos Activos", value: "45", trend: "+5", trendUp: true, icon: ClipboardList, color: "text-purple-400", bg: "bg-purple-400/10" },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-3xl p-6 hover:border-white/20 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stat.trendUp ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
            <p className="text-zinc-400 text-sm mb-1">{stat.label}</p>
            <h3 className="text-3xl font-bold">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-3xl p-6">
        <h2 className="text-xl font-bold mb-6">Actividad Reciente</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-white/10 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                  <Package2 className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <h4 className="font-medium text-sm text-white">Actualización de Stock</h4>
                  <p className="text-xs text-zinc-400">Se agregaron 50 unidades de Laptop Pro</p>
                </div>
              </div>
              <span className="text-xs text-zinc-500">Hace {i * 2} horas</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
