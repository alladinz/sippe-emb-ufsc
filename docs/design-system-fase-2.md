# SIPPE — Design System & Guia de Estilo (Fase 2)

## 1. Visão Geral da Fase 2

A Fase 2 consolida a direção visual **Minimalismo Institucional Contemporâneo** aprovada na Fase 1, expandindo o refinamento para as telas de criação, edição e revisão de documentos do SIPPE.

Principais metas atingidas:
- **Equilíbrio espacial do Dashboard:** Cards de disciplinas atribuídas compactos, remoção de vazios assimétricos e posicionamento harmonioso da seção de Programas de Ensino.
- **Estados de carregamento consistentes:** Placeholders em pulso suave (*skeleton screens*) na barra de estatísticas dos programas, eliminando o flash de valores zerados.
- **Empty states discretos nas filas de revisão:** Fim de tabelas vazias gigantes com múltiplos cabeçalhos repetidos quando não há documentos pendentes.
- **Harmonização de painéis administrativos:** Eliminação de blocos escuros herdados (`bg-slate-900`) na Base de Dados Mestre e na Gestão de Usuários da visão do Chefe, padronizando abas e pills de filtros.
- **Consolidação de busca:** Remoção do campo duplicado no Arquivo Central da secretaria.
- **Polimento visual do editor TipTap:** Toolbar compacta com estados ativo/hover nítidos em `brand-light` e `brand-blue`, tipografia em entrelinha 1.625, listas multiníveis com numerais azuis institucionais e borda de foco alinhada aos demais inputs.
- **Hierarquia clara e fluxo de revisão:** Barra superior unificada com feedback de autosave, diferenciação primária de "Submeter para Revisão", e banner de revisão da coordenação limpo com parecer estruturado.

---

## 2. Etapa A — Correções e Otimizações de Layout

### A1. Dashboard (`/dashboard`)
- **Cards de Disciplinas Atribuídas:**
  - Altura reduzida em ~40% mantendo excelente legibilidade.
  - Padding otimizado (`p-4 pb-3`), badge institucional de departamento/curso e indicador discreto de semestre.
  - Rodapé compacto (`px-4 py-2.5`) com status "Rascunho" e botão de ação rápida "Continuar Plano" (`h-8 text-xs font-bold`).
- **Equilíbrio de Colunas:**
  - A coluna de disciplinas e a coluna de resumo de planos agora possuem alturas equivalentes, eliminando espaços vazios.
  - Seção de **Programas de Ensino** para chefia e coordenação reorganizada em seção horizontal equilibrada com grid de 3 colunas, métricas reais e links de acesso direto.

### A2. Estados de Carregamento (`StatsBar.tsx`)
- Adicionada propriedade `isLoading?: boolean` ao componente de métricas.
- Durante a consulta de dados, números são substituídos por blocos de pulso suave (`h-6 w-8 bg-slate-200 animate-pulse rounded`), garantindo transição sem trepidação de layout (*layout shift*).

### A3. Empty States de Revisão (`coordinator-plans-table.tsx` e `SubmissionsTable.tsx`)
- Quando não há submissões pendentes, a interface substitui a renderização de uma tabela inteira com 7 colunas por um cartão compacto com borda tracejada suave (`border-dashed border-slate-200/90 rounded-xl p-6 text-center`).
- Mensagens contextualizadas orientam o revisor sobre o fluxo.
- Estado de busca sem resultados exibe aviso compacto sem quebrar a estrutura.

### A4. Painéis Administrativos e Visão do Chefe (`/dashboard/chef`)
- **Base de Dados Mestre (`master-course-list.tsx`):**
  - Substituído o bloco herdado `bg-slate-900` por card branco com borda sutil (`border-slate-200/80 rounded-xl p-5 shadow-xs`) e ícone em `bg-blue-50 text-[#023E8A]`.
  - Botão de limpeza perigosa com estilo de contorno discreto em vermelho e botão primário em `#023E8A`.
- **Gestão de Usuários (`user-management.tsx`):**
  - Mesma harmonização institucional do cabeçalho da seção.
