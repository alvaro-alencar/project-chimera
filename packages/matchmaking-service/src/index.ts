import express, { Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';

const PORT = 4003;
const CHAT_SERVICE_URL = 'http://localhost:4002';
const VOTING_SERVICE_URL = 'http://localhost:4005';
const app = express();

let waitingPlayer: Response | null = null;

app.post('/find', async (req: Request, res: Response) => {
  console.log('[Matchmaking Service]: Requisição recebida!');

  // Se já houver um jogador esperando, faz o match entre humanos.
  if (waitingPlayer) {
    console.log('[Matchmaking Service]: Match Humano-Humano encontrado!');
    const localWaitingPlayer = waitingPlayer;
    waitingPlayer = null;
    const roomId = crypto.randomUUID();

    try {
      // Avisa o chat-service para criar uma sala normal
      await axios.post(`${CHAT_SERVICE_URL}/internal/api/rooms/create`, { roomId, isAiRoom: false });
      await axios.post(`${VOTING_SERVICE_URL}/internal/api/rooms/register`, { roomId, isAiRoom: false });
      localWaitingPlayer.status(200).json({ roomId });
      res.status(200).json({ roomId });
    } catch (error: any) {
      console.error("[Matchmaking Service]: Erro ao criar sala para humanos!", error.message);
      localWaitingPlayer.status(500).json({ error: 'Falha ao criar a sala de chat.' });
      res.status(500).json({ error: 'Falha ao criar a sala de chat.' });
    }
  } else {
    // 50% de chance de jogar com a IA imediatamente
    const playWithAi = Math.random() < 0.5;
    if (playWithAi) {
      console.log('[Matchmaking Service]: Iniciando partida contra IA.');
      const roomId = crypto.randomUUID();
      try {
        await axios.post(`${CHAT_SERVICE_URL}/internal/api/rooms/create`, { roomId, isAiRoom: true });
        await axios.post(`${VOTING_SERVICE_URL}/internal/api/rooms/register`, { roomId, isAiRoom: true });
        res.status(200).json({ roomId });
      } catch (error: any) {
        console.error("[Matchmaking Service]: Erro ao criar sala para IA!", error.message);
        res.status(500).json({ error: 'Falha ao criar a sala de chat.' });
      }
    } else {
      // Caso contrário, adiciona ao lobby e espera por outro humano.
      console.log('[Matchmaking Service]: Adicionando jogador ao lobby para partida Humano-Humano.');
      waitingPlayer = res;

      req.on('close', () => {
        if (waitingPlayer === res) {
          waitingPlayer = null;
          console.log('[Matchmaking Service]: Jogador em espera desconectou.');
        }
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`[Matchmaking Service]: Serviço rodando na porta ${PORT}`);
});