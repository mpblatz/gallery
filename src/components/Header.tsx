import { TabNav } from './TabNav';

const TABS = [
  { id: 'time-machine', label: 'Time Machine' },
  { id: 'quiz', label: 'Art Quiz' },
  { id: 'color-palette', label: 'Color Palette' },
];

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Header({ activeTab, onTabChange }: Props) {
  return (
    <header
      className="sticky top-0 z-10"
      style={{
        background: 'var(--card-bg)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center justify-between">
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: 'var(--text)' }}
          >
            Artic
          </h1>
        </div>
        <TabNav tabs={TABS} activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    </header>
  );
}
