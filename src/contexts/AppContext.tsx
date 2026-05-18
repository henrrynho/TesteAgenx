import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const buildAvatar = (nome: string) =>
  nome
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const normalizePhone = (telefone: string) => telefone.replace(/\D/g, "").trim();

const isNoRowsError = (error: { code?: string } | null) => error?.code === "PGRST116";

const getErrorMessage = (fallback: string, error?: { code?: string; message?: string } | null) => {
  if (error?.message?.toLowerCase().includes("duplicate")) return "Horário já ocupado";
  if (error?.message?.toLowerCase().includes("row-level security")) return "Faça login para continuar";
  return fallback;
};

/** Add minutes to a "HH:mm" string and return "HH:mm" */
export const addMinutesToTime = (time: string, minutes: number): string => {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const rh = Math.floor(total / 60);
  const rm = total % 60;
  return `${rh.toString().padStart(2, "0")}:${rm.toString().padStart(2, "0")}`;
};

/** Convert "HH:mm" to total minutes */
export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/** Check if two time ranges overlap */
export const timeRangesOverlap = (
  start1: string, end1: string,
  start2: string, end2: string
): boolean => {
  const s1 = timeToMinutes(start1), e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2), e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
};

export interface Professional {
  id: string;
  nome: string;
  especialidade: string;
  ativo: boolean;
  avatar: string;
}

export interface Service {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
}

export interface Client {
  id: string;
  nome: string;
  telefone: string;
  email: string;
}

export interface Appointment {
  id: string;
  clienteId: string;
  clienteNome: string;
  profissionalId: string;
  profissionalNome: string;
  servicoId: string;
  servicoNome: string;
  data: string;
  horario: string;
  horarioFim: string;
  duracao: number;
  status: "confirmado" | "pendente" | "cancelado";
  preco: number;
}

/** Data needed to create an appointment (multi-service aware) */
export interface CreateAppointmentData {
  clienteId: string;
  clienteNome: string;
  profissionalId: string;
  profissionalNome: string;
  servicoIds: string[];
  servicoNomes: string[];
  data: string;
  horario: string;
  totalDuracao: number;
  totalPreco: number;
  status: "confirmado" | "pendente" | "cancelado";
}

