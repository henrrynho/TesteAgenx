import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency } from "@/data/mock";

export default function Servicos() {
  const { services, addService, updateService, removeService } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [duracao, setDuracao] = useState("");

  const openAdd = () => { setEditId(null); setNome(""); setPreco(""); setDuracao(""); setDialogOpen(true); };
  const openEdit = (s: typeof services[0]) => { setEditId(s.id); setNome(s.nome); setPreco(String(s.preco)); setDuracao(String(s.duracao)); setDialogOpen(true); };

  const handleSave = async () => {
    if (!nome.trim() || !preco || !duracao) { toast.error("Preencha todos os campos"); return; }
    if (editId) {
      await updateService(editId, { nome, preco: Number(preco), duracao: Number(duracao) });
      toast.success("Serviço atualizado!");
    } else {
      await addService({ nome, preco: Number(preco), duracao: Number(duracao) });
      toast.success("Serviço adicionado!");
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold">Serviços</h1>
          <p className="text-muted-foreground text-sm mt-1">{services.length} serviços cadastrados</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-purple-400 text-primary-foreground font-medium" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />Novo Serviço
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Editar Serviço" : "Novo Serviço"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <Input placeholder="Nome do serviço" value={nome} onChange={(e) => setNome(e.target.value)} />
            <Input placeholder="Preço (R$)" type="number" value={preco} onChange={(e) => setPreco(e.target.value)} />
            <Input placeholder="Duração (minutos)" type="number" value={duracao} onChange={(e) => setDuracao(e.target.value)} />
            <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-400 text-primary-foreground" onClick={handleSave}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {services.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-16 text-muted-foreground">
          
          <p className="text-lg font-medium">Nenhum serviço cadastrado</p>
          <p className="text-sm">Adicione seu primeiro serviço.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.id} className="group hover:border-primary/30 transition-colors">
              <CardContent className="py-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                   
                    <div>
                      <p className="font-medium">{s.nome}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{s.duracao} min</p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-primary">{formatCurrency(s.preco)}</p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(s)}><Pencil className="h-3 w-3 mr-1" />Editar</Button>
                  <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={async () => { await removeService(s.id); toast.success("Serviço removido!"); }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
