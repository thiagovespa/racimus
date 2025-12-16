# Racimus

**Sistema de Gestão de Matrizes RACI**

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/thiagovespas-projects/racimus)

## 🐝 Sobre o Projeto

Racimus é uma aplicação web desenvolvida pela **Vesparium** para criar, gerenciar e visualizar Matrizes RACI (Responsável, Aprovador, Consultado, Informado). A ferramenta facilita a definição clara de papéis e responsabilidades em projetos e processos.

### Funcionalidades Principais

- ✨ Criação interativa de matrizes RACI com wizard guiado
- 🎯 Múltiplas atribuições por pessoa (ex: Consultado + Informado)
- 📊 Painel de carga de trabalho com visualizações gráficas
- 📤 Exportação em PNG, PDF, Excel e JSON
- 🌍 Suporte multilíngue (Português, Inglês, Espanhol)
- 🎨 Modo claro e escuro
- 📱 Interface responsiva e mobile-friendly
- 🎬 Modo de apresentação profissional
- 💾 Armazenamento local no navegador

## 🚀 Tecnologias

- **Next.js 16** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS v4** - Estilização utility-first
- **Supabase** - Banco de dados PostgreSQL e autenticação
- **Recharts** - Visualizações de dados
- **shadcn/ui** - Componentes UI acessíveis

## 🛠️ Desenvolvimento

### Instalação

```bash
npm install
```

### Executar localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

### Build para produção

```bash
npm run build
npm start
```

## 📝 Conventional Commits

Este projeto usa [Conventional Commits](https://www.conventionalcommits.org/) para mensagens de commit padronizadas. Veja [CONTRIBUTING.md](./CONTRIBUTING.md) para detalhes sobre:

- Tipos de commit (feat, fix, docs, etc.)
- Escopos disponíveis
- Como criar releases com notes automáticas

### Exemplo

```bash
feat(matrix): permitir múltiplas atribuições RACI por pessoa
fix(export): corrigir URL do branding para racim.us
docs: adicionar guia de conventional commits
```

## 🔄 Releases

Para criar uma nova release:

```bash
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
```

O GitHub Actions irá automaticamente gerar as release notes categorizadas.

## 🌐 Deploy

O projeto está hospedado na Vercel:

**[https://racim.us](https://racim.us)**

## 📄 Licença

© 2025 Vesparium. Todos os direitos reservados.

## 🤝 Contato

Desenvolvido por [Vesparium](https://racim.us)