interface AppContextType {
  professionals: Professional[];
  services: Service[];
  clients: Client[];
  appointments: Appointment[];
  loading: boolean;
  addProfessional: (p: Omit<Professional, "id">) => Promise<void>;
  updateProfessional: (id: string, p: Partial<Professional>) => Promise<void>;
  removeProfessional: (id: string) => Promise<void>;
  addService: (s: Omit<Service, "id">) => Promise<void>;
  updateService: (id: string, s: Partial<Service>) => Promise<void>;
  removeService: (id: string) => Promise<void>;
  addClient: (c: Omit<Client, "id">) => Promise<void>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  removeClient: (id: string) => Promise<void>;
  findOrCreateClient: (nome: string, telefone: string, email?: string) => Promise<Client>;
  addAppointment: (a: Omit<Appointment, "id">) => Promise<void>;
  createMultiServiceAppointment: (data: CreateAppointmentData) => Promise<void>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<void>;
  updateAppointmentStatus: (id: string, status: Appointment["status"]) => Promise<void>;
  removeAppointment: (id: string) => Promise<void>;
  checkTimeConflict: (profissionalId: string, data: string, horario: string, duracao: number) => boolean;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const fetchAll = useCallback(async (isInitial = false) => {
    if (!user?.id) {
      setProfessionals([]); setServices([]); setClients([]); setAppointments([]);
      setLoading(false);
      setInitialLoaded(true);
      return;
    }

    // Only show full loading state on initial load, not on background refreshes
    if (isInitial || !initialLoaded) setLoading(true);
    try {
      const [prosRes, svcRes, cliRes, aptRes] = await Promise.all([
        supabase.from("profissionais").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("servicos").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("clientes").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("agendamentos").select("*").eq("user_id", user.id).order("created_at"),
      ]);

      const firstError = [prosRes.error, svcRes.error, cliRes.error, aptRes.error].find(Boolean);
      if (firstError) throw firstError;

      if (prosRes.data) setProfessionals(prosRes.data.map((p: any) => ({
        id: p.id, nome: p.nome, especialidade: p.especialidade, ativo: p.ativo,
        avatar: buildAvatar(p.nome),
      })));
      if (svcRes.data) setServices(svcRes.data.map((s: any) => ({
        id: s.id, nome: s.nome, preco: Number(s.preco), duracao: s.duracao,
      })));
      if (cliRes.data) setClients(cliRes.data.map((c: any) => ({
        id: c.id, nome: c.nome, telefone: c.telefone, email: c.email || "",
      })));
      if (aptRes.data) setAppointments(aptRes.data.map((a: any) => ({
        id: a.id, clienteId: a.cliente_id, clienteNome: a.cliente_nome,
        profissionalId: a.profissional_id, profissionalNome: a.profissional_nome,
        servicoId: a.servico_id, servicoNome: a.servico_nome,
        data: a.data, horario: String(a.horario).slice(0, 5),
        horarioFim: String(a.horario_fim).slice(0, 5),
        duracao: a.duracao,
        status: a.status, preco: Number(a.preco),
      })));
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }, [user?.id, initialLoaded]);

  useEffect(() => { fetchAll(true); }, [user?.id]);

  // Debounced realtime refresh to prevent cascading fetches
  useEffect(() => {
    if (!user?.id) return;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedFetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchAll(false), 300);
    };
    const channel = supabase.channel("db-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "profissionais", filter: `user_id=eq.${user.id}` }, debouncedFetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "servicos", filter: `user_id=eq.${user.id}` }, debouncedFetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "clientes", filter: `user_id=eq.${user.id}` }, debouncedFetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "agendamentos", filter: `user_id=eq.${user.id}` }, debouncedFetch)
      .subscribe();
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [fetchAll, user?.id]);

  // ── Professionals ──
  const addProfessional = useCallback(async (p: Omit<Professional, "id">) => {
    if (!user?.id) { toast.error("Faça login para continuar"); return; }
    const { error } = await supabase.from("profissionais").insert({ nome: p.nome, especialidade: p.especialidade, ativo: p.ativo, user_id: user.id });
    if (error) { toast.error("Erro ao adicionar profissional"); return; }
    await fetchAll();
  }, [fetchAll, user]);

  const updateProfessional = useCallback(async (id: string, data: Partial<Professional>) => {
  if (!user?.id) { 
    toast.error("Faça login para continuar"); 
    return; 
  }

 const professionalUpdates: any = {};

if (data.nome !== undefined) {
  professionalUpdates.nome = data.nome.trim();
}

if (data.especialidade !== undefined) {
  professionalUpdates.especialidade = data.especialidade.trim();
}

if (data.ativo !== undefined) {
  professionalUpdates.ativo = data.ativo;
}

if (data.avatar !== undefined) {
  professionalUpdates.avatar = data.avatar;
}
  const { error } = await supabase
    .from("profissionais")
    .update(professionalUpdates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) { 
    toast.error("Erro ao atualizar profissional"); 
    return; 
  }

  if (professionalUpdates.nome !== undefined) {
    const { error: appointmentError } = await supabase
      .from("agendamentos")
      .update({ profissional_nome: professionalUpdates.nome })
      .eq("profissional_id", id)
      .eq("user_id", user.id);

    if (appointmentError) {
      toast.error("Profissional atualizado, mas houve erro ao sincronizar os agendamentos");
      return;
    }
  }

  await fetchAll();
}, [fetchAll, user?.id]);

  const removeProfessional = useCallback(async (id: string) => {
    if (!user?.id) { toast.error("Faça login para continuar"); return; }
    const { error } = await supabase.from("profissionais").delete().eq("id", id).eq("user_id", user.id);
    if (error) { toast.error("Erro ao remover profissional"); return; }
    await fetchAll();
  }, [fetchAll, user?.id]);

  // ── Services ──
  const addService = useCallback(async (s: Omit<Service, "id">) => {
    if (!user?.id) { toast.error("Faça login para continuar"); return; }
    const { error } = await supabase.from("servicos").insert({ nome: s.nome, preco: s.preco, duracao: s.duracao, user_id: user.id });
    if (error) { toast.error("Erro ao adicionar serviço"); return; }
    await fetchAll();
  }, [fetchAll, user]);

  const updateService = useCallback(async (id: string, data: Partial<Service>) => {
  if (!user?.id) { 
    toast.error("Faça login para continuar"); 
    return; 
  }

  const serviceUpdates: any = {};
  if (data.nome !== undefined) serviceUpdates.nome = data.nome;
  if (data.preco !== undefined) serviceUpdates.preco = data.preco;
  if (data.duracao !== undefined) serviceUpdates.duracao = data.duracao;

  const { error } = await supabase
    .from("servicos")
    .update(serviceUpdates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) { 
    toast.error("Erro ao atualizar serviço"); 
    return; 
  }

  const appointmentUpdates: any = {};
  if (data.nome !== undefined) appointmentUpdates.servico_nome = data.nome;
  if (data.preco !== undefined) appointmentUpdates.preco = data.preco;
  if (data.duracao !== undefined) appointmentUpdates.duracao = data.duracao;

  if (Object.keys(appointmentUpdates).length > 0) {
    const { error: appointmentError } = await supabase
      .from("agendamentos")
      .update(appointmentUpdates)
      .eq("servico_id", id)
      .eq("user_id", user.id);

    if (appointmentError) {
      toast.error("Serviço atualizado, mas houve erro ao sincronizar os agendamentos");
      return;
    }
  }

  await fetchAll();
}, [fetchAll, user?.id]);
  const removeService = useCallback(async (id: string) => {
    if (!user?.id) { toast.error("Faça login para continuar"); return; }
    const { error } = await supabase.from("servicos").delete().eq("id", id).eq("user_id", user.id);
    if (error) { toast.error("Erro ao remover serviço"); return; }
    await fetchAll();
  }, [fetchAll, user?.id]);

  // ── Clients ──
  const addClient = useCallback(async (c: Omit<Client, "id">) => {
    if (!user?.id) { toast.error("Faça login para continuar"); return; }
    const { error } = await supabase.from("clientes").insert({ nome: c.nome.trim(), telefone: normalizePhone(c.telefone), email: c.email, user_id: user.id });
    if (error) { toast.error("Erro ao adicionar cliente"); return; }
    await fetchAll();
  }, [fetchAll, user]);

  const updateClient = useCallback(async (id: string, data: Partial<Client>) => {
  if (!user?.id) { 
    toast.error("Faça login para continuar"); 
    return; 
  }

  const updates: any = {};
  if (data.nome !== undefined) updates.nome = data.nome.trim();
  if (data.telefone !== undefined) updates.telefone = normalizePhone(data.telefone);
  if (data.email !== undefined) updates.email = data.email;

  const { error } = await supabase
    .from("clientes")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) { 
    toast.error("Erro ao atualizar cliente"); 
    return; 
  }

  if (updates.nome !== undefined) {
    const { error: appointmentError } = await supabase
      .from("agendamentos")
      .update({ cliente_nome: updates.nome })
      .eq("cliente_id", id)
      .eq("user_id", user.id);

    if (appointmentError) {
      toast.error("Cliente atualizado, mas houve erro ao sincronizar os agendamentos");
      return;
    }
  }

  await fetchAll();
}, [fetchAll, user?.id]);

