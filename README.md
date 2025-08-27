
Project Chimera 🧪

> Project Chimera é um jogo de Teste de Turing interativo, onde os jogadores são desafiados a descobrir se estão conversando com outro humano ou com uma Inteligência Artificial.
> 
Esta aplicação web full-stack explora a linha tênue entre a comunicação humana e a gerada por IA através de um jogo social em tempo real. Os jogadores participam de chats anônimos de 5 minutos e, ao final, votam e recebem estatísticas de acurácia.
<br>
✨ Funcionalidades Principais
 * Chat em Tempo Real: Comunicação de baixa latência usando WebSockets.
 * Matchmaking Inteligente: Sistema que pareia jogadores H-H (Humano vs. Humano) ou H-IA (Humano vs. IA).
 * Integração com IA: Utiliza a API da DeepSeek para gerar conversas naturais e para analisar o histórico e tentar adivinhar se o interlocutor era humano.
 * Sessões Cronometradas: Partidas com duração de 5 minutos para manter o jogo dinâmico.
 * Sistema de Votação e Estatísticas: Coleta votos dos jogadores (e da IA) e calcula a acurácia geral.
🏛️ Arquitetura e Stack Tecnológica
O projeto é construído com uma arquitetura de microsserviços dentro de um monorepo gerenciado com Turborepo. Essa abordagem poliglota aproveita o melhor de cada ecossistema: TypeScript/Node.js para operações de alta concorrência e I/O, e Python para serviços de IA.

graph TD
    subgraph "Navegador do Usuário"
        A[Frontend - Next.js]
    end

    subgraph "Servidores"
        B[API Gateway - Express]
        C[Matchmaking Service - Node.js]
        D[Chat Service (WebSocket) - Node.js]
        E[Voting Service - Python/FastAPI]
        F[AI Service - Python/FastAPI]
    end
    
    subgraph "Serviço Externo"
        G[API DeepSeek]
    end

    A -- HTTP/WebSocket --> B
    B -- HTTP --> C
    B -- WebSocket --> D
    B -- HTTP --> E
    
    C -- Interno --> D & E
    D -- Interno --> F
    D -- Interno --> E

    F -- API Call --> G

 * Monorepo:
   * Turborepo: Orquestrador de build e desenvolvimento para o monorepo.
 * Frontend (/packages/frontend):
   * Next.js: Framework React para renderização no servidor e cliente.
   * React: Biblioteca para construção da interface.
   * TypeScript: Tipagem estática para o JavaScript.
   * CSS Modules: Estilos com escopo local.
 * Backend (Microsserviços em /packages):
   * api-gateway (Node.js): Ponto de entrada único. Roteia requisições HTTP e faz proxy de conexões WebSocket.
     * Express.js, http-proxy-middleware
   * chat-service (Node.js): Gerencia as salas de chat, conexões WebSocket e a lógica de tempo da partida.
     * ws (WebSocket), Express.js
   * matchmaking-service (Node.js): Fila de espera e lógica para parear jogadores.
     * Express.js
   * ai-service (Python): Integração com a API da DeepSeek para gerar respostas e palpites.
     * FastAPI, Uvicorn
   * voting-service (Python): Recebe os votos, processa os resultados e calcula as estatísticas.
     * FastAPI, Uvicorn
🚀 Como Executar Localmente
Siga os passos abaixo para configurar e rodar o projeto em seu ambiente de desenvolvimento.
Pré-requisitos
 * Node.js (v20.x ou superior)
 * Python (v3.10 ou superior)
 * npm (geralmente instalado com o Node.js)
 * Uma chave de API da DeepSeek.
Instalação e Configuração
 * Clone o repositório:
   git clone https://github.com/alvaro-alencar/project-chimera.git
cd project-chimera

 * Instale as dependências:
   O npm install na raiz instalará as dependências de todos os pacotes do monorepo graças ao npm workspaces.
   npm install

 * Configure as variáveis de ambiente:
   Navegue até o serviço de IA, crie uma cópia do arquivo de exemplo .env.example e adicione sua chave de API.
   cd packages/ai-service
cp .env.example .env

   Agora, edite o arquivo .env e insira sua chave:
   # .env
DEEPSEEK_API_KEY="sua_chave_de_api_aqui"

Rodando a Aplicação
 * Inicie todos os serviços:
   Volte para a raiz do projeto e use o comando dev do Turborepo. Ele iniciará todos os serviços (frontend, api-gateway, chat-service, etc.) em modo de desenvolvimento.
   cd ../../ 
npm run dev

 * Acesse a aplicação:
   Abra seu navegador e acesse http://localhost:3000.
Pronto! A aplicação estará rodando com todos os microsserviços se comunicando.
📜 Licença
Distribuído sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

👨‍💻 Contato
Álvaro Alencar
ac.alvaro@gmail.com

Link do Projeto: https://github.com/alvaro-alencar/project-chimera
