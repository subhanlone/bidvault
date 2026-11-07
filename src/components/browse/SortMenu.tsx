import { useId } from 'react';
import { BROWSE_SORTS, type BrowseSort } from '../../utils/browseParams';

/** The seven orders the server can give the results in. */
export default function SortMenu({ value, onChange }: { value: BrowseSort; onChange: (sort: BrowseSort) => void }) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-[13px] text-muted">Sort</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as BrowseSort)}
        className="bg-surface border border-border-medium h-[36px] px-2.5 rounded-lg text-[13px] text-secondary outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
      >
        {BROWSE_SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
    </div>
  );
}
