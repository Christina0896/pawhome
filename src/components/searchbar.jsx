'use client';

import { useEffect, useRef, useState } from 'react';
import { dogBreeds, catBreeds, otherPetTypes } from '../data/petOptions';
import { counties } from '../data/countyList';

const animalOptions = [
  { label: 'All Animals', value: '' },
  { label: 'Dogs', value: 'Dogs' },
  { label: 'Cats', value: 'Cats' },
  { label: 'Other Pets', value: 'Other Pets' },
];

const listingTypeOptions = [
  { label: 'Any Type', value: '' },
  { label: 'For Sale', value: 'For Sale' },
  { label: 'For Stud', value: 'For Stud' },
  { label: 'For Adoption', value: 'For Adoption' },
];

const fieldClass =
  'relative flex h-[52px] items-center gap-3 rounded-xl border border-(--border-beige) bg-white px-3 shadow-[0_3px_10px_rgba(18,53,36,0.04)] transition focus-within:border-(--primary-green)';

const dropdownClass =
  'absolute left-0 right-0 top-full z-[9999] mt-2 max-h-72 overflow-y-auto rounded-xl border border-(--border-beige) bg-white shadow-lg';

const optionClass =
  'block w-full border-b border-(--border-beige) px-4 py-3 text-left text-sm font-medium text-(--muted-green-text) hover:bg-(--background)';

const labelClass = 'block text-sm font-bold leading-tight text-(--secondary-green)';

const valueClass = 'mt-0.5 block truncate text-sm font-medium text-(--muted-green-text)';

const ArrowIcon = () => <span className="shrink-0 text-xs text-(--primary-green)">▼</span>;

const PawIcon = () => (
  <svg className="h-5 w-5 shrink-0 text-(--primary-green)" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="5.5" cy="9.5" r="2" />
    <circle cx="9.5" cy="5.8" r="2" />
    <circle cx="14.5" cy="5.8" r="2" />
    <circle cx="18.5" cy="9.5" r="2" />
    <path d="M7.5 16.2c0-2.6 2-4.7 4.5-4.7s4.5 2.1 4.5 4.7c0 1.7-1.1 2.8-2.6 2.8-.8 0-1.2-.3-1.9-.3s-1.1.3-1.9.3c-1.5 0-2.6-1.1-2.6-2.8z" />
  </svg>
);

const BreedIcon = () => (
  <svg
    className="h-5 w-5 shrink-0 text-(--primary-green)"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 19c2.4-4 5.2-6 8-6s5.6 2 8 6" />
    <path d="M12 13V7" />
    <path d="M8 7h8" />
    <path d="M7 5h10" />
  </svg>
);

