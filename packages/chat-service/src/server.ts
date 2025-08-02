import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { URL } from 'url';
import cors from 'cors';
import axios from 'axios';

const PORT = 4002;
const AI_SERVICE_URL = 'http://localhost:4004'; // Endereço do nosso cérebro

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
const server = http.createServer(app);

// Agora, a sala armazena os clientes E se é uma sala de IA
interface Room {
  clients: Set<WebSocket>;
  isAiRoom: boolean;
  history: { role: 'user' | 'assistant'; content: string }[];
}
const rooms = new Map<string, Room>();

const wss = new WebSocketServer({ server });

app.post('/internal/api/rooms/create', (req, res) => {
  const { roomId, isAiRoom = false } = req.body;
  if (!roomId) {
    return res.status(400).json({ error: 'roomId é obrigatório.' });
  }
  if (rooms.has(roomId)) {
    return res.status(409).json({ error: 'Sala já existe.' });
  }

  // Cria a sala com a informação se é de IA ou não
  rooms.set(roomId, { clients: new Set(), isAiRoom, history: [] });
  console.log(`[Chat Service]: Sala ${roomId} (IA: ${isAiRoom}) preparada.`);
  res.status(201).json({ message: 'Sala criada com sucesso.' });
});

wss.on('connection', (ws: WebSocket, req) => {
  const fullUrl = new URL(req.url || '', `http://${req.headers.host}`);
  const roomId = fullUrl.searchParams.get('roomId');
  
  if (!roomId || !rooms.has(roomId)) {
    ws.close(1008, 'Sala inválida ou não autorizada');
    return;
  }

  const room = rooms.get(roomId)!;
  room.clients.add(ws);
  console.log(`[Chat Service]: Cliente conectado à sala: ${roomId}. Total: ${room.clients.size}`);

  ws.on('message', async (message: Buffer) => {
    const messageString = message.toString('utf-8');
    
    // Se for uma sala de IA...
    if (room.isAiRoom) {
      console.log(`[Chat Service]: Mensagem recebida para IA na sala ${roomId}`);
      // Adiciona a mensagem do usuário ao histórico
      room.history.push({ role: 'user', content: messageString });

      try {
        // Chama o serviço de IA com o histórico
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/v1/chat`, {
          messages: room.history,
        });
        const aiMessage = aiResponse.data.response;
        
        // Adiciona a resposta da IA ao histórico
        room.history.push({ role: 'assistant', content: aiMessage });
        
        // Envia a resposta da IA de volta para o cliente
        ws.send(aiMessage);
        console.log(`[Chat Service]: Resposta da IA enviada para sala ${roomId}`);
      } catch (error: any) {
        console.error(`[Chat Service]: Erro ao chamar o AI Service: ${error.message}`);
        ws.send("Desculpe, estou com um pouco de dor de cabeça agora. Tente mais tarde.");
      }

    // Se for uma sala normal (Humano-Humano)...
    } else {
      // Apenas retransmite a mensagem para os outros clientes
      room.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(messageString);
        }
      });
    }
  });

  ws.on('close', () => {
    room.clients.delete(ws);
    console.log(`[Chat Service]: Cliente desconectado da sala ${roomId}. Total: ${room.clients.size}`);
    if (room.clients.size === 0) {
      rooms.delete(roomId);
      console.log(`[Chat Service]: Sala ${roomId} ficou vazia e foi removida.`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`[Chat Service]: Serviço HTTP e WebSocket rodando na porta ${PORT}`);
});