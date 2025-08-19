'use client';
import styles from './ChatRoom.module.css'; // Importa o CSS Module

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
  const isInputEmpty = inputText.trim() === '';

  return (
    <div>
      <div id="messages" className={styles.messagesContainer}>
        {messages.map((msg, index) => (
          <p 
            key={index} 
            className={`${styles.messageParagraph} ${styles[msg.type]}`}
          >
            <span className={`${styles.messageSpan} ${styles[msg.type]}`}>
              {msg.text}
            </span>
          </p>
        ))}
      </div>
      <div className={styles.inputArea}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
          className={styles.inputField}
          // --- CORREÇÃO APLICADA ---
          placeholder="Digite sua mensagem..."
          aria-label="Campo de mensagem" 
        />
        <button 
          onClick={onSendMessage} 
          disabled={isInputEmpty}
          className={styles.sendButton}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}