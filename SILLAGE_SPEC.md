# SILLÁGE — Especificação do Produto

## 1. Visão Geral
Silláge é um CRM Conversacional Comercial com canais interligados, automação de comunicação e inteligência artificial focada em vendas e atendimento direto.

* **Público-alvo principal**: Vendedor, assistente e operador comercial com grande volume de contatos e carteira ativa.
* **Entidade Central**: A pessoa / RE (Revendedora / Cliente). Linhas telefônicas e canais são meios de comunicação e não devem fragmentar o histórico do relacionamento.

## 2. Princípios do Produto
1. **Centralização Multicanal**: WhatsApp, E-mail e futuramente SMS/VoIP em interface unificada.
2. **Histórico Vivo**: Todo o histórico de comunicação e tabulações permanece associado à pessoa, independentemente do canal ou da linha conectada.
3. **Redução de Fricção Operacional**: Menos alternância de celulares físicos e sistemas paralelos.
4. **Automação Comercial Humanizada**: Follow-ups e sequências executadas sem perder a proximidade.
5. **Inteligência Comercial Assistida**: O Second atua como copiloto e consultor de vendas, metas, campanhas e contorno de objeções.

## 3. Nomenclatura Oficial
* **CRM**: Carteira, perfil, histórico, registros, atividades e contexto comercial da RE.
* **Grupo**: Microsegmentação interna da carteira.
* **Campanha**: Fonte estruturada de contexto comercial oficial e ofertas.
* **Flow**: Jornada/execução automatizada de comunicação multicanal.
* **Second**: Inteligência artificial do Silláge.
* **Tabulação**: Registro/desfecho de uma interação comercial.
* **Linha**: Uma conta/número de WhatsApp conectado.
* **Lista de Transmissão 2.0**: Ação para um Grupo que resulta em mensagens privadas individuais utilizando a infraestrutura operacional de Flows.

## 4. Estado Atual (Etapa 3 — WhatsApp Inbox Operacional)
* Fundação do Shell e Barra de Navegação Central Flutuante mantidas.
* Infraestrutura REAL do WhatsApp implementada via Baileys Multi-File Auth server-side.
* Caixa de Entrada (Inbox) integrada e operacional ativada automaticamente quando há linha conectada.
* Layout operacional limpo de 2 colunas: Lista de Conversas (`ChatList`) à esquerda e Histórico de Mensagens com Envio (`MessageThread` + `MessageInput`) à direita.
* Envio real de mensagens de texto via Baileys com entrega ao destinatário e atualização imediata.
* Streaming de novas mensagens e atualizações de conversas via Server-Sent Events (SSE).
* Suporte à abertura de conversas diretas por telefone (`NewChatModal`).
* Alternância rápida entre Caixa de Entrada e Gerenciador de Linhas sem perda de contexto.
* Sem dados falsos (mocks): se não houver conversas, exibe estado limpo de lista vazia.
