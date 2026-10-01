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

## 4. Estado Atual (Etapa 2 — WhatsApp Core Real)
* Fundação do Shell e Barra de Navegação Central Flutuante mantidas.
* Infraestrutura REAL do WhatsApp implementada via Baileys Multi-File Auth server-side.
* Gerenciador centralizado de conexões (`WhatsAppConnectionManager`).
* Suporte a múltiplas linhas independentes com persistência local de credenciais em disco (`data/sessions/{accountId}`).
* Emissão de QR Code real criptografado gerado diretamente pelos servidores do WhatsApp Web.
* Streaming de eventos e estados em tempo real para o frontend via Server-Sent Events (SSE).
* Distinção rigorosa dos 8 estados de linha sem dados forjados.
* Desconexão limpa, reconexão controlada com backoff exponencial e exclusão de linha com limpeza de credenciais.
