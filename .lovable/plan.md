

# Plano: Filtros de Aniversariantes + Mensagem WhatsApp

## Situacao Atual

O `BirthdayCard` mostra apenas aniversariantes do mes corrente via RPC `get_birthdays_this_month`. Sem filtros, sem acao de mensagem.

## Alteracoes

### 1. Expandir `BirthdayCard.tsx` com filtros e acoes

Adicionar barra de filtros no topo do card:
- **Filtro por periodo**: Hoje, Esta Semana, Este Mes (default: Hoje)
- **Contagem** atualizada conforme filtro
- Filtragem feita no frontend (ja temos todos os aniversariantes do mes)

Para "Hoje": mostrar apenas membros cujo dia/mes = hoje.
Para "Esta Semana": proximos 7 dias.
Para "Este Mes": todos (comportamento atual).

### 2. Botao "Enviar Parabens" por membro

Em cada item da lista, adicionar icone WhatsApp clicavel que:
- Abre link `https://wa.me/{phone}?text={mensagem}` (funciona sem API)
- A mensagem padrao e editavel via dialog de configuracao

### 3. Dialog "Configurar Mensagem de Aniversario"

Botao de engrenagem no header do card abre dialog com:
- **Textarea** com a mensagem template (ex: "Feliz aniversario, {nome}! Com carinho, Pastor [Nome]")
- Variaveis disponiveis: `{nome}`, `{igreja}` 
- **Campo "Remetente"**: nome de quem assina (Pastor, Lider, etc)
- Salvar no `localStorage` por enquanto (futuro: banco)

### 4. Botao "Enviar para todos do dia"

Botao no header que gera links WhatsApp para todos os aniversariantes do filtro ativo, abrindo sequencialmente ou listando em um dialog.

### 5. Futuro (fase 2): Integracao API WhatsApp

Quando conectar API do WhatsApp (Evolution API, Z-API, ou WhatsApp Business API), substituir `wa.me` por envio automatico via edge function. Nao implementado agora.

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| `src/components/members/BirthdayCard.tsx` | Reescrever -- filtros + botao WhatsApp + config |

Nenhuma alteracao de banco necessaria.

