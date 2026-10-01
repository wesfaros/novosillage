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

## 4. Conformidade Visual e Anti-Slop
* [x] Sem sidebars ou navigation rails não autorizadas.
* [x] Barra flutuante inferior centralizada (`FloatingBottomBar`) com 3 grupos lógicos.
* [x] Tipografia Sora e Inter aplicadas.
* [x] Zero gráficos falsos, zero conversas falsas, zero QR codes mockados.
