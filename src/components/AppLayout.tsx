import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="relative h-14 flex items-center border-b border-border px-4 shrink-0">
            <SidebarTrigger className="mr-4 md:inline-flex">
              <Menu className="h-5 w-5" />
              <span className="ml-1 text-sm font-medium md:hidden">Menu</span>
            </SidebarTrigger>
            <img src="/logo.png" className="absolute left-1/2 -translate-x-1/2 h-10 w-auto" />
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