  const removeClient = useCallback(async (id: string) => {
    if (!user?.id) { toast.error("Faça login para continuar"); return; }
    const { error } = await supabase.from("clientes").delete().eq("id", id).eq("user_id", user.id);
    if (error) { toast.error("Erro ao remover cliente"); return; }
    await fetchAll();
  }, [fetchAll, user?.id]);

  const findOrCreateClient = useCallback(async (nome: string, telefone: string, email?: string): Promise<Client> => {
    if (!user?.id) throw new Error("Faça login para continuar");
    const nomeNormalizado = nome.trim();
    const telefoneNormalizado = normalizePhone(telefone);
    const emailNormalizado = (email || "").trim();
    if (!nomeNormalizado || !telefoneNormalizado) throw new Error("Nome e telefone são obrigatórios");

    const { data: existing, error: existingError } = await supabase
      .from("clientes").select("*").eq("user_id", user.id).eq("telefone", telefoneNormalizado).maybeSingle();
    if (existingError && !isNoRowsError(existingError)) throw new Error("Erro ao buscar cliente");
    if (existing) {
      // Auto-enrich: update name and email if new data is provided
      const updates: { nome?: string; email?: string } = {};
      if (nomeNormalizado && nomeNormalizado !== existing.nome) updates.nome = nomeNormalizado;
      if (emailNormalizado && emailNormalizado !== (existing.email || "")) updates.email = emailNormalizado;
      if (Object.keys(updates).length > 0) {
        await supabase.from("clientes").update(updates).eq("id", existing.id).eq("user_id", user.id);
      }
      return { id: existing.id, nome: updates.nome || existing.nome, telefone: existing.telefone, email: updates.email || existing.email || "" };
    }

    const { data: created, error } = await supabase
      .from("clientes").insert({ nome: nomeNormalizado, telefone: telefoneNormalizado, email: emailNormalizado, user_id: user.id }).select().single();
    if (error || !created) {
      const { data: fallback } = await supabase
        .from("clientes").select("*").eq("user_id", user.id).eq("telefone", telefoneNormalizado).maybeSingle();
      if (fallback) return { id: fallback.id, nome: fallback.nome, telefone: fallback.telefone, email: fallback.email || "" };
      throw new Error(getErrorMessage("Erro ao criar cliente", error));
    }
    await fetchAll();
    return { id: created.id, nome: created.nome, telefone: created.telefone, email: created.email || "" };
  }, [fetchAll, user?.id]);

