type TabsProps<T extends string> = {
  tabs: { value: T; label: string }[];
  active: T;
  onChange: (value: T) => void;
};

export function Tabs<T extends string>({ tabs, active, onChange }: TabsProps<T>) {
  return (
    <div role="tablist" className="inline-flex w-fit rounded-xl bg-graphite p-1">
      {tabs.map((tab) => {
        const selected = tab.value === active;
        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={`min-h-9 rounded-lg px-4 text-sm font-bold transition ${selected ? 'bg-black text-white shadow' : 'text-muted hover:text-white'}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
