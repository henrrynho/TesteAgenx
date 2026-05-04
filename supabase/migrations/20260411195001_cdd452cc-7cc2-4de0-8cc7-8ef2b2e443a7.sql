
ALTER TABLE public.agendamentos ADD COLUMN horario_fim time without time zone;

-- Populate existing rows: horario_fim = horario + duracao minutes
UPDATE public.agendamentos
SET horario_fim = horario + (duracao || ' minutes')::interval
WHERE horario_fim IS NULL;

-- Make it NOT NULL after backfill
ALTER TABLE public.agendamentos ALTER COLUMN horario_fim SET NOT NULL;

-- Set default (will be overridden on insert but prevents errors)
ALTER TABLE public.agendamentos ALTER COLUMN horario_fim SET DEFAULT '08:30'::time;
