import { useEffect, useState } from "react";
import { Save, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type ConfigFiscal = {
  id?: string;
  user_id?: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  inscricao_municipal: string;
  cidade: string;
  uf: string;
  codigo_municipio: string;
  regime_tributario: string;
  cnae: string;
  codigo_servico: string;
  item_lista_servico: string;
  aliquota_iss: string;
  email_fiscal: string;
  telefone_fiscal: string;
  api_provider: string;
  ambiente: string;
  certificado_configurado: boolean;
  dados_confirmados: boolean;
};

const initialForm: ConfigFiscal = {
  cnpj: "",
  razao_social: "",
  nome_fantasia: "",
  inscricao_municipal: "",
  cidade: "",
  uf: "",
  codigo_municipio: "",
  regime_tributario: "",
  cnae: "",
  codigo_servico: "",
  item_lista_servico: "",
  aliquota_iss: "",
  email_fiscal: "",
  telefone_fiscal: "",
  api_provider: "manual",
  ambiente: "homologacao",
  certificado_configurado: false,
  dados_confirmados: false,
};
const onlyNumbers = (value: string) => {
  return value.replace(/\D/g, "");
};

const limitNumbers = (value: string, maxLength: number) => {
  return onlyNumbers(value).slice(0, maxLength);
};

const formatCNPJ = (value: string) => {
  const digits = limitNumbers(value, 14);

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

const formatUF = (value: string) => {
  return value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2);
};

const formatAliquota = (value: string) => {
  return value
    .replace(",", ".")
    .replace(/[^0-9.]/g, "")
    .slice(0, 6);
};
export default function ConfiguracoesFiscais() {
  const [form, setForm] = useState<ConfigFiscal>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const updateField = (field: keyof ConfigFiscal, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const carregarConfiguracoes = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Usuário não autenticado.");
      }

      const { data, error } = await supabase
        .from("configuracoes_fiscais")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setForm({
          id: data.id,
          user_id: data.user_id,
          cnpj: data.cnpj || "",
          razao_social: data.razao_social || "",
          nome_fantasia: data.nome_fantasia || "",
          inscricao_municipal: data.inscricao_municipal || "",
          cidade: data.cidade || "",
          uf: data.uf || "",
          codigo_municipio: data.codigo_municipio || "",
          regime_tributario: data.regime_tributario || "",
          cnae: data.cnae || "",
          codigo_servico: data.codigo_servico || "",
          item_lista_servico: data.item_lista_servico || "",
          aliquota_iss: String(data.aliquota_iss || ""),
          email_fiscal: data.email_fiscal || "",
          telefone_fiscal: data.telefone_fiscal || "",
          api_provider: data.api_provider || "manual",
          ambiente: data.ambiente || "homologacao",
          certificado_configurado: Boolean(data.certificado_configurado),
          dados_confirmados: Boolean(data.dados_confirmados),
        });
      }
    } catch (error) {
      console.error("Erro ao carregar configurações fiscais:", error);
      alert("Erro ao carregar configurações fiscais.");
    } finally {
      setLoading(false);
    }
  };

  const salvarConfiguracoes = async () => {
    try {
      setSaving(true);
const camposObrigatorios = [
  { campo: form.cnpj, nome: "CNPJ" },
  { campo: form.razao_social, nome: "Razão Social" },
  { campo: form.inscricao_municipal, nome: "Inscrição Municipal" },
  { campo: form.cidade, nome: "Cidade" },
  { campo: form.uf, nome: "UF" },
  { campo: form.codigo_municipio, nome: "Código do Município" },
  { campo: form.regime_tributario, nome: "Regime Tributário" },
  { campo: form.codigo_servico, nome: "Código de Serviço Municipal" },
  { campo: form.item_lista_servico, nome: "Item da Lista de Serviço" },
  { campo: form.aliquota_iss, nome: "Alíquota ISS" },
  { campo: form.email_fiscal, nome: "E-mail Fiscal" },
];

const campoVazio = camposObrigatorios.find(
  (item) => !String(item.campo || "").trim()
);

if (campoVazio) {
  alert(`Preencha o campo obrigatório: ${campoVazio.nome}`);
  return;
}

if (!form.dados_confirmados) {
  alert(
    "Você precisa confirmar que os dados fiscais foram revisados pelo responsável ou contador do salão."
  );
  return;
}
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Usuário não autenticado.");
      }

      const payload = {
        user_id: user.id,
        cnpj: form.cnpj,
        razao_social: form.razao_social,
        nome_fantasia: form.nome_fantasia,
        inscricao_municipal: form.inscricao_municipal,
        cidade: form.cidade,
        uf: form.uf,
        codigo_municipio: form.codigo_municipio,
        regime_tributario: form.regime_tributario,
        cnae: form.cnae,
        codigo_servico: form.codigo_servico,
        item_lista_servico: form.item_lista_servico,
        aliquota_iss: Number(form.aliquota_iss) || 0,
        email_fiscal: form.email_fiscal,
        telefone_fiscal: form.telefone_fiscal,
        api_provider: form.api_provider,
        ambiente: form.ambiente,
        certificado_configurado: form.certificado_configurado,
        dados_confirmados: form.dados_confirmados,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("configuracoes_fiscais")
        .upsert(payload, {
          onConflict: "user_id",
        });

      if (error) {
        throw error;
      }

      alert("Configurações fiscais salvas com sucesso!");
      await carregarConfiguracoes();
    } catch (error) {
      console.error("Erro ao salvar configurações fiscais:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao salvar configurações fiscais."
      );
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl">
        <p className="text-sm text-muted-foreground">
          Carregando configurações fiscais...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-display font-semibold">
          Configurações Fiscais
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure os dados fiscais do salão para emissão de NFS-e.
        </p>
      </div>

      <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium text-yellow-300">
              Atenção: confira os dados com o contador.
            </p>
            <p className="text-sm text-yellow-100/80">
              Código de serviço, alíquota de ISS, regime tributário e inscrição
              municipal devem ser informados corretamente pelo salão ou contador.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card/60 p-5 space-y-6">
        <div>
          <h2 className="font-semibold mb-4">Dados do salão</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <Field
  label="CNPJ"
  value={form.cnpj}
  onChange={(v) => updateField("cnpj", formatCNPJ(v))}
  placeholder="00.000.000/0001-00"
  maxLength={18}
  required
/>

            <Field
  label="Inscrição Municipal"
  value={form.inscricao_municipal}
  onChange={(v) => updateField("inscricao_municipal", limitNumbers(v, 20))}
  placeholder="Inscrição municipal"
  maxLength={20}
  required
/>

            <Field
              label="Razão Social"
              value={form.razao_social}
              onChange={(v) => updateField("razao_social", v)}
              placeholder="Razão social da empresa"
              required
            />

            <Field
              label="Nome Fantasia"
              value={form.nome_fantasia}
              onChange={(v) => updateField("nome_fantasia", v)}
              placeholder="Nome do salão"
              required
            />

            <Field
              label="Cidade"
              value={form.cidade}
              onChange={(v) => updateField("cidade", v)}
              placeholder="Ex: São Paulo"
              required
            />

            <Field
  label="UF"
  value={form.uf}
  onChange={(v) => updateField("uf", v.toUpperCase())}
  placeholder="SP"
  required
/>

            <Field
  label="Código do Município"
  value={form.codigo_municipio}
  onChange={(v) => updateField("codigo_municipio", limitNumbers(v, 7))}
  placeholder="Código IBGE da cidade"
  maxLength={7}
  required
/>

            <Field
              label="E-mail Fiscal"
              value={form.email_fiscal}
              onChange={(v) => updateField("email_fiscal", v)}
              placeholder="financeiro@salao.com"
              required
            />
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-4">Dados tributários do serviço</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Regime Tributário"
              value={form.regime_tributario}
              onChange={(v) => updateField("regime_tributario", v)}
              required
              options={[
                { value: "", label: "Selecione" },
                { value: "mei", label: "MEI" },
                { value: "simples_nacional", label: "Simples Nacional" },
                { value: "lucro_presumido", label: "Lucro Presumido" },
                { value: "lucro_real", label: "Lucro Real" },
              ]}
            />

            <Field
  label="CNAE"
  value={form.cnae}
  onChange={(v) => updateField("cnae", v.slice(0, 9))}
  placeholder="Ex: 9602-5/01"
  maxLength={9}
/>

            <Field
  label="Código de Serviço Municipal"
  value={form.codigo_servico}
  onChange={(v) => updateField("codigo_servico", v.slice(0, 20))}
  placeholder="Código usado pela prefeitura"
  maxLength={20}
  required
/>

            <Field
  label="Item da Lista de Serviço"
  value={form.item_lista_servico}
  onChange={(v) => updateField("item_lista_servico", v.slice(0, 10))}
  placeholder="Ex: 06.01"
  maxLength={10}
  required
/>

            <Field
  label="Alíquota ISS"
  value={form.aliquota_iss}
  onChange={(v) => updateField("aliquota_iss", formatAliquota(v))}
  placeholder="Ex: 0.02 para 2%"
  maxLength={6}
  required
/>

            <Field
  label="Telefone Fiscal"
  value={form.telefone_fiscal}
  onChange={(v) => updateField("telefone_fiscal", limitNumbers(v, 11))}
  placeholder="Telefone do responsável fiscal"
  maxLength={11}
/>
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-4">Integração fiscal</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Integração de emissão"
              value={form.api_provider}
              onChange={(v) => updateField("api_provider", v)}
              options={[
                { value: "manual", label: "Ainda não configurada" },
                { value: "focus_nfe", label: "Focus NFe" },
                { value: "nuvem_fiscal", label: "Nuvem Fiscal" },
                { value: "plugnotas", label: "PlugNotas" },
              ]}
            />

            <SelectField
  label="Modo de emissão"
  value={form.ambiente}
  onChange={(v) => updateField("ambiente", v)}
  options={[
    { value: "homologacao", label: "Teste — não emite nota real" },
    { value: "producao", label: "Produção — emite nota oficial" },
  ]}
/>
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.certificado_configurado}
                onChange={(e) =>
                  updateField("certificado_configurado", e.target.checked)
                }
              />
              Certificado digital/configuração fiscal já foi configurado na API.
            </label>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.dados_confirmados}
                onChange={(e) =>
                  updateField("dados_confirmados", e.target.checked)
                }
              />
              Confirmo que os dados fiscais foram revisados pelo responsável ou
              contador do salão.
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={salvarConfiguracoes}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar configurações"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-purple-500"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-purple-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
 
