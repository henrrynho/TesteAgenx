import { supabase } from "@/integrations/supabase/client";
import { criarNotaFiscalRascunho } from "@/services/notaFiscalService";
type CriarNotaFiscalParams = {
  agendamentoId?: string;
  clienteNome?: string;
  clienteDocumento?: string;
  servicoDescricao: string;
  valor: number;
};

function gerarReferencia() {
  return `NFSE-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

export async function criarNotaFiscalRascunho(params: CriarNotaFiscalParams) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Usuário não autenticado.");
  }

  const referencia = gerarReferencia();

  const { data, error } = await supabase
    .from("notas_fiscais")
    .insert({
      user_id: user.id,
      agendamento_id: params.agendamentoId || null,
      cliente_nome: params.clienteNome || null,
      cliente_documento: params.clienteDocumento || null,
      servico_descricao: params.servicoDescricao,
      valor: Number(params.valor) || 0,
      status: "rascunho",
      referencia,
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar nota fiscal:", error);
    throw new Error(error.message || "Erro ao criar nota fiscal.");
  }

  return data;
}