- **Abas e Filtros:**
  - Segmented control institucional claro (`bg-slate-100/80 rounded-xl p-1`) com aba ativa branca e texto em `#023E8A`.
  - Pills de filtros padronizados: ativo em `#023E8A` com texto branco; inativo em branco com borda suave e hover cinza claro.
  - Substituição de badges manuais por `StatusBadge` padronizado na listagem de planos.

### A5. Consolidação de Busca no Arquivo Central (`/dashboard/secretary`)
- Removido o container redundante de busca no topo de `ArquivoCentralClient`.
- A busca e os filtros avançados foram unificados diretamente na `TableToolbar` da `CentralArchiveTable`, proporcionando filtragem instantânea e paginação sincronizada.
- Adicionado campo de busca ágil na aba de Programas de Ensino arquivados.

---

## 3. Etapa B — Edição Documental e Experiência de Revisão

### B1. Estrutura e Hierarquia de Formulários
- **Diálogo de Criação de Plano de Ensino (`create-plan-dialog.tsx`):**
  - Títulos em `brand-navy` (`#102E52`), campos com indicação clara de obrigatoriedade (`*`), botões com hierarquia primário/secundário.
- **Diálogo de Criação de Programa (`CreateProgramaModal.tsx`):**
  - Busca ágil com seleção destacada em azul institucional (`border-l-[#023E8A] bg-blue-50/70`).
- **Navegação por Abas nos Editores:**
  - Padronizada a barra de abas segmentada com rolagem horizontal suave, indicador ativo branco com sombra sutil e marcador de preenchimento (`complete`, `partial`, `empty`).
- **Cards de Conteúdo:**
  - Todas as seções adotam `bg-white rounded-xl border border-slate-200/80 shadow-xs p-6`, com títulos semânticos em `text-lg font-bold text-[#102E52]` e descrições auxiliares em `text-xs text-slate-500`.

### B2. Editor de Texto Rico TipTap (`tiptap-editor.tsx`)
- **Container e Foco:**
  - Borda arredondada `rounded-xl border border-slate-200/90`.
  - Foco integrado com anel institucional (`focus-within:border-[#023E8A] focus-within:ring-2 focus-within:ring-[#023E8A]/15`).
- **Barra de Ferramentas:**
  - Fundo neutro suave (`bg-slate-50/70 border-b border-slate-100 px-2 py-1.5`).
  - Botões compactos (`h-7 w-7 rounded-md`) com estado ativo inequívoco: fundo `bg-[#EAF2FE]` e ícone em `#023E8A`.
  - Separadores verticais sutis entre formatação inline (negrito, itálico) e listas.
- **Área de Edição e Tipografia:**
  - Tipografia Lato com entrelinha confortável (`1.625`), margens inferiores padronizadas em parágrafos (`margin-bottom: 0.75rem`).
  - Listas ordenadas multiníveis (1., 1.1., etc.) estilizadas com prefixos em negrito e cor azul institucional (`#023E8A`).
  - Placeholder elegante em itálico neutro (`#94A3B8`).

### B3. Indicadores de Estado e Ações de Salvamento
- **Barra de Ações do Documento (`StudyPlanForm` & `ProgramaActionBar`):**
  - Indicador de salvamento em tempo real:
    - Salvando: ícone em pulso com texto azul institucional (`#023E8A`).
    - Salvo: checkmark verde esmeralda com horário da última gravação.
    - Erro: alerta com destaque em vermelho.
  - Botão secundário "Visualizar" em contorno neutro.
  - Botão primário "Submeter para Revisão" destacado em `#023E8A` com sombra suave, transmitindo clareza sem agressividade.

### B4. Experiência de Revisão e Homologação
- **Banner de Revisão da Coordenação (`review-actions.tsx`):**
  - Substituído o bloco escuro por container institucional (`bg-white border border-slate-200/90 rounded-xl shadow-xs p-5`).
  - Ponto semântico em âmbar indicando documento sob análise.
  - Ação de "Iniciar Revisão" com botão primário institucional.
  - Modal de devolução integrado com campo de apontamentos detalhados (`min-h-[120px]`).
