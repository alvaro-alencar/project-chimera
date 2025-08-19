import express from 'express';
import http from 'http';
import axios from 'axios';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';

const PORT = 4001;
const app = express();
const server = http.createServer(app);

app.use(cors({ origin: 'http://localhost:3000' }));

const MATCHMAKING_SERVICE_URL = 'http://localhost:4003';
const CHAT_SERVICE_URL = 'http://localhost:4002';

// Função genérica de proxy para evitar repetição
const proxyRequest = (url: string) => async (req: express.Request, res: express.Response) => {
  console.log(`[API Gateway]: Repassando ${req.method} ${req.originalUrl} para ${url}`);
  try {
    const response = await axios({
      method: req.method,
      url,
      data: req.body,
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error(`[API Gateway]: Erro ao contatar ${url}:`, error.message);
    const status = error.response?.status || 500;
    const data = error.response?.data || { error: 'Erro interno do servidor.' };
    res.status(status).json(data);
  }
};

// --- ROTAS ATUALIZADAS ---
// Rota para encontrar partida
app.post('/api/v1/matchmaking/find', proxyRequest(`${MATCHMAKING_SERVICE_URL}/api/v1/matchmaking/find`));

// Nova rota para verificar o status do ticket
app.get('/api/v1/matchmaking/status/:ticketId', (req, res) => {
  const { ticketId } = req.params;
  const url = `${MATCHMAKING_SERVICE_URL}/api/v1/matchmaking/status/${ticketId}`;
  
  // Usamos um proxy manual para o long-polling
  console.log(`[API Gateway]: Repassando GET ${req.originalUrl} para ${url}`);
  axios.get(url, { responseType: 'stream' })
    .then(response => {
        res.status(response.status);
        response.data.pipe(res);
    })
    .catch(error => {
        console.error(`[API Gateway]: Erro ao contatar ${url}:`, error.message);
        const status = error.response?.status || 500;
        const data = error.response?.data || { error: 'Erro interno do servidor.' };
        res.status(status).json(data);
    });
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