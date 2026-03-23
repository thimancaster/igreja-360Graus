

# Plano: Corrigir cadastro de membros + Integrar membros ao sistema de escalas

## Problema 1: Membros nao estao sendo cadastrados

### Diagnostico

O formulario de cadastro usa Zod validation com `form.handleSubmit(onSubmit)`. Se qualquer campo falhar na validacao (ex: um campo obrigatorio em outra aba do formulario), o `onSubmit` nunca e chamado e o erro aparece apenas no campo especifico -- que pode estar em outra aba invisivel para o usuario.

Alem disso, o bloco `catch {}` na linha 345 do `MemberDialog.tsx` engole erros silenciosamente sem feedback.

### Correcoes

**`MemberDialog.tsx`**:
- Adicionar `console.error` e `toast.error` no bloco `catch` para mostrar erros ao usuario
- Adicionar indicador visual nas abas que contem erros de validacao (badge vermelho na tab)
- Verificar se `form.formState.errors` tem erros e mostrar toast quando o submit falha por validacao
- Relaxar validacao do `marital_status` para aceitar string vazia sem quebrar (ja aceita via `.or(z.literal(''))` mas verificar edge cases)

## Problema 2: Membros vinculados a ministerios devem virar voluntarios automaticamente

### Situacao atual

Quando um membro e cadastrado com ministerios selecionados, apenas a tabela `member_ministries` e preenchida. O sistema de escalas (`Escalas`) usa a tabela `department_volunteers` para listar voluntarios disponiveis. Nao ha conexao entre as duas tabelas.

### Solucao

**`useCreateMember` e `useUpdateMember` (useMembers.tsx)**:
- Apos inserir/atualizar `member_ministries`, tambem criar/atualizar registros em `department_volunteers` para cada ministerio selecionado
- Se o membro ja existe como voluntario no ministerio, pular (evitar duplicatas via constraint `23505`)
- Status do voluntario: `active` (sem necessidade de aceitar termo, pois o admin esta cadastrando)
- Mapear `member.full_name`, `member.email`, `member.phone` para `department_volunteers`

**Ao remover um ministerio do membro**:
- Desativar (soft delete) o registro correspondente em `department_volunteers` (`is_active: false`, `status: 'inactive'`)

## Problema 3: Melhorias no sistema de escalas

### Melhorias planejadas

1. **`ScheduleDialog.tsx`**: Mostrar apenas voluntarios ativos do ministerio selecionado (ja funciona, mas garantir que voluntarios criados automaticamente aparecam)

2. **`VolunteerList.tsx`**: Adicionar coluna "Origem" para distinguir voluntarios convidados manualmente vs vinculados via cadastro de membro

3. **`Escalas.tsx`**: Se o usuario e admin/pastor, auto-selecionar o primeiro ministerio disponivel para evitar tela vazia

4. **`DepartmentSelector.tsx`**: Para admins, garantir que todos os ministerios aparecam (mesmo sem voluntarios)

## Arquivos afetados

| Arquivo | Acao |
|---------|------|
| `src/components/members/MemberDialog.tsx` | Corrigir -- tratamento de erros, indicadores visuais de validacao |
| `src/hooks/useMembers.tsx` | Modificar -- sincronizar `department_volunteers` ao salvar ministerios |
| `src/pages/Escalas.tsx` | Melhorar -- auto-selecao de ministerio para admins |
| `src/components/schedules/VolunteerList.tsx` | Melhorar -- coluna de origem |

Nenhuma alteracao de banco necessaria -- as tabelas `department_volunteers` e `member_ministries` ja existem.

