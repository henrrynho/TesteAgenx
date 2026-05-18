import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      toast.error("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        toast.error("Erro ao atualizar senha. Solicite um novo link.");
        return;
      }

      toast.success("Senha atualizada com sucesso!");
      navigate("/");
    } catch (error) {
      console.error("Erro ao atualizar senha:", error);
      toast.error("Erro ao atualizar senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="text-center">
          <img src="/logo.png" alt="AGENX" className="w-44 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold">Criar nova senha</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Digite sua nova senha para acessar o Agenx.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Nova senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-purple-500"
            placeholder="Digite a nova senha"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Confirmar nova senha</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-purple-500"
            placeholder="Confirme a nova senha"
          />
        </div>

        <button
          type="button"
          onClick={handleUpdatePassword}
          disabled={loading}
          className="w-full rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar nova senha"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full text-sm text-muted-foreground hover:text-foreground"
        >
          Voltar para login
        </button>
      </div>
    </div>
  );
}
