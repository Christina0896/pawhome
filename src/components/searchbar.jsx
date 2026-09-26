'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dogBreeds, catBreeds, otherPetTypes } from '../data/petOptions';
import { counties } from '../data/countyList';
import { PawIcon, BreedIcon, LocationIcon, ListingTypeIcon, SearchIcon, ArrowIcon } from './Icons';

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

const DropdownArrow = ({ open = false }) => (
  <ArrowIcon className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? '-rotate-90' : 'rotate-90'}`} />
);

const SearchBar = () => {
  const router = useRouter();
  const searchBarRef = useRef(null);

  const [animalType, setAnimalType] = useState('');
  const [breedInput, setBreedInput] = useState('');
  const [county, setCounty] = useState('');
  const [listingType, setListingType] = useState('');

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

  const toggleDropdown = (dropdown) => {
    const wasOpen = {
      animal: showAnimalDropdown,
      breed: showBreedDropdown,
      county: showCountyDropdown,
      listingType: showListingTypeDropdown,
    }[dropdown];

    closeAllDropdowns();

    if (wasOpen) return;

    if (dropdown === 'animal') setShowAnimalDropdown(true);
    if (dropdown === 'breed') setShowBreedDropdown(true);
    if (dropdown === 'county') setShowCountyDropdown(true);
    if (dropdown === 'listingType') setShowListingTypeDropdown(true);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (animalType) params.set('animalType', animalType);
    if (breedInput) params.set('breed', breedInput);
    if (county) params.set('county', county);
    if (listingType) params.set('listingType', listingType);

    const queryString = params.toString();

    router.push(queryString ? `/listings?${queryString}` : '/listings');
  };

  return (
    <div
      ref={searchBarRef}
      className="relative z-50 mx-auto max-w-[1280px] rounded-[18px] border border-(--border-beige) bg-(--background) p-4 shadow-[0_12px_35px_rgba(18,53,36,0.12)]"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_190px]">
        <div className={fieldClass}>
          <PawIcon className="h-5 w-5 shrink-0 text-(--primary-green)" />

          <button
            type="button"
            onClick={() => toggleDropdown('animal')}
            className="flex min-w-0 flex-1 items-center justify-between text-left"
          >
            <div className="min-w-0">
              <span className={labelClass}>Animal Type</span>
              <span className={valueClass}>{animalType || 'All Animals'}</span>
            </div>

            <DropdownArrow open={showAnimalDropdown} />
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

        <div className={fieldClass}>
          <BreedIcon className="h-5 w-5 shrink-0 text-(--primary-green)" />

          <div className="min-w-0 flex-1">
            <span className={labelClass}>{animalType === 'Other Pets' ? 'Pet Type' : 'Breed'}</span>

            {animalType === 'Other Pets' ? (
              <button
                type="button"
                onClick={() => toggleDropdown('breed')}
                className="mt-0.5 flex w-full items-center justify-between text-left text-sm font-medium text-(--muted-green-text)"
              >
                <span className="truncate">{breedInput || 'All Pet Types'}</span>
                <DropdownArrow open={showBreedDropdown} />
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
            <button type="button" onClick={() => toggleDropdown('breed')} className="shrink-0" aria-label="Open breed dropdown">
              <DropdownArrow open={showBreedDropdown} />
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

        <div className={fieldClass}>
          <LocationIcon className="h-5 w-5 shrink-0 text-(--primary-green)" />

          <button
            type="button"
            onClick={() => toggleDropdown('county')}
            className="flex min-w-0 flex-1 items-center justify-between text-left"
          >
            <div className="min-w-0">
              <span className={labelClass}>County</span>
              <span className={valueClass}>{county || 'All Counties'}</span>
            </div>

            <DropdownArrow open={showCountyDropdown} />
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

        <div className={fieldClass}>
          <ListingTypeIcon className="h-5 w-5 shrink-0 text-(--primary-green)" />

          <button
            type="button"
            onClick={() => toggleDropdown('listingType')}
            className="flex min-w-0 flex-1 items-center justify-between text-left"
          >
            <div className="min-w-0">
              <span className={labelClass}>Ad Type</span>
              <span className={valueClass}>{listingType || 'Any Type'}</span>
            </div>

            <DropdownArrow open={showListingTypeDropdown} />
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

        <button
          type="button"
          onClick={handleSearch}
          className="flex h-[52px] cursor-pointer items-center justify-center gap-3 rounded-xl bg-(--primary-orange) px-6 text-base font-bold text-white shadow-sm transition hover:bg-(--secondary-orange)"
        >
          <SearchIcon className="h-5 w-5" />
          <span>Search</span>
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
