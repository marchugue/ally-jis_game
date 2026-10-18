import type { Person } from '../types';

interface Props {
  person: Person;
  size?: 'md' | 'lg' | 'xl';
}

export function Avatar({ person, size = 'md' }: Props) {
  const sizeClasses = {
    md: 'w-7 h-7 text-xs shadow-[0_0_0_2px_var(--ring,theme(colors.game.s1))]',
    lg: 'w-[38px] h-[38px] text-sm shadow-[0_0_0_2px_var(--ring,theme(colors.game.s1))]',
    xl: 'w-14 h-14 text-xl shadow-none',
  }[size];

  return (
    <span
      className={`inline-grid place-items-center rounded-full text-[#17181b] font-bold font-sans flex-none leading-none select-none ${sizeClasses}`}
      style={{ backgroundColor: person.color }}
    >
      {person.name[0]}
    </span>
  );
}
