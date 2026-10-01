# SILLÁGE — Changelog de Desenvolvimento

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
