# SILLÁGE — Arquitetura e Responsabilidades

## 1. Separação de Responsabilidades

### Frontend (Client-side)
* **Framework**: React 19 com TypeScript e Tailwind CSS v4.
* **Tipografia**: Sora para títulos e marcas; Inter para leitura e interface.
* **Identidade Visual**: Paleta corporativa Light (#A9E6FF, #6FCBFF, #2F8CFF, #184D9B, #F5FAFD, #162033).
* **Navegação**: Controle central inferior flutuante (`FloatingBottomBar`), estruturado em 3 blocos:
  1. Operação (Início, WhatsApp, Email, Campanhas, Carteira, Agenda, Configurações).
  2. Second (Camada de IA comercial).
  3. Flows (Motor de sequenciamento e automação).
* **Restrições**: Sem credenciais ou regras críticas de negócio no navegador. Nenhuma barra lateral (sidebar) ou navegação rail permitida.

### Backend (Server-side)
* **Runtime**: Node.js com Express e TypeScript (`tsx server.ts`).
* **Vite Integration**: Middleware integrado de desenvolvimento com proxy transparente.
* **Canais**:
  * Baileys (`@whiskeysockets/baileys@6.7.18`) executando estritamente no servidor.
  * `WhatsAppConnectionManager`: gerenciador central de sockets ativos com suporte a múltiplas linhas simultâneas.
  * `WhatsAppStorage`: repositório de persistência de linhas em disco (`data/whatsapp_lines.json`) e pastas isoladas de sessão por `accountId` (`data/sessions/{accountId}`).
  * `Server-Sent Events (SSE)`: endpoint `/api/whatsapp/events` transmitindo atualizações em tempo real (mudança de estado, QR code gerado, pareamento, desconexão) para os clientes conectados.
* **IA**: Gemini SDK server-side (`@google/genai`) reservado para as próximas fases.
* **Persistência**: Abstração Repository/Service desacoplada da camada de apresentação.

## 2. Estrutura Modular Atual
```
server/
├── routes/
│   └── whatsapp-routes.ts  # Endpoints REST e streaming SSE (/api/whatsapp/*)
├── services/
│   └── whatsapp-manager.ts # Connection Manager centralizado, ciclo Baileys e eventos
├── storage/
│   └── whatsapp-storage.ts # Persistência de linhas e diretórios de sessão multi-file auth
└── types/
    └── whatsapp.ts         # Tipos e contratos de linha WhatsApp
src/
├── types/
│   ├── navigation.ts       # Tipos, interfaces de navegação e agrupamentos
│   └── whatsapp.ts         # Contratos e tipos da linha WhatsApp no cliente
├── config/
│   └── navigation.ts       # Configuração centralizada dos itens de menu e metadados
├── services/
│   └── whatsapp-api.ts     # Client HTTP e inscrição SSE para o backend
├── hooks/
│   ├── useWhatsAppLines.ts # Hook reativo para gerenciamento de linhas e escuta SSE
│   └── useWhatsAppChat.ts  # Hook reativo para conversas, histórico de mensagens e envio
├── components/
│   ├── brand/
│   │   └── SillageLogo.tsx # Logotipo e elemento visual do Silláge
│   ├── layout/
│   │   └── AppShell.tsx    # Layout shell, topo minimalista e ancoragem da barra
│   ├── navigation/
│   │   └── FloatingBottomBar.tsx # Barra flutuante inferior com os 3 grupos
│   ├── common/
│   │   └── ModuleEmptyState.tsx  # Estado vazio padrão para módulos em planejamento
│   └── whatsapp/
│       ├── WhatsAppStatusBadge.tsx # Badge visual para os 8 estados da linha
│       ├── WhatsAppLineCard.tsx    # Card operacional da linha com ações
│       ├── ConnectLineModal.tsx    # Modal com QR Code real, instruções e pareamento
│       ├── ChatList.tsx            # Lista de conversas com busca e indicador de mensagens
│       ├── MessageThread.tsx       # Área principal com balões e histórico da conversa
│       ├── MessageInput.tsx        # Compositor de mensagens de texto com atalhos
│       └── NewChatModal.tsx        # Modal para abertura de chat direto por número
├── pages/
│   ├── HomePage.tsx        # Tela inicial limpa com identidade e guia
│   ├── WhatsAppPage.tsx    # Caixa de Entrada (Inbox) integrada + Gestão de Linhas
│   ├── EmailPage.tsx       # Placeholder limpo do canal E-mail
│   ├── CampanhasPage.tsx   # Placeholder limpo de Campanhas
│   ├── CarteiraPage.tsx    # Placeholder limpo do CRM/Carteira
│   ├── AgendaPage.tsx      # Placeholder limpo de Agenda
│   ├── ConfiguracoesPage.tsx # Placeholder limpo de Configurações
│   ├── SecondPage.tsx      # Placeholder limpo do Second (IA)
│   └── FlowsPage.tsx       # Placeholder limpo do Flows (Automação)
├── App.tsx                 # Roteador central e sincronização de estado
├── main.tsx                # Entrypoint React
├── index.css               # Tokens de tema Tailwind v4
└── server.ts               # Servidor Express com API WhatsApp e Vite Middleware
```
