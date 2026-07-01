const defaultStroke = '#5f6f64';

function LineIcon({ className = 'h-4 w-4', children, stroke = defaultStroke, viewBox = '0 0 24 24' }) {
  return (
    <svg
      viewBox={viewBox}
      className={className}
      fill="none"
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const ArrowIcon = ({ className = 'h-4 w-4' }) => (
  <LineIcon className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </LineIcon>
);

export const AgeIcon = ({ className = 'h-4 w-4' }) => (
  <LineIcon className={className}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v5l3 2" />
  </LineIcon>
);

export const ChipIcon = ({ className = 'h-4 w-4' }) => (
  <LineIcon className={className}>
    <rect x="7" y="7" width="10" height="10" rx="2" />
    <path d="M4 9h3M4 15h3M17 9h3M17 15h3M9 4v3M15 4v3M9 17v3M15 17v3" />
  </LineIcon>
);

export const WormIcon = ({ className = 'h-4 w-4' }) => (
  <LineIcon className={className}>
    <path d="M5 14c2.5-6 7.5 5 14-3" />
    <circle cx="18" cy="10" r="1" fill="currentColor" stroke="none" />
  </LineIcon>
);

export const VaccineIcon = ({ className = 'h-4 w-4' }) => (
  <LineIcon className={className}>
    <path d="M15 4l5 5M14 5l5 5M5 19l7-7M8 16l-3 3M12 12l5-5" />
    <path d="M10 8l6 6" />
  </LineIcon>
);

export const VetIcon = ({ className = 'h-4 w-4' }) => (
  <LineIcon className={className}>
    <path d="M12 6v12M6 12h12" />
    <circle cx="12" cy="12" r="8" />
  </LineIcon>
);

export const NeuteredIcon = ({ className = 'h-4 w-4' }) => (
  <LineIcon className={className}>
    <circle cx="8" cy="8" r="3" />
    <circle cx="16" cy="16" r="3" />
    <path d="M10.2 10.2l3.6 3.6M15 6h4v4M19 6l-5 5" />
  </LineIcon>
);

export const HealthIcon = ({ className = 'h-4 w-4' }) => (
  <LineIcon className={className}>
    <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z" />
    <path d="M9 13h2l1-2 1 4 1-2h2" />
  </LineIcon>
);

export const LitterIcon = ({ className = 'h-4 w-4' }) => (
  <LineIcon className={className}>
    <circle cx="8" cy="8" r="2" />
    <circle cx="16" cy="8" r="2" />
    <circle cx="7" cy="15" r="2" />
    <circle cx="17" cy="15" r="2" />
    <path d="M10 13c1-1.5 3-1.5 4 0l1.5 2.2c1 1.5-.1 3.3-1.9 3.3h-3.2c-1.8 0-2.9-1.8-1.9-3.3L10 13z" />
  </LineIcon>
);

export const AvailableIcon = ({ className = 'h-3 w-3' }) => (
  <LineIcon className={className}>
    <rect x="4" y="5" width="16" height="15" rx="2" />
    <path d="M8 3v4M16 3v4M8 13l2.5 2.5L16 10" />
  </LineIcon>
);

export const BirthIcon = ({ className = 'h-3 w-3' }) => (
  <LineIcon className={className}>
    <path d="M12 3s2 2 2 3.2A2 2 0 0 1 12 8a2 2 0 0 1-2-1.8C10 5 12 3 12 3Z" />
    <path d="M5 14h14v6H5z" />
    <path d="M4 14c1.8-3 4.2-3 6-1s4.2 2 6 0 3.2-1.4 4 1" />
  </LineIcon>
);

export const EyeIcon = ({ className = 'h-4 w-4' }) => (
  <LineIcon className={className}>
    <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
    <circle cx="12" cy="12" r="2.5" />
  </LineIcon>
);

export const PaperIcon = ({ className = 'h-4 w-4' }) => (
  <LineIcon className={className}>
    <path d="M7 3h7l4 4v14H7z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h6" />
  </LineIcon>
);

export const GroupIcon = ({ className = 'h-4 w-4' }) => (
  <LineIcon className={className}>
    <circle cx="8" cy="9" r="3" />
    <circle cx="16" cy="9" r="3" />
    <path d="M3.5 19c.7-3 2.5-5 4.5-5s3.8 2 4.5 5" />
    <path d="M11.5 19c.7-3 2.5-5 4.5-5s3.8 2 4.5 5" />
  </LineIcon>
);

export const CalendarIcon = ({ className = 'h-4 w-4' }) => (
  <LineIcon className={className}>
    <rect x="4" y="5" width="16" height="15" rx="2" />
    <path d="M8 3v4M16 3v4M4 10h16" />
  </LineIcon>
);

export const HeartIcon = ({ className = 'h-5 w-5', filled = false }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20.8 4.6c-1.9-1.8-4.9-1.8-6.8.1L12 6.7l-2-2c-1.9-1.9-4.9-1.9-6.8-.1-2 1.9-2.1 5.1-.2 7.1l9 8.8 9-8.8c1.9-2 1.8-5.2-.2-7.1Z" />
  </svg>
);

export const ShareIcon = ({ className = 'h-5 w-5' }) => (
  <LineIcon className={className} stroke="currentColor">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.6 10.6 15.4 6.4" />
    <path d="M8.6 13.4 15.4 17.6" />
  </LineIcon>
);

export const CloseIcon = ({ className = 'h-4 w-4' }) => (
  <LineIcon className={className}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </LineIcon>
);

export const SearchIcon = ({ className = 'h-5 w-5' }) => (
  <LineIcon className={className} stroke="#ffffff">
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20 16.5 16.5" />
  </LineIcon>
);

export const PawIcon = ({ className = 'h-8 w-8' }) => (
  <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="23" cy="17" rx="7" ry="9.5" fill="currentColor" />
    <ellipse cx="39" cy="17" rx="7" ry="9.5" fill="currentColor" />
    <ellipse cx="12" cy="32" rx="7" ry="8.5" fill="currentColor" />
    <ellipse cx="52" cy="31" rx="7" ry="8.5" fill="currentColor" />
    <path
      d="M32 29C24 29 16 37.2 16 47.5C16 54.2 20.4 58 25.3 58C28.4 58 30 55.8 32 55.8C34 55.8 35.6 58 38.7 58C43.6 58 48 54.2 48 47.5C48 37.2 40 29 32 29Z"
      fill="currentColor"
    />
  </svg>
);

export const BreedIcon = ({ className = 'h-5 w-5' }) => (
  <LineIcon className={className}>
    <path d="M4 19c2.4-4 5.2-6 8-6s5.6 2 8 6" />
    <path d="M12 13V7" />
    <path d="M8 7h8" />
    <path d="M7 5h10" />
  </LineIcon>
);

export const LocationIcon = ({ className = 'h-5 w-5' }) => (
  <LineIcon className={className}>
    <path d="M12 21s7-5.2 7-12a7 7 0 0 0-14 0c0 6.8 7 12 7 12Z" />
    <circle cx="12" cy="9" r="2.5" />
  </LineIcon>
);

export const ListingTypeIcon = ({ className = 'h-5 w-5' }) => (
  <LineIcon className={className}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h10" />
    <circle cx="18" cy="18" r="2" />
  </LineIcon>
);

export const UnderlineIcon = ({ className = 'h-4 w-full' }) => (
  <svg className={className} viewBox="0 0 200 20" fill="none" preserveAspectRatio="none" aria-hidden="true">
    <path d="M4 14C52 5 139 5 196 13" stroke="#5f6f64" strokeWidth="6" strokeLinecap="round" />
  </svg>
);

export const ShieldCheckIcon = ({ className = 'h-7 w-7' }) => (
  <LineIcon className={className}>
    <path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Z" />
    <path d="m8.8 12.2 2.2 2.2 4.5-4.6" />
  </LineIcon>
);

export const LockIcon = ({ className = 'h-7 w-7' }) => (
  <LineIcon className={className}>
    <rect x="5" y="10" width="14" height="10" rx="2" />
    <path d="M8 10V7.5A4 4 0 0 1 12 3.5a4 4 0 0 1 4 4V10" />
    <path d="M12 15v2" />
    <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
  </LineIcon>
);

export const UsersIcon = ({ className = 'h-7 w-7' }) => (
  <LineIcon className={className}>
    <circle cx="12" cy="8" r="3" />
    <path d="M6.5 19c.5-3.2 2.6-5 5.5-5s5 1.8 5.5 5" />
    <circle cx="5.5" cy="10" r="2" />
    <path d="M2.5 18c.3-2.2 1.5-3.5 3.3-3.8" />
    <circle cx="18.5" cy="10" r="2" />
    <path d="M21.5 18c-.3-2.2-1.5-3.5-3.3-3.8" />
  </LineIcon>
);

export const HeadsetIcon = ({ className = 'h-7 w-7' }) => (
  <LineIcon className={className}>
    <path d="M4 13a8 8 0 0 1 16 0" />
    <path d="M4 13v3a2 2 0 0 0 2 2h1v-7H6a2 2 0 0 0-2 2Z" />
    <path d="M20 13v3a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2Z" />
    <path d="M15 20h-3" />
    <path d="M18 18c0 1.1-.9 2-2 2h-1" />
  </LineIcon>
);

export const FemaleIcon = ({ className = 'h-3.5 w-3.5' }) => (
  <LineIcon className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M12 12v8" />
    <path d="M8.5 17h7" />
  </LineIcon>
);

export const MaleIcon = ({ className = 'h-3.5 w-3.5' }) => (
  <LineIcon className={className}>
    <circle cx="9" cy="15" r="5" />
    <path d="M13 11l6-6" />
    <path d="M15 5h4v4" />
  </LineIcon>
);

export const MixedGenderIcon = ({ className = 'h-3.5 w-3.5' }) => (
  <LineIcon className={className}>
    <circle cx="10" cy="10" r="4" />
    <path d="M10 14v6" />
    <path d="M7 17h6" />
    <path d="M14 6l4-4" />
    <path d="M16 2h2v2" />
  </LineIcon>
);

export const PhoneIcon = ({ className = 'h-5 w-5' }) => (
  <LineIcon className={className}>
    <path d="M21 5.5C21 14 14 21 5.5 21c-.4 0-.8 0-1.1-.1-.4 0-.7-.3-.8-.7L3 16.8c-.1-.5.2-1 .7-1.2l3.2-1.2c.5-.2 1 .1 1.3.5L10 16c2.7-1.2 4.8-3.4 6-6l-1.1-1.8c-.3-.4-.1-1 .4-1.2l3.2-1.2c.5-.2 1 .1 1.2.6.2.7.3 1.4.3 2.1Z" />
  </LineIcon>
);

export const TemperamentIcon = ({ className = 'h-5 w-5' }) => (
  <LineIcon className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 10h.01M15.5 10h.01" />
    <path d="M8.5 15c1.8 1.8 5.2 1.8 7 0" />
  </LineIcon>
);

export const ExerciseIcon = ({ className = 'h-5 w-5' }) => (
  <LineIcon className={className}>
    <path d="M4 17c3.2-1.4 5.4-4.2 7-8" />
    <path d="m9 9 3-3 3 3" />
    <path d="M13 13h7" />
    <path d="m17 10 3 3-3 3" />
  </LineIcon>
);

export const GroomingIcon = ({ className = 'h-5 w-5' }) => (
  <LineIcon className={className}>
    <path d="M4 20 17.5 6.5" />
    <path d="m14 4 6 6" />
    <path d="M16.5 3.5 20.5 7.5" />
    <path d="M7 17l-3 3" />
  </LineIcon>
);

export const SizeIcon = ({ className = 'h-5 w-5' }) => (
  <LineIcon className={className}>
    <path d="M4 18h16" />
    <path d="M7 18V8" />
    <path d="M17 18V5" />
    <path d="m7 8 2 2M7 8l-2 2" />
    <path d="m17 5 2 2M17 5l-2 2" />
  </LineIcon>
);

export const IntelligenceIcon = ({ className = 'h-5 w-5' }) => (
  <LineIcon className={className}>
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M8 14c-1.2-1.2-2-2.9-2-4.8A6 6 0 0 1 12 3a6 6 0 0 1 6 6.2c0 1.9-.8 3.6-2 4.8-.8.8-1 1.4-1 2H9c0-.6-.2-1.2-1-2Z" />
  </LineIcon>
);

export const GalleryIcon = ({ className = 'h-5 w-5' }) => (
  <LineIcon className={className}>
    <rect x="4" y="5" width="16" height="14" rx="2" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="m4 16 4-4 3 3 2-2 7 6" />
  </LineIcon>
);

export const FoodIcon = ({ className = 'h-5 w-5' }) => (
  <LineIcon className={className}>
    <path d="M6 3v8" />
    <path d="M10 3v8" />
    <path d="M8 3v18" />
    <path d="M17 3c2 2.5 2 7.5 0 10v8" />
  </LineIcon>
);

export const InsuranceIcon = ({ className = 'h-5 w-5' }) => <ShieldCheckIcon className={className} />;

export const EquipmentIcon = ({ className = 'h-5 w-5' }) => (
  <LineIcon className={className}>
    <rect x="5" y="7" width="14" height="11" rx="2" />
    <path d="M9 7V5h6v2" />
    <path d="M8 12h8" />
  </LineIcon>
);

export const DogIcon = ({ className = 'h-4 w-4' }) => (
  <LineIcon className={className}>
    <path d="M5 11V8.5C5 6.6 6.6 5 8.5 5H12l2-2 2 2h1.5C19.4 5 21 6.6 21 8.5V12" />
    <path d="M4 13h17" />
    <path d="M6 13v4.5A2.5 2.5 0 0 0 8.5 20h7A2.5 2.5 0 0 0 18 17.5V13" />
    <path d="M9 10h.01M15 10h.01" />
  </LineIcon>
);

export const CatIcon = ({ className = 'h-4 w-4' }) => (
  <LineIcon className={className}>
    <path d="M5 9 6.5 4 10 7h4l3.5-3L19 9" />
    <path d="M5 9c0 6 3 10 7 10s7-4 7-10" />
    <path d="M9 11h.01M15 11h.01" />
  </LineIcon>
);

export const RabbitIcon = ({ className = 'h-4 w-4' }) => (
  <LineIcon className={className}>
    <path d="M8 11C6 8 5.8 4 7.4 3.4c1.6-.6 3.1 3 3.4 6" />
    <path d="M13.2 9.4c.3-3 1.8-6.6 3.4-6 1.6.6 1.4 4.6-.6 7.6" />
    <path d="M6 14c0-3.3 2.7-5 6-5s6 1.7 6 5-2.7 6-6 6-6-2.7-6-6Z" />
  </LineIcon>
);

export const BirdIcon = ({ className = 'h-4 w-4' }) => (
  <LineIcon className={className}>
    <path d="M4 12c3-5 8-7 13-3" />
    <path d="M10 19c4-1 7-4.5 7-9" />
    <path d="M17 9l4-1-3 3" />
  </LineIcon>
);

export const PoultryIcon = ({ className = 'h-4 w-4' }) => (
  <LineIcon className={className}>
    <path d="M8 8c0-2 1.4-3 3-3 .7 0 1.4.2 2 .7.2-1 .9-1.7 1.8-1.7 1.2 0 2.2 1 2.2 2.2" />
    <path d="M7 11c0-2.2 2-4 5-4s6 2.4 6 6-2.5 6-6 6-6-2.6-6-6c0-.7.1-1.3.3-1.8" />
    <path d="M18 10l3 1.2-3 1.3" />
  </LineIcon>
);

export const FishIcon = ({ className = 'h-4 w-4' }) => (
  <LineIcon className={className}>
    <path d="M3 12s4-6 10-6 8 6 8 6-2 6-8 6-10-6-10-6Z" />
    <path d="M19 9l3-3v12l-3-3" />
  </LineIcon>
);

export const HorseIcon = ({ className = 'h-4 w-4' }) => (
  <LineIcon className={className}>
    <path d="M7 20V9l5-5 5 3v5" />
    <path d="M12 4v5l4 2" />
    <path d="M7 12h8" />
    <path d="M15 12c3 1 4 3.2 4 6v2" />
  </LineIcon>
);

export const ReptileIcon = ({ className = 'h-4 w-4' }) => (
  <LineIcon className={className}>
    <path d="M4 14c3-5 9-7 16-4" />
    <path d="M5 15c4 3 9 3.5 14 .5" />
    <path d="M8 13l-2-3M12 12l-1-4M16 12l2-3" />
  </LineIcon>
);

export const RodentIcon = ({ className = 'h-4 w-4' }) => (
  <LineIcon className={className}>
    <circle cx="8" cy="8" r="3" />
    <circle cx="16" cy="8" r="3" />
    <path d="M5 13c0-3.3 3-5 7-5s7 1.7 7 5-3 7-7 7-7-3.7-7-7Z" />
  </LineIcon>
);

export const OtherAnimalIcon = ({ className = 'h-4 w-4' }) => <PawIcon className={className} />;

export function AnimalTypeIcon({ animalType, category, className = 'h-4 w-4' }) {
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
