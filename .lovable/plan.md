

# Plano de Implementacao - Verificacao Completa e Portal do Membro

## Diagnostico Atual

Apos varredura profunda, identifiquei os seguintes problemas e lacunas:

### Problemas Encontrados
1. **PhotoUpload so aceita arquivos** -- o `accept="image/jpeg,image/png,image/webp"` funciona para galeria, mas nao oferece opcao explicita de "captura pela camera" em dispositivos moveis. Falta o atributo `capture="environment"` para ativar a camera nativa.
2. **FaceVerificationStep usa `@vladmandic/face-api`** que e um pacote pesado (~6MB). A implementacao esta funcional mas depende de CDN para modelos. Se a foto cadastrada estiver em dominio diferente (Supabase Storage), o `crossOrigin` no `<img>` da camera ativa pode falhar silenciosamente.
3. **PIN na tabela `guardians` esta salvo em texto plano** (`access_pin` column) -- funciona mas e uma fragilidade de seguranca.
4. **Console warning**: Badge em GuardianDialog nao suporta ref (warning menor, nao funcional).
5. **Pagina de Auth atual** (`/auth`) e unica para admins e membros -- nao ha separacao de fluxo para membros do portal.
6. **Nao existe autocadastro para membros do portal** -- um membro so acessa o portal se um admin criar seu usuario e vincular ao guardian.

---

## Plano de Implementacao

### Fase 1 -- Correcoes de Foto e Camera (prioridade alta)

**1.1 Adicionar captura pela camera no PhotoUpload**
- Adicionar botao separado "Tirar Foto" com `capture="user"` para selfie ou `capture="environment"` para camera traseira
- Manter botao "Escolher da Galeria" existente
- Em desktop, ambos abrem o file picker normalmente (o browser ignora `capture`)

**1.2 Corrigir crossOrigin na FaceVerificationStep**
- A imagem de referencia (foto cadastrada) precisa de `crossOrigin="anonymous"` ao ser carregada pelo `faceapi.fetchImage()`. A imagem ja tem esse atributo no `<img>` visual, mas o `fetchImage` interno pode nao respeitar. Substituir por criar um `HTMLImageElement` com `crossOrigin` setado antes de passar para o face-api.
- Garantir que o bucket `photos` tem headers CORS corretos (ja e publico, entao deve funcionar).

**1.3 Validar fluxo completo de foto**
- Verificar que `photo_url` e salvo corretamente nas tabelas `children` e `guardians`
- Verificar que a foto aparece no checkout (FaceVerificationStep recebe `photoUrl` do `selectedPerson`)

### Fase 2 -- Correcoes de PIN e Checkout

**2.1 Corrigir fluxo de PIN no checkout manual**
- O campo PIN no checkout mostra "Digite o PIN (se cadastrado)" -- quando o usuario digita um PIN e o responsavel tem PIN cadastrado, o sistema verifica corretamente na edge function. Mas se o PIN esta vazio e o responsavel tem PIN, o sistema faz uma chamada com `__check__` que pode confundir. Simplificar: se nao digitou PIN, so chamar verify com string vazia e tratar `no_pin` vs `valid:false`.

**2.2 Remover chamada dupla de verificacao**
- Atualmente `handleConfirmCheckOut` faz duas chamadas ao edge function (uma com PIN, outra com `__check__`). Unificar em uma unica chamada.

### Fase 3 -- Pagina de Login/Cadastro para Membros do Portal

**3.1 Criar pagina `/portal/auth` dedicada**
- Design diferenciado do admin: branding "Portal do Membro"
- Abas: Login / Cadastrar-se
- No cadastro: Nome, Email, Senha, Telefone
- Apos cadastro, o usuario e criado no Supabase Auth com role `membro` automaticamente
- O profile e criado pelo trigger existente `handle_new_user`

**3.2 Criar role `membro` no enum `app_role`**
- Migrar enum para incluir `membro`
- Apos signup no portal, inserir automaticamente `user_roles(user_id, role='membro')`
- Criar edge function `portal-signup` que:
  1. Cria usuario via `admin.createUser`
  2. Insere role `membro`
  3. Vincula `church_id` no profile (via codigo de convite ou link direto)

**3.3 Fluxo de vinculacao igreja-membro**
- Opcao 1: Link de convite com `church_id` embutido (ex: `/portal/auth?church=UUID`)
- O membro se cadastra e automaticamente e vinculado a igreja
- Admins podem gerar link de convite na area admin

**3.4 Atualizar rotas**
- `/portal/auth` -- rota publica para login/cadastro de membros
- Atualizar `AuthRedirect` para redirecionar membros (role `membro`) direto para `/portal`
- Atualizar `ProtectedRoute` para permitir acesso ao portal por membros

**3.5 Auto-vinculacao guardian**
- Quando um membro se cadastra com email que ja existe em `guardians.email`, vincular automaticamente o `profile_id` do guardian ao novo usuario

### Fase 4 -- Melhorias de UX e Limpeza

**4.1 Corrigir warning de ref no Badge**
- Ajuste menor no GuardianDialog

**4.2 Melhorar feedback visual no checkout**
- Mostrar foto do responsavel selecionado no dialog de checkout
- Indicar visualmente se reconhecimento facial esta disponivel

---

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| `src/components/children-ministry/PhotoUpload.tsx` | Adicionar botao de captura por camera |
| `src/components/children-ministry/FaceVerificationStep.tsx` | Corrigir crossOrigin no fetchImage |
| `src/components/children-ministry/CheckOutPanel.tsx` | Simplificar logica de PIN |
| `src/pages/portal/PortalAuth.tsx` | **Novo** - pagina de login/cadastro do portal |
| `supabase/functions/portal-signup/index.ts` | **Novo** - edge function para cadastro de membros |
| `src/App.tsx` | Adicionar rota `/portal/auth` |
| `src/components/AuthRedirect.tsx` | Redirecionar membros para portal |
| `src/components/children-ministry/GuardianDialog.tsx` | Corrigir warning Badge ref |
| Migration SQL | Adicionar `membro` ao enum `app_role` |

---

## Ordem de Execucao

1. Fase 1 (Camera + Foto + Face) -- correcoes criticas
2. Fase 2 (PIN) -- simplificacao
3. Fase 3 (Portal Auth) -- nova funcionalidade
4. Fase 4 (UX) -- polimento

