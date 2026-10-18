import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export default function Auth() {
  const { user, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>("/");

useEffect(() => {
  if (!user) {
    setRedirectPath(null);
    return;
  }

  let cancelled = false;

  async function verificarEstabelecimento() {
    const { data, error } = await supabase
      .from("estabelecimentos")
      .select("nome")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (cancelled) return;

    if (error || !data) {
      toast.error("Não foi possível verificar seu estabelecimento.");
      setRedirectPath("/");
      return;
    }

    setRedirectPath("/");
  }

  verificarEstabelecimento();

  return () => {
    cancelled = true;
  };
}, [user]);

  if (user && !redirectPath) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      Verificando seu estabelecimento...
    </div>
  );
}

if (user && redirectPath) {
  return <Navigate to={redirectPath} replace />;
}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
    const { error } = isLogin ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);
    if (error) {
      toast.error(isLogin ? "Email ou senha incorretos" : "Erro ao criar conta. Tente novamente.");
    } else if (!isLogin) {
      toast.success("Conta criada com sucesso!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2">
        <div className="text-center">
  <img src="/logo.png" className="h-16 w-auto mx-auto" />
</div>
          <CardTitle className="text-xl font-display">
            {isLogin ? "Entrar" : "Criar Conta"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              
<div className="space-y-2">
  <Label htmlFor="password">Senha</Label>
  <div className="relative">
    <Input
      id="password"
      type={showPassword ? "text" : "password"}
      placeholder="••••••"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      className="pr-10"
    />
    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-muted-foreground hover:text-foreground"
      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
      aria-pressed={showPassword}
    >
      {showPassword ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
    </button>
  </div>
</div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Aguarde..." : isLogin ? "Entrar" : "Criar Conta"}
            </Button>
          </form>
          {isLogin && (
  <div className="mt-3 text-center">
    <button
      type="button"
      onClick={() => {
        if (!email.trim()) {
          toast.error("Digite seu e-mail para recuperar a senha.");
          return;
        }

        supabase.auth
          .resetPasswordForEmail(email, {
            redirectTo: "https://teste-agenx-henrrynhos-projects.vercel.app/reset-password",
          })
          .then(({ error }) => {
            if (error) {
              toast.error("Erro ao enviar e-mail de recuperação.");
              return;
            }

            toast.success("Enviamos um link de recuperação para seu e-mail.");
          });
      }}
      className="text-sm text-purple-400 hover:underline"
    >
      Esqueci minha senha
    </button>
  </div>
)}
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? "Criar conta" : "Entrar"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
