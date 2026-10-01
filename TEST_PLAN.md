# SILLÁGE — Plano de Testes

## 1. Verificações de Compilação e Sintaxe
* [x] Tipagem TypeScript estrita sem erros (`tsconfig.json` e `vite build`).
* [x] Carregamento sem conflitos de estilos via Tailwind CSS v4.
* [x] Build limpo executado sem avisos ou erros.

## 2. Testes de Navegação e Roteamento (Etapa 1)
* [x] **Início (Home)**: Carrega como tela inicial padrão.
* [x] **Grupo 1 (Operação Primária)**:
  * Clique em "WhatsApp" abre a rota `/whatsapp`.
  * Clique em "Email" abre a rota `/email` com estado vazio correspondente.
  * Botão "Retornar ao Início" nos módulos reconduz à Home.
* [x] **Grupo 1 (Operação Secundária)**:
  * Campanhas (`/campanhas`), Carteira (`/carteira`), Agenda (`/agenda`), Configurações (`/configuracoes`) acessíveis com hierarquia visual secundária.
* [x] **Grupo 2 (Second)**:
  * Botão "Second" destacado com gradiente sutil e distintivo de IA, abrindo `/second`.
* [x] **Grupo 3 (Flows)**:
  * Botão "Flows" destacado com indicador de automação e rota `/flows`.
* [x] **Histórico do Navegador**: Suporte aos botões voltar/avançar do navegador (sincronização via `popstate`).

## 3. Testes do WhatsApp Core Real (Etapa 2)
* [x] **Criação de Linha via API/UI**:
  * Requisição POST cria registro único de linha com `id` e `accountId` isolados.
* [x] **Geração de QR Code REAL**:
  * Baileys se conecta com sucesso aos servidores oficiais do WhatsApp.
  * Recebimento do payload criptográfico real de QR code (`2@...`).
  * Conversão para Data URL PNG sem simulação ou desenho inventado.
* [x] **Persistência em Disco**:
  * Metadados salvos em `data/whatsapp_lines.json`.
  * Chaves e tokens salvos em pasta isolada `data/sessions/{accountId}` via Multi-File Auth.
* [x] **Transmissão em Tempo Real (SSE)**:
  * Conexão ao stream `/api/whatsapp/events` estabelecida com sucesso.
  * Emissão de eventos `line_created`, `qr_updated`, `connection_state_changed`, `line_deleted`.
* [x] **Desconexão e Limpeza de Recursos**:
  * Desconexão voluntária encerra o socket e altera o status para `disconnected_by_user`.
  * Exclusão da linha remove registro e apaga o diretório de sessão do disco.
* [x] **Reconexão Controlada**:
  * Tentativas limitadas a 5 vezes com backoff exponencial para evitar sobrecarga de rede.

## 4. Testes da Caixa de Entrada / Inbox (Etapa 3)
* [x] **Exibição Condicional da Caixa de Entrada**:
  * Com linha conectada, a tela do WhatsApp abre automaticamente na Caixa de Entrada (`isInboxView`).
  * Com zero linhas conectadas, exibe tela limpa para adicionar linha.
* [x] **Lista de Conversas (`ChatList`)**:
  * Listagem real de conversas da linha conectada.
  * Filtro de busca por nome, número ou texto da última mensagem.
  * Estado limpo quando a linha não possui conversas registradas ("Nenhuma conversa encontrada").
  * Botão "Nova conversa" abre modal para contato direto por número telefônico.
* [x] **Histórico de Mensagens (`MessageThread`)**:
  * Carregamento do histórico de mensagens reais da conversa selecionada.
  * Balões diferenciados com timestamps e indicadores de entrega (`CheckCheck`).
  * Rolagem automática para o final ao abrir conversa ou receber nova mensagem.
* [x] **Envio de Mensagens de Texto (`MessageInput`)**:
  * Envio de mensagem pelo Baileys via endpoint `POST /api/whatsapp/lines/:lineId/chats/:chatJid/messages`.
  * Suporte a atalho `Enter` para enviar e `Shift+Enter` para quebra de linha.
  * Tratamento de erro com aviso visual caso a mensagem não possa ser enviada.
* [x] **Atualização em Tempo Real via SSE**:
  * Recebimento de mensagens em background atualiza `messages` e reordena `chats` instantaneamente.

## 5. Conformidade Visual e Anti-Slop
* [x] Sem sidebars ou navigation rails não autorizadas.
* [x] Barra flutuante inferior centralizada (`FloatingBottomBar`) mantida intacta.
* [x] Tipografia Sora e Inter aplicadas.
* [x] Zero gráficos falsos, zero conversas falsas, zero dados simulados.
