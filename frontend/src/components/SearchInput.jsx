import { FiSearch } from 'react-icons/fi';

export default function SearchInput({ value, onChange, placeholder = 'Search…', label = 'Search' }) {
  return (
    <div className="relative">
      <label htmlFor="search-input" className="sr-only">
        {label}
      </label>
      <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input id="search-input" type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input pl-9" />
    </div>
  );
}
