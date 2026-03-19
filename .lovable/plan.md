

# Plano: Check-in Multiplo e Notificacoes para Responsaveis

## Problema

A linha 43 do `CheckInPanel.tsx` filtra criancas usando TODOS os check-ins do dia:
```js
const checkedInIds = new Set(todayCheckIns?.map((c: any) => c.child_id));
```
Isso impede re-check-in apos checkout. O filtro deve considerar apenas check-ins **sem checkout**.

Alem disso, nao existe notificacao para os responsaveis quando seus filhos fazem check-in ou check-out.

## Alteracoes

### 1. `CheckInPanel.tsx` -- Filtrar apenas criancas PRESENTES

Mudar `checkedInIds` para considerar apenas check-ins onde `checked_out_at` e null:

```js
const checkedInIds = new Set(
  todayCheckIns
    ?.filter((c: any) => !c.checked_out_at)
    .map((c: any) => c.child_id)
);
```

Mesma logica no `FaceCheckInMode` que recebe `checkedInIds` como prop.

### 2. `useChildrenMinistry.tsx` -- Notificar responsaveis no check-in

Apos inserir check-in com sucesso, buscar os responsaveis vinculados (via `child_guardians` + `guardians`) que possuem `profile_id`, e inserir uma notificacao na tabela `notifications` para cada um com detalhes (nome da crianca, evento, sala, horario).

### 3. `useChildrenMinistry.tsx` -- Notificar responsaveis no check-out

Apos registrar check-out, buscar responsaveis vinculados e inserir notificacao com horario de saida, quem retirou e metodo.

### 4. RLS -- Permitir INSERT na tabela `notifications`

Atualmente a tabela `notifications` NAO permite INSERT por usuarios autenticados. Precisamos adicionar uma policy para permitir que usuarios autenticados insiram notificacoes (necessario para o check-in criar notificacoes).

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| Migration SQL | Criar -- policy INSERT em notifications |
| `src/components/children-ministry/CheckInPanel.tsx` | Modificar -- filtro checkedInIds |
| `src/hooks/useChildrenMinistry.tsx` | Modificar -- notificacoes no check-in e check-out |

