# SILLÁGE — Changelog de Desenvolvimento

## [0.3.0] - Etapa 3: Caixa de Entrada (Inbox) Operacional do WhatsApp

### Adicionado
- **Persistência de Conversas e Mensagens (`server/storage/whatsapp-storage.ts`)**:
  - Armazenamento em disco das conversas (`data/chats_{lineId}.json`) e histórico de mensagens (`data/messages_{lineId}.json`).
  - Ordenação automática por `updatedAt` decrescente para conversas e cronológica para mensagens.
- **Manipulação de Mensagens no Baileys (`server/services/whatsapp-manager.ts`)**:
  - Escuta em tempo real do evento `messages.upsert` com normalização de mensagens textuais e push de remetente.
  - Escuta de sincronização inicial de histórico (`messaging-history.set`) e atualizações de chats (`chats.upsert`).
  - Método `sendMessage` disparando mensagens reais de texto via Baileys com persistência e transmissão SSE (`message_upsert` e `chat_upsert`).
- **Endpoints de Caixa de Entrada (`server/routes/whatsapp-routes.ts`)**:
  - `GET /api/whatsapp/lines/:lineId/chats`: lista conversas reais da sessão conectada.
  - `GET /api/whatsapp/lines/:lineId/chats/:chatJid/messages`: histórico de mensagens da conversa.
  - `POST /api/whatsapp/lines/:lineId/chats/:chatJid/messages`: envio de nova mensagem de texto.
  - `POST /api/whatsapp/lines/:lineId/chats`: abertura de nova conversa por número/JID.
- **Hook Reativo de Caixa de Entrada (`src/hooks/useWhatsAppChat.ts`)**:
  - Gestão de estado das conversas, conversa selecionada, mensagens e escuta SSE em tempo real.
- **Componentes da Caixa de Entrada**:
  - `ChatList.tsx`: Coluna esquerda com busca por contato/número, última mensagem e estado limpo quando não há conversas.
  - `MessageThread.tsx`: Área principal com cabeçalho do contato, balões de mensagens com timestamps e confirmações de entrega.
  - `MessageInput.tsx`: Compositor de mensagens com atalhos de teclado (Enter para envio, Shift+Enter para quebra) e bloqueio de envio duplo.
  - `NewChatModal.tsx`: Modal para iniciar conversa direta digitando o telefone do contato.
- **Integração na Tela do WhatsApp (`src/pages/WhatsAppPage.tsx`)**:
  - Exibição automática da Caixa de Entrada quando há linha conectada.
  - Alternância limpa para "Gerenciar Linhas" mantendo estado e contexto.

## [0.2.0] - Etapa 2: WhatsApp Core Real (Baileys Multi-File Auth & Gerenciamento de Linhas)

### Adicionado
- **Servidor Full-Stack (`server.ts`)**: Express com proxy e middleware Vite integrado para desenvolvimento e produção.
- **Gerenciador de Conexões (`server/services/whatsapp-manager.ts`)**:
  - Instância única de socket Baileys por linha.
  - Autenticação e chaves persistidas via `useMultiFileAuthState` isoladas por `accountId` (`data/sessions/{accountId}`).
  - Detecção dinâmica de versão do WhatsApp Web (`fetchLatestWaWebVersion`) prevenindo rejeições por versão obsoleta (código 405).
  - Reconexão controlada com backoff exponencial (máximo de 5 tentativas) evitando tempestades de conexões.
  - Emissão de QR Code criptográfico REAL convertido em Data URL PNG.
  - Liberação completa de recursos e encerramento de sockets ao desconectar ou excluir linhas.
- **Armazenamento Persistente (`server/storage/whatsapp-storage.ts`)**:
  - Armazenamento em disco das linhas e metadados (`data/whatsapp_lines.json`).
  - Gerenciamento de diretórios de sessão e limpeza total após revogação/exclusão.
- **API REST e Streaming SSE (`server/routes/whatsapp-routes.ts`)**:
  - Endpoints `/api/whatsapp/lines`, `/connect`, `/disconnect` e exclusão de linha.
  - Endpoint SSE `/api/whatsapp/events` transmitindo atualizações em tempo real para os clientes conectados com keep-alive.
- **Interface de Gerenciamento de Linhas (`src/pages/WhatsAppPage.tsx`)**:
  - Visualização de linhas com métricas reais (sem dados fictícios).
  - Card de Linha operacional (`WhatsAppLineCard`) com ações de conexão, desconexão e exclusão.
  - Badge de status (`WhatsAppStatusBadge`) cobrindo os 8 estados da linha: `disconnected`, `waiting_qr`, `qr_ready`, `connecting`, `connected`, `reconnecting`, `error`, `disconnected_by_user`.
  - Modal de conexão (`ConnectLineModal`) exibindo o QR Code real gerado diretamente pelos servidores do WhatsApp, com instruções de escaneamento e identificação do número conectado.
- **Serviço de Comunicação e Hook Reativo (`src/services/whatsapp-api.ts`, `src/hooks/useWhatsAppLines.ts`)**:
  - Conexão e sincronização reativa com o servidor via Server-Sent Events.

## [0.1.0] - Etapa 1: Shell da Aplicação & Navegação Flutuante Inferior

### Adicionado
- **Configuração de Navegação Centralizada**: `src/config/navigation.ts` e `src/types/navigation.ts`.
- **Barra de Navegação Flutuante Inferior**: `src/components/navigation/FloatingBottomBar.tsx` implementando os 3 grupos lógicos oficiais:
  - Grupo 1 (Operação): Início, WhatsApp, Email como primários; Campanhas, Carteira, Agenda, Configurações como secundários.
  - Grupo 2 (Second): Identidade e destaque visual da camada de IA comercial.
  - Grupo 3 (Flows): Identidade e destaque visual do motor de automação e jornadas.
- **Identidade Visual Silláge**: Logotipo, tipografia (Sora + Inter) e paleta oficial Light (#A9E6FF, #6FCBFF, #2F8CFF, #184D9B, #F5FAFD, #162033).
- **Layout Shell**: `src/components/layout/AppShell.tsx` com topo sutil de contexto e área de visualização sem sidebars.
- **Tela Inicial (Home)**: `src/pages/HomePage.tsx` informativa, limpa e sem dados falsos.
- **Páginas de Módulos com Estados Vazios**: Módulos de WhatsApp, Email, Campanhas, Carteira, Agenda, Configurações, Second e Flows com estados transparentes e padronizados (`src/components/common/ModuleEmptyState.tsx`).
- **Documentação do Projeto**: `SILLAGE_SPEC.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `TEST_PLAN.md` e `CHANGELOG_DEV.md`.
