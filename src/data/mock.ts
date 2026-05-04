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
  duracao: number; // minutes
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
  data: string; // YYYY-MM-DD
  horario: string; // HH:mm
  duracao: number;
  status: "confirmado" | "pendente" | "cancelado";
  preco: number;
}

export const professionals: Professional[] = [];

export const services: Service[] = [];

export const clients: Client[] = [];

export const appointments: Appointment[] = [];

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
