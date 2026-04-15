import { useState, useCallback, useEffect, useRef } from 'react';
import type { Artwork, MuseumId } from '../types/artwork';
import { fetchBoostedArtworks } from '../lib/api';
import { adapters } from '../lib/museums/registry';
import { getEraName } from './useTimeMachine';

export type QuizMode = 'artist' | 'era' | 'which-first';

export interface PeriodFilter {
  label: string;
  start: number;
  end: number;
}

export const PERIOD_FILTERS: PeriodFilter[] = [
  { label: 'Pre-1600', start: -3000, end: 1599 },
  { label: '1600–1850', start: 1600, end: 1850 },
  { label: '1850–1950', start: 1850, end: 1950 },
  { label: 'Post-1950', start: 1950, end: 2030 },
];

interface BaseQuestion {
  mode: QuizMode;
}

interface MultipleChoiceQuestion extends BaseQuestion {
  mode: 'artist' | 'era';
  artwork: Artwork;
  choices: string[];
  correctIndex: number;
}

interface WhichFirstQuestion extends BaseQuestion {
  mode: 'which-first';
  artworkA: Artwork;
  artworkB: Artwork;
  correctSide: 'A' | 'B';
}

export type QuizQuestion = MultipleChoiceQuestion | WhichFirstQuestion;

interface QuizState {
  mode: QuizMode;
  periodFilter: PeriodFilter | null;
  museumFilter: MuseumId | 'all';
  question: QuizQuestion | null;
  selectedAnswer: number | null;
  score: number;
  streak: number;
  bestStreak: number;
  totalAnswered: number;
  loading: boolean;
  error: string | null;
}

const BATCH_SIZE = 8;

function getEraBracket(year: number): string {
  return getEraName(year);
}

