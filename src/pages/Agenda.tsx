import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useApp, timeToMinutes } from "@/contexts/AppContext";
import { format, addDays, subDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSearchParams } from "react-router-dom";

const HOUR_HEIGHT = 72;
const START_HOUR = 8;
const END_HOUR = 20;
const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => `${(i + START_HOUR).toString().padStart(2, "0")}:00`);

export default function Agenda() {
 const { appointments, professionals, updateAppointment } = useApp();
  const [searchParams] = useSearchParams();
  const filterFromUrl = searchParams.get("filter");
  const [view, setView] = useState<"dia" | "semana">("dia");
  const [currentDate, setCurrentDate] = useState(() => {
    if (filterFromUrl === "ontem") return subDays(new Date(), 1);
    return new Date();
  });
  const activePros = professionals.filter((p) => p.ativo);
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), i)
  );

  const dateStr = format(currentDate, "yyyy-MM-dd");
  const displayDate = format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const handleEditAppointment = async (apt: any) => {
  const newDate = window.prompt(
    "Digite a nova data do agendamento no formato AAAA-MM-DD:",
    apt.data
  );

  if (!newDate) return;

  const newTime = window.prompt(
    "Digite o novo horário do agendamento no formato HH:mm:",
    apt.horario
  );

  if (!newTime) return;

  const ids = apt.appointmentIds || [apt.id];

  for (const appointmentId of ids) {
    await updateAppointment(appointmentId, {
      data: newDate,
      horario: newTime,
    });
  }
};

  const dayAppointments = appointments.filter((a) => a.data === dateStr && a.status !== "cancelado");

  type GroupedDayAppointment = {
    key: string;
    id: string;
    appointmentIds: string[];
    data: string;
    clienteNome: string;
    horario: string;
    horarioFim: string;
    servicos: string[];
    profissionais: string[];
    totalPreco: number;
    totalDuracao: number;
    status: string;
  };

  const groupedDayAppointments = Object.values(
    dayAppointments.reduce<Record<string, GroupedDayAppointment>>((acc, apt) => {
      const key = `${apt.data}__${apt.horario}__${apt.clienteNome}`;

      if (!acc[key]) {
        acc[key] = {
          key,
          id: key,
          appointmentIds: [apt.id],
          data: apt.data,
          clienteNome: apt.clienteNome,
          horario: apt.horario,
          horarioFim: apt.horarioFim,
          servicos: [apt.servicoNome],
          profissionais: [apt.profissionalNome],
          totalPreco: apt.preco,
          totalDuracao: apt.duracao,
          status: apt.status,
        };
      } else {
        if (!acc[key].appointmentIds.includes(apt.id)) {
          acc[key].appointmentIds.push(apt.id);
        }

        acc[key].servicos.push(apt.servicoNome);

        if (!acc[key].profissionais.includes(apt.profissionalNome)) {
          acc[key].profissionais.push(apt.profissionalNome);
        }

        acc[key].totalPreco += apt.preco;
        acc[key].totalDuracao += apt.duracao;

        if (apt.horarioFim && acc[key].horarioFim) {
          if (apt.horarioFim.localeCompare(acc[key].horarioFim) > 0) {
            acc[key].horarioFim = apt.horarioFim;
          }
        } else if (apt.horarioFim) {
          acc[key].horarioFim = apt.horarioFim;
        }
      }

      return acc;
    }, {})
  );
  return (
    <div className="space-y-6 max-w-7xl pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold">Agenda</h1>
          <p className="text-muted-foreground text-sm mt-1 capitalize">{displayDate}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate((d) => subDays(d, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate((d) => addDays(d, 1))}><ChevronRight className="h-4 w-4" /></Button>
          <div className="flex gap-1 border border-border rounded-lg p-1 ml-2">
            <Button variant={view === "dia" ? "secondary" : "ghost"} size="sm" onClick={() => setView("dia")}>Dia</Button>
            <Button variant={view === "semana" ? "secondary" : "ghost"} size="sm" onClick={() => setView("semana")}>Semana</Button>
          </div>
        </div>
      </div>

      {activePros.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          <p className="text-lg font-medium">Nenhum profissional ativo</p>
          <p className="text-sm">Ative profissionais para ver a agenda.</p>
        </CardContent></Card>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <div className="w-full">
              {/* Header */}

              {/* Time grid */}
              {view === "dia" ? (
                    <div className="space-y-4">
    {dayAppointments
      .slice()
      .sort((a, b) => a.horario.localeCompare(b.horario))
      .length === 0 ? (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Nenhum agendamento neste dia</p>
        </CardContent>
      </Card>
    ) : (
    groupedDayAppointments
  .slice()
  .sort((a, b) => a.horario.localeCompare(b.horario))
  .map((group) => (
          <Card key={group.key} className="border border-border bg-card/60">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="shrink-0">
                  <p className="text-lg font-semibold text-purple-300 leading-none">
                    {group.horario}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {group.horarioFim}
                  </p>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">
                    {group.clienteNome}
                  </p>
                  <p className="text-xs text-white/75 mt-1 truncate">
                    {group.servicos.join(", ")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    Profissionais: {group.profissionais.join(", ")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {group.totalDuracao} min
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-white">
                    R$ {group.totalPreco.toFixed(2)}
                  </p>
                  <p
                   className={`text-xs mt-1 ${
  group.status === "confirmado"
    ? "text-green-400"
    : group.status === "cancelado"
    ? "text-red-400"
    : "text-yellow-400"
}`}
                  >
                    {group.status}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
    )}
  </div>   
                      ) : (

  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
    {weekDays.map((day, i) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayAppts = appointments
        .filter((a) => a.data === dayStr && a.status !== "cancelado")
        .sort((a, b) => a.horario.localeCompare(b.horario));
   const groupedAppointments = Array.from(
  appointments
    .filter((a) => a.data === dayStr && a.status !== "cancelado")
    .sort((a, b) => a.horario.localeCompare(b.horario))
    .reduce((map, apt) => {
      const appointment = apt as any;
      const clientKey = appointment.clienteId || appointment.clienteNome;
      const groupKey = `${appointment.data}-${appointment.horario}-${clientKey}`;

      if (!map.has(groupKey)) {
        map.set(groupKey, {
  ...appointment,
  id: groupKey,
  appointmentIds: [appointment.id],
  data: appointment.data,
  servicos: [appointment.servicoNome],
  profissionais: [appointment.profissionalNome],
});
      
        } else {
  const existing = map.get(groupKey);

  if (!existing.appointmentIds.includes(appointment.id)) {
    existing.appointmentIds.push(appointment.id);
  }

  if (!existing.servicos.includes(appointment.servicoNome)) {
   existing.servicos.push(appointment.servicoNome);
   }

        if (!existing.profissionais.includes(appointment.profissionalNome)) {
          existing.profissionais.push(appointment.profissionalNome);
        }
      }

      return map;
    }, new Map<string, any>())
    .values()
).map((apt: any) => ({
  ...apt,
  servicoNome: apt.servicos.join(" + "),
  profissionalNome: apt.profissionais.join(", "),
}));

      return (
        <div
          key={i}
          className="rounded-2xl border border-border bg-muted/20 overflow-hidden min-h-[180px]"
        >
          <div className="px-3 py-3 border-b border-border bg-background/40">
  <p className="text-[11px] text-muted-foreground capitalize">
    {format(day, "EEEE", { locale: ptBR })}
  </p>
  <p className="text-sm font-semibold text-white">
    {format(day, "dd/MM")}
  </p>
</div>

          <div className="p-3 space-y-2.5">
            {groupedAppointments.length === 0 ? (
              <p className="text-[11px] text-muted-foreground/60 text-center py-10">
  Sem agendamentos
</p>
            ) : (
             groupedAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="rounded-xl bg-purple-900/30 border border-purple-500/30 px-3 py-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
  <p className="text-[12px] font-semibold text-white truncate">
    {apt.clienteNome}
  </p>

  <button
    type="button"
    onClick={() => handleEditAppointment(apt)}
    className="text-[10px] text-purple-200 hover:text-white border border-purple-400/40 rounded px-2 py-0.5 shrink-0"
  >
    Editar
  </button>
</div>

                  <p className="text-[11px] text-white/75 truncate mt-0.5">
                    {apt.servicoNome}
                  </p>

                  <p className="text-[10px] text-white/45 truncate">
                    {apt.profissionalNome}
                  </p>

                  <p className="text-[10px] text-purple-300 mt-1 font-medium">
                    {apt.horario}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      );
    })}
  </div>
)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Global empty state */}
      {view === "dia" && activePros.length > 0 && dayAppointments.length === 0 && (
  <div className="text-center py-8 text-muted-foreground">
    <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" />
    <p className="text-sm font-medium">Nenhum agendamento neste dia</p>
  </div>
)}
    </div>
  );
}
