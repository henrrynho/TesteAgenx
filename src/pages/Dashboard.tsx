import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/data/mock";
import { CalendarDays, DollarSign, Clock, Users, Copy, Check, CalendarIcon } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { useApp } from "@/contexts/AppContext";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const COLORS = ["#8b5cf6", "#7c3aed", "#a855f7", "#3f3f46"];
const fadeIn = { hidden: { opacity: 0, y: 12 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08 } }) };

type FilterType = "hoje" | "ontem" | "7dias" | "mes" | "personalizado";

function getDateRange(filter: FilterType, customStart?: Date, customEnd?: Date): { start: string; end: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  switch (filter) {
    case "hoje":
      return { start: fmt(today), end: fmt(today) };
    case "ontem": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { start: fmt(y), end: fmt(y) };
    }
    case "7dias": {
      const s = new Date(today);
      s.setDate(s.getDate() - 6);
      return { start: fmt(s), end: fmt(today) };
    }
    case "mes": {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: fmt(s), end: fmt(today) };
    }
    case "personalizado":
      return {
        start: customStart ? fmt(customStart) : fmt(today),
        end: customEnd ? fmt(customEnd) : fmt(today),
      };
  }
}

const FILTER_LABELS: Record<FilterType, string> = {
  hoje: "Hoje",
  ontem: "Ontem",
  "7dias": "Últimos 7 dias",
  mes: "Este mês",
  personalizado: "Personalizado",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<FilterType>("hoje");
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const bookingUrl = `${window.location.origin}/agendar`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast.success("Link copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const { appointments, professionals } = useApp();

  const { start, end } = useMemo(() => getDateRange(filter, customStart, customEnd), [filter, customStart, customEnd]);

  const filteredAppointments = useMemo(
    () => appointments.filter((a) => a.data >= start && a.data <= end && a.status !== "cancelado"),
    [appointments, start, end]
  );

  const revenue = useMemo(() => filteredAppointments.reduce((sum, a) => sum + a.preco, 0), [filteredAppointments]);
  const activePros = professionals.filter((p) => p.ativo).length;
  const pendingCount = useMemo(
    () => filteredAppointments.filter((a) => a.status === "pendente").length,
    [filteredAppointments]
  );

  // Service breakdown for pie chart
  const serviceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredAppointments.forEach((a) => {
      counts[a.servicoNome] = (counts[a.servicoNome] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, value]) => ({ name, value }));
  }, [filteredAppointments]);

  // Build week data from real appointments
  const weekData = useMemo(() => {
    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const todayDate = new Date();
    const startOfWeek = new Date(todayDate);
    startOfWeek.setDate(todayDate.getDate() - todayDate.getDay() + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const ds = d.toISOString().split("T")[0];
      const valor = appointments
        .filter((a) => a.data === ds && a.status !== "cancelado")
        .reduce((s, a) => s + a.preco, 0);
      return { dia: weekDays[d.getDay()], valor };
    });
  }, [appointments]);

  const stats = [
    { title: "Agendamentos", value: filteredAppointments.length.toString(), icon: CalendarDays },
    { title: "Faturamento", value: formatCurrency(revenue), icon: DollarSign },
    { title: "Pendentes", value: pendingCount.toString(), icon: Clock },
    { title: "Profissionais Ativos", value: activePros.toString(), icon: Users },
  ];

  const upcomingAppointments = useMemo(
    () =>
      filteredAppointments
        .sort((a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario))
        .slice(0, 5),
    [filteredAppointments]
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-semibold">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Visão geral do seu salão</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg truncate max-w-[240px]">{bookingUrl}</div>
            <Button size="sm" variant="outline" onClick={handleCopyLink} className="shrink-0">
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? "Copiado!" : "Copiar Link"}
            </Button>
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FILTER_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {filter === "personalizado" && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal", !customStart && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {customStart ? format(customStart, "dd/MM/yyyy", { locale: ptBR }) : "Início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customStart} onSelect={setCustomStart} locale={ptBR} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground text-sm">até</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal", !customEnd && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {customEnd ? format(customEnd, "dd/MM/yyyy", { locale: ptBR }) : "Fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customEnd} onSelect={setCustomEnd} locale={ptBR} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.title} custom={i} initial="hidden" animate="visible" variants={fadeIn}>
            <Card className="bg-[#12131c] border border-purple-500/10 rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.08)]">
  <CardHeader className="flex flex-row items-start justify-between pb-3 space-y-0">
    <CardTitle className="text-base font-medium text-white/80">{s.title}</CardTitle>
    <s.icon className="h-4 w-4 text-primary" />
  </CardHeader>

  <CardContent className="pt-0">
    <div className="text-3xl font-bold tracking-tight text-white leading-none">
      {s.value}
    </div>
  </CardContent>
</Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader><CardTitle className="text-base">Faturamento dos últimos 7 dias</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
  <AreaChart data={weekData}>
    <defs>
      <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.45} />
        <stop offset="95%" stopColor="#a855f7" stopOpacity={0.02} />
      </linearGradient>
    </defs>

    <XAxis
      dataKey="dia"
      stroke="hsl(0,0%,40%)"
      fontSize={12}
      tickLine={false}
      axisLine={false}
    />

    <YAxis
      stroke="hsl(0,0%,40%)"
      fontSize={12}
      tickLine={false}
      axisLine={false}
      tickFormatter={(v) => `R$${v}`}
    />

    <Tooltip
      contentStyle={{
        background: "hsl(0,0%,12%)",
        border: "1px solid hsl(0,0%,18%)",
        borderRadius: 8,
        color: "hsl(0,0%,90%)"
      }}
      formatter={(v: number) => [formatCurrency(v), "Faturamento"]}
    />

    <Area
      type="monotone"
      dataKey="valor"
      stroke="#a855f7"
      strokeWidth={3}
      fillOpacity={1}
      fill="url(#colorValor)"
    />
  </AreaChart>
</ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader><CardTitle className="text-base">Serviços Mais Populares</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {serviceBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8">Sem dados no período</p>
            ) : (
              <div className="space-y-4 w-full">
  {serviceBreakdown.map((service, i) => (
    <div key={i} className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground">{service.name}</span>
        <span className="text-muted-foreground">{service.value}</span>
      </div>

      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400"
          style={{ width: `${Math.min(service.value, 100)}%` }}
        />
      </div>
    </div>
  ))}
</div>
            )}
          </CardContent>
          {serviceBreakdown.length > 0 && (
            <div className="px-6 pb-4 flex flex-wrap gap-3">
              {serviceBreakdown.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  {s.name} ({s.value})
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
  <CardHeader className="flex flex-row items-center justify-between">
  <CardTitle className="text-base">
    {filter === "hoje"
      ? "Agenda do dia"
      : filter === "ontem"
      ? "Agenda de ontem"
      : filter === "7dias"
      ? "Próximos atendimentos"
      : filter === "mes"
      ? "Atendimentos do mês"
      : "Atendimentos no período"}
  </CardTitle>

  <Button
  variant="ghost"
  size="sm"
  className="text-purple-400 hover:text-purple-300"
  onClick={() => navigate(`/agenda?filter=${filter}`)}
>
    Ver agenda
  </Button>
</CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Nenhum atendimento no período selecionado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
  <div className="flex items-center gap-4 min-w-0">
    <div className="w-14 text-sm text-white/80 shrink-0">
      {a.horario}
    </div>

    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-sm font-semibold text-white shrink-0">
      {a.clienteNome.split(" ").map((n) => n[0]).join("").slice(0, 1)}
    </div>

    <div className="min-w-0">
      <p className="text-sm font-medium text-white truncate">{a.clienteNome}</p>
      <p className="text-xs text-white/60 truncate">{a.servicoNome}</p>
    </div>
  </div>

  <div className="text-sm text-white/60 shrink-0">
    {a.profissionalNome}
  </div>
</div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
