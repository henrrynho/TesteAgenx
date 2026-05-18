import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/data/mock";
import { Check, Scissors, ArrowRight, ArrowLeft, CalendarDays, Clock, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useApp, addMinutesToTime } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";

const steps = ["Agendamento", "Seus Dados"];
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
export default function ClientBooking() {
  const { appointments, services, professionals, createMultiServiceAppointment, findOrCreateClient, checkTimeConflict } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
const showDashboardButton = location.pathname === "/agendar-teste";
  const [step, setStep] = useState(0);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [serviceProfessionals, setServiceProfessionals] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [clienteDocumento, setClienteDocumento] = useState("");
const [desejaNotaFiscal, setDesejaNotaFiscal] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
useEffect(() => {
  setSelectedTime("");
}, [selectedDate, selectedServices, serviceProfessionals]);
  const activePros = professionals.filter((p) => p.ativo);
  const selectedServiceObjects = useMemo(
    () => services.filter((s) => selectedServices.includes(s.id)),
    [services, selectedServices]
  );
  const totalDuracao = selectedServiceObjects.reduce((sum, s) => sum + s.duracao, 0);
  const totalPreco = selectedServiceObjects.reduce((sum, s) => sum + s.preco, 0);
  const allServicesHaveProfessional = selectedServices.every(
  (serviceId) => !!serviceProfessionals[serviceId]
);
  
  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
const dayAppointments = appointments.filter(
  (a) =>
    a.data === dateStr &&
    a.status !== "cancelado" &&
    selectedServices.some(
      (serviceId) => serviceProfessionals[serviceId] === a.profissionalId
    )
);

const availableTimes = TIME_SLOTS.filter((time) => {
  if (!selectedDate || selectedServices.length === 0) return false;

  const allServicesHaveProfessional = selectedServices.every(
    (serviceId) => !!serviceProfessionals[serviceId]
  );

  if (!allServicesHaveProfessional) return false;

  const professionalDurations = Object.entries(serviceProfessionals).reduce(
    (acc, [serviceId, professionalId]) => {
      if (!selectedServices.includes(serviceId)) return acc;

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
          a.data === dateStr &&
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
  const toggleService = (id: string) => {
  setSelectedServices((prev) => {
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

  const canNext = () => {
  if (step === 0) {
    return (
      selectedServices.length > 0 &&
      allServicesHaveProfessional &&
      !!selectedDate &&
      /^\d{2}:\d{2}$/.test(selectedTime)
    );
  }

  if (step === 1) {
    return nome.trim().length > 0 && telefone.trim().length > 0;
  }

  return true;
};
const onlyNumbers = (value: string) => {
  return value.replace(/\D/g, "");
};

const formatCpfCnpj = (value: string) => {
  const digits = onlyNumbers(value).slice(0, 14);
  const isValidCPF = (cpf: string) => {
  const digits = onlyNumbers(cpf);

  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  let soma = 0;

  for (let i = 0; i < 9; i++) {
    soma += Number(digits[i]) * (10 - i);
  }

  let primeiroDigito = (soma * 10) % 11;
  if (primeiroDigito === 10) primeiroDigito = 0;

  if (primeiroDigito !== Number(digits[9])) return false;

  soma = 0;

  for (let i = 0; i < 10; i++) {
    soma += Number(digits[i]) * (11 - i);
  }

  let segundoDigito = (soma * 10) % 11;
  if (segundoDigito === 10) segundoDigito = 0;

  return segundoDigito === Number(digits[10]);
};

const isValidCNPJ = (cnpj: string) => {
  const digits = onlyNumbers(cnpj);

  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calcularDigito = (base: string, pesos: number[]) => {
    const soma = base
      .split("")
      .reduce((total, digit, index) => total + Number(digit) * pesos[index], 0);

    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiroDigito = calcularDigito(
    digits.slice(0, 12),
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  );

  if (primeiroDigito !== Number(digits[12])) return false;

  const segundoDigito = calcularDigito(
    digits.slice(0, 13),
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  );

  return segundoDigito === Number(digits[13]);
};

const isValidCpfCnpj = (value: string) => {
  const digits = onlyNumbers(value);

  if (digits.length === 11) return isValidCPF(value);
  if (digits.length === 14) return isValidCnpj(value);

  return false;
};

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};
  const handleConfirm = async () => {
    if (
  selectedServices.length === 0 ||
  !allServicesHaveProfessional ||
  !selectedDate ||
  !selectedTime
) return;
    if (desejaNotaFiscal) {
  const documentoDigits = clienteDocumento.replace(/\D/g, "");

  const validarCPF = (cpf: string) => {
    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;

    let soma = 0;

    for (let i = 0; i < 9; i++) {
      soma += Number(cpf[i]) * (10 - i);
    }

    let primeiroDigito = (soma * 10) % 11;
    if (primeiroDigito === 10) primeiroDigito = 0;

    if (primeiroDigito !== Number(cpf[9])) return false;

    soma = 0;

    for (let i = 0; i < 10; i++) {
      soma += Number(cpf[i]) * (11 - i);
    }

    let segundoDigito = (soma * 10) % 11;
    if (segundoDigito === 10) segundoDigito = 0;

    return segundoDigito === Number(cpf[10]);
  };

  const validarCNPJ = (cnpj: string) => {
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1+$/.test(cnpj)) return false;

    const calcularDigito = (base: string, pesos: number[]) => {
      const soma = base
        .split("")
        .reduce(
          (total, digito, index) => total + Number(digito) * pesos[index],
          0
        );

      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };

    const primeiroDigito = calcularDigito(
      cnpj.slice(0, 12),
      [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    );

    if (primeiroDigito !== Number(cnpj[12])) return false;

    const segundoDigito = calcularDigito(
      cnpj.slice(0, 13),
      [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    );

    return segundoDigito === Number(cnpj[13]);
  };

  const documentoValido =
    documentoDigits.length === 11
      ? validarCPF(documentoDigits)
      : documentoDigits.length === 14
      ? validarCNPJ(documentoDigits)
      : false;

  if (!clienteDocumento.trim()) {
    alert("Informe o CPF ou CNPJ para emissão da nota fiscal.");
    return;
  }

  if (!documentoValido) {
    alert("CPF ou CNPJ inválido. Confira os dados e tente novamente.");
    return;
  }

  if (!email.trim()) {
    alert("Informe o e-mail para receber a nota fiscal.");
    return;
  }
}
    setSubmitting(true);
    try {
      const client = await findOrCreateClient(nome, telefone, email);
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
  await createMultiServiceAppointment({
    clienteId: client.id,
    clienteNome: client.nome,
    clienteDocumento: desejaNotaFiscal ? clienteDocumento : "",
clienteEmail: email || "",
desejaNotaFiscal,
    profissionalId: item.professionalId,
    profissionalNome: item.professionalName,
    servicoIds: [item.serviceId],
    servicoNomes: [item.serviceName],
    data: dateStr,
    horario: selectedTime,
    totalDuracao: item.duracao,
    totalPreco: item.preco,
    status: "pendente",
  });
}
      setConfirmed(true);
      toast.success("Agendamento confirmado com sucesso!");
    } catch (e: any) {
      console.error("Erro ao confirmar agendamento:", e);
      toast.error(e.message || "Erro ao criar agendamento");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
   setStep(0); setSelectedServices([]); setServiceProfessionals({});
    setSelectedDate(undefined); setSelectedTime("");
    setNome(""); setTelefone(""); setEmail(""); setConfirmed(false);
  };

  const handleNext = () => {
  if (step === 0) {
    if (selectedServices.length === 0) {
      toast.error("Selecione pelo menos um serviço");
      return;
    }

    if (!allServicesHaveProfessional) {
      toast.error("Selecione um profissional para cada serviço");
      return;
    }

    if (!selectedDate) {
      toast.error("Selecione uma data");
      return;
    }

    if (!selectedTime) {
      toast.error("Selecione um horário");
      return;
    }

    const serviceItems = selectedServiceObjects.map((service) => ({
      professionalId: serviceProfessionals[service.id],
      serviceName: service.nome,
      duracao: service.duracao,
    }));

    for (const item of serviceItems) {
      if (checkTimeConflict(item.professionalId, dateStr, selectedTime, item.duracao)) {
        toast.error(`Horário em conflito para o serviço ${item.serviceName}`);
        return;
      }
    }
  }

  setStep((s) => s + 1);
};
  if (confirmed) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="border-b border-border px-6 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
  <img src="/logo.png" className="w-40 h-auto" alt="AGENX" />
</div>
           {showDashboardButton && (
  <div>
    <Button variant="outline" size="sm" onClick={() => navigate("/")}>
      <LayoutDashboard className="h-4 w-4 mr-2" />
      Voltar ao Dashboard
    </Button>
  </div>
)}
            
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardContent className="py-12 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-display font-semibold">Agendamento Confirmado!</h2>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{selectedServiceObjects.map((s) => s.nome).join(" + ")}</p>
                <p>{selectedDate && format(selectedDate, "dd/MM/yyyy")} às {selectedTime} - {addMinutesToTime(selectedTime, totalDuracao)}</p>
                <p className="font-semibold text-primary text-lg">{formatCurrency(totalPreco)}</p>
              </div>
              <Button variant="outline" onClick={handleReset}>Fazer Novo Agendamento</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" className="h-8 w-auto" alt="AGENX" />
          </div>

          {showDashboardButton && (
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                        ? "border-2 border-primary text-primary"
                        : "border border-border text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-px w-4 sm:w-8 mx-1 ${i < step ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {step === 0 && (
                <>
                  <div>
                    <h2 className="text-2xl font-display font-semibold">Agende seu horário</h2>
                    <p className="text-muted-foreground">É rápido, fácil e online!</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Serviço</label>

                      <div className="space-y-2">
                        {services.length === 0 ? (
                          <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                            Nenhum serviço disponível no momento.
                          </div>
                        ) : (
                          services.map((s) => (
                            <label
                              key={s.id}
                              className={cn(
                                "flex cursor-pointer items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors",
                                selectedServices.includes(s.id) && "border-primary ring-1 ring-primary/30"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={selectedServices.includes(s.id)}
                                  onCheckedChange={() => toggleService(s.id)}
                                />
                                <div>
                                  <p className="font-medium">{s.nome}</p>
                                  <p className="text-xs text-muted-foreground">{s.duracao} min</p>
                                </div>
                              </div>

                              <span className="font-semibold text-primary">{formatCurrency(s.preco)}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>

                    {selectedServiceObjects.length > 0 && (
                      <div className="space-y-3">
                        <label className="text-sm font-medium">Profissional</label>

                        {selectedServiceObjects.map((service) => (
                          <div key={service.id} className="rounded-lg border border-border p-3 space-y-2">
                            <p className="text-sm font-medium">{service.nome}</p>

                            <select
                              value={serviceProfessionals[service.id] || ""}
                              onChange={(e) => {
                                setServiceProfessionals((prev) => ({
                                  ...prev,
                                  [service.id]: e.target.value,
                                }));
                                setSelectedTime("");
                              }}
                              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
                            >
                              <option value="">Selecione o profissional</option>
                              {activePros.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.nome} - {p.especialidade}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data</label>

                      <Input
                        type="date"
                        value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          setSelectedDate(
                            e.target.value ? new Date(`${e.target.value}T00:00:00`) : undefined
                          );
                          setSelectedTime("");
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Horário</label>

                      {!selectedDate ? (
                        <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                          Selecione a data primeiro
                        </div>
                      ) : availableTimes.length === 0 ? (
                        <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                          Não há horários disponíveis nesta data
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {availableTimes.map((time) => (
                            <Button
                              key={time}
                              type="button"
                              variant={selectedTime === time ? "default" : "outline"}
                              className={cn(
                                "justify-center",
                                selectedTime === time && "bg-primary text-primary-foreground"
                              )}
                              onClick={() => setSelectedTime(time)}
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedServiceObjects.length > 0 && (
                      <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                        <p>
                          <span className="text-muted-foreground">Serviço(s): </span>
                          {selectedServiceObjects.map((s) => s.nome).join(", ")}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Duração total: </span>
                          {totalDuracao} min
                        </p>
                        <p>
                          <span className="text-muted-foreground">Valor total: </span>
                          <span className="font-medium text-primary">{formatCurrency(totalPreco)}</span>
                        </p>
                      </div>
                    )}

                    {selectedTime && selectedServices.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {selectedTime} → {addMinutesToTime(selectedTime, totalDuracao)} ({totalDuracao} min)
                      </p>
                    )}
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <div>
                    <h2 className="text-2xl font-display font-semibold">Seus dados</h2>
                    <p className="text-muted-foreground">Preencha para confirmar o agendamento</p>
                  </div>

                  <Card className="max-w-xl">
                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nome</label>
                        <Input
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          placeholder="Digite seu nome"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Telefone</label>
                        <Input
                          value={telefone}
                          onChange={(e) => setTelefone(e.target.value)}
                          placeholder="Digite seu telefone"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
  Email {desejaNotaFiscal ? <span className="text-red-400">*</span> : "(opcional)"}
</Label>
                        <Input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Digite seu email"
                        />
                      </div>
<div className="rounded-lg border border-border bg-card/60 p-4 space-y-4">
  <label className="flex items-center gap-3 text-sm">
    <input
      type="checkbox"
      checked={desejaNotaFiscal}
      onChange={(e) => setDesejaNotaFiscal(e.target.checked)}
      className="h-4 w-4"
    />
    Quero receber nota fiscal deste serviço
  </label>

  {desejaNotaFiscal && (
    <div className="space-y-3">
      <label className="space-y-1.5">
        <span className="text-sm font-medium">
          CPF ou CNPJ <span className="text-red-400">*</span>
        </span>

        <input
          value={clienteDocumento}
          onChange={(e) => setClienteDocumento(formatCpfCnpj(e.target.value))}
          placeholder="000.000.000-00"
          maxLength={18}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-purple-500"
        />
      </label>

      <p className="text-xs text-muted-foreground">
        O CPF/CNPJ será usado apenas para emissão da nota fiscal.
      </p>
    </div>
  )}
</div>
                      <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                        <p>
                          <span className="text-muted-foreground">Serviço(s): </span>
                          {selectedServiceObjects.map((s) => s.nome).join(", ")}
                        </p>

                        <p>
                          <span className="text-muted-foreground">Profissional(is): </span>
                          {selectedServiceObjects
                            .map((service) => {
                              const pro = activePros.find(
                                (p) => p.id === serviceProfessionals[service.id]
                              );
                              return pro ? `${service.nome}: ${pro.nome}` : null;
                            })
                            .filter(Boolean)
                            .join(" • ")}
                        </p>

                        <p>
                          <span className="text-muted-foreground">Data: </span>
                          {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "-"}
                        </p>

                        <p>
                          <span className="text-muted-foreground">Horário: </span>
                          {selectedTime || "-"}
                        </p>

                        <p>
                          <span className="text-muted-foreground">Valor total: </span>
                          <span className="font-medium text-primary">{formatCurrency(totalPreco)}</span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>

            {step < 1 ? (
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleNext}
                disabled={!canNext()}
              >
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleConfirm}
                disabled={submitting}
              >
                {submitting ? (
                  "Confirmando..."
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar Agendamento
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
