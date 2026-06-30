'use client';

function SvgIcon({ className = 'h-3.5 w-3.5', children }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const DogIcon = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M5 11V8.5C5 6.6 6.6 5 8.5 5H12l2-2 2 2h1.5C19.4 5 21 6.6 21 8.5V12" />
    <path d="M4 13h17" />
    <path d="M6 13v4.5A2.5 2.5 0 0 0 8.5 20h7A2.5 2.5 0 0 0 18 17.5V13" />
    <path d="M9 10h.01M15 10h.01" />
    <path d="M11 15h2" />
  </SvgIcon>
);

export const CatIcon = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M5 9 6.5 4 10 7h4l3.5-3L19 9" />
    <path d="M5 9c0 6 3 10 7 10s7-4 7-10" />
    <path d="M9 11h.01M15 11h.01" />
    <path d="M11 14h2" />
    <path d="M8 16c1.2 1 2.5 1.5 4 1.5S14.8 17 16 16" />
  </SvgIcon>
);

export const RabbitIcon = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M8 11C6 8 5.8 4 7.4 3.4c1.6-.6 3.1 3 3.4 6" />
    <path d="M13.2 9.4c.3-3 1.8-6.6 3.4-6 1.6.6 1.4 4.6-.6 7.6" />
    <path d="M6 14c0-3.3 2.7-5 6-5s6 1.7 6 5-2.7 6-6 6-6-2.7-6-6Z" />
    <path d="M9.5 14h.01M14.5 14h.01" />
    <path d="M11 17h2" />
  </SvgIcon>
);

export const BirdIcon = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M4 12c3-5 8-7 13-3" />
    <path d="M10 19c4-1 7-4.5 7-9" />
    <path d="M5 12c2 4 5.5 7 10 7" />
    <path d="M17 9l4-1-3 3" />
    <path d="M12 10h.01" />
  </SvgIcon>
);

export const PoultryIcon = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M8 8c0-2 1.4-3 3-3 .7 0 1.4.2 2 .7.2-1 .9-1.7 1.8-1.7 1.2 0 2.2 1 2.2 2.2" />
    <path d="M7 11c0-2.2 2-4 5-4s6 2.4 6 6-2.5 6-6 6-6-2.6-6-6c0-.7.1-1.3.3-1.8" />
    <path d="M18 10l3 1.2-3 1.3" />
    <path d="M11 10h.01" />
    <path d="M10 19l-1.5 2M14 19l1.5 2" />
  </SvgIcon>
);

export const FishIcon = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M3 12s4-6 10-6 8 6 8 6-2 6-8 6-10-6-10-6Z" />
    <path d="M19 9l3-3v12l-3-3" />
    <path d="M9 12h.01" />
    <path d="M12 8c1 1.2 1 6 0 8" />
  </SvgIcon>
);

export const HorseIcon = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M7 20V9l5-5 5 3v5" />
    <path d="M12 4v5l4 2" />
    <path d="M7 12h8" />
    <path d="M15 12c3 1 4 3.2 4 6v2" />
    <path d="M7 20h10" />
    <path d="M10 8h.01" />
  </SvgIcon>
);

export const ReptileIcon = ({ className }) => (
  <SvgIcon className={className}>
    <path d="M4 14c3-5 9-7 16-4" />
    <path d="M5 15c4 3 9 3.5 14 .5" />
    <path d="M8 13l-2-3M12 12l-1-4M16 12l2-3" />
    <path d="M19 10l2-1" />
    <path d="M18 11h.01" />
  </SvgIcon>
);

export const RodentIcon = ({ className }) => (
  <SvgIcon className={className}>
    <circle cx="8" cy="8" r="3" />
    <circle cx="16" cy="8" r="3" />
    <path d="M5 13c0-3.3 3-5 7-5s7 1.7 7 5-3 7-7 7-7-3.7-7-7Z" />
    <path d="M9.5 13h.01M14.5 13h.01" />
    <path d="M12 15v1" />
  </SvgIcon>
);

export const OtherAnimalIcon = ({ className }) => (
  <SvgIcon className={className}>
    <circle cx="8" cy="8" r="2.5" />
    <circle cx="16" cy="8" r="2.5" />
    <circle cx="7" cy="15" r="2.5" />
    <circle cx="17" cy="15" r="2.5" />
    <path d="M10 13c1-1.5 3-1.5 4 0l1.5 2.2c1 1.5-.1 3.3-1.9 3.3h-3.2c-1.8 0-2.9-1.8-1.9-3.3L10 13Z" />
  </SvgIcon>
);

export default function AnimalTypeIcon({ animalType, category, className = 'h-3.5 w-3.5' }) {
  const animal = String(animalType || '').toLowerCase();
  const type = String(category || '').toLowerCase();

  if (animal === 'dogs' || animal === 'dog') return <DogIcon className={className} />;
  if (animal === 'cats' || animal === 'cat') return <CatIcon className={className} />;

  if (type.includes('rabbit')) return <RabbitIcon className={className} />;
  if (type.includes('poultry') || type.includes('chicken') || type.includes('hen') || type.includes('rooster')) return <PoultryIcon className={className} />;
  if (type.includes('bird')) return <BirdIcon className={className} />;
  if (type.includes('fish')) return <FishIcon className={className} />;
  if (type.includes('horse')) return <HorseIcon className={className} />;
  if (type.includes('reptile')) return <ReptileIcon className={className} />;
  if (type.includes('rodent')) return <RodentIcon className={className} />;

  return <OtherAnimalIcon className={className} />;
}
