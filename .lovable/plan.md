

# Plano: Varredura e Finalizacao do Sistema

## Problemas Encontrados

### 1. Campos bancarios e YouTube NAO editaveis em nenhum lugar do admin
A pagina `GerenciarIgreja.tsx` so salva `name`, `cnpj`, `address`, `city`, `state`. Os campos `pix_key`, `pix_key_type`, `bank_name`, `bank_agency`, `bank_account` e `youtube_live_url` nao aparecem no formulario. Resultado: portal do membro mostra "dados nao configurados" sem possibilidade de configurar.

### 2. Edge function `update-overdue` usa `getClaims()` inexistente
O metodo `auth.getClaims(token)` nao existe no SDK do Supabase JS v2. Isso causa erro 401 constante ao carregar o Dashboard. Deve usar `auth.getUser()` no lugar.

### 3. `GerenciarIgreja.tsx` nao salva campos existentes na tabela
O `handleChurchSubmit` so inclui 5 campos no update. Campos como `address`, `phone`, `email`, `website`, `zip_code` ja existem na tabela mas nao sao editaveis.

### 4. `Configuracoes.tsx` tambem nao tem campos bancarios/YouTube
Mesma lacuna -- a aba "Igreja" so mostra nome, CNPJ, endereco, cidade e estado.

## Alteracoes

### 1. `GerenciarIgreja.tsx` -- Adicionar aba "Dados Financeiros e Midia"

Adicionar uma terceira aba ao `Tabs` com campos para:
- **Chave PIX** (input texto)
- **Tipo da Chave PIX** (select: CPF, CNPJ, Email, Telefone, Chave Aleatoria)
- **Banco** (input texto)
- **Agencia** (input texto)
- **Conta** (input texto)
- **URL YouTube ao Vivo** (input URL)
- **Telefone da Igreja** (input)
- **Email da Igreja** (input)
- **Website** (input)

Incluir esses campos no `handleChurchSubmit` para que sejam salvos via update na tabela `churches`.

### 2. Edge function `update-overdue/index.ts` -- Corrigir autenticacao

Substituir `auth.getClaims(token)` por `auth.getUser()` que e o metodo correto para validar token JWT no Supabase JS v2.

### 3. `Configuracoes.tsx` -- Adicionar campos bancarios na aba Igreja

Adicionar os mesmos campos financeiros (PIX, banco, YouTube) na aba "Igreja" das configuracoes, para que admins possam editar de ambos os locais.

### 4. Limpeza de tipos

O `handleChurchSubmit` em `GerenciarIgreja.tsx` usa `ChurchUpdateData` que e `TablesUpdate<'churches'>` -- ja suporta todos os campos. Basta incluir os novos campos no objeto de update.

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| `src/pages/admin/GerenciarIgreja.tsx` | Modificar -- adicionar aba com campos financeiros/midia |
| `supabase/functions/update-overdue/index.ts` | Modificar -- corrigir getClaims para getUser |
| `src/pages/Configuracoes.tsx` | Modificar -- adicionar campos bancarios e YouTube |

