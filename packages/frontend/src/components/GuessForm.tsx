'use client';
import styles from './GuessForm.module.css'; // Importa o CSS Module

export type Guess = 'human' | 'ai';

export type Stats = {
  human_vs_ai: { total: number; correct: number; accuracy: number; };
  ai_vs_human: { total: number; correct: number; accuracy: number; };
  overall: { totalVotes: number; correctGuesses: number; };
} | null;

interface GuessFormProps {
  onGuess: (guess: Guess) => void;
  stats: Stats;
  onRestart: () => void;
}

export function GuessForm({ onGuess, stats, onRestart }: GuessFormProps) {
  return (
    <div className={styles.guessContainer}>
      <h2 className={styles.title}>Com quem você falou?</h2>
      
      {!stats ? (
        <div className={styles.buttonContainer}>
          <button 
            onClick={() => onGuess('human')} 
            className={`${styles.button} ${styles.humanButton}`}
          >
            Humano
          </button>
          <button 
            onClick={() => onGuess('ai')} 
            className={`${styles.button} ${styles.aiButton}`}
          >
            Inteligência Artificial
          </button>
        </div>
      ) : (
        <div>
          <h3 className={styles.statsTitle}>Estatísticas Gerais</h3>
          <div className={styles.statsContainer}>
            <div className={styles.statsBlock}>
              <h4>Humanos vs. IA</h4>
              <p>
                Acurácia: {(stats.human_vs_ai.accuracy * 100).toFixed(1)}%
              </p>
              <small>({stats.human_vs_ai.correct} acertos de {stats.human_vs_ai.total} tentativas)</small>
            </div>
            <div className={styles.statsBlock}>
              <h4>IA vs. Humanos</h4>
              <p>
                Acurácia: {(stats.ai_vs_human.accuracy * 100).toFixed(1)}%
              </p>
              <small>({stats.ai_vs_human.correct} acertos de {stats.ai_vs_human.total} tentativas)</small>
            </div>
          </div>
          <button 
            onClick={onRestart} 
            className={`${styles.button} ${styles.restartButton}`}
          >
            Jogar Novamente
          </button>
        </div>
      )}
    </div>
  );
}