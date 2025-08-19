'use client';

import { useState, useEffect, useRef } from 'react';
import { Lobby } from '../components/Lobby';
import { ChatRoom } from '../components/ChatRoom';
import { GuessForm, Guess, Stats } from '../components/GuessForm';
import styles from './page.module.css';

type Message = {
  text: string;
  type: 'sent' | 'received';
};

export default function HomePage() {
  const [status, setStatus] = useState('Pronto para encontrar um parceiro de conversa.');
  const [isLoading, setIsLoading] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [phase, setPhase] = useState<'lobby' | 'chat' | 'guess'>('lobby');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Limpa o polling quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  const pollForMatch = (ticketId: string) => {
    // Para o polling anterior, se houver
    if (pollingInterval.current) clearInterval(pollingInterval.current);

    pollingInterval.current = setInterval(async () => {
      try {
        // Usa a porta do Gateway (4001), que repassa para o Matchmaking (4003)
        const response = await fetch(`http://localhost:4001/api/v1/matchmaking/status/${ticketId}`);
        
        if (response.status === 200) { // 200 OK = Match Encontrado
          if (pollingInterval.current) clearInterval(pollingInterval.current);
          const data = await response.json();
          connectToChat(data.roomId);
        } else if (response.status === 204) { // 204 No Content = Ainda esperando
          console.log(`Ticket ${ticketId} ainda esperando...`);
        } else { // Outro status = Erro
          if (pollingInterval.current) clearInterval(pollingInterval.current);
          setStatus('Falha ao procurar partida. Tente novamente.');
          setIsLoading(false);
        }
      } catch (error) {
        if (pollingInterval.current) clearInterval(pollingInterval.current);
        console.error('Erro no polling:', error);
        setStatus('Erro de conexão. Tente novamente.');
        setIsLoading(false);
      }
    }, 2000); // Verifica a cada 2 segundos
  };

  const handleFindMatch = async () => {
    setIsLoading(true); 
    setStatus('Procurando um parceiro...');
    setMessages([]); 
    setStats(null);
    try {
      // O Gateway precisa ser atualizado para repassar a nova rota GET também.
      const response = await fetch('http://localhost:4001/api/v1/matchmaking/find', { method: 'POST' });
      
      if (!response.ok) throw new Error(`Status: ${response.status}`);

      const data = await response.json();

      if (response.status === 200 && data.roomId) { // Match imediato com IA
        connectToChat(data.roomId);
      } else if (response.status === 202 && data.ticketId) { // Entrou na fila de espera
        pollForMatch(data.ticketId);
      }

    } catch (error) {
      setStatus('Falha ao procurar partida.'); 
      setIsLoading(false); 
      console.error('Matchmaking Error:', error);
    }
  };

  // ... (o resto do arquivo permanece o mesmo) ...

  const connectToChat = (newRoomId: string) => {
    setStatus(`Conectando à sala ${newRoomId.substring(0, 8)}...`);
    const wsUrl = `ws://localhost:4001/ws?roomId=${newRoomId}`;
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => { 
      setStatus('Conectado!'); 
      setRoomId(newRoomId); 
      setIsLoading(false); 
      setPhase('chat'); 
    };

    ws.current.onmessage = (event) => {
      if (event.data === '__TIME_UP__') {
        setStatus('Tempo esgotado! Vote abaixo.');
        setPhase('guess');
        ws.current?.close();
      } else {
        setMessages(prev => [...prev, { text: event.data, type: 'received' }]);
      }
    };

    ws.current.onclose = (event: CloseEvent) => {
      console.log('WebSocket connection closed:', event);
      setStatus(`Desconectado. Código: ${event.code}.`);
      setIsLoading(false);
      ws.current = null;
      if (phase !== 'guess') {
        setRoomId(null);
        setPhase('lobby');
      }
    };

    ws.current.onerror = (event: Event) => {
      setStatus('Erro de conexão WebSocket.'); 
      console.error('WebSocket Error Event:', event);
      setIsLoading(false); 
      setRoomId(null); 
      ws.current = null; 
      setPhase('lobby');
    };
  };
  
  const handleSendMessage = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && inputText.trim()) {
      ws.current.send(inputText);
      setMessages(prev => [...prev, { text: inputText, type: 'sent' }]);
      setInputText('');
    }
  };

  const handleGuess = async (guess: Guess) => {
    if (!roomId) return;
    try {
      await fetch('http://localhost:4005/api/v1/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, guess, voterType: 'human' })
      });
      const statsRes = await fetch('http://localhost:4005/api/v1/stats');
      const statsData = await statsRes.json();
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao enviar voto:', error);
    }
  };

  const handleRestart = () => {
    if (pollingInterval.current) clearInterval(pollingInterval.current);
    setPhase('lobby');
    setRoomId(null);
    setMessages([]);
    setStats(null);
    setStatus('Pronto para encontrar um parceiro de conversa.');
  };

  useEffect(() => {
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Project Chimera</h1>
        
        {phase === 'lobby' && (
          <Lobby
            status={status}
            isLoading={isLoading}
            onFindMatch={handleFindMatch}
          />
        )}
        {phase === 'chat' && (
          <ChatRoom
            messages={messages}
            inputText={inputText}
            setInputText={setInputText}
            onSendMessage={handleSendMessage}
          />
        )}
        {phase === 'guess' && (
          <GuessForm onGuess={handleGuess} stats={stats} onRestart={handleRestart} />
        )}
      </div>
    </main>
  );
}