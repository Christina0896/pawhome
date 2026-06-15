const defaultStrokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '2',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
};

export const AgeIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v5l3 2" />
  </svg>
);

export const ChipIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <rect x="7" y="7" width="10" height="10" rx="2" />
    <path d="M4 9h3M4 15h3M17 9h3M17 15h3M9 4v3M15 4v3M9 17v3M15 17v3" />
  </svg>
);

export const WormIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <path d="M5 14c2.5-6 7.5 5 14-3" />
    <circle cx="18" cy="10" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const VaccineIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <path d="M15 4l5 5M14 5l5 5M5 19l7-7M8 16l-3 3M12 12l5-5" />
    <path d="M10 8l6 6" />
  </svg>
);

export const VetIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <path d="M12 6v12M6 12h12" />
    <circle cx="12" cy="12" r="8" />
  </svg>
);

export const NeuteredIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <circle cx="8" cy="8" r="3" />
    <circle cx="16" cy="16" r="3" />
    <path d="M10.2 10.2l3.6 3.6M15 6h4v4M19 6l-5 5" />
  </svg>
);

export const HealthIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10Z" />
    <path d="M9 13h2l1-2 1 4 1-2h2" />
  </svg>
);

export const LitterIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <circle cx="8" cy="8" r="2" />
    <circle cx="16" cy="8" r="2" />
    <circle cx="7" cy="15" r="2" />
    <circle cx="17" cy="15" r="2" />
    <path d="M10 13c1-1.5 3-1.5 4 0l1.5 2.2c1 1.5-.1 3.3-1.9 3.3h-3.2c-1.8 0-2.9-1.8-1.9-3.3L10 13Z" />
  </svg>
);

export const AvailableIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <path d="M4 11l8-7 8 7" />
    <path d="M6 10v9h12v-9" />
    <path d="M10 19v-5h4v5" />
  </svg>
);

export const BirthIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <path d="M7 11h10v8H7z" />
    <path d="M5 11h14" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    <path d="M9 15h6" />
  </svg>
);

export const CalendarIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <rect x="4" y="5" width="16" height="15" rx="2" />
    <path d="M8 3v4M16 3v4M4 10h16" />
  </svg>
);

export const EyeIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
);

export const PaperIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <path d="M7 3h7l4 4v14H7z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </svg>
);

export const PawSmallIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <circle cx="8" cy="8" r="2" />
    <circle cx="16" cy="8" r="2" />
    <circle cx="7" cy="15" r="2" />
    <circle cx="17" cy="15" r="2" />
    <path d="M10 13c1-1.5 3-1.5 4 0l1.5 2.2c1 1.5-.1 3.3-1.9 3.3h-3.2c-1.8 0-2.9-1.8-1.9-3.3L10 13Z" />
  </svg>
);

export const GroupSmallIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <circle cx="8" cy="9" r="3" />
    <circle cx="16" cy="9" r="3" />
    <path d="M3.5 19c.7-3 2.5-5 4.5-5s3.8 2 4.5 5" />
    <path d="M11.5 19c.7-3 2.5-5 4.5-5s3.8 2 4.5 5" />
  </svg>
);

export const CalendarSmallIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <rect x="4" y="5" width="16" height="15" rx="2" />
    <path d="M8 3v4M16 3v4M4 10h16" />
  </svg>
);

export const LocationSmallIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <path d="M12 21s7-5.2 7-11a7 7 0 0 0-14 0c0 5.8 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export const HeartIcon = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <path d="M20.8 4.6c-1.6-1.6-4.2-1.6-5.8 0L12 7.6 9 4.6c-1.6-1.6-4.2-1.6-5.8 0s-1.6 4.2 0 5.8L12 19.2l8.8-8.8c1.6-1.6 1.6-4.2 0-5.8Z" />
  </svg>
);

export const CloseIcon = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <path d="M18 6 6 18" />
    <path d="M6 6l12 12" />
  </svg>
);

