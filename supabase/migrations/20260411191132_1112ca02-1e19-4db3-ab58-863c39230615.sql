
-- Add user_id to all tables
ALTER TABLE public.clientes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profissionais ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.servicos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.agendamentos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all access to clientes" ON public.clientes;
DROP POLICY IF EXISTS "Allow all access to profissionais" ON public.profissionais;
DROP POLICY IF EXISTS "Allow all access to servicos" ON public.servicos;
DROP POLICY IF EXISTS "Allow all access to agendamentos" ON public.agendamentos;

-- Clientes: users see only their own
CREATE POLICY "Users manage own clientes" ON public.clientes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Profissionais: users see only their own
CREATE POLICY "Users manage own profissionais" ON public.profissionais FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Servicos: users see only their own
CREATE POLICY "Users manage own servicos" ON public.servicos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Agendamentos: users see only their own
CREATE POLICY "Users manage own agendamentos" ON public.agendamentos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Public read for booking page (anon can see active pros and services)
CREATE POLICY "Public read profissionais" ON public.profissionais FOR SELECT TO anon USING (ativo = true);
CREATE POLICY "Public read servicos" ON public.servicos FOR SELECT TO anon USING (true);
-- Anon can insert agendamentos (booking page)
CREATE POLICY "Public insert agendamentos" ON public.agendamentos FOR INSERT TO anon WITH CHECK (true);
-- Anon can read agendamentos for slot checking
CREATE POLICY "Public read agendamentos" ON public.agendamentos FOR SELECT TO anon USING (true);
-- Anon can insert clientes (booking creates client)
CREATE POLICY "Public insert clientes" ON public.clientes FOR INSERT TO anon WITH CHECK (true);
-- Anon can read clientes for findOrCreate
CREATE POLICY "Public read clientes" ON public.clientes FOR SELECT TO anon USING (true);
