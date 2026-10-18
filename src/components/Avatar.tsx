import { useState } from 'react';
import type { Person } from '../types';
import {
  isAnimalKey,
  isImageUrl,
  getCrittersAvatarDataUri,
  avatarColorFor,
  getDeterministicAnonymousAvatar,
} from '../lib/avatar';

interface Props {
  person: Person;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ person, size = 'md', className = '' }: Props) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-7 h-7 text-xs',
    lg: 'w-[38px] h-[38px] text-sm',
    xl: 'w-14 h-14 text-xl',
  }[size];

  const ringClass = size === 'xl' ? '' : 'shadow-[0_0_0_2px_var(--ring,theme(colors.game.s1))]';

  // Determine if this is an anonymous avatar
  const rawKey =
    person.avatarKey ||
    (person.isAnonymous
      ? getDeterministicAnonymousAvatar(person.id)
      : isAnimalKey(person.avatar_url)
      ? person.avatar_url
      : null);

  const animalKey = rawKey?.trim().toLowerCase();

  // 1. Anonymous Avatar (DiceBear Critters - identical to web)
  if (animalKey && isAnimalKey(animalKey)) {
    const bg = avatarColorFor(animalKey);
    const dataUri = getCrittersAvatarDataUri(animalKey, bg);

    return (
      <span
        className={`inline-grid place-items-center rounded-full overflow-hidden flex-none select-none ${sizeClasses} ${ringClass} ${className}`}
        style={{ backgroundColor: bg }}
      >
        <img
          src={dataUri}
          alt={person.name}
          className="w-full h-full object-cover pointer-events-none select-none"
          draggable={false}
        />
      </span>
    );
  }

  // 2. Real Profile Image URL
  const avatarUrl = person.avatar_url?.trim();
  if (avatarUrl && isImageUrl(avatarUrl) && !imgError) {
    return (
      <span
        className={`inline-grid place-items-center rounded-full overflow-hidden flex-none select-none bg-[#1A1A1A] ${sizeClasses} ${ringClass} ${className}`}
      >
        <img
          src={avatarUrl}
          alt={person.name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </span>
    );
  }

  // 3. Emoji Avatar
  if (avatarUrl && !isImageUrl(avatarUrl) && avatarUrl.length <= 4) {
    return (
      <span
        className={`inline-grid place-items-center rounded-full flex-none select-none bg-[#1A1A1A] ${sizeClasses} ${ringClass} ${className}`}
      >
        <span className="leading-none">{avatarUrl}</span>
      </span>
    );
  }

  // 4. Fallback Initial Letter
  const fallbackColor = person.color || '#38C185';
  const initial = person.name?.trim() ? person.name.trim()[0].toUpperCase() : 'P';

  return (
    <span
      className={`inline-grid place-items-center rounded-full text-[#081B12] font-bold font-sans flex-none leading-none select-none ${sizeClasses} ${ringClass} ${className}`}
      style={{ backgroundColor: fallbackColor }}
    >
      {initial}
    </span>
  );
}
