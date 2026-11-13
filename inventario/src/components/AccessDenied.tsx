"use client";

import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AccessDenied({
  title = "Acceso Denegado",
  message = "No tienes permisos asignados por el Administrador para acceder a este apartado.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <main className="flex-1 p-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8 text-center backdrop-blur-md shadow-2xl">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-400 shadow-lg shadow-red-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-white">{title}</h2>
        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">{message}</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-black font-semibold rounded-xl text-sm hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Panel Principal
        </Link>
      </div>
    </main>
  );
}
