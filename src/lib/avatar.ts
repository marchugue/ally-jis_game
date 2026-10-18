import { Style, Avatar as DiceBearAvatar } from '@dicebear/core';
import critters from '@dicebear/styles/critters.json';

const crittersStyle = new Style(critters as any);

// In-memory data URI cache for instant lookups
const dataUriCache = new Map<string, string>();

export const ANIMAL_KEYS = [
  'fox',
  'wolf',
  'whale',
  'owl',
  'panda',
  'otter',
  'falcon',
  'koala',
  'lynx',
  'dolphin',
  'raven',
  'badger',
] as const;

export const AVATAR_COLORS = ['#1A6B3C', '#3B8C7E', '#B8860B', '#6B5B95', '#C0654B', '#3B6E8C'];

export function avatarColorFor(avatarKey: string | null | undefined): string {
  if (!avatarKey) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < avatarKey.length; i++) {
    hash = (hash * 31 + avatarKey.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[hash];
}

export function getDeterministicAnonymousAvatar(userId?: string | null): string {
  if (!userId) return 'fox';
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return ANIMAL_KEYS[hash % ANIMAL_KEYS.length];
}

export function isAnimalKey(value?: string | null): boolean {
  if (!value) return false;
  return (ANIMAL_KEYS as readonly string[]).includes(value.trim().toLowerCase());
}

export function getCrittersAvatarDataUri(
  seed?: string | null,
  customBg?: string | null,
  size?: number
): string {
  const safeSeed = seed?.trim().toLowerCase() || 'ally';
  const color = customBg || avatarColorFor(seed);
  const bgHex = color.replace(/^#/, '');
  const cacheKey = `${safeSeed}:${bgHex}:${size || 'auto'}`;

  const cached = dataUriCache.get(cacheKey);
  if (cached) return cached;

  try {
    const avatar = new DiceBearAvatar(crittersStyle, {
      seed: safeSeed,
      backgroundColor: [bgHex],
      borderRadius: 50,
      ...(size ? { size } : {}),
    });
    const uri = avatar.toDataUri();
    dataUriCache.set(cacheKey, uri);
    return uri;
  } catch {
    const fallback = `https://api.dicebear.com/10.x/critters/svg?seed=${encodeURIComponent(
      safeSeed
    )}&backgroundColor=${bgHex}&radius=50`;
    dataUriCache.set(cacheKey, fallback);
    return fallback;
  }
}

export function isImageUrl(value?: string | null): boolean {
  if (!value) return false;
  const v = value.trim();
  return (
    v.startsWith('http://') ||
    v.startsWith('https://') ||
    v.startsWith('data:image') ||
    v.startsWith('blob:') ||
    v.startsWith('/') ||
    /\.(png|jpe?g|webp|gif|svg|avif)($|\?)/i.test(v)
  );
}
