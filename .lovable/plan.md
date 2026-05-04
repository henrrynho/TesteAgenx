

## Plano: Corrigir erro ao criar cliente durante agendamento

### Problema identificado
A função `handleCreate` em `Agendamentos.tsx` (e `handleConfirm` em `ClientBooking.tsx`) chama `findOrCreateClient` sem `try/catch`. Quando ocorre qualquer erro (rede, validação, etc.), a exceção não é tratada corretamente, resultando no erro "Erro ao criar cliente".

### Correções

**1. Agendamentos.tsx — Adicionar try/catch em `handleCreate`**
- Envolver todo o corpo de `handleCreate` em `try/catch`
- Exibir `toast.error(e.message)` no catch
- Impedir que a dialog feche quando há erro

**2. ClientBooking.tsx — Adicionar try/catch em `handleConfirm`**
- Mesma correção: envolver em `try/catch` com toast de erro

**3. AppContext.tsx — Melhorar tratamento de erro em `findOrCreateClient`**
- Adicionar log do erro real no console para facilitar debug
- Garantir que o fallback de busca por telefone funciona corretamente
- Retornar mensagem de erro mais descritiva

### Detalhes técnicos

```typescript
// Agendamentos.tsx - handleCreate
const handleCreate = async () => {
  if (!selService || !selPro || !selDate || !selTime || !clientNome.trim() || !clientTelefone.trim()) {
    toast.error("Preencha todos os campos"); return;
  }
  try {
    const client = await findOrCreateClient(clientNome, clientTelefone);
    await addAppointment({ ... });
    toast.success("Agendamento criado com sucesso!");
    setDialogOpen(false);
    resetForm();
  } catch (e: any) {
    toast.error(e.message || "Erro ao criar agendamento");
  }
};
```

Nenhuma alteração de UI ou estrutura será feita.

