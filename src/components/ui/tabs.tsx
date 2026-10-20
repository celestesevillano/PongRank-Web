type TabsProps<T extends string> = {
  tabs: { value: T; label: string }[];
  active: T;
  onChange: (value: T) => void;
};

export function Tabs<T extends string>({ tabs, active, onChange }: TabsProps<T>) {
  return (
    <div role="tablist" className="inline-flex rounded-xl border border-line bg-surface p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={tab.value === active}
          onClick={() => onChange(tab.value)}
          className={`rounded-lg px-4 py-1.5 text-sm font-bold ${tab.value === active ? 'bg-brand text-white' : 'text-muted hover:text-white'}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
