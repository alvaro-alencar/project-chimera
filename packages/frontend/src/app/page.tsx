'use client';

import { useState, useEffect, useRef } from 'react';
import { Lobby } from '../components/Lobby';
import { ChatRoom } from '../components/ChatRoom';
import { GuessForm, Guess, Stats } from '../components/GuessForm';

type Message = {
  text: string;
  type: 'sent' | 'received';
};

export default function HomePage() {
  // --- GERENCIAMENTO DE ESTADO (Permanece aqui) ---
  const [status, setStatus] = useState('Pronto para encontrar um parceiro de conversa.');
  const [isLoading, setIsLoading] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [phase, setPhase] = useState<'lobby' | 'chat' | 'guess'>('lobby');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const ws = useRef<WebSocket | null>(null);

  // --- LÓGICA DE CONEXÃO (Permanece aqui) ---
  const connectToChat = (newRoomId: string) => {
    setStatus(`Conectando à sala ${newRoomId.substring(0, 8)}...`);
    const wsUrl = `ws://localhost:4002?roomId=${newRoomId}`;
    ws.current = new WebSocket(wsUrl);
    ws.current.onopen = () => { setStatus('Conectado!'); setRoomId(newRoomId); setIsLoading(false); setPhase('chat'); };
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
      setStatus('Erro de conexão WebSocket.'); console.error('WebSocket Error Event:', event);
      setIsLoading(false); setRoomId(null); ws.current = null; setPhase('lobby');
    };
  };

  const handleFindMatch = async () => {
    setIsLoading(true); setStatus('Procurando um parceiro...');
    setMessages([]); setStats(null);
    try {
      const response = await fetch('http://localhost:4001/api/v1/matchmaking/find', { method: 'POST' });
      if (!response.ok) { throw new Error(`Erro no matchmaking: ${response.statusText}`); }
      const data = await response.json();
      connectToChat(data.roomId);
    } catch (error) {
      setStatus('Falha ao procurar partida.'); setIsLoading(false); console.error('Matchmaking Error:', error);
    }
  };
  
  const handleSendMessage = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && inputText) {
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
        body: JSON.stringify({ roomId, guess })
      });
      const statsRes = await fetch('http://localhost:4005/api/v1/stats');
      const statsData = await statsRes.json();
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao enviar voto:', error);
    }
  };

  const handleRestart = () => {
    setPhase('lobby');
    setRoomId(null);
    setMessages([]);
    setStats(null);
    setStatus('Pronto para encontrar um parceiro de conversa.');
  };

  // Efeito para rolar a janela de chat (Permanece aqui)
  useEffect(() => {
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]);

  // --- RENDERIZAÇÃO (Agora muito mais limpa) ---
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '400px', backgroundColor: '#1e1e1e', padding: '2rem', borderRadius: '8px' }}>
        <h1 style={{ textAlign: 'center', color: '#bb86fc', marginBottom: '1rem' }}>Project Chimera</h1>
        
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