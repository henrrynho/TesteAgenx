
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function ConfiguracaoInicial() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState("#7C3AED");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth", { replace: true });
        return;
      }

      const { data, error } = await supabase
        .from("estabelecimentos")
        .select("nome, cor_primaria, logo_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !data) {
        toast.error("Não foi possível carregar seu estabelecimento.");
        setLoading(false);
        return;
      }

      setNome(data.nome === "Meu Negócio" ? "" : data.nome);
      setCor(data.cor_primaria || "#7C3AED");
      setLogoUrl(data.logo_url || "");
      setLoading(false);
    }

    carregar();
  }, [navigate]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();

    const nomeFinal = nome.trim();

    if (!nomeFinal) {
      toast.error("Digite o nome do seu negócio.");
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth", { replace: true });
        return;
      }

      const { error } = await supabase
        .from("estabelecimentos")
        .update({
          nome: nomeFinal,
          cor_primaria: cor,
          logo_url: logoUrl.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Estabelecimento configurado com sucesso!");
      navigate("/", { replace: true });
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando configuração...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Configure seu negócio</CardTitle>
          <p className="text-sm text-muted-foreground">
            Personalize seu espaço no Agenx para começar.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={salvar} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do estabelecimento *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Studio Bella"
                required
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cor">Cor principal</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="cor"
                  type="color"
                  value={cor}
                  onChange={(e) => setCor(e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <span className="text-sm text-muted-foreground">{cor}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">URL da logo (opcional)</Label>
              <Input
                id="logo"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">
                Você poderá adicionar ou trocar a logo depois.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Salvando..." : "Salvar e continuar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
