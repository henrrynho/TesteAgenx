
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const categorias = [
  { value: "salao", label: "Salão de beleza" },
  { value: "barbearia", label: "Barbearia" },
  { value: "clinica", label: "Clínica" },
  { value: "estetica", label: "Estética" },
  { value: "pet_shop", label: "Pet shop" },
  { value: "studio", label: "Estúdio" },
  { value: "outro", label: "Outro" },
];

export default function ConfiguracoesNegocio() {
  const [tipo, setTipo] = useState("");
  const [outro, setOutro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function carregar() {
      const { data: auth } = await supabase.auth.getUser();

      if (!auth.user) {
        toast.error("Faça login novamente.");
        setCarregando(false);
        return;
      }

      const { data, error } = await supabase
        .from("estabelecimentos")
        .select("tipo_estabelecimento, tipo_estabelecimento_outro")
        .eq("user_id", auth.user.id)
        .maybeSingle();

      if (error) {
        toast.error("Não foi possível carregar as configurações.");
      } else if (data) {
        setTipo(data.tipo_estabelecimento || "");
        setOutro(data.tipo_estabelecimento_outro || "");
      }

      setCarregando(false);
    }

    void carregar();
  }, []);

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!tipo || (tipo === "outro" && !outro.trim())) {
      toast.error("Preencha a categoria do negócio.");
      return;
    }

    setSalvando(true);

    try {
      const { data: auth, error: authError } =
        await supabase.auth.getUser();

      if (authError || !auth.user) {
        throw new Error("Sessão inválida.");
      }

      const { data: estabelecimento, error: buscaError } =
        await supabase
          .from("estabelecimentos")
          .select("id")
          .eq("user_id", auth.user.id)
          .maybeSingle();

      if (buscaError) throw buscaError;
      if (!estabelecimento) {
        throw new Error("Estabelecimento não encontrado.");
      }

      const { error } = await supabase
        .from("estabelecimentos")
        .update({
          tipo_estabelecimento: tipo,
          tipo_estabelecimento_outro:
            tipo === "outro" ? outro.trim() : null,
        })
        .eq("id", estabelecimento.id)
        .eq("user_id", auth.user.id);

      if (error) throw error;

      toast.success("Categoria salva com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível salvar a categoria.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <p className="p-6">Carregando configurações...</p>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Configurações do negócio
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure a categoria do seu estabelecimento no Agenx.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tipo de negócio</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={salvar} className="space-y-5">
            <div className="space-y-2">
              <Label>Categoria do estabelecimento</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((categoria) => (
                    <SelectItem
                      key={categoria.value}
                      value={categoria.value}
                    >
                      {categoria.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {tipo === "outro" && (
              <div className="space-y-2">
                <Label htmlFor="categoria-outro">
                  Qual é o seu tipo de negócio?
                </Label>
                <Input
                  id="categoria-outro"
                  value={outro}
                  onChange={(e) => setOutro(e.target.value)}
                  placeholder="Ex.: escola de música"
                  maxLength={100}
                  required
                />
              </div>
            )}

            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar categoria"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
