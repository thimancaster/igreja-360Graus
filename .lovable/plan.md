

# Plano: Evolucao do Portal do Membro

Escopo grande -- vamos dividir em fases executaveis. Esta e a **Fase 1** focada nos itens mais impactantes e viáveis agora.

## Alteracoes

### 1. Ocultar "Ir para App Principal" para membros sem acesso

**`PortalLayout.tsx`**: Importar `useRole` no `NavContent`, e renderizar o botao "Ir para App Principal" apenas se `isAdmin || isTesoureiro || isPastor || isLider`. Mesma logica ja usada no `AppRoute`.

### 2. Novas paginas no Portal

Adicionar 3 novas rotas e itens de navegacao:

- **`/portal/contribuicoes`** -- Pagina de Contribuicoes/Dizimos com dados bancarios e chave PIX da igreja
- **`/portal/culto-ao-vivo`** -- Card com link direto para YouTube (configuravel pela igreja)
- **`/portal/agendar`** -- Agendamento com a secretaria/pastores

#### 2a. `PortalContributions.tsx` -- Contribuicoes via PIX

- Exibe dados bancarios da igreja (chave PIX, banco, agencia, conta) em cards copiáveis com animacao
- Botao "Copiar Chave PIX" com feedback visual
- Historico de contribuicoes do membro logado (reutiliza `useMemberContributions` vinculando pelo email/profile)
- Card com QR Code PIX (gerado estaticamente com a chave)
- Estilo glassmorphism com gradientes suaves

#### 2b. `PortalLiveService.tsx` -- Culto ao Vivo

- Card hero com thumbnail do YouTube embed
- Link configuravel pela igreja (campo `youtube_live_url` na tabela `churches`)
- Countdown para proximo culto (se houver evento tipo "culto" agendado)
- Design imersivo com backdrop blur e gradientes

#### 2c. `PortalBooking.tsx` -- Agendamento Pastoral

- Lista de pastores disponiveis (da tabela `members` com role pastor ou da equipe ministerial)
- Formulario simples: escolha de pastor, data, horario, motivo
- Insere na tabela `pastoral_appointments` (nova)
- Notificacao para o pastor quando agendamento criado

### 3. Migration: Novos campos e tabela

```sql
-- Dados bancarios da igreja
ALTER TABLE churches ADD COLUMN pix_key text;
ALTER TABLE churches ADD COLUMN pix_key_type text; -- cpf, cnpj, email, phone, random
ALTER TABLE churches ADD COLUMN bank_name text;
ALTER TABLE churches ADD COLUMN bank_agency text;
ALTER TABLE churches ADD COLUMN bank_account text;
ALTER TABLE churches ADD COLUMN youtube_live_url text;

-- Agendamentos pastorais
CREATE TABLE pastoral_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL,
  member_profile_id uuid NOT NULL,
  pastor_name text NOT NULL,
  appointment_date date NOT NULL,
  appointment_time text NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE pastoral_appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "manage_appointments" ON pastoral_appointments FOR ALL TO authenticated
  USING (church_id = get_user_church_id() OR member_profile_id = auth.uid());
```

### 4. Navegacao atualizada no PortalLayout

Novos itens no sidebar e bottom nav:
- Contribuicoes (icone `Heart` ou `Wallet`)
- Culto ao Vivo (icone `Play` ou `Radio`)
- Agendar (icone `CalendarClock`)

Bottom nav: manter 5 itens (trocar um ou usar scroll horizontal). Sugestao: manter os 5 atuais e colocar os novos apenas no sidebar (acessiveis via menu hamburger no mobile).

### 5. Melhorias esteticas no Portal Dashboard

- Aplicar glassmorphism nos cards (usar `variant="glass"` que ja existe)
- Adicionar micro-interacoes nos ImageCards (escala suave no hover, spring animation)
- Gradientes mais suaves nos badges e cards
- Sombras com `glass-shadow` do design system existente
- Animacoes staggered mais polidas com `spring` em vez de `ease`
- Cards de acesso rapido para as novas funcionalidades (Contribuir, Ao Vivo, Agendar)
- Safe area padding para PWA (ja parcialmente implementado com `safe-area-pb`)

### 6. PWA Compliance

- Verificar meta tags viewport em `index.html` (`viewport-fit=cover`, `apple-mobile-web-app-capable`)
- Garantir `safe-area-inset` em todos os edges (top/bottom/left/right)
- Verificar `manifest.json` tem `display: standalone`, `theme_color`, icons corretos
- Garantir que bottom nav respeita safe area em iPhones com notch

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| Migration SQL | Criar -- campos bancarios em churches + tabela pastoral_appointments |
| `src/components/portal/PortalLayout.tsx` | Modificar -- ocultar botao, novos nav items |
| `src/pages/portal/PortalContributions.tsx` | Criar -- pagina de contribuicoes/PIX |
| `src/pages/portal/PortalLiveService.tsx` | Criar -- culto ao vivo |
| `src/pages/portal/PortalBooking.tsx` | Criar -- agendamento pastoral |
| `src/pages/portal/PortalDashboard.tsx` | Modificar -- novos cards, melhorias visuais |
| `src/App.tsx` | Modificar -- novas rotas portal |
| `index.html` | Modificar -- meta tags PWA |
| `src/index.css` | Verificar/ajustar safe areas |

## Ideias para Fase 2 (futuro)

- Integracao real com API PIX para gerar QR Code dinamico
- Envio de comprovante de contribuicao pelo membro (upload de imagem)
- Notificacoes push reais via service worker
- Biblioteca de devocional / leitura biblica diaria
- Pedidos de oracao com acompanhamento
- Chat direto com lideranca

