# Robusty CRM — Plataforma de Gestão Comercial e Operacional

[![Deploy to GitHub Pages](https://github.com/nunovisk-ai/robusty/actions/workflows/deploy.yml/badge.svg)](https://github.com/nunovisk-ai/robusty/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Demo-GitHub%20Pages-orange)](https://nunovisk-ai.github.io/robusty/)

Sistema centralizado desenvolvido sob medida para a **Robusty**, fabricante especializada em bagageiros automotivos e acessórios de alta resistência para veículos utilitários (Kombi, Fiorino, Nova Kangoo, Doblo, Jumpy/Expert/Scudo, Ducato e Saveiro).

🔗 **Link de Validação ao Vivo (GitHub Pages):**  
👉 **[https://nunovisk-ai.github.io/robusty/](https://nunovisk-ai.github.io/robusty/)**

---

## 📌 Estratégia de Desenvolvimento e Hospedagem

1. **Fase Atual (Desenvolvimento & Validação Contínua):**
   - O código é versionado e construído aqui no GitHub.
   - Cada commit no branch `main` dispara o workflow do GitHub Actions que atualiza automaticamente o link de validação no GitHub Pages.
2. **Fase de Produção (Migração para VPS Robusty):**
   - A aplicação é 100% containerizável (Docker + Nginx) e preparada para migração direta para a VPS própria da Robusty com domínio oficial (ex: `crm.robusty.com.br`).

---

## 🚀 Funcionalidades Principais Implementadas (Sprint 1)

### 1. Catálogo Oficial de Produtos (Tabela Fev/2026)
- Todos os modelos e acessórios oficiais cadastrados com regras estritas de compatibilidade veicular:
  - **Volkswagen Kombi:** MX 100 Plus (Aba Dupla), MX 200 Plus (Aba Lateral), MX 80 Plus, MX 50 Plus, escadas, ventosas, suportes de estepe, toldo (comum e Leroy), barras solares e decks de madeira modulares.
  - **Renault Kangoo & Nova Kangoo:** KX 100, KX 200 e KX 200 Nova (com alertas técnicos de restrição de rolete).
  - **Fiat Fiorino & Doblo Cargo:** FX 100, FX 200, DX 100, DX 200 com taxa padrão de instalação de R$ 200,00.
  - **PSA Linha K0 (Jumpy / Expert / Scudo):** MX 120, Aba Dupla, Extreme (3,30m), decks e suportes de escada com rolete.
  - **Fiat Ducato Max Cargo & VW Saveiro:** Cabine Simples, Cabine Dupla e Guia de Rolete Especial Saveiro.
- **Matriz de Preços Oficial:**
  - 10x sem juros (Preço Tabela)
  - À vista no boleto (5% de desconto)
  - PIX (10% de desconto máximo)
  - Serviços especializados (rebite com forração R$ 340, toldo Leroy R$ 170, climatizador R$ 140, zincagem R$ 390).

### 2. Construtor de Orçamento com Regra de Dependência Veicular
- Ao selecionar um veículo, a interface filtra **apenas os bagageiros e acessórios compatíveis**.
- Integração de busca automática de endereço por CEP (**BrasilAPI / ViaCEP**), obrigatória para entrega via Transportadora.
- Campo de inserção de frete cotado por Igor.
- Trava de desconto comercial manual entre 0% e 10%.
- Botão para **"Copiar Proposta Formatada para WhatsApp"** pronto para Norlando colar na conversa com o cliente.

### 3. Funil de Vendas CRM (Kanban Norlando)
- Acompanhamento das etapas comerciais do lead inbound: *Novo Lead ➔ Qualificação ➔ Cotação Frete (Igor) ➔ Orçamento Enviado ➔ Em Negociação ➔ Aguardando Pagamento ➔ Venda Ganha*.
- Conversão com 1 clique de uma **Venda Ganha** em **Pedido Operacional**.

### 4. Funil Operacional de Pedidos (Igor & Loja)
- Mapeamento exato do fluxo operacional da Robusty:
  - **Caminho A (Transportadora):** Igor coordena coleta, alinha preparação na loja e anexa NF-e.
  - **Caminho B (Instalação na Loja):** Loja organiza fila de preparação e executa a instalação física.
  - Controle de emissão de Nota Fiscal quando solicitada pelo cliente.

### 5. Agenda Interna de Instalações
- Calendário com slots de horário diários (segunda a sexta).
- **Validação de capacidade de 1 baia exclusiva por vez**, impedindo no frontend e no banco agendamentos sobrepostos.

---

## 🗄️ Banco de Dados Supabase (PostgreSQL 16)

O banco de dados oficial está provisionado no Supabase:
- **Project URL:** `https://mcthzfppvzfjbiothycs.supabase.co`
- **Publishable Key:** `sb_publishable_M392arFdTtMCD2fJ6mlg7g_hkCzzA5H`

### Como Rodar a Migração das Tabelas e do Catálogo:
1. Acesse o **SQL Editor** do projeto:  
   👉 [https://supabase.com/dashboard/project/mcthzfppvzfjbiothycs/sql](https://supabase.com/dashboard/project/mcthzfppvzfjbiothycs/sql)
2. Abra o arquivo de migração gerado:  
   `supabase/migrations/20260216_initial_schema.sql`
3. Cole o conteúdo no editor e clique em **RUN**. Ele criará todas as tabelas, RLS e carregará os dados iniciais.

---

## 💻 Como Rodar Localmente

```bash
# 1. Clonar repositório
git clone https://github.com/nunovisk-ai/robusty.git
cd robusty

# 2. Instalar dependências
npm install

# 3. Executar servidor de desenvolvimento
npm run dev

# 4. Compilar para produção
npm run build
```

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React
- **Backend & Database:** Supabase (PostgreSQL 16, Supabase Auth, Storage)
- **APIs Externas:** BrasilAPI & ViaCEP (Consulta de CEP)
- **CI/CD:** GitHub Actions (Deploy automatizado no GitHub Pages)
