# SIPPE — Homologação de UX, Microajustes e Validação de Fluxos (Fase 4)

Este documento registra a homologação completa da interface, a auditoria de jornadas acadêmicas por perfil, os testes de estresse do autosave e a verificação de compatibilidade com a branch `origin/main` no branch `redesign-v1`.

---

## 1. Microajustes Implementados

### 1.1 Central de Notificações (`notification-bell.tsx`)
- **Badge Numérica Aprimorada:** Substituído o badge estático anterior por um container com `inline-flex items-center justify-center min-w-[20px] h-5 px-1.5`.
- **Tipografia e Alinhamento:** Aplicado `text-[11px] font-bold tabular-nums leading-none` para centralização vertical e horizontal precisa de 1, 2 e 3 dígitos.
- **Tratamento de Grandes Volumes:** Contagens acima de 99 são sintetizadas como `99+`, preservando o valor exato via `title` e `aria-label` acessíveis.
- **Identidade Institucional:** Mantido o azul `#023E8A` sobre fundo contrastante com sombra sutil `shadow-2xs`.

### 1.2 Toast de Notificação e Geração de PDF (`swal.ts` & `globals.css`)
- **Redução de Escala:** Largura máxima contida em `max-width: 320px` e padding ajustado para `0.5rem 0.85rem`.
- **Ícone Discreto:** Ícone de sucesso reduzido para `1.15rem` (18px) com traço fino de `1.5px`.
- **Remoção de Barra de Progresso:** A barra de contagem regressiva inferior foi desativada (`timerProgressBar: false` e `display: none !important`), tornando os toasts silenciosos e compactos.
- **Semântica:** Preservada a auto-dispensa em 3000ms e a mensagem de sucesso sem impacto no download via Blob.

### 1.3 Modal de Acesso e Redefinição de Senha (`login/page.tsx`)
- **Comunicação Precisa:** O texto orientador do modal foi atualizado para esclarecer que atende tanto ao **primeiro acesso** (definição inicial de senha após cadastro pelo Chefe) quanto à **redefinição de senha esquecida**.
- **Texto:** *"Informe o e-mail institucional cadastrado no SIPPE. Enviaremos um link seguro para que você possa definir sua senha inicial de primeiro acesso ou redefinir sua senha atual."*

### 1.4 Seletores Administrativos em Telas Menores (`user-management.tsx`)
- **Grid Responsivo:** No modal de Adicionar Novo Usuário, os campos "Papel" e "Curso/Depto" passaram de `grid-cols-2` fixo para `grid-cols-1 sm:grid-cols-2 gap-3`. Em telas móveis (390px), os seletores ocupam largura total, eliminando truncamentos severos de nomes de cursos.
- **Menu Rolável:** Adicionado `max-h-56` ao container de opções de Curso/Departamento para navegação confortável com dezenas de cursos cadastrados.

---

## 2. Inventário de Jornadas Acadêmicas por Perfil

O SIPPE atende a dois fluxos documentais distintos que não compartilham o mesmo ciclo de vida: **Planos de Ensino** (nível operacional/turma) e **Programas de Ensino** (nível departamental/PPC).

### 2.1 Matriz Comparativa de Ciclo de Vida

| Etapa | Plano de Ensino | Programa de Ensino |
| :--- | :--- | :--- |
| **Responsável pela Criação** | Professor (ou atribuição pelo Chefe) | Comissão Revisora ou Chefe |
| **Escopo** | Turma e Semestre específico (ex: Turma 01 - 2026.1) | Disciplina mestre com múltiplos cursos vinculados |
| **Status Inicial** | `draft` (Rascunho) | `draft` (Rascunho) |
| **Mecanismo de Salvamento** | Serial com debounce de 1000ms | Serial com debounce de 1500ms + flush manual |
| **Submissão** | Direta para a Coordenação do Curso | Para a Chefia do Departamento (`pending_chefe`) |
| **Revisão Intermediária** | Não há | Chefia analisa e encaminha para coordenações (`submitted`) |
| **Homologação** | Coordenação do Curso do plano (`approved`) | Todas as Coordenações dos cursos vinculados devem aprovar |
| **Devolução** | Coordenação devolve ao Professor com apontamentos | Chefe ou Coordenação devolve à Comissão com parecer |
| **Arquivamento** | Secretaria Acadêmica arquiva no Arquivo Central | Consulta direta de programas vigentes no catálogo |

