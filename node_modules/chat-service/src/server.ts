import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { URL } from 'url';
import cors from 'cors';
import axios from 'axios';

const PORT = 4002;
const AI_SERVICE_URL = 'http://localhost:4004';
const VOTING_SERVICE_URL = 'http://localhost:4005';
const FIVE_MINUTES = 5 * 60 * 1000;

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
const server = http.createServer(app);

interface Room {
  clients: Set<WebSocket>;
  isAiRoom: boolean;
  history: { role: 'user' | 'assistant'; content: string }[];
  timeout: NodeJS.Timeout;
}
const rooms = new Map<string, Room>();

const wss = new WebSocketServer({ server });

const handleTimeUp = async (roomId: string) => {
  const room = rooms.get(roomId);
  if (!room) return;

  console.log(`[Chat Service]: Tempo esgotado para a sala ${roomId}.`);

  if (room.isAiRoom && room.history.length > 0) {
    try {
      console.log(`[Chat Service]: Solicitando palpite da IA para a sala ${roomId}.`);
      const response = await axios.post(`${AI_SERVICE_URL}/api/v1/guess`, {
        history: room.history,
      });
      const aiGuess = response.data.guess;
      
      console.log(`[Chat Service]: Palpite da IA recebido: '${aiGuess}'. Enviando para o voting-service.`);
      
      await axios.post(`${VOTING_SERVICE_URL}/api/v1/vote`, {
        roomId,
        guess: aiGuess,
        voterType: 'ai',
      });
      
    } catch (error: any) {
      console.error(`[Chat Service]: Erro ao processar o palpite da IA para a sala ${roomId}:`, error.message);
    }
  }

  room.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send('__TIME_UP__');
      client.close(1000, 'Tempo esgotado');
    }
  });
};

app.post('/internal/api/rooms/create', (req, res) => {
  const { roomId, isAiRoom = false } = req.body;
  if (!roomId) {
    return res.status(400).json({ error: 'roomId é obrigatório.' });
  }
  if (rooms.has(roomId)) {
    return res.status(409).json({ error: 'Sala já existe.' });
  }

  const timeout = setTimeout(() => handleTimeUp(roomId), FIVE_MINUTES);

  rooms.set(roomId, { clients: new Set(), isAiRoom, history: [], timeout });
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
    
    if (room.isAiRoom) {
      console.log(`[Chat Service]: Mensagem recebida para IA na sala ${roomId}`);
      room.history.push({ role: 'user', content: messageString });

      try {
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/v1/chat`, {
          messages: room.history,
        });
        const aiMessage = aiResponse.data.response;
        
        room.history.push({ role: 'assistant', content: aiMessage });
        
        ws.send(aiMessage);
        console.log(`[Chat Service]: Resposta da IA enviada para sala ${roomId}`);
      } catch (error: any) {
        console.error(`[Chat Service]: Erro ao chamar o AI Service: ${error.message}`);
        ws.send("Desculpe, estou com um pouco de dor de cabeça agora. Tente mais tarde.");
      }

    } else {
      room.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(messageString);
        }
      });
    }
  });

  ws.on('close', () => {
    if (room) {
      room.clients.delete(ws);
      console.log(`[Chat Service]: Cliente desconectado da sala ${roomId}. Total: ${room.clients.size}`);
      if (room.clients.size === 0) {
        clearTimeout(room.timeout);
        rooms.delete(roomId!);
        console.log(`[Chat Service]: Sala ${roomId} ficou vazia e foi removida.`);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`[Chat Service]: Serviço HTTP e WebSocket rodando na porta ${PORT}`);
});