  // ── Conflict check (client-side, overlap-based) ──
  const checkTimeConflict = useCallback((profissionalId: string, data: string, horario: string, duracao: number): boolean => {
    const newEnd = addMinutesToTime(horario, duracao);
    return appointments.some((a) =>
      a.profissionalId === profissionalId &&
      a.data === data &&
      a.status !== "cancelado" &&
      timeRangesOverlap(horario, newEnd, a.horario, a.horarioFim)
    );
  }, [appointments]);

  // ── Appointments (legacy single-service) ──
  const addAppointment = useCallback(async (a: Omit<Appointment, "id">) => {
    if (!user?.id) throw new Error("Faça login para continuar");
    if (!a.servicoId || !a.profissionalId || !a.data || !a.horario || !a.clienteNome.trim() || !a.clienteId) {
      throw new Error("Preencha todos os campos obrigatórios");
    }

    const servico = services.find((s) => s.id === a.servicoId);
    if (!servico) throw new Error("Serviço inválido");
    const profissional = professionals.find((p) => p.id === a.profissionalId);
    if (!profissional) throw new Error("Profissional inválido");

    const horarioNormalizado = String(a.horario).slice(0, 5);
    const horarioFim = addMinutesToTime(horarioNormalizado, servico.duracao);

    const startMin = timeToMinutes(horarioNormalizado);
    const endMin = timeToMinutes(horarioFim);
    if (startMin < 480 || endMin > 1200) throw new Error("Horário fora do expediente (08:00 - 20:00)");

    const { data: client, error: clientError } = await supabase
      .from("clientes").select("id, nome").eq("id", a.clienteId).eq("user_id", user.id).maybeSingle();
    if (clientError && !isNoRowsError(clientError)) throw new Error("Erro ao validar cliente");
    if (!client) throw new Error("Cliente inválido");

    if (checkTimeConflict(a.profissionalId, a.data, horarioNormalizado, servico.duracao)) {
      throw new Error("Horário em conflito com outro agendamento");
    }

    const { error } = await supabase.from("agendamentos").insert({
      cliente_id: client.id, cliente_nome: client.nome,
      profissional_id: profissional.id, profissional_nome: profissional.nome,
      servico_id: servico.id, servico_nome: servico.nome,
      data: a.data, horario: horarioNormalizado, horario_fim: horarioFim,
      duracao: servico.duracao,
      status: "confirmado", preco: servico.preco,
      user_id: user.id,
    });

    if (error) throw new Error(getErrorMessage("Erro ao criar agendamento", error));
    await fetchAll();
  }, [fetchAll, professionals, services, user?.id, checkTimeConflict]);