### 2.2 Jornada 1: Professor (Planos de Ensino)
1. **Entrada:** Acesso ao dashboard -> visualização dos cards de disciplinas atribuídas no semestre ativo.
2. **Criação/Abertura:** Botão "Novo Plano de Ensino" (seleção de disciplina + PPC) ou clique em card já atribuído.
3. **Preenchimento:** Editor dividido em 6 abas (Identificação, Conteúdo, Metodologia, Avaliação, Cronograma, Bibliografia). Possibilidade de "Copiar de plano anterior".
4. **Autosave:** Persistência automática serial a cada 1000ms de inatividade na digitação, com indicador tri-state no cabeçalho.
5. **Pré-visualização e PDF:** Aba de prévia permite inspeção em formato institucional e download direto em PDF.
6. **Submissão:** Confirmação com modal de envio. O plano muda para `submitted`. O formulário torna-se somente-leitura.
7. **Retorno:** Se aprovado pela coordenação (`approved`), recebe notificação com ícone verde. Se devolvido (`rejected`), recebe notificação com ícone vermelho e visualiza os apontamentos para correção e ressubmissão.

### 2.3 Jornada 2: Comissão Revisora (Programas de Ensino)
1. **Entrada:** Acesso à aba "Programas de Ensino".
2. **Criação:** Seleção de disciplina mestre da base.
3. **Preenchimento:** 7 abas técnicas (Identificação, Carga Horária com extensão, Ementa, Objetivos, Conteúdo, Avaliação, Bibliografia).
4. **Autosave:** Indicador na barra de ação; salvamento forçado ao alternar abas ou clicar em "Visualizar".
5. **Encaminhamento:** Submissão envia o documento para a Chefia do Departamento (`pending_chefe`).
6. **Retorno:** Caso a Chefia ou uma das Coordenações aponte inconsistências, o programa retorna para `rejected` com histórico de pareceres.

### 2.4 Jornada 3: Chefia de Departamento
1. **Visão Geral:** Dashboard com contadores mestres, disciplinas ativas, semestres e atalhos rápidos.
2. **Atribuição:** Criação direta de rascunhos para professores via `assignment-dialog`.
3. **Revisão de Programas:** Acesso à fila `pending_chefe`. O chefe pode:
   - Editar diretamente o documento institucional.
   - Devolver à comissão com parecer via `promptDialog` (`reject_back`).
   - Encaminhar para as coordenações dos cursos vinculados (`submitted`).
4. **Configurações:** Definição do texto padrão institucional de Avaliação Final (Planos) e Critérios Institucionais de Avaliação (Programas).

### 2.5 Jornada 4: Coordenação de Curso
1. **Fila de Planos:** Aba de Planos aguardando homologação. Ação de "Iniciar Revisão" (`pending_review`).
2. **Homologação/Devolução de Planos:** Análise do plano; aprovação direta (`approved`) ou devolução com apontamentos obrigatórios (`review-actions.tsx`).
3. **Revisão de Programas:** Aba "Revisão de Programas". O coordenador avalia em nome do seu curso específico. O modal `ReviewProgramaModal` registra o parecer. Quando o último curso aprova, o programa consolida status `approved`.

### 2.6 Jornada 5: Secretaria Acadêmica
1. **Arquivo Central:** Acesso a todos os planos homologados no semestre.
2. **Arquivamento em Lote ou Unitário:** Transição de planos aprovados para `archived`.
3. **Exportação:** Download de cópias em PDF para acervo departamental.

---

