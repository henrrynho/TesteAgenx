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
  style={{ "--primary": corPrimaria } as React.CSSProperties}
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
