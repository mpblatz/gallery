import type { QuizMode } from '../../hooks/useArtQuiz';
import { useArtQuiz, PERIOD_FILTERS } from '../../hooks/useArtQuiz';
import { QuizQuestion } from './QuizQuestion';
import { QuizScoreboard } from './QuizScoreboard';
import { LoadingSpinner } from '../LoadingSpinner';
import { museumOptions } from '../../lib/museums/registry';
import type { MuseumId } from '../../types/artwork';

const MODES: { id: QuizMode; label: string }[] = [
  { id: 'artist', label: 'Guess the Artist' },
  { id: 'era', label: 'Guess the Era' },
  { id: 'which-first', label: 'Which Came First?' },
];

export function QuizView() {
  const quiz = useArtQuiz();

  return (
    <div className="px-4 py-6">
      {/* Mode selector */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => quiz.setMode(m.id)}
            className="px-4 py-1.5 text-xs font-medium transition-colors cursor-pointer"
            style={
              quiz.mode === m.id
                ? {
                    background: 'var(--accent)',
                    color: '#fff',
                    borderRadius: '8px',
                    border: 'none',
                  }
                : {
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.5)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }
            }
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={quiz.museumFilter}
          onChange={(e) => quiz.setMuseumFilter(e.target.value as MuseumId | 'all')}
          className="text-[11px] font-medium rounded-lg px-3 py-1.5 cursor-pointer outline-none"
          style={{
            background: 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.1)',
            appearance: 'none',
            WebkitAppearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(255,255,255,0.4)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
            paddingRight: '24px',
          }}
        >
          {museumOptions.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        {quiz.mode === 'artist' && (
          <select
            value={quiz.periodFilter?.label ?? 'all'}
            onChange={(e) => {
              if (e.target.value === 'all') {
                quiz.setPeriodFilter(null);
              } else {
                const pf = PERIOD_FILTERS.find((p) => p.label === e.target.value);
                if (pf) quiz.setPeriodFilter(pf);
              }
            }}
            className="text-[11px] font-medium rounded-lg px-3 py-1.5 cursor-pointer outline-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.1)',
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(255,255,255,0.4)'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              paddingRight: '24px',
            }}
          >
            <option value="all">All Periods</option>
            {PERIOD_FILTERS.map((pf) => (
              <option key={pf.label} value={pf.label}>{pf.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Scoreboard */}
      <div className="mb-6">
        <QuizScoreboard
          score={quiz.score}
          totalAnswered={quiz.totalAnswered}
          streak={quiz.streak}
          bestStreak={quiz.bestStreak}
        />
      </div>

      {/* Question area */}
      {quiz.loading && <LoadingSpinner />}

      {quiz.error && (
        <div
          className="p-4 text-xs"
          style={{
            background: 'rgba(220, 38, 38, 0.1)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            borderRadius: '8px',
            color: '#f87171',
          }}
        >
          {quiz.error}
          <button
            onClick={quiz.nextQuestion}
            className="ml-2 underline cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {quiz.question && !quiz.loading && (
        <>
          <QuizQuestion
            question={quiz.question}
            selectedAnswer={quiz.selectedAnswer}
            onAnswer={quiz.answer}
          />

          {/* Feedback + Next */}
          {quiz.selectedAnswer !== null && (
            <div className="mt-6 text-center">
              <p
                className="mb-3 text-sm font-bold"
                style={{ color: quiz.isCorrect ? '#34d399' : '#f87171' }}
              >
                {quiz.isCorrect ? 'Correct!' : 'Wrong!'}
                {quiz.isCorrect && quiz.streak > 1 && (
                  <span className="ml-2 text-xs font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {quiz.streak} in a row
                  </span>
                )}
              </p>
              <button
                onClick={quiz.nextQuestion}
                className="px-6 py-2 text-xs font-semibold transition-colors cursor-pointer"
                style={{
                  background: 'var(--accent)',
                  color: '#fff',
                  borderRadius: '10px',
                  border: 'none',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
              >
                Next Question
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