function getEraChoices(correctEra: string): string[] {
  const allEras = [
    'Ancient World', 'Classical Antiquity', 'Medieval', 'Renaissance',
    'Baroque & Rococo', 'Neoclassicism & Romanticism', 'Impressionism',
    'Modern Art', 'Contemporary Art', '21st Century',
  ];
  const others = allEras.filter((e) => e !== correctEra);
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  return others.slice(0, 3);
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildQuestion(mode: QuizMode, pool: Artwork[]): QuizQuestion | null {
  if (pool.length < 2) return null;

  if (mode === 'which-first') {
    const candidates = pool.filter((a) => a.date_start != null);
    if (candidates.length < 2) return null;
    const [a, b] = shuffle(candidates).slice(0, 2);
    return {
      mode: 'which-first',
      artworkA: a,
      artworkB: b,
      correctSide: a.date_start! <= b.date_start! ? 'A' : 'B',
    };
  }

  if (mode === 'artist') {
    const candidates = pool.filter((a) => a.artist_title);
    if (candidates.length < 4) return null;
    const shuffled = shuffle(candidates);
    const correct = shuffled[0];
    const distractors = shuffled
      .slice(1)
      .filter((a) => a.artist_title !== correct.artist_title)
      .slice(0, 3)
      .map((a) => a.artist_title!);
    if (distractors.length < 3) return null;

    const choices = shuffle([correct.artist_title!, ...distractors]);
    return {
      mode: 'artist',
      artwork: correct,
      choices,
      correctIndex: choices.indexOf(correct.artist_title!),
    };
  }

  // era mode
  const candidates = pool.filter((a) => a.date_start != null);
  if (candidates.length < 1) return null;
  const correct = shuffle(candidates)[0];
  const correctEra = getEraBracket(correct.date_start!);
  const distractors = getEraChoices(correctEra);
  const choices = shuffle([correctEra, ...distractors]);

  return {
    mode: 'era',
    artwork: correct,
    choices,
    correctIndex: choices.indexOf(correctEra),
  };
}

async function fetchMultiMuseumPool(
  museumFilter: MuseumId | 'all',
  periodFilter: PeriodFilter | null,
): Promise<Artwork[]> {
  if (museumFilter === 'artic' || museumFilter === 'all') {
    // AIC has the best quiz data via fetchBoostedArtworks
    const dateRange = periodFilter ? { start: periodFilter.start, end: periodFilter.end } : undefined;
    const aicArtworks = await fetchBoostedArtworks(BATCH_SIZE, [], dateRange);
    // Add source fields for AIC artworks
    const withSource = aicArtworks.map((a) => ({
      ...a,
      source: 'artic' as MuseumId,
      imageUrl: a.image_id ? `https://www.artic.edu/iiif/2/${a.image_id}/full/600,/0/default.jpg` : null,
    }));

    if (museumFilter === 'artic') return withSource;

    // For "all", also fetch from other museums
    const otherAdapters = adapters.filter((a) => a.id !== 'artic');
    const otherResults = await Promise.allSettled(
      otherAdapters.map(async (adapter) => {
        const randomPage = Math.floor(Math.random() * 3) + 1;
        const result = await adapter.searchFeatured(randomPage);
        return result.artworks.filter((a) => a.artist_title && a.date_start != null && a.imageUrl);
      }),
    );

    const otherArtworks: Artwork[] = [];
    for (const r of otherResults) {
      if (r.status === 'fulfilled') {
        otherArtworks.push(...r.value);
      }
    }

    return shuffle([...withSource, ...otherArtworks]);
  }

  // Specific non-AIC museum
  const adapter = adapters.find((a) => a.id === museumFilter);
  if (!adapter) return [];

  const randomPage = Math.floor(Math.random() * 3) + 1;
  const result = periodFilter
    ? await adapter.searchCombined({ artType: 'all', timeRange: { startYear: periodFilter.start, endYear: periodFilter.end }, colorHue: null, keywords: null }, randomPage)
    : await adapter.searchFeatured(randomPage);

  return result.artworks.filter((a) => a.artist_title && a.date_start != null && a.imageUrl);
}

export function useArtQuiz() {
  const [state, setState] = useState<QuizState>({
    mode: 'artist',
    periodFilter: null,
    museumFilter: 'all',
    question: null,
    selectedAnswer: null,
    score: 0,
    streak: 0,
    bestStreak: 0,
    totalAnswered: 0,
    loading: false,
    error: null,
  });

  const nextQuestionRef = useRef<QuizQuestion | null>(null);

  const loadQuestion = useCallback(async (mode: QuizMode, museumFilter: MuseumId | 'all', periodFilter: PeriodFilter | null) => {
    setState((s) => ({ ...s, loading: true, error: null, selectedAnswer: null }));

    try {
      if (nextQuestionRef.current && nextQuestionRef.current.mode === mode) {
        const q = nextQuestionRef.current;
        nextQuestionRef.current = null;
        setState((s) => ({ ...s, question: q, loading: false }));
        // Prefetch next pool in background
        fetchMultiMuseumPool(museumFilter, periodFilter).then((pool) => {
          nextQuestionRef.current = buildQuestion(mode, pool);
        });
        return;
      }

      const pool = await fetchMultiMuseumPool(museumFilter, periodFilter);
      const question = buildQuestion(mode, pool);
      if (!question) throw new Error('Not enough artworks for this filter — try a different option');

      // Build prefetch question from the same pool (already shuffled, so it'll differ)
      nextQuestionRef.current = buildQuestion(mode, pool);

      setState((s) => ({ ...s, question, loading: false }));
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load question',
      }));
    }
  }, []);

  // Load first question
  useEffect(() => {
    loadQuestion(state.mode, state.museumFilter, state.periodFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setMode = useCallback((mode: QuizMode) => {
    nextQuestionRef.current = null;
    setState((s) => {
      const newPeriod = mode !== 'artist' ? null : s.periodFilter;
      loadQuestion(mode, s.museumFilter, newPeriod);
      return {
        ...s,
        mode,
        periodFilter: newPeriod,
        score: 0,
        streak: 0,
        totalAnswered: 0,
        question: null,
      };
    });
  }, [loadQuestion]);

  const setPeriodFilter = useCallback((filter: PeriodFilter | null) => {
    nextQuestionRef.current = null;
    setState((s) => {
      loadQuestion(s.mode, s.museumFilter, filter);
      return {
        ...s,
        periodFilter: filter,
        score: 0,
        streak: 0,
        totalAnswered: 0,
        question: null,
      };
    });
  }, [loadQuestion]);

  const setMuseumFilter = useCallback((museumId: MuseumId | 'all') => {
    nextQuestionRef.current = null;
    setState((s) => {
      loadQuestion(s.mode, museumId, s.periodFilter);
      return {
        ...s,
        museumFilter: museumId,
        score: 0,
        streak: 0,
        totalAnswered: 0,
        question: null,
      };
    });
  }, [loadQuestion]);

  const answer = useCallback((index: number) => {
    setState((s) => {
      if (s.selectedAnswer !== null || !s.question) return s;

      let isCorrect: boolean;
      if (s.question.mode === 'which-first') {
        isCorrect = (index === 0 ? 'A' : 'B') === s.question.correctSide;
      } else {
        isCorrect = index === s.question.correctIndex;
      }

      const newStreak = isCorrect ? s.streak + 1 : 0;
      return {
        ...s,
        selectedAnswer: index,
        score: s.score + (isCorrect ? 1 : 0),
        streak: newStreak,
        bestStreak: Math.max(s.bestStreak, newStreak),
        totalAnswered: s.totalAnswered + 1,
      };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    loadQuestion(state.mode, state.museumFilter, state.periodFilter);
  }, [loadQuestion, state.mode, state.museumFilter, state.periodFilter]);

  const isCorrect = (() => {
    if (state.selectedAnswer === null || !state.question) return null;
    if (state.question.mode === 'which-first') {
      return (state.selectedAnswer === 0 ? 'A' : 'B') === state.question.correctSide;
    }
    return state.selectedAnswer === state.question.correctIndex;
  })();

  return {
    ...state,
    isCorrect,
    setMode,
    setPeriodFilter,
    setMuseumFilter,
    answer,
    nextQuestion,
  };
}
