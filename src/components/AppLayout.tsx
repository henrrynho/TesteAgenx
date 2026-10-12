import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AppLayout() {
    const [nomeEstabelecimento, setNomeEstabelecimento] = useState("Agenx");
  const [corPrimaria, setCorPrimaria] = useState("#7C3AED");
  const [logoUrl, setLogoUrl] = useState("/logo.png");

  useEffect(() => {
    async function carregarEstabelecimento() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("estabelecimentos")
        .select("nome, cor_primaria, logo_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Erro ao carregar estabelecimento:", error);
        return;
      }

      if (data) {
        setNomeEstabelecimento(data.nome || "Agenx");
        setCorPrimaria(data.cor_primaria || "#7C3AED");
        setLogoUrl(data.logo_url || "/logo.png");
      }
    }

    carregarEstabelecimento();
  }, []);
  return (
    <SidebarProvider>
      <div
  className="min-h-screen flex w-full"
  style={{
  "--primary": (() => {
    const hex = corPrimaria.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (delta !== 0) {
      s = delta / (1 - Math.abs(2 * l - 1));

      if (max === r) {
        h = 60 * (((g - b) / delta) % 6);
      } else if (max === g) {
        h = 60 * ((b - r) / delta + 2);
      } else {
        h = 60 * ((r - g) / delta + 4);
      }
    }

    if (h < 0) h += 360;

    return `${h} ${s * 100}% ${l * 100}%`;
  })(),
} as React.CSSProperties}
>
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="relative h-14 flex items-center border-b border-border px-4 shrink-0">
            <SidebarTrigger className="mr-4 md:inline-flex">
              <Menu className="h-5 w-5" />
              <span className="ml-1 text-sm font-medium md:hidden">Menu</span>
            </SidebarTrigger>
           {logoUrl ? (
  <img
    src={logoUrl}
    alt={nomeEstabelecimento}
    title={nomeEstabelecimento}
    className="absolute left-1/2 -translate-x-1/2 h-10 max-w-[180px] object-contain"
  />
) : (
  <span className="absolute left-1/2 -translate-x-1/2 font-semibold">
    {nomeEstabelecimento}
  </span>
)}
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
            <Outlet />
          </main>
        </div>
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}
