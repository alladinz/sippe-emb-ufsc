# SIPPE — Design System & Convenções de UI/UX (Fase 3)

## Padronização de Modais, Alertas, Pop-ups e Feedback de Interface

Este documento estabelece o padrão visual e de interação para todas as sobreposições de tela (modais, caixas de diálogo, pop-ups, popovers, alertas e notificações toast) no SIPPE, consolidando a direção **Minimalismo Institucional Contemporâneo**.

---

## 1. Princípios e Diretrizes Visuais

### 1.1 Cores e Identidade Institucional
- **Títulos de Modais e Overlays:** Azul profundo `#102E52`, peso `bold`, tipografia `font-heading` (Lato).
- **Ações Primárias / Confirmação:** Azul institucional `#023E8A` (`hover:bg-[#023E8A]/90`), texto em branco `font-bold`.
- **Ações Destrutivas / Devolução:** Vermelho discreto `#DC2626` / `bg-red-600` (`hover:bg-red-700`).
- **Ações Secundárias / Cancelamento:** Botão `variant="outline"` com borda `border-slate-200`, texto `text-slate-600`, fundo `hover:bg-slate-50`.
- **Superfícies de Conteúdo:** Fundo branco puro `#FFFFFF` com bordas sutis `border border-slate-200/80` e elevação suave `shadow-xl`.
- **Backdrop (Scrim):** `bg-slate-900/40 backdrop-blur-xs` para foco sem perda do contexto de fundo.

---

## 2. Padrão de Modais (`Dialog` / `DialogContent`)

### 2.1 Variantes de Largura
Definidas na propriedade `size` de `DialogContent` (`@/components/ui/dialog`):
- **Compact (`size="compact"`):** `sm:max-w-md` (448px) — diálogos de confirmação rápida, formulários curtos de um campo, redefinição de senha e estados vazios.
- **Default (`size="default"`):** `sm:max-w-lg` (512px) — formulários padrões, avaliação e homologação de documentos.
- **Large (`size="large"`):** `sm:max-w-2xl` (672px) — formulários complexos de edição de disciplina e seleção mestre.

### 2.2 Estrutura Padronizada
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-[480px] p-6 rounded-xl border border-slate-200/80 shadow-xl">
    <DialogHeader>
      <DialogTitle className="text-lg font-bold text-[#102E52] flex items-center gap-2">
        <Icon className="w-5 h-5 text-[#023E8A]" />
        Título do Modal
      </DialogTitle>
      <DialogDescription className="text-xs text-slate-500 mt-1">
        Descrição sucinta e orientadora do objetivo da janela.
      </DialogDescription>
    </DialogHeader>

    <div className="py-3 space-y-3">
      {/* Conteúdo e inputs com altura padronizada h-9 */}
    </div>

    <DialogFooter className="gap-2 sm:gap-2">
      <Button variant="outline" className="h-9 px-4 text-xs font-semibold text-slate-600 border-slate-200 hover:bg-slate-50 rounded-lg">
        Cancelar
      </Button>
      <Button className="h-9 bg-[#023E8A] hover:bg-[#023E8A]/90 text-white font-bold px-4 text-xs rounded-lg">
        Confirmar Ação
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 3. SweetAlert2 e Toasts de Feedback

### 3.1 Isolamento de Estilos
Para prevenir que notificações flutuantes (toasts) herdem preenchimentos excessivos de pop-ups centrais:
- **Pop-ups centrais de confirmação:** utilizam a classe `.swal-popup` com `padding: 2rem !important; border-radius: 14px !important;`.
- **Notificações Toast:** utilizam a classe `.swal-toast-popup` com `padding: 0.75rem 1rem !important; border-radius: 10px !important;`.

### 3.2 Eliminação de Diálogos Nativos do Navegador
O uso de `window.alert`, `window.confirm` e `window.prompt` foi formalmente banido do projeto.
Em seu lugar, deve-se utilizar as funções centralizadas de `@/lib/swal`:
- `confirmDialog(title, text, confirmText, cancelText, isDangerous)`: Confirmações assíncronas com retorno booleano.
- `promptDialog(title, text, placeholder, confirmText, cancelText, isDangerous)`: Captura de pareceres e justificativas com validação.
- `toastSuccess(message)`, `toastError(message)`, `toastWarning(message)`, `toastInfo(message)`: Notificações não-bloqueantes no canto superior direito.
- `swalLoading(title)` / `MySwal.close()`: Diálogos de progresso e sincronização.

---

