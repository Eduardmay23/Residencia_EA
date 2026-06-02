import { Package2, ArrowRight, Lock, Mail } from "lucide-react";
import Link from "next/link";

export default function Login() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl transition-all duration-300 hover:border-white/20">
          
          {/* Logo and Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 transform transition-transform duration-300 hover:scale-105">
              <Package2 className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">DECD Inventario</h1>
            <p className="text-zinc-400 text-sm">Gestiona tu stock de manera segura</p>
          </div>

          {/* Form */}
          <form className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 pl-1">Correo Electrónico</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input 
                  type="email" 
                  placeholder="admin@decd.com" 
                  className="w-full bg-black/40 border border-white/10 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-zinc-600"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 pl-1">Contraseña</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full bg-black/40 border border-white/10 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-zinc-600"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm mt-2 mb-6">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0" />
                <span className="text-zinc-400 group-hover:text-zinc-300 transition-colors">Recordarme</span>
              </label>
              <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">¿Olvidaste tu contraseña?</a>
            </div>

            <Link 
              href="/dashboard"
              className="w-full block text-center relative group overflow-hidden bg-white text-black font-semibold rounded-xl py-3.5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-[1.02]"
            >
              <span className="flex items-center justify-center gap-2">
                Iniciar Sesión
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </form>

        </div>
        
        {/* Footer info */}
        <p className="text-center text-zinc-600 text-xs mt-8 font-medium tracking-wide">
          SISTEMA SEGURO • PROTEGIDO CON SUPABASE
        </p>
      </div>
    </div>
  );
}
