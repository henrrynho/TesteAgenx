
-- Create table for clients
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for professionals
CREATE TABLE public.profissionais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  especialidade TEXT NOT NULL DEFAULT '',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for services
CREATE TABLE public.servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  preco NUMERIC NOT NULL DEFAULT 0,
  duracao INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for appointments
CREATE TABLE public.agendamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  cliente_nome TEXT NOT NULL,
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE NOT NULL,
  profissional_nome TEXT NOT NULL,
  servico_id UUID REFERENCES public.servicos(id) ON DELETE CASCADE NOT NULL,
  servico_nome TEXT NOT NULL,
  data DATE NOT NULL,
  horario TIME NOT NULL,
  duracao INTEGER NOT NULL DEFAULT 30,
  preco NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Since this is a demo app without auth, allow all operations publicly
CREATE POLICY "Allow all access to clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to profissionais" ON public.profissionais FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to servicos" ON public.servicos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to agendamentos" ON public.agendamentos FOR ALL USING (true) WITH CHECK (true);
