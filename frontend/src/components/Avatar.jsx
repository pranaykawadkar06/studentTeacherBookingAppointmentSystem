import { initials } from '../utils/formatters';

export default function Avatar({ name, src, size = 'h-12 w-12 text-base' }) {
  if (src) return <img src={src} alt="" className={`${size} rounded-full object-cover`} referrerPolicy="no-referrer" />;
  return (
    <span aria-hidden="true" className={`${size} flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700`}>
      {initials(name)}
    </span>
  );
}
