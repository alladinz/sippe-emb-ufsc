# SIPPE - Sistema de Programas e Planos de Ensino

![UFSC Badge](https://img.shields.io/badge/UFSC-Departamento%20de%20Engenharia%20da%20Mobilidade-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8)
![DrizzleORM](https://img.shields.io/badge/DrizzleORM-0.31-C5F74F)

O **SIPPE** é uma plataforma institucional desenvolvida para a gestão, revisão e arquivamento de Planos de Ensino. O sistema visa automatizar o fluxo de trabalho entre professores, coordenadores de curso e chefia de departamento, garantindo padronização e eficiência acadêmica.

## 🚀 Principais Funcionalidades

- **Gestão de Planos de Ensino:** Criação, edição e visualização de planos com suporte a Rich Text (TipTap).
- **Fluxo de Aprovação:** Sistema de submissão e revisão em múltiplos níveis (Coordenador e Chefe).
- **Gerenciamento de Disciplinas:** Importação e sincronização de bases de dados mestres de disciplinas.
- **Arquivo Central:** Repositório histórico para consulta e gestão de planos aprovados.
- **Gestão de Usuários:** Controle de acesso baseado em cargos (Professor, Coordenador, Chefe, Administrador).
- **Importação Automática:** Suporte para importação de dados via planilhas Google Sheets e arquivos XLSX locais.

## 🛠️ Stack Tecnológica

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Interface:** [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Shadcn/UI](https://ui.shadcn.com/)
- **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/) (Neon.tech recomendado)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Autenticação:** [Better-Auth](https://www.better-auth.com/)
- **Ícones:** [Lucide React](https://lucide.dev/) e [Phosphor Icons](https://phosphoricons.com/)

## ⚙️ Configuração do Ambiente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/sippe-emb-ufsc/sippe-emb-ufsc.git
   cd studyplan-management
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env.local` baseado no `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
   Preencha as chaves necessárias (DATABASE_URL, chaves de Auth, etc).

4. **Prepare o banco de dados:**
   ```bash
   npx drizzle-kit push
   ```

5. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

## 📦 Estrutura do Projeto

- `src/app`: Rotas e páginas (Next.js App Router).
- `src/components`: Componentes de UI padronizados e tabelas enterprise.
- `src/db`: Esquemas de banco de dados e configuração do Drizzle.
- `src/hooks`: Hooks customizados (tabelas, autenticação).
- `src/lib`: Utilitários e configurações de terceiros (auth, swal, etc).

## 📄 Licença

Este projeto é de uso restrito institucional do Departamento de Engenharia da Mobilidade - UFSC.

---
Desenvolvido por [Abdeel Fernandes da Cruz](https://github.com/alladinz)