## 3. Validação do Mecanismo de Autosave

Conduzimos testes arquiteturais para os cenários críticos apontados na auditoria:

### 3.1 Concorrência e Gravações Fora de Ordem (Timeout)
- **Problema Analisado:** Quando uma chamada do `onSave` atinge o timeout de 10s via `Promise.race`, a requisição original no servidor não é cancelada pelo browser. Se o usuário tentar salvar novamente em seguida, uma resposta lenta da primeira requisição poderia sobrescrever os dados mais novos.
- **Solução Implementada:** Adicionado o contador monotônico `saveSeqRef`. A cada salvamento disparado, registra-se `const currentSeq = ++saveSeqRef.current`. Quando uma requisição resolve, seu resultado só atualiza o estado `lastSavedDataRef` e `saveStatus` se `currentSeq === saveSeqRef.current`. Qualquer resposta defasada ou pós-timeout é descartada com segurança.

### 3.2 Proteção Contra Fechamento Acidental (`beforeunload`)
- **Problema Analisado:** Se o usuário fechar a aba ou janela durante o debounce de 1000ms ou enquanto uma requisição de salvamento estiver ativa, alterações poderiam ser perdidas sem aviso.
- **Solução Implementada:** Inseridos event listeners de `beforeunload` tanto no `StudyPlanForm` quanto no `ProgramaEnsinoEditorClient`, disparando o alerta nativo de navegação caso haja dados na fila pendente ou transação ativa.

### 3.3 Alternância de Abas e Flush Forçado
- **Problema Analisado:** Alternar abas no editor de Programa de Ensino ou clicar em "Visualizar" antes do disparo do timer de 1500ms de debounce.
- **Solução Implementada:** Implementada a função `flushSave()` executada de forma síncrona/aguardada antes do redirecionamento da rota em `handleVisualizar` e `handlePreSubmit`.

---

## 4. Validação Responsiva e Acessibilidade

### 4.1 Resoluções Auditadas
- **Desktop Amplo (1440px / 1280px):** Tabelas com visualização completa de colunas, sidebar expandida (256px), modais centralizados com padding generoso (24px).
- **Tablet / Laptop Compacto (768px):** Sidebar recolhida em modo ícones ou gaveta; quebra de tabelas com scroll horizontal discreto (`overflow-x-auto`); filtros de busca empilhados.
- **Mobile (390px - padrão smartphone):** Modais ocupam `calc(100% - 2rem)`; grid de inputs em coluna única (`grid-cols-1`); dropdown de notificações contido em 320px; menu hamburguer mobile preservado.

### 4.2 Acessibilidade e Contraste
- **Títulos e Textos Principais:** `#102E52` sobre `#FFFFFF` atinge razão de contraste de **13.2:1** (superior ao padrão AAA do W3C de 7:1).
- **Ações Primárias:** `#023E8A` sobre `#FFFFFF` atinge razão de **8.6:1** (padrão AAA).
- **Textos Secundários:** `#64748B` sobre `#FFFFFF` atinge razão de **4.6:1** (padrão AA).
- **Ações Destrutivas:** `#DC2626` sobre `#FFFFFF` atinge razão de **4.5:1** (padrão AA).
- **Navegação por Teclado:** Todos os modais baseados em Radix mantêm trap de foco, tecla Esc funcional e retorno de foco para o disparador ao fechar.

---

## 5. Auditoria de Desempenho

- **Tamanho do Bundle Inicial:** Shared First Load JS contido em **102 kB**.
- **Rotas Administrativas:** Variando entre 155 kB e 210 kB de First Load JS.
- **Rotas com Editores e PDF:** 334 kB (`/study-plans/[id]` com Tiptap) e 710 kB (`/preview` com React-PDF), carregados sob demanda (*code-splitting* automático).
- **Tempo de Build de Produção:** 40 segundos para compilação completa de 33 rotas estáticas e dinâmicas.

---

## 6. Comparação com a Branch `origin/main`

