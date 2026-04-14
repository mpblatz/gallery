interface Props {
  score: number;
  totalAnswered: number;
  streak: number;
  bestStreak: number;
}

export function QuizScoreboard({ score, totalAnswered, streak, bestStreak }: Props) {
  return (
    <div
      className="flex items-center gap-6 px-4 py-3"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
      }}
    >
      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
        <span className="font-bold" style={{ color: 'var(--accent)' }}>{score}</span>
        <span>/{totalAnswered}</span>
      </div>
      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Streak: <span className="font-bold" style={{ color: '#fff' }}>{streak}</span>
      </div>
      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Best: <span className="font-bold" style={{ color: '#fff' }}>{bestStreak}</span>
      </div>
    </div>
  );
}
