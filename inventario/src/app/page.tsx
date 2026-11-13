"use client";

import { useState, useEffect } from "react";
import { Package2, ArrowRight, Lock, Mail, User, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const [isFirstAdmin, setIsFirstAdmin] = useState(false);
  const [checkingInitialState, setCheckingInitialState] = useState(true);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkUsers() {
      try {
        const { data, error } = await supabase.from("user_profiles").select("id").limit(1);
        if (!error && data && data.length === 0) {
          setIsFirstAdmin(true);
        }
      } catch (err) {
        console.error("Error checking initial users:", err);
      } finally {
        setCheckingInitialState(false);
      }
    }

    checkUsers();
  }, [supabase]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isFirstAdmin) {
        // Registro del primer Super Administrador
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: fullName.trim() || "Administrador Principal",
              role: "admin",
              can_access_inventory: true,
              can_access_loans: true,
              can_access_reports: true,
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          router.push("/dashboard");
          return;
        } else {
          setSuccessMessage(
            "¡Cuenta de Administrador creada! Si tienes confirmación de correo activa en Supabase, revisa tu bandeja. Si no, ya puedes iniciar sesión."
          );
          setIsFirstAdmin(false);
        }
      } else {
        // Inicio de sesión normal
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) throw error;

        // Validar si la cuenta está activa
        if (data.user) {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("is_active, role")
            .eq("id", data.user.id)
            .single();

          if (profile && profile.is_active === false) {
            await supabase.auth.signOut();
            throw new Error("Tu cuenta ha sido desactivada por el administrador del sistema.");
          }
        }

        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al procesar la solicitud.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

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
            <p className="text-zinc-400 text-sm">
              {isFirstAdmin
                ? "Configura la cuenta del Super Administrador"
                : "Gestiona tu stock de manera segura"}
            </p>
          </div>

          {/* Banner de Primer Administrador */}
          {isFirstAdmin && !checkingInitialState && (
            <div className="mb-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white text-sm mb-0.5">Creando Super Administrador</p>
                <p className="text-zinc-300">
                  Esta será la cuenta principal con control total para crear usuarios y asignar permisos.
                </p>
              </div>
            </div>
          )}

          {/* Mensajes de error o éxito */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            {isFirstAdmin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 pl-1">Nombre Completo</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Administrador Principal"
                    className="w-full bg-black/40 border border-white/10 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-zinc-600 text-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 pl-1">Correo Electrónico</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@empresa.com"
                  className="w-full bg-black/40 border border-white/10 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-zinc-600 text-sm"
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
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/10 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-zinc-600 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-white text-black font-semibold rounded-xl py-3.5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{isFirstAdmin ? "Crear Super Administrador" : "Iniciar Sesión"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
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
