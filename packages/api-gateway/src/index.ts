import express from 'express';
import http from 'http';
import axios from 'axios';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors'; // Importamos o cors

const PORT = 4001;
const app = express();
const server = http.createServer(app);

// --- INÍCIO DA CORREÇÃO ---
// Habilita o CORS, permitindo que o frontend na porta 3000 se comunique conosco.
app.use(cors({ origin: 'http://localhost:3000' }));
// --- FIM DA CORREÇÃO ---

const MATCHMAKING_SERVICE_URL = 'http://localhost:4003';
const CHAT_SERVICE_URL = 'http://localhost:4002';

// Proxy para requisições HTTP
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

// Proxy para WebSockets
app.use('/ws', createProxyMiddleware({
  target: CHAT_SERVICE_URL,
  ws: true,
  pathRewrite: {
    '^/ws': '', 
  },
}));

server.listen(PORT, () => {
  console.log(`[API Gateway]: Serviço HTTP e WS Proxy rodando na porta ${PORT}`);
});