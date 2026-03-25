

# Plano: Corrigir visibilidade de membros + Vulnerabilidades de seguranca

## Problema principal: Membros novos nao aparecem

**Causa raiz**: O Supabase tem um limite padrao de 1000 linhas por consulta. Com exatamente 1000 membros ja cadastrados, qualquer novo membro e ignorado pela query -- mesmo sendo inserido com sucesso no banco. Por isso o toast "Membro cadastrado com sucesso!" aparece, mas o membro nao aparece na lista, o contador nao muda, e a busca nao encontra.

### Correcao

**`src/hooks/useMembers.tsx`** -- `useMembers()`:
- Implementar paginacao com contagem total usando duas queries:
  1. `supabase.from('members').select('*', { count: 'exact', head: true })` para obter o total real
  2. Query paginada com `.range(from, to)` para buscar os dados
- Alternativa mais simples: usar um loop que busca paginas de 1000 ate nao ter mais dados, concatenando os resultados (abordagem "fetch all with pagination")
- A abordagem recomendada e a segunda (fetch all), pois a UI ja renderiza todos os membros em uma lista scrollavel sem paginacao visual

**`src/pages/Membros.tsx`**:
- O `stats.total` passara a refletir o total real (todos os membros retornados)
- Nenhuma mudanca necessaria na UI se o fetch-all funcionar

### Implementacao tecnica (fetch all)

```typescript
export function useMembers() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['members', profile?.church_id],
    queryFn: async () => {
      if (!profile?.church_id) return [];
      const PAGE_SIZE = 1000;
      let allData: Member[] = [];
      let from = 0;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from('members')
          .select(`*, member_ministries(ministry_id, role, ministries:ministry_id(name))`)
          .eq('church_id', profile.church_id)
          .order('full_name')
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        allData = allData.concat(data as Member[]);
        hasMore = data.length === PAGE_SIZE;
        from += PAGE_SIZE;
      }
      return allData;
    },
    enabled: !!profile?.church_id,
  });
}
```

---

## Vulnerabilidades de seguranca (scan results)

### 1. CRITICO: Qualquer usuario pode se dar role admin

A policy INSERT em `user_roles` tem `has_role(auth.uid(), 'admin') OR (user_id = auth.uid())`. A segunda clausula permite que qualquer usuario autenticado insira `role = 'admin'` para si mesmo.

**Correcao** (migracao SQL):
```sql
DROP POLICY IF EXISTS "..." ON public.user_roles;
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
```

### 2. CRITICO: guardians_safe sem RLS

A view `guardians_safe` expos PII (nome, email, telefone, CPF) sem nenhuma policy. Qualquer usuario autenticado pode ler dados de todas as igrejas.

**Correcao** (migracao SQL):
```sql
ALTER TABLE public.guardians_safe ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view guardians of their church"
  ON public.guardians_safe FOR SELECT TO authenticated
  USING (church_id = public.get_user_church_id());
```

### 3. Dados bancarios da igreja expostos a todos os membros

A tabela `churches` contem `bank_account`, `bank_agency`, `pix_key`, `cnpj` visiveis para qualquer membro. Nao sera alterada neste ciclo para evitar quebrar funcionalidades existentes, mas sera documentada como divida tecnica.

---

## Arquivos afetados

| Arquivo | Acao |
|---------|------|
| `src/hooks/useMembers.tsx` | Corrigir query para buscar todos os membros (sem limite de 1000) |
| Migracao SQL | Corrigir policy de `user_roles` (remover self-assignment) |
| Migracao SQL | Adicionar RLS a `guardians_safe` |

## Impacto

- Membros novos passarao a aparecer imediatamente apos cadastro
- Contadores refletirao o total real
- Busca funcionara para todos os membros
- Privilege escalation bloqueada
- PII de responsaveis protegida por church_id

