'use client';

import { useState, useEffect, useRef } from 'react';
import { Lobby } from '../components/Lobby'; // Importa o componente Lobby
import { ChatRoom } from '../components/ChatRoom'; // Importa o componente ChatRoom

type Message = {
  text: string;
  type: 'sent' | 'received';
};

export default function HomePage() {
  // --- GERENCIAMENTO DE ESTADO (Permanece aqui) ---
  const [status, setStatus] = useState('Pronto para encontrar um parceiro de conversa.');
  const [isLoading, setIsLoading] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const ws = useRef<WebSocket | null>(null);

  // --- LÓGICA DE CONEXÃO (Permanece aqui) ---
  const connectToChat = (newRoomId: string) => {
    setStatus(`Conectando à sala ${newRoomId.substring(0, 8)}...`);
    const wsUrl = `ws://localhost:4002?roomId=${newRoomId}`;
    ws.current = new WebSocket(wsUrl);
    ws.current.onopen = () => { setStatus('Conectado!'); setRoomId(newRoomId); setIsLoading(false); };
    ws.current.onmessage = (event) => { setMessages(prev => [...prev, { text: event.data, type: 'received' }]); };
    ws.current.onclose = (event: CloseEvent) => {
      console.log('WebSocket connection closed:', event);
      setStatus(`Desconectado. Código: ${event.code}.`);
      setIsLoading(false); setRoomId(null); ws.current = null;
    };
    ws.current.onerror = (event: Event) => {
      setStatus('Erro de conexão WebSocket.'); console.error('WebSocket Error Event:', event);
      setIsLoading(false); setRoomId(null); ws.current = null;
    };
  };

  const handleFindMatch = async () => {
    setIsLoading(true); setStatus('Procurando um parceiro...');
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
        
        {/* Lógica condicional: Se não houver roomId, mostre o Lobby. Senão, mostre a ChatRoom. */}
        {!roomId ? (
          <Lobby 
            status={status} 
            isLoading={isLoading} 
            onFindMatch={handleFindMatch} 
          />
        ) : (
          <ChatRoom 
            messages={messages}
            inputText={inputText}
            setInputText={setInputText}
            onSendMessage={handleSendMessage}
          />
        )}
      </div>
    </main>
  );
}