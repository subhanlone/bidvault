import type { BrowseView } from '../../utils/browseParams';

const VIEWS: { value: BrowseView; label: string }[] = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
];

/** List or grid. Two buttons that say which one is on, not tabs: nothing is hidden behind either. */
export default function ViewToggle({ value, onChange }: { value: BrowseView; onChange: (view: BrowseView) => void }) {
  return (
    <div role="group" aria-label="View" className="flex">
      {VIEWS.map((v, i) => (
        <button
          key={v.value}
          type="button"
          aria-pressed={value === v.value}
          onClick={() => onChange(v.value)}
          className={`h-[36px] px-3.5 text-[13px] font-semibold border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:z-10 ${i === 0 ? 'rounded-l-lg' : 'rounded-r-lg -ml-px'} ${value === v.value ? 'bg-navy text-white border-navy' : 'bg-surface text-navy border-border-medium hover:border-navy'}`}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
