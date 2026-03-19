

# Plano: Reorganizar Administracao -- Separar Gestao Institucional e Operacional

## Visao Geral

Reorganizar a pagina de Administracao em **duas secoes claras** e mover "Gerenciar Ministerios" para dentro de "Gerenciar Igreja" como uma aba, ja que ministerios sao parte da estrutura institucional da igreja.

## Nova Organizacao da Pagina Admin

```text
Administracao
├── Gestao Institucional (Igreja e Estrutura)
│   ├── Gerenciar Igreja (agora com aba "Ministerios" embutida)
│   ├── Gerenciar Usuarios e Cargos
│   └── Link do Portal do Membro (gerar/copiar convite)
│
├── Gestao Financeira e Operacional
│   ├── Gerenciar Categorias (financeiras)
│   ├── Configuracoes do Sistema (sync, automacoes)
│   └── Gerenciar Dados (zona de perigo)
```

## Alteracoes Detalhadas

### 1. `src/pages/Admin.tsx` -- Reorganizar layout
- Dividir os cards em dois grupos visuais com subtitulos:
  - **"Igreja e Estrutura"** -- Igreja (que agora inclui ministerios), Usuarios, + novo card "Portal do Membro" (copiar link de convite)
  - **"Financeiro e Sistema"** -- Categorias, Config. Sistema, Gerenciar Dados
- Remover o card "Gerenciar Ministerios" (foi absorvido pelo Gerenciar Igreja)
- Adicionar card "Portal do Membro" com botao para copiar link de convite
- Melhorar descricoes dos cards para serem mais claras

### 2. `src/pages/admin/GerenciarIgreja.tsx` -- Adicionar abas com Ministerios
- Adicionar componente `Tabs` com duas abas:
  - **"Dados da Igreja"** -- formulario atual (nome, CNPJ, endereco)
  - **"Ministerios"** -- conteudo atual de `GerenciarMinisterios` embutido inline (tabela + CRUD)
- Importar a logica de ministerios diretamente (queries, mutations, dialogs)

### 3. `src/App.tsx` -- Manter rota `/app/admin/ministerios` por compatibilidade
- Manter a rota existente para evitar quebras, mas redirecionar para `/app/admin/igreja`
- Ou simplesmente manter como esta (a pagina standalone continua funcionando)

### 4. `src/components/AppSidebar.tsx` -- Sem alteracoes
- O sidebar ja nao tem link direto para ministerios; nao precisa mudar.

## Ideias de Melhorias Adicionais (para futuro)

Estas **nao serao implementadas agora**, mas sao sugestoes para o ecossistema:

1. **Auditoria e Logs** -- card na admin para visualizar historico de acoes (ja existe `AuditLogViewer` mas nao esta exposto na admin)
2. **Gestao de Convites** -- painel para ver membros convidados via portal, status de cadastro pendente/ativo
3. **Personalizacao da Igreja** -- upload de logo, cores do tema, mensagem de boas-vindas personalizada
4. **Backup e Exportacao** -- botao para exportar todos os dados da igreja em Excel/CSV
5. **Dashboard Admin** -- metricas rapidas no topo (total usuarios, total membros, total ministerios)

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| `src/pages/Admin.tsx` | Reorganizar em secoes, remover card ministerios, add card Portal |
| `src/pages/admin/GerenciarIgreja.tsx` | Adicionar Tabs com aba Ministerios embutida |
| `src/App.tsx` | Adicionar redirect de `/app/admin/ministerios` para `/app/admin/igreja` |

