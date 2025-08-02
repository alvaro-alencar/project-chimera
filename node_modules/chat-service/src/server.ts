import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { URL } from 'url'; // Importa a classe URL nativa do Node.js

const PORT = 4002;

const app = express();
app.use(express.json());
const server = http.createServer(app);

const rooms = new Map<string, Set<WebSocket>>();
const wss = new WebSocketServer({ server });

app.post('/internal/api/rooms/create', (req, res) => {
  const { roomId } = req.body;
  if (!roomId) {
    return res.status(400).json({ error: 'roomId é obrigatório.' });
  }

  if (rooms.has(roomId)) {
    return res.status(409).json({ error: 'Sala já existe.' });
  }

  rooms.set(roomId, new Set());
  console.log(`[Chat Service]: Sala ${roomId} preparada e pronta para conexões via API interna.`);
  res.status(201).json({ message: 'Sala criada com sucesso.' });
});

wss.on('connection', (ws: WebSocket, req) => {
  // --- INÍCIO DA CORREÇÃO ROBUSTA ---
  // Para extrair os parâmetros de forma segura, criamos um objeto URL completo.
  // Isso funciona mesmo que req.url seja '/ws?roomId=...' ou qualquer outra variação do proxy.
  const fullUrl = new URL(req.url || '', `http://${req.headers.host}`);
  const roomId = fullUrl.searchParams.get('roomId');
  
  console.log(`[Chat Service]: Nova conexão recebida. URL: ${req.url}, RoomID extraído: ${roomId}`);
  // --- FIM DA CORREÇÃO ROBUSTA ---

  if (!roomId || !rooms.has(roomId)) {
    console.log(`[Chat Service]: Conexão rejeitada para sala inválida ou não autorizada: ${roomId}`);
    ws.close(1008, 'Sala inválida ou não autorizada');
    return;
  }

  const room = rooms.get(roomId)!;
  room.add(ws);
  console.log(`[Chat Service]: Cliente conectado à sala: ${roomId}. Total na sala: ${room.size}`);

  ws.on('message', (message: Buffer) => {
    const messageString = message.toString('utf-8');
    room.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(messageString);
      }
    });
  });

  ws.on('close', () => {
    if (room) {
      room.delete(ws);
      if (room.size === 0) {
        rooms.delete(roomId);
        console.log(`[Chat Service]: Sala ${roomId} ficou vazia e foi removida.`);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`[Chat Service]: Serviço HTTP e WebSocket rodando na porta ${PORT}`);
});