- **Modal de Homologação de Programas (`ReviewProgramaModal.tsx`):**
  - Seleção de curso vinculador com dropdown limpo.
  - Seletores de decisão em cartões interativos:
    - Homologar/Aprovar: realce em azul institucional com ícone de sucesso.
    - Devolver com Apontamentos: realce em vermelho suave com campo obrigatório de parecer.
  - Integração com toasts institucionais SweetAlert2.

---

## 4. Matriz de Componentes Atualizada

| Componente | Localização | Papel no SIPPE |
|---|---|---|
| `PageHeader` | `src/components/dashboard/page-header.tsx` | Cabeçalho unificado de telas |
| `StatusBadge` | `src/components/dashboard/status-badge.tsx` | Badges de status com pontos coloridos |
| `TiptapEditor` | `src/components/ui/tiptap-editor.tsx` | Editor de texto rico para ementa, objetivos, conteúdos e avaliação |
| `StatsBar` | `src/components/programas/StatsBar.tsx` | Barra de indicadores com suporte a skeleton loader |
| `CoordinatorPlansTable` | `src/app/dashboard/coordinator/_components/coordinator-plans-table.tsx` | Tabela de revisão com empty states compactos |
| `SubmissionsTable` | `src/components/programas/SubmissionsTable.tsx` | Tabela de homologação com empty state refinado |
| `MasterCourseList` | `src/app/dashboard/chef/_components/master-course-list.tsx` | Gestão de dados mestres em paleta institucional |
| `UserManagement` | `src/app/dashboard/chef/_components/user-management.tsx` | Gestão de acessos em paleta institucional |
| `CentralArchiveTable` | `src/app/dashboard/secretary/_components/central-archive-table.tsx` | Tabela com busca consolidada |
| `ReviewActions` | `src/app/dashboard/study-plans/[id]/preview/review-actions.tsx` | Banner de deliberação do coordenador |
| `ReviewProgramaModal` | `src/components/programas/ReviewProgramaModal.tsx` | Modal de homologação e parecer |
| `StudyPlanForm` | `src/components/forms/study-plan-form/index.tsx` | Editor completo de planos de ensino |
| `ProgramaActionBar` | `src/components/programas/ProgramaActionBar.tsx` | Barra de ações e autosave para programas |

---

## 5. Fase 2.1 — Auditoria de Consistência Visual e Refinamento de Componentes

### 5.1. Padrão Unificado de Cabeçalhos Administrativos (Admin Header)
Aplicado em `UserManagement`, `MasterCourseList` e `SemesterManagement`:
- **Container Externo:** `flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-5 rounded-xl shadow-xs`.
- **Bloco do Ícone:** Caixa de dimensões fixas `w-10 h-10 rounded-xl bg-blue-50 text-[#023E8A] flex items-center justify-center shrink-0`.
- **Hierarquia de Texto:**
  - Título em `text-base sm:text-lg font-bold text-[#102E52] leading-snug`.
  - Descrição em `text-slate-500 text-xs leading-normal`.
  - Container textual com `min-w-0 flex-1 space-y-0.5` para evitar quebras anômalas em breakpoints intermediários (1024–1280px).
- **Ações à Direita:** `flex items-center gap-2 w-full sm:w-auto justify-end shrink-0`.

### 5.2. Padrão de Espaçamentos, Padding e Divisórias de Cartões
Consolidado no componente global `src/components/ui/card.tsx` e formulários:
- **`Card`:** `rounded-xl border border-slate-200/80 shadow-xs bg-card overflow-hidden`.
- **`CardHeader`:** `p-5 sm:p-6 [.border-b]:border-slate-100 [.border-b]:pb-5 flex flex-col gap-1.5`.
- **`CardContent`:** `p-5 sm:p-6 group-data-[size=sm]/card:p-4`.
- **Respiro e Margens:** Distância mínima de 16px entre descrições ou badges e divisórias (`border-b`), eliminando qualquer sensação de elementos "colados" às linhas.

