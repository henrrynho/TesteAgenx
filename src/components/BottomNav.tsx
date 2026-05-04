import { LayoutDashboard, CalendarDays, CalendarRange, Users, Scissors, UserCog } from "lucide-react";
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Agendamentos", url: "/agendamentos", icon: CalendarDays },
  { title: "Agenda", url: "/agenda", icon: CalendarRange },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Serviços", url: "/servicos", icon: Scissors },
  { title: "Equipe", url: "/profissionais", icon: UserCog },
];

export function BottomNav() {
  const location = useLocation();

  const isActive = (url: string) =>
    url === "/" ? location.pathname === "/" : location.pathname.startsWith(url);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card md:hidden">
      <div className="flex items-center justify-around h-16 px-1">
        {items.map((item) => {
          const active = isActive(item.url);
          return (
            <RouterNavLink
              key={item.url}
              to={item.url}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span className="truncate max-w-[64px]">{item.title}</span>
            </RouterNavLink>
          );
        })}
      </div>
    </nav>
  );
}
