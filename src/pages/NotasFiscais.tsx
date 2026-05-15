import { useEffect, useState } from "react";
import { FileText, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type NotaFiscal = {
  id: string;
  agendamento_id?: string | null;
  cliente_nome?: string | null;
  cliente_documento?: string | null;
  servico_descricao: string;
  valor: number;
  status: string;
  referencia?: string | null;
  numero_nota?: string | null;
  codigo_verificacao?: string | null;
  pdf_url?: string | null;
  xml_url?: string | null;
  erro_mensagem?: string | null;
  created_at?: string;
};

export default function NotasFiscais() {
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarNotas = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("notas_fiscais")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setNotas(data || []);
    } catch (error) {
      console.error("Erro ao carregar notas fiscais:", error);
      alert("Erro ao carregar notas fiscais.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarNotas();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value || 0));
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "autorizada":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "processando":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "rejeitada":
      case "erro":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "cancelada":
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      default:
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold">Notas Fiscais</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie as solicitações de emissão de NFS-e.
          </p>
        </div>

        <button
          type="button"
          onClick={carregarNotas}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      <div className="rounded-lg border border-border bg-card/60 overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">
            Carregando notas fiscais...
          </div>
        ) : notas.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-60" />
            <h2 className="font-medium">Nenhuma nota fiscal criada</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Quando você clicar em “Emitir NFS-e” em um agendamento, a solicitação aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Serviço
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Referência
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Criada em
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Arquivos
                  </th>
                </tr>
              </thead>

              <tbody>
                {notas.map((nota) => (
                  <tr
                    key={nota.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-3 font-medium">
                      {nota.cliente_nome || "Cliente não informado"}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {nota.servico_descricao || "Serviço não informado"}
                    </td>

                    <td className="px-4 py-3 font-semibold">
                      {formatCurrency(nota.valor)}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${getStatusClass(
                          nota.status
                        )}`}
                      >
                        {nota.status || "rascunho"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {nota.referencia || "-"}
                    </td>

                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {nota.created_at
                        ? new Date(nota.created_at).toLocaleString("pt-BR")
                        : "-"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {nota.pdf_url ? (
                          <a
                            href={nota.pdf_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-emerald-400 hover:underline"
                          >
                            PDF
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            PDF -
                          </span>
                        )}

                        {nota.xml_url ? (
                          <a
                            href={nota.xml_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-emerald-400 hover:underline"
                          >
                            XML
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            XML -
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
