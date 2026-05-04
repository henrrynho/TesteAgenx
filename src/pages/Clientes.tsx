import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Users, Mail, Phone, Trash2, ArrowLeft,
  Edit2, CalendarPlus, DollarSign, Clock, Calendar,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import { StatusBadge } from "@/components/StatusBadge";

export default function Clientes() {
  const { clients, appointments, addClient, updateClient, removeClient } = useApp();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");

  // Edit form state
  const [editNome, setEditNome] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const filtered = clients.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.telefone.includes(search)
  );

  const selectedClient = clients.find((c) => c.id === selectedId);

  const clientAppointments = useMemo(() => {
    if (!selectedId) return [];
    return appointments
      .filter((a) => a.clienteId === selectedId)
      .sort((a, b) => {
        const dateCompare = b.data.localeCompare(a.data);
        if (dateCompare !== 0) return dateCompare;
        return b.horario.localeCompare(a.horario);
      });
  }, [appointments, selectedId]);

  const totalSpent = useMemo(
    () =>
      clientAppointments
        .filter((a) => a.status !== "cancelado")
        .reduce((sum, a) => sum + a.preco, 0),
    [clientAppointments]
  );

  const totalAppointments = clientAppointments.filter(
    (a) => a.status !== "cancelado"
  ).length;

  const handleAdd = async () => {
    if (!nome.trim() || !telefone.trim()) {
      toast.error("Nome e telefone são obrigatórios");
      return;
    }
    const exists = clients.find((c) => c.telefone === telefone);
    if (exists) {
      toast.error("Já existe um cliente com este telefone");
      return;
    }
    await addClient({ nome, telefone, email });
    toast.success("Cliente adicionado com sucesso!");
    setDialogOpen(false);
    setNome("");
    setTelefone("");
    setEmail("");
  };

  const handleEdit = async () => {
    if (!selectedId || !editNome.trim() || !editTelefone.trim()) {
      toast.error("Nome e telefone são obrigatórios");
      return;
    }
    await updateClient(selectedId, {
      nome: editNome,
      telefone: editTelefone,
      email: editEmail,
    });
    toast.success("Cliente atualizado!");
    setEditDialogOpen(false);
  };

  const openEditDialog = () => {
    if (!selectedClient) return;
    setEditNome(selectedClient.nome);
    setEditTelefone(selectedClient.telefone);
    setEditEmail(selectedClient.email);
    setEditDialogOpen(true);
  };

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  // ── Profile View ──
  if (selectedClient) {
    return (
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedId(null)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-display font-semibold">
            Perfil do Cliente
          </h1>
        </div>

        {/* Client Info Card */}
        <Card>
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
                {initials(selectedClient.nome)}
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <h2 className="text-xl font-semibold">{selectedClient.nome}</h2>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" />
                      {selectedClient.telefone}
                    </span>
                    {selectedClient.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {selectedClient.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={openEditDialog}>
                  <Edit2 className="h-4 w-4 mr-1.5" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={async () => {
                    await removeClient(selectedClient.id);
                    setSelectedId(null);
                    toast.success("Cliente removido!");
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total gasto</p>
                <p className="text-lg font-semibold">
                  R$ {totalSpent.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Atendimentos</p>
                <p className="text-lg font-semibold">{totalAppointments}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Último atendimento</p>
                <p className="text-sm font-medium">
                  {clientAppointments.filter((a) => a.status !== "cancelado")[0]
                    ? clientAppointments.filter((a) => a.status !== "cancelado")[0].data
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointment History */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Histórico de Atendimentos</h3>
          {clientAppointments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
                <CalendarPlus className="h-10 w-10 mb-3 opacity-40" />
                <p>Nenhum atendimento registrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {clientAppointments.map((a) => (
                <Card key={a.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{a.servicoNome}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {a.data}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {a.horario} – {a.horarioFim}
                          </span>
                          <span>{a.profissionalNome}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge status={a.status} />
                        <span className="text-sm font-semibold">
                          R$ {a.preco.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Nome"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
              />
              <Input
                placeholder="Telefone"
                value={editTelefone}
                onChange={(e) => setEditTelefone(e.target.value)}
              />
              <Input
                placeholder="Email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-purple-400 text-primary-foreground"
                onClick={handleEdit}
              >
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── Client List View ──
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {clients.length} clientes cadastrados
          </p>
        </div>
        <Button
          className="bg-gradient-to-r from-purple-600 to-purple-400 text-primary-foreground font-medium"
          onClick={() => {
            setNome("");
            setTelefone("");
            setEmail("");
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Cliente
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <Input
              placeholder="Telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-purple-400 text-primary-foreground"
              onClick={handleAdd}
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar clientes..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
            <Users className="h-12 w-12 mb-4 opacity-40" />
            <p>Nenhum cliente encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const cAppts = appointments.filter(
              (a) => a.clienteId === c.id && a.status !== "cancelado"
            );
            const spent = cAppts.reduce((s, a) => s + a.preco, 0);
            return (
              <Card
                key={c.id}
                className="cursor-pointer transition-colors hover:border-primary/40"
                onClick={() => setSelectedId(c.id)}
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium shrink-0">
                    {initials(c.nome)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{c.nome}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {c.telefone}
                      </span>
                      {c.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {c.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-xs text-muted-foreground">
                      {cAppts.length} atendimento{cAppts.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-sm font-medium">
                      R$ {spent.toFixed(2)}
                    </p>
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