### 5.3. Contadores Dinâmicos e Skeleton Screens
- Em `MasterCourseList` e `UserManagement`, durante o estado de carregamento (`isLoading`), a contagem inicial ("0") é substituída por badges ou placeholders animados em pulso suave (`h-3 w-8 bg-slate-200 animate-pulse rounded inline-block`).
- O componente `TableToolbar` passa a aceitar a prop `isLoading?: boolean`, renderizando skeleton loader no badge numérico quando dados assíncronos estão em trânsito.

### 5.4. Arquitetura de Autosave Resiliente (`study-plan-form`)
Eliminado o problema de travamento no estado "Salvando..." observado na validação:
- **Fila Serial Não Concorrente (`pendingDataRef`):** Se uma nova solicitação de salvamento ocorre enquanto uma requisição anterior está em voo (como na alternância de abas ou digitação na Bibliografia), os dados mais recentes são enfileirados e processados sequencialmente. Isso previne deadlocks e abortos de transação no PostgreSQL causados por concorrência de `DELETE` + `INSERT`.
- **Timeout Preventivo (10s):** Garantia de que requisições que demorem mais de 10 segundos caiam em estado de erro com opção de "Tentar novamente", nunca mantendo o usuário congelado em "Salvando...".
- **Feedback Tri-State:**
  - *Salvando:* `<CloudUpload className="animate-pulse text-[#023E8A]" /> Salvando...`
  - *Salvo:* `<Check className="text-emerald-600" /> Salvo às HH:MM:SS`
  - *Erro:* `<AlertCircle className="text-red-500" /> Erro ao salvar [Tentar novamente]`
- Debounce otimizado para 1000ms.

### 5.5. Navegação por Abas dos Editores
- Sincronização visual completa entre os editores de Planos e Programas de Ensino.
- Indicadores discretos de completude (`getTabStatus`):
  - Verde esmeralda (`bg-emerald-500`): seção preenchida.
  - Âmbar (`bg-amber-400`): preenchimento parcial.
  - Cinza neutro (`bg-slate-300`): não preenchido.
- Aba ativa destacada com fundo branco, sombra suave e texto em azul institucional `#023E8A`.
- Acessibilidade por teclado com anel de foco `focus-visible:ring-2 focus-visible:ring-[#023E8A]`.
- Container com rolagem horizontal fluida (`overflow-x-auto min-w-max`).

### 5.6. Feedback Interativo no Cronograma (Seleção de Dias da Semana)
- Checkboxes tradicionais substituídos por cartões toggle interativos (`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5`).
- Estado ativo com contorno azul `#023E8A`, fundo azul claro (`bg-blue-50/90`), texto em negrito e anel de realce.
- Resumo em tempo real informando quantidade de dias selecionados e lista textual formatada ("Dias ativos: Terça-feira, Quinta-feira"), eliminando dúvidas sobre o registro de múltiplos cliques.

### 5.7. Configuração de Avaliação (Visão do Chefe)
- Textareas harmonizados com a tipografia do sistema: `font-sans text-sm leading-relaxed text-slate-800` (eliminando a fonte monoespaçada crua).
- Botão de negrito atualizado com ícone Lucide `Bold` e estados hover/active limpos.
- Botões de salvamento padronizados em azul institucional `#023E8A` com estados de carregamento independentes para planos e programas.
- Pré-visualização formatada em cartão destacado (`bg-slate-50/70 border-slate-200/80 rounded-xl p-4`).

### 5.8. Padronização de Tabelas Administrativas
- Alinhamento de colunas: valores numéricos e cargas horárias alinhados à direita (`text-right font-mono`), textos à esquerda, fases centralizadas (`text-center`).
- Badges e tags dentro de células formatados com `flex-wrap` e largura máxima (`max-w-[280px]`) para não provocar overflow horizontal na tabela.
- Ações destrutivas (excluir conta / limpar base) com realce visual em vermelho e confirmações prévias de segurança.
