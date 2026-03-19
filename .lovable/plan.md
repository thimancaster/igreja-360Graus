

# Plano: Anti-Duplicidade e CPF no Ministerio Infantil

## Resumo

Adicionar campo CPF aos responsaveis, implementar validacoes de duplicidade em criancas e responsaveis, e impedir que pais cadastrem criancas ja vinculadas a outros responsaveis.

## Alteracoes

### 1. Migration: Adicionar coluna `cpf` na tabela `guardians`

```sql
ALTER TABLE public.guardians ADD COLUMN cpf text;
CREATE UNIQUE INDEX guardians_cpf_church_unique ON public.guardians (church_id, cpf) WHERE cpf IS NOT NULL AND cpf != '';
```

Indice unico garante que nao haja dois responsaveis com o mesmo CPF na mesma igreja.

### 2. Atualizar view `guardians_safe` para incluir CPF

Recriar a view incluindo o campo `cpf` (dado nao sigiloso como PIN).

### 3. Atualizar `get_guardians_for_management` RPC para incluir CPF

### 4. `GuardianDialog.tsx` -- Adicionar campo CPF com validacao

- Novo campo CPF no formulario com mascara (###.###.###-##)
- Validacao de digitos verificadores do CPF via Zod custom
- Antes de salvar, verificar no banco se ja existe responsavel com mesmo CPF na igreja
- Se duplicado, mostrar erro: "Ja existe um responsavel cadastrado com este CPF: [nome]. Vincule o responsavel existente."

### 5. `GuardianDialog.tsx` -- Validacao de duplicidade por parentesco

- Ao criar responsavel com relationship "Pai" ou "Mae", antes de vincular a uma crianca, verificar se a crianca ja tem um "Pai" ou "Mae" vinculado
- Se ja tiver, bloquear: "Esta crianca ja possui um(a) [Pai/Mae] cadastrado(a)."

### 6. `ChildGuardianLinkSection.tsx` -- Validacao de duplicidade de parentesco ao vincular

- Antes de executar `linkGuardianToChild`, consultar os guardians ja vinculados
- Se o responsavel sendo vinculado tem relationship "Pai" e ja existe um "Pai" vinculado, bloquear com mensagem

### 7. `useParentChildMutations.tsx` -- Verificar crianca existente antes de cadastrar

- Antes de inserir nova crianca, buscar por `full_name` + `birth_date` na mesma `church_id`
- Se encontrar match: lançar erro "Esta crianca ja esta cadastrada no sistema. Por favor, procure a administracao da igreja para vincular ao seu cadastro."
- NAO permitir criar duplicata

### 8. `useChildMutations` (admin) -- Verificar duplicidade tambem

- Mesma logica: antes de criar crianca, checar `full_name` + `birth_date` na mesma igreja
- Avisar admin mas permitir override (diferente do portal dos pais que bloqueia)

### 9. Tipos TypeScript

- Atualizar tipo `Guardian` em `useChildrenMinistry.tsx` para incluir `cpf: string | null`
- Atualizar `guardianSchema` no `GuardianDialog` para incluir CPF

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| Migration SQL | Criar -- coluna cpf + indice unico |
| `src/hooks/useChildrenMinistry.tsx` | Modificar -- tipo Guardian + validacoes em mutations |
| `src/hooks/useParentChildMutations.tsx` | Modificar -- check duplicidade crianca |
| `src/components/children-ministry/GuardianDialog.tsx` | Modificar -- campo CPF + validacoes |
| `src/components/children-ministry/ChildGuardianLinkSection.tsx` | Modificar -- validacao parentesco |

