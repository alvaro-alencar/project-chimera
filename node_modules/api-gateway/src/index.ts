import express from 'express';
import http from 'http';
import axios from 'axios';
import { createProxyMiddleware } from 'http-proxy-middleware';

const PORT = 4001;
const app = express();
const server = http.createServer(app);

// Endereços dos nossos microsserviços
const MATCHMAKING_SERVICE_URL = 'http://localhost:4003';
const CHAT_SERVICE_URL = 'http://localhost:4002';

// Proxy para requisições HTTP normais (como o matchmaking)
app.post('/api/v1/matchmaking/find', async (req, res) => {
  console.log('[API Gateway]: Recebida requisição em /api/v1/matchmaking/find. Repassando...');
  try {
    const response = await axios.post(`${MATCHMAKING_SERVICE_URL}/find`);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('[API Gateway]: Erro ao contatar o matchmaking service:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// *** CORREÇÃO: A linha 'logLevel' foi removida ***
// Proxy para WebSockets
app.use('/ws', createProxyMiddleware({
  target: CHAT_SERVICE_URL,
  ws: true, // Habilita o proxy para WebSockets
}));

// Agora, usamos o `server.listen` em vez do `app.listen` para suportar o WebSocket
server.listen(PORT, () => {
  console.log(`[API Gateway]: Serviço HTTP e WS Proxy rodando na porta ${PORT}`);
});