  // ── Multi-service appointment ──
  const createMultiServiceAppointment = useCallback(async (data: CreateAppointmentData) => {
    if (!user?.id) throw new Error("Faça login para continuar");
    if (!data.servicoIds.length || !data.profissionalId || !data.data || !data.horario || !data.clienteNome.trim() || !data.clienteId) {
      throw new Error("Preencha todos os campos obrigatórios");
    }

    const profissional = professionals.find((p) => p.id === data.profissionalId);
    if (!profissional) throw new Error("Profissional inválido");

    const horarioNormalizado = String(data.horario).slice(0, 5);
    const horarioFim = addMinutesToTime(horarioNormalizado, data.totalDuracao);

    const startMin = timeToMinutes(horarioNormalizado);
    const endMin = timeToMinutes(horarioFim);
    if (startMin < 480 || endMin > 1200) throw new Error("Horário fora do expediente (08:00 - 20:00)");

    if (checkTimeConflict(data.profissionalId, data.data, horarioNormalizado, data.totalDuracao)) {
      throw new Error("Horário em conflito com outro agendamento");
    }

    const { data: client, error: clientError } = await supabase
      .from("clientes").select("id, nome").eq("id", data.clienteId).eq("user_id", user.id).maybeSingle();
    if (clientError && !isNoRowsError(clientError)) throw new Error("Erro ao validar cliente");
    if (!client) throw new Error("Cliente inválido");

    const servicoNome = data.servicoNomes.join(" + ");

    const { error } = await supabase.from("agendamentos").insert({
      cliente_id: client.id, cliente_nome: client.nome,
      profissional_id: profissional.id, profissional_nome: profissional.nome,
      servico_id: data.servicoIds[0], servico_nome: servicoNome,
      data: data.data, horario: horarioNormalizado, horario_fim: horarioFim,
      duracao: data.totalDuracao,
      status: data.status, preco: data.totalPreco,
      user_id: user.id,
    });

    if (error) throw new Error(getErrorMessage("Erro ao criar agendamento", error));
    await fetchAll();
  }, [fetchAll, professionals, user?.id, checkTimeConflict]);

 const updateAppointment = useCallback(async (id: string, data: Partial<Appointment>) => {
    if (!user?.id) { 
    toast.error("Faça login para continuar"); 
    return; 
  }

  const updates: any = {};

  if (data.clienteId !== undefined) updates.cliente_id = data.clienteId;
  if (data.clienteNome !== undefined) updates.cliente_nome = data.clienteNome;
  if (data.profissionalId !== undefined) updates.profissional_id = data.profissionalId;
  if (data.profissionalNome !== undefined) updates.profissional_nome = data.profissionalNome;
  if (data.servicoId !== undefined) updates.servico_id = data.servicoId;
  if (data.servicoNome !== undefined) updates.servico_nome = data.servicoNome;
  if (data.data !== undefined) updates.data = data.data;
  if (data.horario !== undefined) updates.horario = data.horario;
  if (data.horarioFim !== undefined) updates.horario_fim = data.horarioFim;
  if (data.duracao !== undefined) updates.duracao = data.duracao;
  if (data.status !== undefined) updates.status = data.status;
  if (data.preco !== undefined) updates.preco = data.preco;

  const { error } = await supabase
    .from("agendamentos")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) { 
    toast.error("Erro ao atualizar agendamento"); 
    return; 
  }

  await fetchAll();
  }, [fetchAll, user?.id]);
  const updateAppointmentStatus = useCallback(async (id: string, status: Appointment["status"]) => {
  if (!user?.id) { 
    toast.error("Faça login para continuar"); 
    return; 
  }

  const { error } = await supabase
    .from("agendamentos")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) { 
    toast.error("Erro ao atualizar status"); 
    return; 
  }

  await fetchAll();
}, [fetchAll, user?.id]);

  const removeAppointment = useCallback(async (id: string) => {
    if (!user?.id) { toast.error("Faça login para continuar"); return; }
    const { error } = await supabase.from("agendamentos").delete().eq("id", id).eq("user_id", user.id);
    if (error) { toast.error("Erro ao remover agendamento"); return; }
    await fetchAll();
  }, [fetchAll, user?.id]);

  return (
    <AppContext.Provider
      value={{
        professionals, services, clients, appointments, loading,
        addProfessional, updateProfessional, removeProfessional,
        addService, updateService, removeService,
        addClient, updateClient, removeClient, findOrCreateClient,
       addAppointment, createMultiServiceAppointment,
updateAppointment,
updateAppointmentStatus, removeAppointment,
        checkTimeConflict, refreshData: fetchAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
