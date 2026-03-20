

# Plano: Portal "Meus Filhos" Infantil + Funcionalidades MyKids

## Analise do Concorrente (MyKids) -- O que eles tem e nos NAO temos

Com base nas imagens:
1. **Etiquetas de seguranca** -- impressao de etiqueta/pulseira com numero, nome, turma, idade, codigo de seguranca, indicadores visuais (alergia, restricao alimentar, aniversariante, visitante, permissao de imagem, necessidades especiais)
2. **Chamada de responsavel pelo app** -- notificacao de emergencia direta / chamar pais durante o culto
3. **Relatorios de aula** -- compartilhar com os pais o que a crianca aprendeu
4. **Totem/auto-cadastro de visitantes** -- cadastro simplificado por link
5. **Check-in de pre-adolescentes** -- ja temos via turmas, OK

## Escopo deste Plano

**Parte A -- Redesign visual "Meus Filhos" (portal)**: Tema infantil colorido, divertido, com animacoes ludicas.

**Parte B -- Features novas inspiradas no MyKids**: Etiqueta de seguranca + Chamada de emergencia + Relatorio de aula.

---

## Parte A: Visual Infantil no Portal "Meus Filhos"

### 1. `PortalChildren.tsx` -- Redesign completo

- Gradiente colorido de fundo (rosa/roxo/azul suave)
- Tabs com icones maiores e cores vibrantes (cada aba com cor propria: verde, roxo, azul, laranja, rosa)
- Icones animados com bounce/wiggle sutil via Framer Motion
- Tipografia mais divertida (rounded, emojis nos titulos)
- Header com ilustracao/emoji animado de criancas

### 2. `ParentDashboard.tsx` -- Cards infantis coloridos

- Cards de cada filho com borda colorida (cor por turma) e cantos mais arredondados (`rounded-2xl`)
- Avatar grande com moldura colorida animada (rotate ou pulse suave)
- Badge de status "Presente" com cor verde vibrante e animacao pulsante
- Acoes rapidas com icones coloridos grandes e fundo com gradiente pastel
- Card "Filhos Presentes" com fundo gradiente animado (verde/azul)
- Empty state com emoji animado de bebe

### 3. Subpaginas (`ParentHistory`, `ParentAuthorizations`, `ParentEvents`, `ParentAnnouncements`)

- Aplicar mesma paleta colorida infantil
- Cards com bordas laterais coloridas (tipo faixa de cor por tipo)
- Badges com cores vibrantes em vez de cinza
- Animacoes staggered mais expressivas

### 4. Cores infantis (CSS custom properties ou classes Tailwind)

Paleta: `kids-pink (#FF6B9D)`, `kids-purple (#C084FC)`, `kids-blue (#60A5FA)`, `kids-green (#4ADE80)`, `kids-orange (#FB923C)`, `kids-yellow (#FACC15)`

---

## Parte B: Features Novas do Ministerio Infantil

### 5. Etiqueta de Seguranca (imprimivel)

**`src/components/children-ministry/SecurityLabel.tsx`** -- Componente de etiqueta:
- Nome, sobrenome, numero sequencial, turma, idade, data
- Indicadores visuais: estrelas para alergia, restricao alimentar, necessidade especial, aniversariante, permissao de imagem, visitante
- Codigo de seguranca (ultimos 8 chars do QR code)
- Botao "Imprimir Etiqueta" no dialog pos check-in
- Usa `window.print()` com CSS `@media print`

### 6. Chamada de Emergencia do Responsavel

**`src/components/children-ministry/EmergencyCallPanel.tsx`**:
- Botao "Chamar Responsavel" em cada crianca presente no dashboard admin
- Ao clicar, cria notificacao URGENTE para todos os responsaveis vinculados
- Badge piscante na lista de presentes quando ha chamada ativa
- No portal do membro, card vermelho animado aparece no topo quando ha chamada

### 7. Relatorio de Aula

**Migration**: Criar tabela `classroom_reports`:
```sql
CREATE TABLE classroom_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL,
  classroom text NOT NULL,
  event_date date NOT NULL,
  event_name text,
  title text NOT NULL,
  content text NOT NULL,
  teacher_name text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
```

**`src/components/children-ministry/ClassroomReportPanel.tsx`** -- Admin: criar relatorios por turma/data.

**`ParentDashboard.tsx`** -- Card "Relatorio de Aula" mostrando o ultimo relatorio da turma do filho.

---

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| `src/pages/portal/PortalChildren.tsx` | Reescrever -- tema infantil colorido |
| `src/pages/parent/ParentDashboard.tsx` | Reescrever -- cards coloridos, relatorio de aula |
| `src/pages/parent/ParentHistory.tsx` | Modificar -- cores infantis |
| `src/pages/parent/ParentAuthorizations.tsx` | Modificar -- cores infantis |
| `src/pages/parent/ParentEvents.tsx` | Modificar -- cores infantis |
| `src/pages/parent/ParentAnnouncements.tsx` | Modificar -- cores infantis |
| `src/components/children-ministry/SecurityLabel.tsx` | Criar -- etiqueta imprimivel |
| `src/components/children-ministry/EmergencyCallPanel.tsx` | Criar -- chamada de emergencia |
| `src/components/children-ministry/ClassroomReportPanel.tsx` | Criar -- relatorios de aula (admin) |
| `src/components/children-ministry/CheckInPanel.tsx` | Modificar -- botao imprimir etiqueta |
| `src/components/children-ministry/MinistryDashboard.tsx` | Modificar -- cores, botao emergencia |
| `src/pages/MinisterioInfantil.tsx` | Modificar -- nova aba "Relatorios de Aula" |
| Migration SQL | Criar -- tabela classroom_reports + RLS |

## Fase 2 (futuro)

- Link de auto-cadastro para visitantes (totem)
- Pulseiras NFC
- Integracao WhatsApp para chamar responsavel

