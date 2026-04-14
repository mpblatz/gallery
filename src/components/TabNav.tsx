interface Tab {
  id: string;
  label: string;
}

interface Props {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabNav({ tabs, activeTab, onTabChange }: Props) {
  return (
    <nav className="flex gap-1 mt-3">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          style={
            activeTab === tab.id
              ? { background: 'var(--accent)', color: '#fff' }
              : { background: 'transparent', color: 'var(--text-muted)' }
          }
          onMouseEnter={(e) => {
            if (activeTab !== tab.id) {
              (e.currentTarget as HTMLElement).style.color = 'var(--text)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== tab.id) {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
            }
          }}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
