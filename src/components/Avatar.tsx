import type { CSSProperties } from 'react';
import type { Person } from '../types';

interface Props {
  person: Person;
  size?: 'md' | 'lg' | 'xl';
}

export function Avatar({ person, size = 'md' }: Props) {
  return (
    <span className={size === 'md' ? 'av' : `av ${size}`} style={{ '--c': person.color } as CSSProperties}>
      {person.name[0]}
    </span>
  );
}