## 4. Central de Notificações (`NotificationBell`)

- **Largura:** `w-80 sm:w-96` com cantos arredondados `rounded-xl`, borda `border border-slate-200/90` e sombra `shadow-xl`.
- **Cabeçalho:** Título `#102E52` com contador numérico discreto (`bg-[#023E8A] text-white`) e atalho para marcar todas como lidas.
- **Carregamento:** Skeleton animado com 3 linhas pulse, evitando visualização prematura de estado vazio.
- **Diferenciação Não Lida:** Faixa lateral `border-l-3 border-l-[#023E8A]`, fundo suave `bg-blue-50/40`, título destacado e indicador em círculo azul.
- **Ícones Semânticos:**
  - Sucesso/Aprovação: `CheckCircle` em verde esmeralda `text-emerald-600`.
  - Rejeição/Devolução: `XCircle` em vermelho `text-red-600`.
  - Submissão/Revisão pendente: `Clock` em âmbar `text-amber-500`.
  - Novo Plano: `FileText` em azul `#023E8A`.

---

## 5. Inventário de Componentes Refatorados na Fase 3

| Componente | Caminho | Ajuste Realizado |
| :--- | :--- | :--- |
| `dialog.tsx` | `src/components/ui/dialog.tsx` | Inclusão de variantes de tamanho (`compact`, `default`, `large`), backdrop com blur sutil, título `#102E52`, botão fechar acessível em pt-BR. |
| `swal.ts` | `src/lib/swal.ts` | Separação das classes de toast vs popup; criação da função `promptDialog`. |
| `globals.css` | `src/app/globals.css` | Ajustes finos de CSS para `.swal-toast-popup` sem conflito de preenchimento. |
| `CopiarPlanoModal.tsx` | `src/components/planos/CopiarPlanoModal.tsx` | Dimensionamento dinâmico (`sm:max-w-md` quando vazio; `sm:max-w-xl` quando preenchido), ícone centralizado e remoção de excesso vertical. |
| `user-management.tsx` | `src/app/dashboard/chef/_components/user-management.tsx` | Modal de Novo Usuário com `sm:max-w-[480px]`, inputs e selects com `h-9 rounded-lg border-slate-200`, foco `#023E8A`. |
| `create-plan-dialog.tsx` | `src/app/dashboard/study-plans/_components/create-plan-dialog.tsx` | Padronização de título, bordas e botões do rodapé. |
| `CreateProgramaModal.tsx` | `src/components/programas/CreateProgramaModal.tsx` | Substituição do input nativo por `Input` padronizado, ícone no título, lista de busca com destaque `#023E8A`. |
| `SubmitProgramaModal.tsx` | `src/components/programas/SubmitProgramaModal.tsx` | Cards de seleção por rádio com anel `#023E8A`, remoção de classes legadas `brand-blue`. |
| `ReviewProgramaModal.tsx` | `src/components/programas/ReviewProgramaModal.tsx` | Migração completa de overlay customizado para Radix `Dialog`, cards de decisão acessíveis, parecer obrigatório na devolução. |
| `review-actions.tsx` | `src/app/dashboard/study-plans/[id]/preview/review-actions.tsx` | Diálogo de devolução refinado com botões padronizados e feedback obrigatório. |
| `edit-course-dialog.tsx` | `src/app/dashboard/chef/_components/edit-course-dialog.tsx` | Dimensões refinadas, campos `h-9` e foco institucional. |
| `assignment-dialog.tsx` | `src/app/dashboard/chef/_components/assignment-dialog.tsx` | Dimensões compactas, tipografia e botões padronizados. |
| `csv-importer/index.tsx` | `src/components/forms/csv-importer/index.tsx` | Dropzone com ícone `#023E8A`, campos alinhados e rodapé consistente. |
| `login/page.tsx` | `src/app/login/page.tsx` | Modal de recuperação de senha padronizado com `sm:max-w-[420px]`. |
| `notification-bell.tsx` | `src/app/dashboard/_components/notification-bell.tsx` | Expansão responsiva para `w-80 sm:w-96`, skeleton de carregamento e contraste visual. |
| `ProgramaEnsinoEditorClient.tsx` | `src/app/dashboard/programas-ensino/[id]/_components/ProgramaEnsinoEditorClient.tsx` | Eliminação do `window.prompt` substituído por `promptDialog`. |
| `SubmissionsTable.tsx` | `src/components/programas/SubmissionsTable.tsx` | Eliminação de chamada direta `Swal.fire` substituída por `toastSuccess`. |
