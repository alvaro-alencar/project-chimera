'use client';

export type Guess = 'human' | 'ai';

export interface Stats {
  totalVotes: number;
  correctGuesses: number;
  accuracy: number;
}

interface GuessFormProps {
  onGuess: (guess: Guess) => void;
  stats: Stats | null;
  onRestart: () => void;
}

export function GuessForm({ onGuess, stats, onRestart }: GuessFormProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      {stats ? (
        <>
          <p>Voto registrado!</p>
          <p>Total de votos: {stats.totalVotes}</p>
          <p>Acertos: {stats.correctGuesses}</p>
          <p>Precisão: {(stats.accuracy * 100).toFixed(1)}%</p>
          <button onClick={onRestart} style={{ marginTop: '1rem' }}>
            Voltar ao Lobby
          </button>
        </>
      ) : (
        <>
          <p>Com quem você conversou?</p>
          <button onClick={() => onGuess('human')} style={{ marginRight: '1rem' }}>
            Humano
          </button>
          <button onClick={() => onGuess('ai')}>IA</button>
        </>
      )}
    </div>
  );
}
