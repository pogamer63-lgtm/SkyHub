'use client';

interface AvatarImageProps {
  src: string;
  uuid: string;
  username: string;
}

export default function AvatarImage({ src, uuid, username }: AvatarImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${username}'s avatar`}
      width={80}
      height={80}
      className="rounded-xl border border-white/10"
      onError={(e) => {
        const img = e.currentTarget;
        if (!img.dataset.fallback) {
          img.dataset.fallback = '1';
          img.src = `https://crafatar.com/avatars/${uuid.replace(/-/g, '')}?size=80&overlay=true`;
        } else {
          img.style.display = 'none';
        }
      }}
    />
  );
}