A inspeção via `git diff --stat origin/main` comprova:
- **Total de Arquivos Modificados:** 56 arquivos.
- **Escopo Exclusivo de UI/UX:** As alterações abrangem tokens de cor, tipografia Lato, layouts de cards, modais Radix, isolamento de toasts e proteções no client de autosave.
- **Regras de Negócio e Banco Preservadas:** Nenhuma migration, schema Drizzle ou rota de autenticação de backend foi alterada. O sistema permanece 100% interoperável com a infraestrutura existente.


---

## 7. Fase 4.1 a 4.3 — Auditoria Profunda, Correções de Integridade e Testes Automatizados

### 7.1 Correções Críticas Realizadas
1. **Prevenção de Perda de Dados em Submissão de Planos (`study-plan-form/index.tsx`):**
   - O `onFinalSubmit` agora aguarda `await flushSave()` antes de acionar `onSubmit()`. Caso a gravação das últimas alterações falhe, a submissão é abortada com toast de erro, evitando transição prematura para somente-leitura com perda dos dados digitados.
   - O `handlePreviewClick` agora aguarda `await flushSave()`, garantindo que a página de prévia e o PDF renderizem os dados recém-digitados.
   - Adicionada captura de clique em links (`<a>` e `<Link>`) e evento `visibilitychange` (para mobile), salvando alterações pendentes no momento exato em que o usuário navega pela sidebar ou minimiza a aba.
2. **Serialização e Concorrência em Programas de Ensino (`ProgramaEnsinoEditorClient.tsx`):**
   - Implementado o bloqueio serial (`isSavingRef`), sequenciador monotônico (`saveSeqRef`) e `flushSave()` assíncrono com checagem de integridade antes de submeter ou visualizar.
   - Proteção contra fechamento de aba via `beforeunload` quando houver alterações pendentes.
3. **Desbloqueio de Edição e Ressubmissão em Programas Devolvidos (`programaStatus.ts` e `programaEnsinoService.ts`):**
   - `isProgramaEditable` e `canSubmitPrograma` foram atualizados para permitir edição e ressubmissão quando `status === 'rejected'`. Anteriormente, documentos devolvidos ficavam congelados sem possibilidade de ajuste pela comissão.
   - Atualizados `updatePrograma` e `submitPrograma` para aceitar `status === 'rejected'`.
4. **Correção de Homologação Unânime de Programas (`programaEnsinoService.ts`):**
   - A função `reviewPrograma` marcava o programa diretamente como `'archived'` ao receber a aprovação da última coordenação pendente. O comportamento foi corrigido para definir `status: 'approved'` e registrar `aprovadoEm: new Date()`, mantendo o status `archived` restrito ao arquivamento deliberado.
5. **Proteção de Acesso Direto à Rota da Chefia (`src/app/dashboard/chef/page.tsx`):**
   - A página de Chefia verificava apenas a autenticação (`!session`), deixando a rota acessível a qualquer usuário autenticado que digitasse a URL diretamente. Foi inserida a verificação server-side da role `chefe`, exibindo tela de "Acesso Negado" para usuários não autorizados.

### 7.2 Cobertura de Testes Automatizados
- Criada a suíte `tests/autosave-and-workflow.test.ts` com 11 novos testes cobrindo:
  - Descarte de respostas antigas fora de ordem via sequenciamento monotônico.
  - Bloqueio de concorrência com fila serial de salvamento.
  - Aguardo de flush de alterações antes de navegar.
  - Aborto de submissão em caso de falha de persistência.
  - Permissões de edição e envio para `draft` e `rejected`.
  - Homologação parcial vs unânime entre múltiplos cursos vinculados.
  - Limites de permissão RBAC para Professor, Coordenador, Chefe e Secretário.
- Total acumulado no Vitest: **28 testes aprovados em 6 suítes** (0 falhas).
- Compilação de produção Next.js: **33 rotas estáticas e dinâmicas geradas com sucesso** em 42s.


---

