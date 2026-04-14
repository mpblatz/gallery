import type { MuseumId } from '../../types/artwork';
import type { MuseumAdapter } from './types';
import { articAdapter } from './artic';
import { metAdapter } from './met';
import { clevelandAdapter } from './cleveland';
import { vaAdapter } from './va';
import { smkAdapter } from './smk';

export const adapters: MuseumAdapter[] = [
  articAdapter,
  metAdapter,
  clevelandAdapter,
  vaAdapter,
  smkAdapter,
];

export function getAdapter(id: MuseumId): MuseumAdapter {
  const adapter = adapters.find((a) => a.id === id);
  if (!adapter) throw new Error(`Unknown museum: ${id}`);
  return adapter;
}

export const museumOptions: { id: MuseumId | 'all'; name: string }[] = [
  { id: 'all', name: 'All Museums' },
  ...adapters.map((a) => ({ id: a.id, name: a.name })),
];