export const SearchIcon = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

export const PawIcon = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <circle cx="5.5" cy="9.5" r="2" />
    <circle cx="9.5" cy="5.8" r="2" />
    <circle cx="14.5" cy="5.8" r="2" />
    <circle cx="18.5" cy="9.5" r="2" />
    <path d="M7.5 16.2c0-2.6 2-4.7 4.5-4.7s4.5 2.1 4.5 4.7c0 1.7-1.1 2.8-2.6 2.8-.8 0-1.2-.3-1.9-.3s-1.1.3-1.9.3c-1.5 0-2.6-1.1-2.6-2.8Z" />
  </svg>
);

export const BreedIcon = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <path d="M4 19c2.4-4 5.2-6 8-6s5.6 2 8 6" />
    <path d="M12 13V7" />
    <path d="M8 7h8" />
    <path d="M7 5h10" />
  </svg>
);

export const LocationIcon = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <path d="M12 21s7-5.2 7-12a7 7 0 0 0-14 0c0 6.8 7 12 7 12Z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

export const ListingTypeIcon = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h10" />
    <circle cx="18" cy="18" r="2" />
  </svg>
);

export const UnderlineIcon = ({ className = 'h-4 w-full' }) => (
  <svg viewBox="0 0 200 20" className={className} fill="none" preserveAspectRatio="none" aria-hidden="true">
    <path d="M4 14C52 5 139 5 196 13" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
  </svg>
);

export const ShieldCheckIcon = ({ className = 'h-7 w-7' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Z" />
    <path d="m8.8 12.2 2.2 2.2 4.5-4.6" />
  </svg>
);

export const LockIcon = ({ className = 'h-7 w-7' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <rect x="5" y="10" width="14" height="10" rx="2" />
    <path d="M8 10V7.5A4 4 0 0 1 12 3.5a4 4 0 0 1 4 4V10" />
    <path d="M12 15v2" />
    <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const UsersIcon = ({ className = 'h-7 w-7' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <circle cx="12" cy="8" r="3" />
    <path d="M6.5 19c.5-3.2 2.6-5 5.5-5s5 1.8 5.5 5" />
    <circle cx="5.5" cy="10" r="2" />
    <path d="M2.5 18c.3-2.2 1.5-3.5 3.3-3.8" />
    <circle cx="18.5" cy="10" r="2" />
    <path d="M21.5 18c-.3-2.2-1.5-3.5-3.3-3.8" />
  </svg>
);

export const HeadsetIcon = ({ className = 'h-7 w-7' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <path d="M4 13a8 8 0 0 1 16 0" />
    <path d="M4 13v3a2 2 0 0 0 2 2h1v-7H6a2 2 0 0 0-2 2Z" />
    <path d="M20 13v3a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2Z" />
    <path d="M15 20h-3" />
    <path d="M18 18c0 1.1-.9 2-2 2h-1" />
  </svg>
);

export const FemaleIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <circle cx="12" cy="8" r="4" />
    <path d="M12 12v8" />
    <path d="M8.5 17h7" />
  </svg>
);

export const MaleIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <circle cx="9" cy="15" r="5" />
    <path d="M13 11l6-6" />
    <path d="M15 5h4v4" />
  </svg>
);

export const MixedGenderIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <circle cx="10" cy="10" r="4" />
    <path d="M10 14v6" />
    <path d="M7 17h6" />
    <path d="M14 6l4-4" />
    <path d="M16 2h2v2" />
  </svg>
);

export const CameraIcon = ({ className = 'h-8 w-8' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <path d="M4 8h4l2-3h4l2 3h4v11H4Z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

export const ChevronLeftIcon = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <path d="M15 18 9 12l6-6" />
  </svg>
);

export const ChevronRightIcon = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export const CheckIcon = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const ShareIcon = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" className={className} {...defaultStrokeProps}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.6 10.7 15.4 6.3" />
    <path d="m8.6 13.3 6.8 4.4" />
  </svg>
);