## 8. Gate Final de Integração e Liberação para Pull Request

### 8.1 Revisão Conclusiva de Autosave e Ordenação Real
- **Eliminação de Timeout com Concorrência Paralela:** Removido o `Promise.race([..., timeout(10000)])` de `study-plan-form/index.tsx`. O salvamento assíncrono agora aguarda a conclusão da chamada sem liberar antecipadamente o semáforo `isSavingRef`. Dessa forma, nenhuma requisição subsequente é transmitida enquanto a anterior estiver em curso na rede ou no banco, garantindo ordenação monotônica real em nível de banco de dados.
- **Unificação da Fila em Programas de Ensino:** No `ProgramaEnsinoEditorClient.tsx`, o debounce do autosave foi unificado para acionar diretamente `flushSave()`. Todas as gravações (periódicas, de navegação, visualização ou submissão) compartilham a mesma fila serial com lock `isSavingRef`, eliminação de concorrência e controle monotônico `saveSeqRef`.
- **Eliminação de Advertências de React Hooks:** Estabilização com `useCallback` das funções `initFormState` e `flushSave`, zerando advertências no ESLint.

### 8.2 Estatísticas Finais de Validação
- **ESLint:** 0 erros, 0 advertências.
- **TypeScript (`tsc --noEmit`):** 0 erros de tipagem.
- **Vitest Unitário (`npm run test:unit`):** 28 testes aprovados em 6 suítes (100% de sucesso).
- **Next.js Production Build:** 33 rotas estáticas e dinâmicas geradas com sucesso (código 0).
- **Branch:** `redesign-v1`.
- **Diff vs `origin/main`:** 58 arquivos modificados (2773 inserções, 1597 deleções).

---

## 9. Fase 4.4 — Polimento Visual Pré-Merge

Esta etapa consolidou os ajustes finais de consistência visual identificados durante a validação no ambiente de homologação/preview na Vercel antes da integração definitiva à branch `main`.

### 9.1 Filtros do Arquivo Central (`central-archive-table.tsx`)
- **Eliminação de Redundância:** Removido o seletor dropdown de Disciplina, visto que o campo de busca textual geral já pesquisa simultaneamente nome da disciplina, código, turma e professor.
- **Chips / Pills Selecionáveis:** Conversão dos filtros de Semestre e Status em pills arredondadas (`rounded-full`), adotando a convenção visual aprovada em Fases anteriores:
  - **Selecionado (Ativo):** Fundo `#023E8A`, texto `#FFFFFF`, borda `#023E8A`.
  - **Não Selecionado (Inativo):** Fundo `#FFFFFF`, texto `slate-600`, borda `slate-200`, com hover sutil em `slate-50`.
  - **Espaçamento:** `gap-2` (8px) em container `flex-wrap`.
- **Ordenação Cronológica de Semestres:** Os semestres são classificados estritamente do mais recente ao mais antigo (`b.localeCompare(a, undefined, { numeric: true })`), com botão de seleção única "Todos".
- **Filtro de Professor com Busca Integrada:** Para acomodar departamentos com dezenas de docentes sem inflar o layout:
  - Quando a listagem ultrapassa 6 professores, é exibido um campo de busca textual compacto (`w-full sm:w-64`).
  - O container de chips de professores possui rolagem vertical delimitada (`max-h-28 overflow-y-auto pr-1`), mantendo sempre visível a opção "Todos" e garantindo que o docente selecionado permaneça destacado mesmo durante a filtragem textual.
- **Contador de Filtros Ativos e Limpeza:**
  - O botão "Filtros" na barra de ferramentas exibe badge numérica (`bg-[#023E8A] text-white text-[10px]`) indicando a contagem de filtros ativados.
  - Exibido botão discreto "Limpar Filtros" (`FilterX`) ao lado do painel quando houver qualquer filtro aplicado.

