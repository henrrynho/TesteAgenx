import { criarNotaFiscalRascunho } from "@/services/notaFiscalService";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency } from "@/data/mock";
import { Plus, CalendarDays, Search, Trash2, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { useApp, addMinutesToTime, type Appointment } from "@/contexts/AppContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
const TIME_SLOTS = [
  "08:00", "08:30",
  "09:00", "09:30",
  "10:00", "10:30",
  "11:00", "11:30",
  "12:00", "12:30",
  "13:00", "13:30",
  "14:00", "14:30",
  "15:00", "15:30",
  "16:00", "16:30",
  "17:00", "17:30",
  "18:00", "18:30",
  "19:00", "19:30"
];
const timeToMinutes = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};
export default function Agendamentos() {
  const { appointments, services, professionals, createMultiServiceAppointment, findOrCreateClient, checkTimeConflict, updateAppointmentStatus, removeAppointment } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<"proximos" | "historico">("proximos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New appointment form
  const [selServices, setSelServices] = useState<string[]>([]);
  const [serviceProfessionals, setServiceProfessionals] = useState<Record<string, string>>({});
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selDate, setSelDate] = useState<Date | undefined>(undefined);
  const [selTime, setSelTime] = useState("");
  const [clientNome, setClientNome] = useState("");
  const [clientTelefone, setClientTelefone] = useState("");

  const activePros = professionals.filter((p) => p.ativo);

  const selectedServiceObjects = useMemo(
    () => services.filter((s) => selServices.includes(s.id)),
    [services, selServices]
  );
  const totalDuracao = selectedServiceObjects.reduce((sum, s) => sum + s.duracao, 0);
  const totalPreco = selectedServiceObjects.reduce((sum, s) => sum + s.preco, 0);
  const todayStr = format(new Date(), "yyyy-MM-dd");
const selectedDateStr = selDate ? format(selDate, "yyyy-MM-dd") : "";

const dayAppointments = appointments.filter(
  (a) =>
    a.data === selectedDateStr &&
    a.status !== "cancelado" &&
    selServices.some((serviceId) => serviceProfessionals[serviceId] === a.profissionalId)
);

const availableTimes = TIME_SLOTS.filter((time) => {
  if (!selDate || selServices.length === 0) return false;

  const allServicesHaveProfessional = selServices.every(
    (serviceId) => !!serviceProfessionals[serviceId]
  );

  if (!allServicesHaveProfessional) return false;

  const professionalDurations = Object.entries(serviceProfessionals).reduce(
    (acc, [serviceId, professionalId]) => {
      if (!selServices.includes(serviceId)) return acc;

      const service = services.find((s) => s.id === serviceId);
      if (!service) return acc;

      acc[professionalId] = (acc[professionalId] || 0) + service.duracao;
      return acc;
    },
    {} as Record<string, number>
  );

  const hasAnyConflict = Object.entries(professionalDurations).some(
    ([professionalId, duration]) => {
      const slotStart = timeToMinutes(time);
      const slotEnd = slotStart + duration;
      const endOfDay = 20 * 60;

      if (slotEnd > endOfDay) return true;

      const professionalAppointments = appointments.filter(
        (a) =>
          a.data === selectedDateStr &&
          a.status !== "cancelado" &&
          a.profissionalId === professionalId
      );

      return professionalAppointments.some((apt) => {
        const aptStart = timeToMinutes(apt.horario);
        const aptEnd = apt.horarioFim
          ? timeToMinutes(apt.horarioFim)
          : aptStart + apt.duracao;

        return slotStart < aptEnd && slotEnd > aptStart;
      });
    }
  );

  return !hasAnyConflict;
});

useEffect(() => {
  setSelTime("");
}, [selDate, selServices, serviceProfessionals]);
const filtered = appointments.filter((a) => {
  const matchStatus = statusFilter === "todos" || a.status === statusFilter;

  const matchSearch =
    a.clienteNome.toLowerCase().includes(search.toLowerCase()) ||
    a.servicoNome.toLowerCase().includes(search.toLowerCase());

  const matchDate =
    dateFilter === "proximos"
      ? a.data >= todayStr
      : a.data < todayStr || a.status === "cancelado";

  return matchStatus && matchSearch && matchDate;
  });
type GroupedAppointment = {
  key: string;
  ids: string[];
  clienteNome: string;
  servicoNomes: string[];
  profissionais: string[];
  data: string;
  horario: string;
  horarioFim: string;
  totalPreco: number;
  status: Appointment["status"];
};

const groupedFiltered = Object.values(
  filtered.reduce<Record<string, GroupedAppointment>>((acc, a) => {
    const key = `${a.clienteNome}__${a.data}__${a.horario}`;

    if (!acc[key]) {
      acc[key] = {
        key,
        ids: [a.id],
        clienteNome: a.clienteNome,
        servicoNomes: [a.servicoNome],
        profissionais: [a.profissionalNome],
        data: a.data,
        horario: a.horario,
        horarioFim: a.horarioFim,
        totalPreco: a.preco,
        status: a.status,
      };
    } else {
      acc[key].ids.push(a.id);

      if (!acc[key].servicoNomes.includes(a.servicoNome)) {
        acc[key].servicoNomes.push(a.servicoNome);
      }

      if (!acc[key].profissionais.includes(a.profissionalNome)) {
        acc[key].profissionais.push(a.profissionalNome);
      }

      acc[key].totalPreco += a.preco;

      if (a.horarioFim && acc[key].horarioFim) {
        if (a.horarioFim.localeCompare(acc[key].horarioFim) > 0) {
          acc[key].horarioFim = a.horarioFim;
        }
      } else if (a.horarioFim) {
        acc[key].horarioFim = a.horarioFim;
      }
    }

    return acc;
  }, {})
);
  const resetForm = () => {
    setSelServices([]); setServiceProfessionals({}); setSelDate(undefined); setSelTime(""); setClientNome(""); setClientTelefone("");
  };

  const toggleService = (id: string) => {
  setSelServices((prev) => {
    const exists = prev.includes(id);
    const next = exists ? prev.filter((s) => s !== id) : [...prev, id];

    if (exists) {
      setServiceProfessionals((current) => {
        const updated = { ...current };
        delete updated[id];
        return updated;
      });
    }

    return next;
  });
};
const allServicesHaveProfessional = selServices.every(
  (serviceId) => !!serviceProfessionals[serviceId]
);

const handleSubmit = async () => {
  if (
    selServices.length === 0 ||
    !allServicesHaveProfessional ||
    !selDate ||
    !selTime ||
    !clientNome.trim() ||
    !clientTelefone.trim()
  ) {
    toast.error("Preencha todos os campos"); return;
  }

    if (!/^\d{2}:\d{2}$/.test(selTime)) {
      toast.error("Formato de horário inválido (use HH:MM)"); return;
    }

    const dateStr = format(selDate, "yyyy-MM-dd");

    setSubmitting(true);
    try {
     const client = await findOrCreateClient(clientNome.trim(), clientTelefone.trim());
     const serviceItems = selectedServiceObjects.map((service) => {
  const professionalId = serviceProfessionals[service.id];
  const professional = professionals.find((p) => p.id === professionalId);

  return {
    serviceId: service.id,
    serviceName: service.nome,
    professionalId,
    professionalName: professional?.nome || "",
    duracao: service.duracao,
    preco: service.preco,
  };
});

for (const item of serviceItems) {
  if (checkTimeConflict(item.professionalId, dateStr, selTime, item.duracao)) {
    toast.error(`Horário em conflito para o serviço ${item.serviceName}`);
    return;
  }
}

for (const item of serviceItems) {
  await createMultiServiceAppointment({
    clienteId: client.id,
    clienteNome: client.nome,
    profissionalId: item.professionalId,
    profissionalNome: item.professionalName,
    servicoIds: [item.serviceId],
    servicoNomes: [item.serviceName],
    data: dateStr,
    horario: selTime,
    totalDuracao: item.duracao,
    totalPreco: item.preco,
    status: "pendente",
  });
}
      toast.success("Agendamento criado com sucesso!");
      setDialogOpen(false);
      resetForm();
    } catch (e: any) {
      console.error("Erro ao criar agendamento:", e);
      toast.error(e.message || "Erro ao criar agendamento");
    } finally {
      setSubmitting(false);
    }
  };
const handleEmitirNfse = async (agendamento: any) => {
  try {
    const servicoDescricao =
      agendamento.servicoNome ||
      agendamento.servico_nome ||
      agendamento.servico ||
      "Serviço de beleza";

    const valor =
      Number(agendamento.preco) ||
      Number(agendamento.valor) ||
      Number(agendamento.total_preco) ||
      Number(agendamento.totalPreco) ||
      0;

    if (!valor || valor <= 0) {
      alert("Este agendamento está sem valor. Não é possível emitir NFS-e.");
      return;
    }

    await criarNotaFiscalRascunho({
      agendamentoId: agendamento.id,
      clienteNome: agendamento.clienteNome || agendamento.cliente_nome || "",
      clienteDocumento:
        agendamento.clienteDocumento || agendamento.cliente_documento || "",
      servicoDescricao,
      valor,
    });

    alert("Solicitação de NFS-e criada com sucesso!");
  } catch (error) {
    console.error("Erro ao criar solicitação de NFS-e:", error);
    alert(
      error instanceof Error
        ? error.message
        : "Erro ao criar solicitação de NFS-e."
    );
  }
};
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold">Agendamentos</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie todos os agendamentos</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-purple-400 text-primary-foreground font-medium" onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />Novo Agendamento
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Agendamento</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Multi-service selection */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Serviços</label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-lg p-2">
                {services.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 text-center">Cadastre um serviço primeiro</p>
                ) : (
                  services.map((s) => (
                    <label key={s.id} className={cn(
                      "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors hover:bg-secondary/50",
                      selServices.includes(s.id) && "bg-primary/5 border border-primary/20"
                    )}>
                      <Checkbox
                        checked={selServices.includes(s.id)}
                        onCheckedChange={() => toggleService(s.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.nome}</p>
                        <p className="text-xs text-muted-foreground">{s.duracao} min</p>
                      </div>
                      <span className="text-sm font-medium text-primary whitespace-nowrap">{formatCurrency(s.preco)}</span>
                    </label>
                  ))
                )}
              </div>
              {selServices.length > 0 && (
                <div className="mt-2 p-2 bg-muted/50 rounded-md text-xs space-y-1">
                  <p><span className="text-muted-foreground">Duração total:</span> <span className="font-medium">{totalDuracao} min</span></p>
                  <p><span className="text-muted-foreground">Valor total:</span> <span className="font-medium text-primary">{formatCurrency(totalPreco)}</span></p>
                </div>
              )}
            </div>

            <div>
              {selServices.length > 0 && (
  <div className="space-y-3">
    <label className="text-sm text-muted-foreground mb-1 block">
      Profissional por serviço
    </label>

    {selectedServiceObjects.map((service) => (
      <div key={service.id} className="space-y-2 rounded-lg border border-border p-3">
        <p className="text-sm font-medium text-white">
          {service.nome}
        </p>

        <Select
          value={serviceProfessionals[service.id] || ""}
          onValueChange={(value) => {
            setServiceProfessionals((prev) => ({
              ...prev,
              [service.id]: value,
            }));
            setSelTime("");
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o profissional deste serviço" />
          </SelectTrigger>
          <SelectContent>
            {activePros.length === 0 ? (
              <SelectItem value="__empty" disabled>
                Cadastre um profissional primeiro
              </SelectItem>
            ) : (
              activePros.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome} - {p.especialidade}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    ))}
  </div>
)}
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Data</label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !selDate && "text-muted-foreground")}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {selDate ? format(selDate, "dd/MM/yyyy") : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
  mode="single"
  selected={selDate}
  onSelect={(d) => {
    setSelDate(d);
    setSelTime("");
    setDatePickerOpen(false);
  }}
  disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
  className="p-3 pointer-events-auto"
  locale={ptBR}
/>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Horário</label>
{!selDate || !selServices.every((serviceId) => !!serviceProfessionals[serviceId]) ? (
  <div className="rounded-lg border border-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
    {!selDate && !selServices.every((serviceId) => !!serviceProfessionals[serviceId])
  ? "Selecione os profissionais dos serviços e a data primeiro"
  : !selServices.every((serviceId) => !!serviceProfessionals[serviceId])
  ? "Selecione os profissionais de cada serviço primeiro"
  : "Selecione uma data primeiro"}
  </div>
) : availableTimes.length === 0 ? (
  <div className="rounded-lg border border-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
    Sem horários disponíveis
  </div>
) : (
  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
    {availableTimes.map((time) => (
      <button
        key={time}
        type="button"
        onClick={() => setSelTime(time)}
        className={
          selTime === time
            ? "rounded-lg border border-purple-400 bg-purple-500/20 px-3 py-2 text-sm font-medium text-white"
            : "rounded-lg border border-border bg-background hover:bg-muted/30 px-3 py-2 text-sm text-foreground transition"
        }
      >
        {time}
      </button>
    ))}
  </div>
)}

{selTime && selServices.length > 0 && (
  <p className="text-xs text-muted-foreground mt-1">
    {selTime} → {addMinutesToTime(selTime, totalDuracao)} ({totalDuracao} min)
  </p>
)}
            </div>

            <Input placeholder="Nome do cliente" value={clientNome} onChange={(e) => setClientNome(e.target.value)} />
            <Input placeholder="Telefone do cliente" value={clientTelefone} onChange={(e) => setClientTelefone(e.target.value)} />
            <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-400 text-primary-foreground" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Criando..." : "Confirmar Agendamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente ou serviço..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as "proximos" | "historico")}>
  <SelectTrigger className="w-full sm:w-44">
    <SelectValue placeholder="Período" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="proximos">Próximos</SelectItem>
    <SelectItem value="historico">Histórico</SelectItem>
  </SelectContent>
</Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="confirmado">Confirmado</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <CalendarDays className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-lg font-medium">Nenhum agendamento encontrado</p>
          <p className="text-sm">Tente alterar os filtros ou criar um novo agendamento.</p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="md:hidden space-y-3">
  {filtered.length === 0 ? (
    <Card className="border border-border bg-card/60">
      <CardContent className="p-4 text-sm text-muted-foreground">
        Nenhum agendamento encontrado.
      </CardContent>
    </Card>
  ) : (
    filtered.map((a) => (
      <Card key={a.id} className="border border-border bg-card/60">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-white truncate">{a.clienteNome}</p>
              <p className="text-xs text-muted-foreground mt-1">{a.data}</p>
            </div>
            <StatusBadge status={a.status} />
          </div>

          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Horário:</span>{" "}
              {a.horario} - {a.horarioFim}
            </p>

            <p>
              <span className="text-muted-foreground">Serviço:</span>{" "}
              {a.servicoNome}
            </p>

            <p>
              <span className="text-muted-foreground">Profissional:</span>{" "}
              {a.profissionalNome}
            </p>

            <p>
              <span className="text-muted-foreground">Valor:</span>{" "}
              {formatCurrency(a.preco)}
            </p>
          </div>
<button
  type="button"
  onClick={() => handleEmitirNfse(a)}
  className="mt-3 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
>
  Emitir NFS-e
</button>
          <div className="flex flex-wrap gap-2 pt-1">
            {a.status === "pendente" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8"
                  onClick={async () => {
                    await updateAppointmentStatus(a.id, "confirmado");
                    toast.success("Agendamento confirmado!");
                  }}
                >
                  Confirmar
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 text-destructive"
                  onClick={async () => {
                    await updateAppointmentStatus(a.id, "cancelado");
                    toast.success("Agendamento cancelado!");
                  }}
                >
                  Cancelar
                </Button>
              </>
            )}

            {a.status === "confirmado" && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 text-destructive"
                onClick={async () => {
                  await updateAppointmentStatus(a.id, "cancelado");
                  toast.success("Agendamento cancelado!");
                }}
              >
                Cancelar
              </Button>
            )}

            {a.status === "cancelado" && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 text-destructive"
                onClick={async () => {
                  await removeAppointment(a.id);
                  toast.success("Agendamento removido!");
                }}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Remover
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    ))
  )}
</div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Cliente</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">Serviço(s)</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">Profissional</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Data</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Horário</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">Valor</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                 {groupedFiltered.map((group) => (
  <tr key={group.key} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
    <td className="px-4 py-3 font-medium">{group.clienteNome}</td>

    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-[260px] truncate">
      {group.servicoNomes.join(", ")}
    </td>

    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
      {group.profissionais.join(", ")}
    </td>

    <td className="px-4 py-3 text-muted-foreground">{group.data}</td>

    <td className="px-4 py-3">
      {group.horario} - {group.horarioFim}
    </td>

    <td className="px-4 py-3 hidden sm:table-cell">
      {formatCurrency(group.totalPreco)}
    </td>

    <td className="px-4 py-3">
      <StatusBadge status={group.status} />
    </td>

    <td className="px-4 py-3">
      {group.status === "pendente" && (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={async () => {
              await Promise.all(
                group.ids.map((id) => updateAppointmentStatus(id, "confirmado"))
              );
              toast.success("Agendamento confirmado!");
            }}
          >
            Confirmar
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 text-destructive"
            onClick={async () => {
              await Promise.all(
                group.ids.map((id) => updateAppointmentStatus(id, "cancelado"))
              );
              toast.success("Agendamento cancelado!");
            }}
          >
            Cancelar
          </Button>
        </div>
      )}

      {group.status === "confirmado" && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7 text-destructive"
          onClick={async () => {
            await Promise.all(
              group.ids.map((id) => updateAppointmentStatus(id, "cancelado"))
            );
            toast.success("Agendamento cancelado!");
          }}
        >
          Cancelar
        </Button>
      )}

      {group.status === "cancelado" && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7 text-destructive"
          onClick={async () => {
            await Promise.all(group.ids.map((id) => removeAppointment(id)));
            toast.success("Agendamento removido!");
          }}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Remover
        </Button>
      )}
    </td>
  </tr>
))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
