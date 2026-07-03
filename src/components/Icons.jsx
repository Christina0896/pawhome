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
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {/* person */}
    <circle cx="6.5" cy="5" r="1.8" />
    <path d="M6.5 6.8v4.3" />
    <path d="M6.5 8.5 4.5 10.5" />
    <path d="M6.5 8.5 9 10" />
    <path d="M6.4 11.1 4.9 15.5" />
    <path d="M6.7 11.1 8.8 15" />

    {/* leash */}
    <path d="M9 10 11.6 10.8" />

    {/* dog */}
    <path d="M12.1 12.1h3.6l1.2-1.1 1.7.5.9 1.2-.5 1.1h-1.5" />
    <path d="M12.1 12.1 10.9 11.2" />
    <path d="M13 12.1 12.4 15.2" />
    <path d="M15.2 12.1v3.1" />
    <path d="M17.2 12.8 18 15.1" />
  </svg>
);

export const GroomingIcon = ({ className = 'h-5 w-5' }) => (
  <svg className={className} viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
    <path d="M438 14H324c-4.4 0-8 3.6-8 8v263c0 4.4 3.6 8 8 8h106c-1.6 39.4-7.4 81.1-17.3 123.9-1.4 5.9-2.1 12-2.1 18.3 0 21 7.9 40.4 21.2 52.3 8.5 7.6 19.1 11.8 30.4 11.8s21.9-4.2 30.4-11.8c13.3-11.9 21.2-31.3 21.2-52.3 0-6.2-.7-12.4-2.1-18.3-14.2-61.4-21.4-111.9-21.4-150.1V66.7c0-29.2-23.7-52.7-52.3-52.7Zm36.1 253.1c0 39.5 7.3 91.4 21.8 154.8 1 4.3 1.5 8.8 1.5 13.3 0 16.8-6.5 32.7-17 41.3-5.6 4.6-11.8 6.9-18.2 6.9s-12.6-2.3-18.2-6.9c-10.5-8.6-17-24.5-17-41.3 0-4.6.5-9.1 1.5-13.4 10.8-46.8 16.9-92.3 18-135.2.1-2.2-.8-4.3-2.3-5.8-1.5-1.5-3.6-2.4-5.7-2.4H332V29.9h106c19.9 0 36.1 16.2 36.1 36.8v200.4Z" />
    <path d="M430 45h-26c-4.4 0-8 3.6-8 8s3.6 8 8 8h26c4.4 0 8-3.6 8-8s-3.6-8-8-8ZM430 83h-96v16h96c4.4 0 8-3.6 8-8s-3.6-8-8-8ZM430 122h-96v16h96c4.4 0 8-3.6 8-8s-3.6-8-8-8ZM430 161h-96v16h96c4.4 0 8-3.6 8-8s-3.6-8-8-8ZM430 200h-96v16h96c4.4 0 8-3.6 8-8s-3.6-8-8-8ZM430 239h-96v16h96c4.4 0 8-3.6 8-8s-3.6-8-8-8Z" />
    <path d="M350.5 423.5c-1.3-38.3-32.3-70.6-70.5-73.5-6.7-.5-13.5-.1-20.1 1.1l-9.5-1.5c-12.3-2-23.8-7.9-32.6-16.7l-6.5-20.9 47.2-258.5c2.8-15.5-2.8-31.7-14.6-42.1-2-1.8-4.8-2.4-7.4-1.7-2.6.7-4.6 2.7-5.4 5.3l-55.8 180.3L119.5 15c-.8-2.6-2.8-4.6-5.4-5.3-2.6-.7-5.4-.1-7.4 1.7-11.9 10.4-17.5 26.6-14.6 42.1l47.2 258.5-6.5 20.9c-8.8 8.8-20.3 14.7-32.6 16.7l-9.5 1.5c-6.6-1.2-13.4-1.6-20.1-1.1C32.4 352.9 1.4 385.2.1 423.5c-.7 21 6.9 40.8 21.4 55.8 14.5 15.1 34.1 23.4 55 23.4 34.4 0 64.5-23 73.7-56 .1-.4.3-.8.4-1.1l24.8-105.5 24.8 105.5c.1.4.2.8.4 1.1 9.2 33 39.3 56 73.7 56 20.9 0 40.5-8.3 55-23.4 14.3-15 21.9-34.8 21.2-55.8ZM201.2 279.1l-17.6-57 57.9-187.1c1.8 4.9 2.4 10.3 1.4 15.6l-41.7 228.5Zm-66 161.9c-.1.2-.1.4-.2.6-7 26.6-31.1 45.1-58.6 45.1-16.6 0-32-6.6-43.6-18.5-11.5-11.9-17.5-27.6-16.9-44.2 1-29.8 26.1-55.9 55.8-58.2 5.8-.4 11.6-.1 17.1 1.1 1.1.2 2.2.2 3.2 0l10.6-1.7c16.3-2.7 31.5-10.8 42.9-22.8.8-.9 1.4-1.9 1.8-3.1l5-16.1 9.7 3.7-26.8 114.1Zm182.4 27.3c-11.5 11.9-27 18.5-43.6 18.5-27.5 0-51.6-18.6-58.6-45.1-.1-.2-.1-.4-.2-.6l-27.6-117.5c-.6-2.6-2.4-4.7-4.9-5.6l-26.3-10-48.8-267.3c-.9-5.3-.4-10.7 1.4-15.6l86.6 279.8 7.6 24.5c.4 1.2 1 2.2 1.8 3.1 11.3 12 26.5 20.1 42.9 22.8l10.6 1.7c1 .2 2.1.2 3.2 0 5.6-1.2 11.4-1.6 17.1-1.1 29.7 2.3 54.8 28.4 55.8 58.2.5 16.5-5.5 32.2-17 44.1Z" />
    <path d="M274.1 379.2c-25.9 0-47 21.1-47 47s21.1 47 47 47 47-21.1 47-47-21.1-47-47-47Zm0 78.1c-17.1 0-31.1-13.9-31.1-31.1s13.9-31.1 31.1-31.1 31.1 13.9 31.1 31.1-14 31.1-31.1 31.1ZM76.5 379.2c-25.9 0-47 21.1-47 47s21.1 47 47 47 47-21.1 47-47-21.1-47-47-47Zm0 78.1c-17.1 0-31.1-13.9-31.1-31.1s13.9-31.1 31.1-31.1 31.1 13.9 31.1 31.1-14 31.1-31.1 31.1Z" />
  </svg>
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
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
    <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
    <g id="SVGRepo_iconCarrier">
      {' '}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.15452 1.01195C5.11987 1.32041 7.17569 2.2474 8.72607 3.49603C9.75381 3.17407 10.8558 2.99995 12 2.99995C13.1519 2.99995 14.261 3.17641 15.2946 3.5025C16.882 2.27488 18.8427 1.31337 20.8354 1.01339C21.2596 0.95092 21.7008 1.16534 21.8945 1.55273C22.6719 3.38958 22.6983 5.57987 22.2202 7.49248L22.2128 7.52213C22.0847 8.03536 21.9191 8.69868 21.3876 8.92182C21.7827 9.89315 22 10.9466 22 12.0526C22 14.825 20.8618 17.6774 19.8412 20.2348L19.8412 20.2348L19.7379 20.4936C19.1182 22.0486 17.7316 23.1196 16.125 23.418L13.8549 23.8397C13.1549 23.9697 12.4562 23.7172 12 23.2082C11.5438 23.7172 10.8452 23.9697 10.1452 23.8397L7.87506 23.418C6.26852 23.1196 4.88189 22.0486 4.26214 20.4936L4.15891 20.2348C3.13833 17.6774 2.00004 14.825 2.00004 12.0526C2.00004 10.9466 2.21737 9.89315 2.6125 8.92182C2.08046 8.69845 1.91916 8.05124 1.7909 7.53658L1.7799 7.49248C1.32311 5.66527 1.23531 3.2968 2.10561 1.55273C2.29827 1.16741 2.72906 0.945855 3.15452 1.01195ZM6.58478 4.44052C5.45516 5.10067 4.47474 5.9652 3.71373 6.98132C3.41572 5.76461 3.41236 4.41153 3.67496 3.18754C4.68842 3.48029 5.68018 3.89536 6.58478 4.44052ZM20.2863 6.98133C19.5303 5.97184 18.5577 5.11195 17.4374 4.45347C18.3364 3.9005 19.3043 3.45749 20.3223 3.17455C20.5884 4.40199 20.5853 5.76068 20.2863 6.98133ZM8.85364 5.56694C9.81678 5.20285 10.8797 4.99995 12 4.99995C13.1204 4.99995 14.1833 5.20285 15.1464 5.56694C18.0554 6.66661 20 9.1982 20 12.0526C20 14.4676 18.9891 16.9876 18.0863 19.238L18.0862 19.2382C18.0167 19.4115 17.9478 19.5832 17.8801 19.7531C17.5291 20.6338 16.731 21.2712 15.7597 21.4516L13.4896 21.8733L12.912 20.5896C12.7505 20.2307 12.3935 19.9999 12 19.9999C11.6065 19.9999 11.2496 20.2307 11.0881 20.5896L10.5104 21.8733L8.24033 21.4516C7.26908 21.2712 6.471 20.6338 6.12001 19.7531C6.05237 19.5834 5.98357 19.4119 5.91414 19.2388L5.91395 19.2384L5.91381 19.238C5.01102 16.9876 4.00004 14.4676 4.00004 12.0526C4.00004 9.1982 5.94472 6.66661 8.85364 5.56694ZM10.5 15.9999C10.1212 15.9999 9.77497 16.2139 9.60557 16.5527C9.43618 16.8915 9.47274 17.2969 9.7 17.5999L11.2 19.5999C11.3889 19.8517 11.6852 19.9999 12 19.9999C12.3148 19.9999 12.6111 19.8517 12.8 19.5999L14.3 17.5999C14.5273 17.2969 14.5638 16.8915 14.3944 16.5527C14.225 16.2139 13.8788 15.9999 13.5 15.9999H10.5ZM9.62134 11.1212C9.62134 11.9497 8.94977 12.6212 8.12134 12.6212C7.29291 12.6212 6.62134 11.9497 6.62134 11.1212C6.62134 10.2928 7.29291 9.62125 8.12134 9.62125C8.94977 9.62125 9.62134 10.2928 9.62134 11.1212ZM16 12.4999C16.8284 12.4999 17.5 11.8284 17.5 10.9999C17.5 10.1715 16.8284 9.49994 16 9.49994C15.1716 9.49994 14.5 10.1715 14.5 10.9999C14.5 11.8284 15.1716 12.4999 16 12.4999Z"
        fill="#000000"
      ></path>{' '}
    </g>
  </svg>
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
  if (type.includes('poultry') || type.includes('chicken') || type.includes('hen') || type.includes('rooster'))
    return <PoultryIcon className={className} />;
  if (type.includes('bird')) return <BirdIcon className={className} />;
  if (type.includes('fish')) return <FishIcon className={className} />;
  if (type.includes('horse')) return <HorseIcon className={className} />;
  if (type.includes('reptile')) return <ReptileIcon className={className} />;
  if (type.includes('rodent')) return <RodentIcon className={className} />;

  return <OtherAnimalIcon className={className} />;
}
