'use client';

// Definimos as "props" que este componente espera receber
interface LobbyProps {
  status: string;
  isLoading: boolean;
  onFindMatch: () => void; // Uma função que será chamada no clique
}

export function Lobby({ status, isLoading, onFindMatch }: LobbyProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: '#a0a0a0', minHeight: '24px' }}>{status}</p>
      <button 
        onClick={onFindMatch} 
        disabled={isLoading} 
        style={{ width: '100%', padding: '12px', cursor: 'pointer', marginTop: '1rem' }}
      >
        {isLoading ? 'Procurando...' : 'Procurar Partida'}
      </button>
    </div>
  );
}