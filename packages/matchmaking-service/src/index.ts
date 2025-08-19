import express, { Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import cors from 'cors';

const PORT = 4003;
const CHAT_SERVICE_URL = 'http://localhost:4002';
const VOTING_SERVICE_URL = 'http://localhost:4005';

const app = express();
app.use(cors());
app.use(express.json());

// --- NOVAS ESTRUTURAS DE DADOS ---
// Fila de tickets de jogadores esperando
let waitingQueue: string[] = []; 
// Mapa de partidas prontas, onde a chave é o ticketId do jogador que esperava
const matches = new Map<string, { roomId: string }>();

// Rota principal para encontrar uma partida
app.post('/api/v1/matchmaking/find', async (req: Request, res: Response) => {
  console.log('[Matchmaking]: Requisição /find recebida.');

  const opponentTicketId = waitingQueue.shift(); // Pega o primeiro jogador da fila

  if (opponentTicketId) {
    // Se havia alguém esperando, cria a partida
    console.log(`[Matchmaking]: Oponente com ticket ${opponentTicketId} encontrado.`);
    const roomId = crypto.randomUUID();
    try {
      await axios.post(`${CHAT_SERVICE_URL}/internal/api/rooms/create`, { roomId, isAiRoom: false });
      await axios.post(`${VOTING_SERVICE_URL}/internal/api/rooms/register`, { roomId, isAiRoom: false });

      // Registra a partida como pronta para o jogador que esperava
      matches.set(opponentTicketId, { roomId });

      // Responde imediatamente para o jogador atual (o segundo a chegar)
      res.status(200).json({ roomId });
      console.log(`[Matchmaking]: Sala ${roomId} criada. Notificando jogador 2.`);
    } catch (error: any) {
      console.error('[Matchmaking]: Erro ao criar sala H-H.', error.message);
      res.status(500).json({ error: 'Falha ao criar sala.' });
    }
    return;
  }

  // Se não há ninguém na fila, decide entre IA ou esperar
  const playWithAi = Math.random() < 0.5;
  if (playWithAi) {
    console.log('[Matchmaking]: Nenhum jogador na fila. Sorteado para jogar com a IA.');
    const roomId = crypto.randomUUID();
    try {
      await axios.post(`${CHAT_SERVICE_URL}/internal/api/rooms/create`, { roomId, isAiRoom: true });
      await axios.post(`${VOTING_SERVICE_URL}/internal/api/rooms/register`, { roomId, isAiRoom: true });
      res.status(200).json({ roomId });
    } catch (error: any) {
      console.error('[Matchmaking]: Erro ao criar sala H-IA.', error.message);
      res.status(500).json({ error: 'Falha ao criar sala.' });
    }
  } else {
    // Adiciona o jogador à fila de espera e retorna um ticket
    const ticketId = crypto.randomUUID();
    waitingQueue.push(ticketId);
    console.log(`[Matchmaking]: Adicionando à espera com ticket ${ticketId}. Tamanho da fila: ${waitingQueue.length}`);
    res.status(202).json({ ticketId }); // 202 Accepted
  }
});

// Rota para verificar o status de um ticket
app.get('/api/v1/matchmaking/status/:ticketId', (req, res) => {
  const { ticketId } = req.params;
  
  if (matches.has(ticketId)) {
    // A partida está pronta! Envia o roomId e remove o ticket.
    const match = matches.get(ticketId)!;
    console.log(`[Matchmaking]: Match encontrado para ticket ${ticketId}. Enviando roomId.`);
    matches.delete(ticketId);
    res.status(200).json({ roomId: match.roomId });
  } else {
    // A partida ainda não está pronta.
    console.log(`[Matchmaking]: Ticket ${ticketId} ainda em espera.`);
    res.status(204).send(); // 204 No Content
  }
});

app.listen(PORT, () => {
  console.log(`[Matchmaking Service]: Serviço rodando na porta ${PORT}`);
});