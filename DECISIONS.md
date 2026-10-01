# SILLÁGE — Registro de Decisões Arquiteturais (ADR)

## ADR 001: Padrão de Navegação por Barra Flutuante Inferior
* **Status**: Aprovado e implementado na Etapa 1.
* **Contexto**: A navegação tradicional de sistemas SaaS recorre a sidebars pesadas ou navbars superiores com excesso de itens, que consomem espaço de tela útil e criam ruído visual para operadores de alta intensidade.
* **Decisão**: Adotar uma barra de controle flutuante fixada próxima à base da tela (`FloatingBottomBar`), dividida explicitamente em três blocos funcionais: Operação Central, Second (IA) e Flows (Automação).
* **Consequências**: Foco total no conteúdo operacional, maior eficiência espacial e ergonomia visual superior.

## ADR 002: Distinção Visual do Second e do Flows
* **Status**: Aprovado.
* **Contexto**: Second e Flows são os pilares de automação e inteligência do Silláge, diferenciando o produto de um CRM estático tradicional.
* **Decisão**: Second e Flows recebem tratamentos visuais destacados e posições próprias e identificáveis na barra de navegação, mantendo separação dos itens convencionais da Operação.

## ADR 003: Postura Estrita contra Dados e Simulações Falsas (Anti-Slop)
* **Status**: Aprovado.
* **Contexto**: Protótipos frequentemente caem na armadilha de simular conversas, QR codes falsos e gráficos inventados, o que prejudica a confiança e mascara o desenvolvimento real do backend.
* **Decisão**: Não renderizar dados falsos, conversas simuladas, métricas forjadas ou componentes inacabados disfarçados de prontos. Módulos não implementados apresentam estados vazios honestos, elegantes e funcionais.

## ADR 004: Baileys Server-Side com Multi-File Auth e Versão Dinâmica
* **Status**: Aprovado e implementado na Etapa 2.
* **Contexto**: A integração WhatsApp Web não oficial via Baileys necessita de conexão WebSocket persistente e sofre rejeição (código HTTP 405) caso utilize versões obsoletas ou seja executada no navegador.
* **Decisão**: Executar Baileys estritamente no Node.js (`server.ts`), utilizando `useMultiFileAuthState` persistido em disco (`data/sessions/{accountId}`), busca dinâmica de versão do WhatsApp Web (`fetchLatestWaWebVersion`) e emulação de navegador Ubuntu/Chrome reconhecida pelos servidores oficiais do WhatsApp.
* **Consequências**: Geração criptográfica real de QR Code, manutenção da sessão após reinicialização do servidor e total isolamento das credenciais fora do alcance do cliente.

## ADR 005: Transmissão em Tempo Real via Server-Sent Events (SSE)
* **Status**: Aprovado e implementado na Etapa 2.
* **Contexto**: O cliente precisa reagir imediatamente à emissão do QR Code, leitura pelo aparelho, confirmação de conexão e quedas sem sobrecarregar o servidor com polling HTTP agressivo.
* **Decisão**: Implementar endpoint SSE `/api/whatsapp/events` integrado a um EventEmitter centralizado no `WhatsAppConnectionManager`.
* **Consequências**: Latência zero para atualização de estado na interface, reconexão transparente suportada nativamente pelo navegador e ausência de overhead de polling.
