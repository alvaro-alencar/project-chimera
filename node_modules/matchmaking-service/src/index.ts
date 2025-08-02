import express, { Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';

const PORT = 4003;
const CHAT_SERVICE_URL = 'http://localhost:4002'; // Endereço do nosso vizinho
const app = express();

let waitingPlayer: Response | null = null;

app.post('/find', async (req: Request, res: Response) => {
  console.log('[Matchmaking Service]: Requisição recebida para encontrar partida!');

  if (waitingPlayer) {
    console.log('[Matchmaking Service]: Match encontrado! Gerando roomId...');
    const localWaitingPlayer = waitingPlayer;
    waitingPlayer = null; // Limpa o lobby

    const roomId = crypto.randomUUID();

    try {
      // *** LÓGICA DE COMUNICAÇÃO SERVIÇO-A-SERVIÇO ***
      console.log(`[Matchmaking Service]: Informando o Chat Service para preparar a sala ${roomId}...`);
      await axios.post(`${CHAT_SERVICE_URL}/internal/api/rooms/create`, { roomId });

      // Só responde aos jogadores DEPOIS que a sala foi criada com sucesso no chat-service
      console.log(`[Matchmaking Service]: Sala preparada. Respondendo aos jogadores.`);
      localWaitingPlayer.status(200).json({ roomId });
      res.status(200).json({ roomId });

    } catch (error: any) {
      console.error("[Matchmaking Service]: Erro ao criar a sala no Chat Service!", error.message);
      // Se a criação da sala falhar, informa os jogadores e não os coloca na fila novamente.
      localWaitingPlayer.status(500).json({ error: 'Falha ao criar a sala de chat.' });
      res.status(500).json({ error: 'Falha ao criar a sala de chat.' });
    }
  } else {
    console.log('[Matchmaking Service]: Nenhum jogador na fila. Adicionando jogador ao lobby.');
    waitingPlayer = res;

    // Se o cliente que está esperando fechar a conexão, removemos ele do lobby
    req.on('close', () => {
      if (waitingPlayer === res) {
        waitingPlayer = null;
        console.log('[Matchmaking Service]: Jogador em espera desconectou. Removido do lobby.');
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`[Matchmaking Service]: Serviço rodando na porta ${PORT}`);
});