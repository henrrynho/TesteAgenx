import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

export default function Profissionais() {
  const { professionals, appointments, addProfessional, updateProfessional, removeProfessional } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [especialidade, setEspecialidade] = useState("");

  const openAdd = () => { setEditId(null); setNome(""); setEspecialidade(""); setDialogOpen(true); };
  const openEdit = (p: typeof professionals[0]) => { setEditId(p.id); setNome(p.nome); setEspecialidade(p.especialidade); setDialogOpen(true); };

  const handleSave = async () => {
    if (!nome.trim() || !especialidade.trim()) { toast.error("Preencha todos os campos"); return; }
    if (editId) {
      await updateProfessional(editId, { nome, especialidade });
      toast.success("Profissional atualizado!");
    } else {
      const avatar = nome.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
      await addProfessional({ nome, especialidade, ativo: true, avatar });
      toast.success("Profissional adicionado!");
    }
    setDialogOpen(false);
  };

  const handleRemove = async (id: string) => {
    await removeProfessional(id);
    toast.success("Profissional removido!");
  };
const handleToggleAtivo = async (p: any) => {
  const novoStatus = !Boolean(p.ativo);

  await updateProfessional(p.id, {
    ativo: novoStatus,
  });

  toast.success(
    novoStatus ? "Profissional ativado!" : "Profissional desativado!"
  );
};
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold">Profissionais</h1>
          <p className="text-muted-foreground text-sm mt-1">{professionals.filter((p) => p.ativo).length} profissionais ativos</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-purple-400 text-primary-foreground font-medium" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />Novo Profissional
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Editar Profissional" : "Novo Profissional"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <Input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            <Input placeholder="Especialidade" value={especialidade} onChange={(e) => setEspecialidade(e.target.value)} />
            <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-400 text-primary-foreground" onClick={handleSave}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {professionals.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">Nenhum profissional cadastrado</p>
          <p className="text-sm">Adicione seu primeiro profissional.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {professionals.map((p) => {
            const totalToday = appointments.filter((a) => a.profissionalId === p.id && a.status !== "cancelado").length;
            return (
              <Card key={p.id} className={`transition-colors ${!p.ativo ? "opacity-60" : ""}`}>
                <CardContent className="py-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center text-sm font-semibold text-primary">{p.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{p.nome}</p>
                      <p className="text-sm text-muted-foreground">{p.especialidade}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge
  variant="outline"
  className={
    Boolean(p.ativo)
      ? "bg-success/10 text-success border-success/30"
      : "bg-destructive/10 text-destructive border-destructive/30"
  }
>
  {Boolean(p.ativo) ? "Ativo" : "Inativo"}
</Badge>
                    <Switch
  checked={Boolean(p.ativo)}
  onCheckedChange={() => handleToggleAtivo(p)}
/>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{totalToday} agendamento{totalToday !== 1 ? "s" : ""} hoje</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleRemove(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