const LocationIcon = () => (
  <svg
    className="h-5 w-5 shrink-0 text-(--primary-green)"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 21s7-5.2 7-12a7 7 0 0 0-14 0c0 6.8 7 12 7 12Z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

const ListingTypeIcon = () => (
  <svg
    className="h-5 w-5 shrink-0 text-(--primary-green)"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h10" />
    <circle cx="18" cy="18" r="2" />
  </svg>
);

const SearchBar = () => {
  // Refs
  const searchBarRef = useRef(null);

  // Search state
  const [animalType, setAnimalType] = useState('');
  const [breedInput, setBreedInput] = useState('');
  const [county, setCounty] = useState('');
  const [listingType, setListingType] = useState('');

  // Dropdown state
  const [showAnimalDropdown, setShowAnimalDropdown] = useState(false);
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  const [showCountyDropdown, setShowCountyDropdown] = useState(false);
  const [showListingTypeDropdown, setShowListingTypeDropdown] = useState(false);

  const breedSuggestions =
    animalType === 'Dogs'
      ? dogBreeds
      : animalType === 'Cats'
        ? catBreeds
        : animalType === 'Other Pets'
          ? []
          : [...dogBreeds, ...catBreeds];

  const filteredBreedSuggestions = breedSuggestions.filter((breed) =>
    breed.toLowerCase().includes(breedInput.toLowerCase()),
  );

  // Close dropdowns when clicking outside the search bar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!searchBarRef.current?.contains(e.target)) {
        closeAllDropdowns();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const closeAllDropdowns = () => {
    setShowAnimalDropdown(false);
    setShowBreedDropdown(false);
    setShowCountyDropdown(false);
    setShowListingTypeDropdown(false);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (animalType) params.set('animalType', animalType);
    if (breedInput) params.set('breed', breedInput);
    if (county) params.set('county', county);
    if (listingType) params.set('listingType', listingType);

    const queryString = params.toString();

    window.location.href = queryString ? `/listings?${queryString}` : '/listings';
  };

  return (
    <div
      ref={searchBarRef}
      className="relative z-50 mx-auto max-w-[1280px] rounded-[18px] border border-(--border-beige) bg-(--background) p-4 shadow-[0_12px_35px_rgba(18,53,36,0.12)]"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_190px]">
        {/* Animal Type */}
        <div className={fieldClass}>
          <PawIcon />

          <button
            type="button"
            onClick={() => {
              closeAllDropdowns();
              setShowAnimalDropdown((open) => !open);
            }}
            className="flex min-w-0 flex-1 items-center justify-between text-left"
          >
            <div className="min-w-0">
              <span className={labelClass}>Animal Type</span>
              <span className={valueClass}>{animalType || 'All Animals'}</span>
            </div>

            <ArrowIcon />
          </button>

          {showAnimalDropdown && (
            <div className={dropdownClass}>
              {animalOptions.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => {
                    setAnimalType(option.value);
                    setBreedInput('');
                    setShowAnimalDropdown(false);
                  }}
                  className={optionClass}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Breed / Pet Type */}
        <div className={fieldClass}>
          <BreedIcon />

          <div className="min-w-0 flex-1">
            <span className={labelClass}>{animalType === 'Other Pets' ? 'Pet Type' : 'Breed'}</span>

            {animalType === 'Other Pets' ? (
              <button
                type="button"
                onClick={() => {
                  closeAllDropdowns();
                  setShowBreedDropdown((open) => !open);
                }}
                className="mt-0.5 flex w-full items-center justify-between text-left text-sm font-medium text-(--muted-green-text)"
              >
                <span className="truncate">{breedInput || 'All Pet Types'}</span>
                <ArrowIcon />
              </button>
            ) : (
              <input
                type="text"
                value={breedInput}
                onFocus={() => {
                  closeAllDropdowns();
                  setShowBreedDropdown(true);
                }}
                onChange={(e) => {
                  setBreedInput(e.target.value);
                  setShowBreedDropdown(true);
                }}
                placeholder="Any Breed"
                className="mt-0.5 w-full bg-transparent text-sm font-medium text-(--muted-green-text) placeholder:text-(--muted-green-text) outline-none"
              />
            )}
          </div>

          {animalType !== 'Other Pets' && (
            <button
              type="button"
              onClick={() => {
                closeAllDropdowns();
                setShowBreedDropdown((open) => !open);
              }}
              className="shrink-0"
              aria-label="Open breed dropdown"
            >
              <ArrowIcon />
            </button>
          )}

          {showBreedDropdown && (
            <div className={dropdownClass}>
              {animalType === 'Other Pets' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setBreedInput('');
                      setShowBreedDropdown(false);
                    }}
                    className={optionClass}
                  >
                    All Pet Types
                  </button>

                  {otherPetTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setBreedInput(type);
                        setShowBreedDropdown(false);
                      }}
                      className={optionClass}
                    >
                      {type}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setBreedInput('');
                      setShowBreedDropdown(false);
                    }}
                    className={optionClass}
                  >
                    All Breeds
                  </button>

                  {filteredBreedSuggestions.map((breed) => (
                    <button
                      key={breed}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setBreedInput(breed);
                        setShowBreedDropdown(false);
                      }}
                      className={optionClass}
                    >
                      {breed}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* County */}
        <div className={fieldClass}>
          <LocationIcon />

          <button
            type="button"
            onClick={() => {
              closeAllDropdowns();
              setShowCountyDropdown((open) => !open);
            }}
            className="flex min-w-0 flex-1 items-center justify-between text-left"
          >
            <div className="min-w-0">
              <span className={labelClass}>County</span>
              <span className={valueClass}>{county || 'All Counties'}</span>
            </div>

            <ArrowIcon />
          </button>

          {showCountyDropdown && (
            <div className={dropdownClass}>
              <button
                type="button"
                onClick={() => {
                  setCounty('');
                  setShowCountyDropdown(false);
                }}
                className={optionClass}
              >
                All Counties
              </button>

              {counties.map((countyOption) => (
                <button
                  key={countyOption}
                  type="button"
                  onClick={() => {
                    setCounty(countyOption);
                    setShowCountyDropdown(false);
                  }}
                  className={optionClass}
                >
                  {countyOption}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ad Type */}
        <div className={fieldClass}>
          <ListingTypeIcon />

          <button
            type="button"
            onClick={() => {
              closeAllDropdowns();
              setShowListingTypeDropdown((open) => !open);
            }}
            className="flex min-w-0 flex-1 items-center justify-between text-left"
          >
            <div className="min-w-0">
              <span className={labelClass}>Ad Type</span>
              <span className={valueClass}>{listingType || 'Any Type'}</span>
            </div>

            <ArrowIcon />
          </button>

          {showListingTypeDropdown && (
            <div className={dropdownClass}>
              {listingTypeOptions.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => {
                    setListingType(option.value);
                    setShowListingTypeDropdown(false);
                  }}
                  className={optionClass}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Button */}
        <button
          type="button"
          onClick={handleSearch}
          className="flex h-[52px] items-center justify-center gap-3 rounded-xl bg-(--primary-orange) px-6 text-base font-bold text-white shadow-sm transition hover:bg-(--secondary-orange)"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20L16.5 16.5" />
          </svg>

          <span>Search</span>
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