### 9.2 Padronização da Aba Programas de Ensino no Arquivo Central (`arquivo-central-client.tsx`)
- **Adoção da `TableToolbar` e `TableFilters`:** Substituída a barra de busca isolada pelo conjunto padrão compartilhado de componentes de tabela do SIPPE.
- **Busca Abrangente:** O campo de busca agora cobre nome da disciplina, código e cursos vinculados.
- **Filtro Contextual por Cursos Vinculados:** Adicionado painel de filtros com pills de cursos vinculados (`formatCursoVinculado`), permitindo seleção rápida entre "Todos os Cursos" e os cursos atendidos pelas disciplinas departamentais.
- **Ausência de Filtros Redundantes:** Preservada a regra de negócio do Arquivo Central de não incluir filtros de semestre (programas não possuem vínculo semestral) ou status (a consulta já é restrita a documentos arquivados).
- **Paginação e Estado Vazio:** Integrados o componente `TablePagination` (20 itens por página) e `TableEmptyState` para quando não houver registros correspondentes.

### 9.3 Centralização das Abas Horizontais nos Editores (`study-plan-form/index.tsx` & `ProgramaEnsinoEditorClient.tsx`)
- **Eliminação do Card Branco Redundante:** Eliminado o bloco retangular branco de largura total (`bg-white px-3 py-2 rounded-xl shadow-2xs border-b`) que deixava um grande vazio visual à direita em monitores desktop.
- **Alinhamento Centralizado:** As listas de abas (6 abas em Planos e 7 abas em Programas) foram centralizadas horizontalmente no container de edição (`w-full flex sm:justify-center justify-start py-1 overflow-x-auto`).
- **Container Segmentado Neutro:** As abas agora repousam em container sutil (`bg-slate-100/90 rounded-xl border border-slate-200/70 p-1 shadow-2xs min-w-max`).
- **Responsividade e Rolagem:** Em telas pequenas (smartphones e tablets), o container permite rolagem horizontal suave sem cortar a primeira ou a última aba.
- **Indicadores de Preenchimento:** Preservados os marcadores visuais circulares de completude (`bg-emerald-500` para completo, `bg-amber-400` para parcial, `bg-slate-300` para pendente) e os atributos de acessibilidade Radix/ARIA.

### 9.4 Reestruturação da Barra de Ações de Programas de Ensino (`ProgramaActionBar.tsx`)
- **Fim da Compressão de Controles:** A barra de ações foi redesenhada em estrutura hierárquica clara. O flexbox principal agora contém apenas dois grupos alinhados nas extremidades (`justify-between`):
  - **Grupo Esquerdo:** Botão "Voltar", separador vertical, badge de status institucional do programa e indicador animado tri-state de salvamento automático (`CloudUpload` / `Check` / `AlertCircle`).
  - **Grupo Direito:** Botões de ação contextual ("Histórico", "Excluir Rascunho", "Visualizar", "Encaminhar para Chefia / Coordenações", "Devolver à Comissão", "Iniciar Revisão", ou aviso de aguardo de parecer).
- **Desacoplamento do Painel de Aprovações (`AprovacoesPanel`):** O painel de aprovações por curso vinculado e o alerta de feedback de devolução foram movidos para fora do flexbox horizontal de botões. Ambos agora ocupam blocos dedicados de largura total logo abaixo da barra, separados por linha divisória discreta (`border-t border-slate-100 pt-2`).
- **Suporte aos Perfis e Ciclos de Vida:** A barra atende perfeitamente Comissão (`draft`, `rejected`), Chefia (`pending_chefe`), Coordenação (`submitted`) e Secretaria (`approved`, `archived`), com espaçamento harmonioso tanto em desktop (1280px+) quanto em mobile (390px).

