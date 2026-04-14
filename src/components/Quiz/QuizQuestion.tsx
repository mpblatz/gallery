import type { QuizQuestion as QuizQuestionType } from '../../hooks/useArtQuiz';
import type { Artwork } from '../../types/artwork';
import { getImageUrl } from '../../lib/api';

interface Props {
  question: QuizQuestionType;
  selectedAnswer: number | null;
  onAnswer: (index: number) => void;
}

function ArtworkImage({ artwork }: { artwork: Artwork }) {
  const src = artwork.imageUrl || (artwork.image_id ? getImageUrl(artwork.image_id, 600) : null);
  if (!src) return null;
  return (
    <img
      src={src}
      alt={artwork.title}
      className="max-h-80 w-full object-contain"
      style={{ background: '#0a0a0a', borderRadius: '10px' }}
      loading="eager"
    />
  );
}

function getChoiceStyle(answered: boolean, isSelected: boolean, isCorrect: boolean): React.CSSProperties {
  if (!answered) {
    return {
      background: 'rgba(255,255,255,0.05)',
      border: '2px solid rgba(255,255,255,0.1)',
      color: '#fff',
    };
  }
  if (isCorrect) {
    return {
      background: 'rgba(5, 150, 105, 0.15)',
      border: '2px solid #059669',
      color: '#34d399',
    };
  }
  if (isSelected) {
    return {
      background: 'rgba(220, 38, 38, 0.15)',
      border: '2px solid #dc2626',
      color: '#f87171',
    };
  }
  return {
    background: 'rgba(255,255,255,0.02)',
    border: '2px solid rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.3)',
  };
}

function ChoiceButton({
  label,
  index,
  selectedAnswer,
  correctIndex,
  onAnswer,
}: {
  label: string;
  index: number;
  selectedAnswer: number | null;
  correctIndex: number;
  onAnswer: (index: number) => void;
}) {
  const answered = selectedAnswer !== null;
  const isSelected = selectedAnswer === index;
  const isCorrect = index === correctIndex;

  return (
    <button
      onClick={() => onAnswer(index)}
      disabled={answered}
      className="w-full text-left text-xs font-medium transition-colors"
      style={{
        ...getChoiceStyle(answered, isSelected, isCorrect),
        padding: '10px 16px',
        borderRadius: '10px',
        cursor: answered ? 'default' : 'pointer',
      }}
    >
      {label}
    </button>
  );
}

export function QuizQuestion({ question, selectedAnswer, onAnswer }: Props) {
  if (question.mode === 'which-first') {
    const { artworkA, artworkB, correctSide } = question;
    const answered = selectedAnswer !== null;

    const getSideStyle = (side: 'A' | 'B', index: number): React.CSSProperties => {
      if (!answered) {
        return {
          border: '2px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.03)',
          cursor: 'pointer',
        };
      }
      const isCorrect = side === correctSide;
      const isSelected = selectedAnswer === index;
      if (isCorrect) return { border: '2px solid #059669', background: 'rgba(5, 150, 105, 0.1)' };
      if (isSelected) return { border: '2px solid #dc2626', background: 'rgba(220, 38, 38, 0.1)' };
      return { border: '2px solid rgba(255,255,255,0.05)', opacity: 0.5 };
    };

    return (
      <div>
        <p className="mb-4 text-center text-sm font-semibold" style={{ color: '#fff' }}>
          Which artwork came first?
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { artwork: artworkA, side: 'A' as const, index: 0 },
            { artwork: artworkB, side: 'B' as const, index: 1 },
          ].map(({ artwork, side, index }) => (
            <button
              key={artwork.id}
              onClick={() => onAnswer(index)}
              disabled={answered}
              className="p-3 transition-colors"
              style={{
                ...getSideStyle(side, index),
                borderRadius: '12px',
              }}
            >
              {(artwork.imageUrl || artwork.image_id) && (
                <ArtworkImage artwork={artwork} />
              )}
              <p className="mt-2 text-xs font-semibold truncate" style={{ color: '#fff' }}>
                {artwork.title}
              </p>
              {answered && (
                <p className="mt-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {artwork.date_display ?? artwork.date_start}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Multiple choice (artist / era)
  const { artwork, choices, correctIndex } = question;
  const prompt = question.mode === 'artist'
    ? 'Who created this artwork?'
    : 'What era is this artwork from?';

  return (
    <div>
      <p className="mb-4 text-center text-sm font-semibold" style={{ color: '#fff' }}>
        {prompt}
      </p>

      {(artwork.imageUrl || artwork.image_id) && (
        <div className="mb-4 flex justify-center">
          <ArtworkImage artwork={artwork} />
        </div>
      )}

      {selectedAnswer !== null && (
        <p className="mb-3 text-center text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
          <span className="font-semibold">{artwork.title}</span>
          {artwork.date_display && <span> ({artwork.date_display})</span>}
        </p>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {choices.map((choice, i) => (
          <ChoiceButton
            key={i}
            label={choice}
            index={i}
            selectedAnswer={selectedAnswer}
            correctIndex={correctIndex}
            onAnswer={onAnswer}
          />
        ))}
      </div>
    </div>
  );
}
