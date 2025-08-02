'use client';

// Definimos um tipo para as mensagens para reutilizá-lo
type Message = {
  text: string;
  type: 'sent' | 'received';
};

interface ChatRoomProps {
  messages: Message[];
  inputText: string;
  setInputText: (value: string) => void;
  onSendMessage: () => void;
}

export function ChatRoom({ messages, inputText, setInputText, onSendMessage }: ChatRoomProps) {
  // --- NOVA LÓGICA ---
  // Variável para determinar se o botão deve estar desabilitado.
  // Usamos .trim() para remover espaços em branco no início e no fim.
  const isInputEmpty = inputText.trim() === '';

  return (
    <div>
      <div 
        id="messages" 
        style={{ border: '1px solid #333', height: '300px', overflowY: 'auto', padding: '10px', backgroundColor: '#121212', marginBottom: '10px' }}
      >
        {messages.map((msg, index) => (
          <p key={index} style={{ textAlign: msg.type === 'sent' ? 'right' : 'left', margin: '5px' }}>
            <span style={{ 
              backgroundColor: msg.type === 'sent' ? '#6200ee' : '#373737', 
              padding: '8px 12px', 
              borderRadius: '15px', 
              display: 'inline-block' 
            }}>
              {msg.text}
            </span>
          </p>
        ))}
      </div>
      <div style={{ display: 'flex' }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
          style={{ flexGrow: 1, padding: '8px', border: 'none', backgroundColor: '#2c2c2c', color: 'white' }}
        />
        <button 
          onClick={onSendMessage} 
          // O botão é desabilitado se o input estiver vazio
          disabled={isInputEmpty}
          style={{ 
            padding: '8px', 
            border: 'none', 
            // --- ESTILO CONDICIONAL ---
            // Se estiver desabilitado, fica cinza e com cursor de "não permitido".
            // Senão, fica com a cor de destaque e cursor de ponteiro.
            backgroundColor: isInputEmpty ? '#373737' : '#03dac6',
            color: isInputEmpty ? '#a0a0a0' : '#121212',
            cursor: isInputEmpty ? 'not-allowed' : 'pointer'
          }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}