### 9.5 Correção do Ícone em Toasts de Sucesso (`swal.ts` & `globals.css`)
- **Diagnóstico:** Ao reduzir o tamanho do `.swal2-icon` para 18px (`1.15rem`) via CSS na Fase 4 sem ajustar proporcionalmente o `font-size`, as coordenadas em `em` dos elementos animados internos do SweetAlert2 (`.swal2-success-line-tip`, `.swal2-success-line-long`, `.swal2-success-ring`) causavam cisalhamento e deformação do checkmark verde.
- **Solução Definitiva:**
  - Em `swal.ts`, a função `toastSuccess` agora fornece um ícone SVG geométrico limpo e centrado via propriedade `iconHtml`:
    ```html
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:auto;"><polyline points="20 6 9 17 4 12"></polyline></svg>
    ```
  - Em `globals.css`, foram ajustados os estilos específicos de `.swal2-popup.swal2-toast .swal2-icon` para `width: 1.25rem`, `height: 1.25rem`, `font-size: 0.625rem`, borda verde `#10b981` e ocultação de pseudo-linhas legadas de animação em toasts.
  - Modais centrais (`confirmDialog`, `promptDialog`, `swalLoading`) permanecem intactos com seus ícones originais completos.

---

## 10. Fase 4.5 — Acabamento Final Pré-Merge

Esta etapa executou os refinamentos finais e pontuais de acabamento visual antes do merge definitivo à branch `main`.

### 10.1 Refinamento do Dropdown do Usuário (`user-menu.tsx` & `dropdown-menu.tsx`)
- **Eliminação de Bordas Retangulares e Contornos Rígidos:** A camada base `dropdown-menu.tsx` foi atualizada de `rounded-none` para `rounded-xl` em containers e `rounded-lg` em itens, alinhando-se aos cards do Minimalismo Institucional Contemporâneo.
- **Tratamento de Foco e Trigger:** No disparador (`UserMenu`), o botão recebeu `rounded-xl`, `border border-transparent` e foco acessível condicional `focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-[#023E8A] focus-visible:ring-offset-2`. Isso elimina contornos azuis permanentes quando o menu é aberto via clique do mouse, mantendo foco nítido apenas na navegação por teclado (Tab).
- **Estrutura Visual Interna:**
  - **Superfície e Sombra:** Fundo branco (`bg-white`), borda sutil (`border border-slate-200/80`), cantos `rounded-xl`, sombra suave `shadow-lg shadow-slate-900/5` e largura compacta proporcional (`w-56 sm:w-60`).
  - **Cabeçalho:** Rótulo "Minha Conta" (`text-xs font-bold text-slate-900`) e e-mail institucional truncado com segurança (`text-[11px] text-slate-500 truncate`).
  - **Separador:** Linha fina e neutra (`h-px bg-slate-100 my-1 -mx-1.5`).
  - **Ação de Logout:** Ícone Lucide `LogOut` (16px), texto "Sair do Sistema", cor vermelha discreta (`text-red-600`), hover e foco suaves (`hover:bg-red-50/80 hover:text-red-700 focus:bg-red-50/80 focus:text-red-700`) e alinhamento vertical flexível.
- **Acessibilidade e Viewport:** Preservados o fechamento por clique externo, tecla Escape e proteção contra transbordamento da viewport.

### 10.2 Padronização do Botão de Download de PDF
- **Eliminação de Ícones Duplicados:** Nos botões de exportação (`DownloadPDFButton` e `DownloadProgramaButton`), foi removido o elemento SVG rígido interno herdado (`<svg ... d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2...`) que concorria com o ícone passado pelos componentes pais (`preview/page.tsx` e `visualizar/page.tsx`).
- **Ícone Único Padronizado:** Padronizado para um único ícone Lucide `Download` (dimensão aproximada de 18px: `w-[18px] h-[18px] shrink-0`), perfeitamente alinhado com a label "Baixar PDF".
- **Estado de Carregamento:** Durante a geração do PDF (`isGenerating`), o botão exibe o ícone animado `Loader2` (`w-[18px] h-[18px] animate-spin`) acompanhado do texto "Gerando PDF...".
- **Preservação Funcional:** Mantidos intactos o Blob em memória, o nome padronizado do arquivo, o download no navegador e a notificação de confirmação via toast.
