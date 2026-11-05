# SIPPE — Design System & Guia de Estilo (Fase 1)

## 1. Visão Geral e Princípios

O SIPPE (Sistema para Programas e Planos de Ensino) adota a direção visual de **Minimalismo Institucional Contemporâneo**:
- **Clareza e agilidade:** Interface limpa, rápida e previsível, inspirada em ferramentas modernas de produtividade acadêmica.
- **Credibilidade institucional:** Seriedade visual da Universidade Federal de Santa Catarina (UFSC), sem formalismos ou poluição visual.
- **Consistência de componentes:** Padrões padronizados para cabeçalhos, filtros, cards, tabelas e badges.

---

## 2. Tipografia

A família tipográfica exclusiva do projeto é a **Lato**, preservando as variantes reais carregadas na aplicação:
- Pesos oficiais: `100` (Thin), `300` (Light), `400` (Normal), `700` (Bold), `900` (Black).
- Devem ser evitados pesos intermediários sintetizados (`500` / `600`), priorizando `font-normal` (400) para leitura e `font-bold` (700) para destaque e títulos.

### Escala Tipográfica Padronizada

| Elemento | Tamanho Desktop | Tamanho Mobile | Peso | Cor Predominante |
|---|---|---|---|---|
| **Título principal da página** | `text-2xl` a `text-3xl` (24–30px) | `text-2xl` (24px) | `font-bold` (700) | `#102E52` (`brand-navy`) |
| **Título de seção / grupos** | `text-lg` a `text-xl` (18–20px) | `text-lg` (18px) | `font-bold` (700) | `#1E293B` (slate-800) |
| **Título de card / disciplina** | `text-base` (16px) | `text-base` (16px) | `font-bold` (700) | `#0F172A` (slate-900) |
| **Labels de seções na sidebar** | `text-[11px]` (11px) | `text-[11px]` (11px) | `font-bold` (700) | `#94A3B8` (slate-400), uppercase |
| **Corpo de texto / descrições** | `text-sm` (14px) | `text-sm` (14px) | `font-normal` (400) | `#64748B` (slate-500) |
| **Cabeçalhos de tabelas** | `text-xs` (12px) | `text-xs` (12px) | `font-bold` (700) | `#475569` (slate-600), uppercase |
| **Metadados e badges** | `text-xs` (12px) / `text-[10px]` | `text-xs` (12px) | `font-bold` (700) | Conforme semântica |

---

## 3. Paleta de Cores & Tokens

| Token | Código Hex / HSL | Uso Principal |
|---|---|---|
| `brand-blue` | `#023E8A` | Cor institucional primária, botões principais, links ativos, barra de progresso |
| `brand-navy` | `#102E52` | Títulos principais de páginas e cabeçalhos de destaque |
| `brand-light` | `#EAF2FE` | Fundo de item ativo na navegação e seleções suaves |
| `brand-accent` | `#99BFF2` | Acentos e tons secundários de suporte |
| `app-bg` | `#F7F9FC` | Plano de fundo de páginas do dashboard |
| `border-subtle` | `#E5EAF1` | Bordas sutis de separação entre cartões e containers |
| `text-secondary` | `#64748B` | Textos secundários, subtítulos e labels auxiliares |

### Cores Semânticas de Status

Cada status possui indicador visual triplo (cor de fundo, cor de texto e ponto semântico `dot`):

- **Rascunho (`draft`):** Neutro — `bg-slate-100 text-slate-700 border-slate-200` (Dot: `bg-slate-400`)
- **Aguardando Revisão (`submitted`, `pending_review`, `pending_chefe`):** Âmbar — `bg-amber-50 text-amber-800 border-amber-200/80` (Dot: `bg-amber-500`)
- **Aprovado (`approved`):** Verde Esmeralda — `bg-emerald-50 text-emerald-800 border-emerald-200/80` (Dot: `bg-emerald-500`)
- **Devolvido / Rejeitado (`rejected`):** Laranja/Coral — `bg-orange-50 text-orange-800 border-orange-200/80` (Dot: `bg-orange-500`)
- **Arquivado (`archived`):** Cinza/Azul Neutro — `bg-slate-100 text-slate-600 border-slate-200` (Dot: `bg-slate-400`)

---

## 4. Estrutura da Sidebar

A navegação lateral preserva o comportamento colapsável existente com persistência local em `localStorage`, organizada em 3 grupos temáticos:

1. **ÁREA DE TRABALHO**
   - Dashboard (`/dashboard`)
   - Planos de ensino (`/dashboard/study-plans`)
   - Programas de ensino (`/dashboard/programas-ensino`)
2. **FLUXO DE APROVAÇÃO**
   - Revisão de planos (`/dashboard/coordinator`)
   - Revisão de programas (`/dashboard/revisao-programas`)
3. **ADMINISTRAÇÃO**
   - Visão geral (`/dashboard/chef`)
   - Arquivo Central (`/dashboard/secretary`)

### Regras de Exibição
- Grupos que não contêm nenhum item com permissão para o perfil logado são automaticamente ocultados.
- Quando recolhida (`isCollapsed`), exibe ícones com indicação visual de página ativa e tooltips flutuantes imediatas no hover.

---

## 5. Componentes Principais Padronizados

### 5.1. `PageHeader` (`src/components/dashboard/page-header.tsx`)
Padroniza o topo de todas as páginas da aplicação com título, descrição e slot flexível para botões de ação (ex: "Novo Plano", "Novo Programa").

### 5.2. `StatusBadge` (`src/components/dashboard/status-badge.tsx`)
Componente reutilizável para estados de planos e programas de ensino, garantindo acessibilidade, consistência de texto e marcadores semânticos coloridos.

### 5.3. Tabelas e Listagens
- Containers em `TableShell` com borda sutil e cantos arredondados (`rounded-xl`).
- Cabeçalhos com fundo `bg-slate-50/75` e tipografia `text-xs font-bold uppercase tracking-wider`.
- Linhas com espaçamento balanceado e efeito sutil de hover (`hover:bg-slate-50/60`).
- Barra de busca e filtros unificada com pills de status e botão de limpar.

---

## 6. Recomendações para a Fase 2

1. **Editores de Documentos:** Unificar a barra superior de ações e os títulos das abas no editor de Planos e Programas de Ensino.
2. **Modal de Avaliação:** Refinar os modais de feedback e devolver/aprovar com os mesmos tokens de botões e cartões.
3. **Contraste no Modo Escuro:** Formalizar paleta de modo escuro completa quando a funcionalidade de alternância de tema for priorizada.
