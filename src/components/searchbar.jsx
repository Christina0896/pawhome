'use client';

import { useEffect, useRef, useState } from 'react';
import { dogBreeds, catBreeds, otherPetTypes } from '../data/petOptions';
import { counties } from '../data/countyList';

const SearchBar = () => {
  const searchBarRef = useRef(null);
  const [animalType, setAnimalType] = useState('');
  const [breedInput, setBreedInput] = useState('');
  const [county, setCounty] = useState('');
  const [listingType, setListingType] = useState('');
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  const [showAnimalDropdown, setShowAnimalDropdown] = useState(false);
  const [showCountyDropdown, setShowCountyDropdown] = useState(false);
  const [showListingTypeDropdown, setShowListingTypeDropdown] = useState(false);

  const breedOptions = animalType === 'Dogs' ? dogBreeds : animalType === 'Cats' ? catBreeds : [];

  const filteredBreeds = breedOptions.filter((breed) => breed.toLowerCase().includes(breedInput.toLowerCase()));

  const breedSuggestions =
    animalType === 'Dogs'
      ? dogBreeds
      : animalType === 'Cats'
        ? catBreeds
        : animalType === 'Other Pets'
          ? []
          : [...dogBreeds, ...catBreeds];
  const breedDropdownRef = useRef(null);

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (animalType) params.set('animalType', animalType);
    if (breedInput) params.set('breed', breedInput);
    if (county) params.set('county', county);
    if (listingType) params.set('listingType', listingType);

    const queryString = params.toString();

    window.location.href = queryString ? `/listings?${queryString}` : '/listings';
  };
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target)) {
        setShowAnimalDropdown(false);
        setShowBreedDropdown(false);
        setShowCountyDropdown(false);
        setShowListingTypeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const filteredBreedSuggestions = breedSuggestions.filter((breed) =>
    breed.toLowerCase().includes(breedInput.toLowerCase()),
  );
  return (
    <div
      ref={searchBarRef}
      className=" relative z-50 mx-auto -mt-4 max-w-6xl rounded-xl border border-(--border-beige) bg-(--secundary-background) p-5 shadow-[0_12px_35px_rgba(18,53,36,0.08)]"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5 ">
        {/* Animal Type */}
        <div className="relative flex h-[52px] items-center gap-3 rounded-xl border border-(--border-beige) p-4">
          {/* Icon */}
          <svg
            className="h-5 w-5 shrink-0 text-(--primary-green)"
            viewBox="0 0 512 512"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="currentColor"
            strokeWidth="32"
            strokeMiterlimit="10"
            aria-hidden="true"
          >
            <path d="M457.74,170.1a30.26,30.26,0,0,0-11.16-2.1h-.4c-20.17.3-42.79,19.19-54.66,47.76-14.23,34.18-7.68,69.15,14.74,78.14a30.21,30.21,0,0,0,11.15,2.1c20.27,0,43.2-19,55.17-47.76C486.71,214.06,480.06,179.09,457.74,170.1Z" />
            <path d="M327.6,303.48C299.8,257.35,287.8,240,256,240s-43.9,17.46-71.7,63.48c-23.8,39.36-71.9,42.64-83.9,76.07a50.91,50.91,0,0,0-3.6,19.25c0,27.19,20.8,49.2,46.4,49.2,31.8,0,75.1-25.39,112.9-25.39S337,448,368.8,448c25.6,0,46.3-22,46.3-49.2a51,51,0,0,0-3.7-19.25C399.4,346,351.4,342.84,327.6,303.48Z" />
            <path d="M192.51,196a26.53,26.53,0,0,0,4-.3c23.21-3.37,37.7-35.53,32.44-71.85C224,89.61,203.22,64,181.49,64a26.53,26.53,0,0,0-4,.3c-23.21,3.37-37.7,35.53-32.44,71.85C150,170.29,170.78,196,192.51,196Z" />
            <path d="M366.92,136.15c5.26-36.32-9.23-68.48-32.44-71.85a26.53,26.53,0,0,0-4-.3c-21.73,0-42.47,25.61-47.43,59.85-5.26,36.32,9.23,68.48,32.44,71.85a26.53,26.53,0,0,0,4,.3C341.22,196,362,170.29,366.92,136.15Z" />
            <path d="M105.77,293.9c22.39-9,28.93-44,14.72-78.14C108.53,187,85.62,168,65.38,168a30.21,30.21,0,0,0-11.15,2.1c-22.39,9-28.93,44-14.72,78.14C51.47,277,74.38,296,94.62,296A30.21,30.21,0,0,0,105.77,293.9Z" />
          </svg>

          <button
            type="button"
            onClick={() => {
              setShowAnimalDropdown(!showAnimalDropdown);
              setShowCountyDropdown(false);
              setShowBreedDropdown(false);
            }}
            className="flex min-w-0 flex-1 items-center justify-between text-left"
          >
            <div>
              <label className="block text-md font-bold  ">Animal Type</label>

              <p className="mt-0.5 text-sm font-medium text-(--muted-green-text)">{animalType || 'All Animals'}</p>
            </div>

            <span className="ml-3 text-xs text-(--primary-green)">▼</span>
          </button>

          {showAnimalDropdown && (
            <div className="absolute left-0 right-0 top-full z-[9999] mt-1 overflow-hidden rounded-xl border border-(--border-beige) bg-white shadow-lg">
              {[
                { label: 'All Animals', value: '' },
                { label: 'Dogs', value: 'Dogs' },
                { label: 'Cats', value: 'Cats' },
                { label: 'Other Pets', value: 'Other Pets' },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => {
                    setAnimalType(option.value);
                    setBreedInput('');
                    setShowBreedDropdown(false);
                    setShowAnimalDropdown(false);
                  }}
                  className="block w-full border-b border-(--border-beige) px-4 py-3 text-left text-md font-medium  hover:bg-(--background)"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Breed / Pet Type */}
        <div
          className="relative flex h-[52px] items-center gap-3 rounded-xl border border-(--border-beige) bg-white px-3"
          ref={breedDropdownRef}
        >
          {/* Icon */}
          <svg
            fill="#0e4f2a"
            className="h-5 w-5 shrink-0 text-(--primary-green)"
            version="1.1"
            id="Capa_1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 470.345 470.345"
            stroke="#000000"
            stroke-width="4.703450000000001"
          >
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
              {' '}
              <path d="M470.026,91.943c-0.861-3.532-3.392-6.447-6.767-7.796L434.29,72.558l-9.398-11.16c-5.082-6.035-12.512-9.372-20.41-9.202 l-14.896,0.354c-14.432,0.344-27.631,7.2-36.213,18.809l-29.548,39.978c-6.13,8.292-14.979,14.372-24.917,17.118 c-38.603,10.667-78.419,14.464-118.343,11.283l-36.471-2.905c-12.706-1.01-25.501,2.391-36.026,9.583 c0,0-29.081,20.211-30.236,21.25c-6.067,5.238-17.931,16.59-28.719,33.405c-19.169,29.876-23.679,61.641-13.188,92.188 c-8.333,7.597-18.32,14.939-29.594,19.95c-2.571,1.143-4.287,3.628-4.442,6.438c-0.761,13.691-1.508,56.114-1.885,80.184 c-0.076,4.872,1.764,9.466,5.181,12.938c3.419,3.473,7.987,5.386,12.862,5.386h19.832c2.235,0,4.354-0.997,5.778-2.719 c1.425-1.722,2.007-3.989,1.589-6.185l-2.265-11.89c-1.226-6.437-5.021-12.004-10.352-15.523l1.352-13.322 c1.534-15.125,7.377-28.982,16.476-40.243c2.737,8.119,5.488,19.971,3.453,31.163c-0.504,2.77,0.586,5.588,2.821,7.298 c1.333,1.02,2.94,1.543,4.559,1.543c1.096,0,2.198-0.24,3.224-0.729c22.616-10.771,27.428-39.636,24.276-65.083 c26.641-12.088,46.307-36.73,51.953-65.622l3.307-16.924c6.521-1.016,19.197-1.824,29.204,4.651 c3.141,2.032,6.871,5.007,11.19,8.451c17.607,14.04,43.731,34.853,86.505,39.15c-0.081,1.466-0.16,2.933-0.212,4.406l-3.188,90.042 c-0.031,0.877,0.092,1.752,0.363,2.587l10.592,32.53c3.196,9.82,12.282,16.417,22.609,16.417h24.825 c2.488,0,4.815-1.234,6.211-3.295c1.395-2.061,1.677-4.68,0.753-6.99l-3.997-9.991c-3.27-8.175-10.585-13.769-19.134-14.878 l-4.733-24.455l12.418-88.697c0.735-5.253,3.779-9.808,8.351-12.498c5.956-3.504,10.548-8.709,13.28-15.054l54.579-126.735 l39.859,5.695c9.722,1.386,19.351-2.219,25.767-9.648l8.314-9.627C469.983,99.228,470.887,95.476,470.026,91.943z M372.789,73.128 c-0.951,9.189-3.301,18.066-7.04,26.47l-6.929-10.372l6.615-8.95C367.518,77.459,370.008,75.063,372.789,73.128z M59.292,213.157 l2.528,49.918c-2.098,3.175-6.9,10.064-13.904,17.979C42.192,258.432,46,235.659,59.292,213.157z M69.126,342.987 c-1.244-10.974-4.624-20.61-6.995-26.315c3.787-3.017,7.896-5.683,12.276-7.967C75.794,324.06,73.366,335.338,69.126,342.987z M447.94,101.803c-3.062,3.544-7.651,5.266-12.294,4.603l-45.539-6.506c-3.346-0.478-6.609,1.348-7.949,4.458l-56.849,132.004 c-1.462,3.396-3.92,6.183-7.108,8.058c-8.54,5.023-14.226,13.533-15.601,23.346l-12.591,89.935c-0.114,0.82-0.093,1.653,0.064,2.465 l6.107,31.555c0.683,3.527,3.771,6.075,7.363,6.075h3.086c3.591,0,6.784,2.092,8.224,5.357h-13.741c-3.813,0-7.166-2.435-8.346-6.06 l-10.182-31.27l3.141-88.716c0.489-13.837,2.366-27.328,5.576-40.097c1.01-4.017-1.428-8.092-5.444-9.102 c-4.018-1.011-8.093,1.428-9.103,5.445c-1.947,7.744-3.422,15.73-4.45,23.876c-38.379-3.95-62.347-23.047-78.511-35.936 c-4.631-3.692-8.63-6.881-12.394-9.316c-11.687-7.562-25.049-8.286-34.329-7.529l1.99-10.182c0.794-4.065-1.857-8.005-5.922-8.799 c-4.064-0.793-8.004,1.857-8.799,5.922l-8.32,42.578c-5.045,25.819-23.488,47.579-48.132,56.787 c-15.957,5.962-29.892,16.242-40.297,29.729c-10.406,13.486-16.815,29.573-18.535,46.521l-1.873,18.465 c-0.354,3.492,1.761,6.762,5.09,7.872c3.077,1.025,5.366,3.642,5.972,6.828l0.569,2.986H18.045c-1.111,0-1.838-0.569-2.172-0.909 c-0.333-0.339-0.89-1.072-0.873-2.18c0.276-17.575,0.954-57.631,1.658-75.148c35.882-17.925,58.221-54.337,59.189-55.937 c0.775-1.282,1.15-2.766,1.074-4.263l-2.697-53.27c-0.716-14.152,6.106-27.91,17.806-35.904l24.5-16.742 c7.705-5.264,17.064-7.762,26.373-7.015l36.472,2.905c41.675,3.316,83.235-0.644,123.528-11.778 c13.157-3.635,24.871-11.682,32.985-22.66l13.458-18.208l7.128,10.668c2.198,3.291,5.793,5.204,9.712,5.204 c0.217,0,0.437-0.006,0.655-0.018c4.171-0.226,7.814-2.572,9.746-6.275l0.064-0.124c6.347-12.165,10.141-25.267,11.275-38.943 l0.408-4.926c0.534-0.04,1.069-0.071,1.608-0.084l14.896-0.354c1.971-0.06,3.878,0.436,5.555,1.376 c-3.492,0.996-5.839,4.404-5.38,8.121c0.469,3.799,3.701,6.582,7.434,6.582c0.307,0,0.617-0.019,0.929-0.058l9.309-1.149l1.34,1.591 c0.794,0.942,1.808,1.675,2.952,2.132l25.86,10.345L447.94,101.803z"></path>{' '}
            </g>
          </svg>

          <div className="min-w-0 flex-1">
            <label className="block text-md font-bold leading-tight ">
              {animalType === 'Other Pets' ? 'Pet Type' : 'Breed'}
            </label>

            {animalType === 'Other Pets' ? (
              <select
                value={breedInput}
                onChange={(e) => setBreedInput(e.target.value)}
                className="mt-0.5 w-full appearance-none bg-transparent text-sm font-medium text-(--muted-green-text) outline-none"
              >
                <option value="">All Pet Types</option>
                {otherPetTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={breedInput}
                onFocus={() => setShowBreedDropdown(true)}
                onChange={(e) => {
                  setBreedInput(e.target.value);
                  setShowBreedDropdown(true);
                }}
                placeholder="Start typing..."
                className="mt-0.5 w-full bg-transparent text-sm font-medium text-(--muted-green-text) placeholder:text-(--muted-green-text) outline-none"
              />
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setShowBreedDropdown(!showBreedDropdown);
              setShowAnimalDropdown(false);
              setShowCountyDropdown(false);
            }}
            className="shrink-0 text-xs text-(--primary-green)"
          >
            ▼
          </button>

          {showBreedDropdown && animalType !== 'Other Pets' && (
            <div className="absolute left-0 right-0 top-full z-[9999] mt-1 max-h-72 overflow-y-auto rounded-xl border border-(--border-beige) bg-white shadow-lg">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  setBreedInput('');
                  setShowBreedDropdown(false);
                }}
                className="block w-full border-b border-(--border-beige) px-4 py-3 text-left text-sm font-medium text-(--text-green) hover:bg-(--background)"
              >
                All Breeds
              </button>

              {filteredBreedSuggestions.map((breed) => (
                <button
                  key={breed}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    setBreedInput(breed);
                    setShowBreedDropdown(false);
                  }}
                  className="block w-full border-b border-(--border-beige) px-4 py-3 text-left text-sm font-medium text-(--text-green) hover:bg-(--background)"
                >
                  {breed}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* County */}
        <div className="relative ">
          <button
            type="button"
            onClick={() => {
              setShowCountyDropdown(!showCountyDropdown);
              setShowAnimalDropdown(false);
              setShowBreedDropdown(false);
              setShowListingTypeDropdown(false);
            }}
            className="flex h-[52px] w-full items-center gap-3 rounded-xl border border-(--border-beige)  px-3 text-left "
          >
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

            <div className="min-w-0 flex-1">
              <span className="block text-md font-bold leading-tight ">County</span>

              <span className="mt-0.5 block truncate text-sm font-medium text-(--muted-green-text)">
                {county || 'All Counties'}
              </span>
            </div>

            <span className="shrink-0 text-xs text-(--primary-green)">▼</span>
          </button>

          {showCountyDropdown && (
            <div className="absolute left-0 right-0 top-full z-[999] mt-2 max-h-72 overflow-y-auto rounded-xl border border-(--border-beige) bg-white shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setCounty('');
                  setShowCountyDropdown(false);
                }}
                className="block w-full border-b border-(--border-beige) px-4 py-3 text-left text-md font-medium text-(--muted-green-text) hover:bg-(--background)"
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
                  className="block w-full border-b border-(--border-beige) px-4 py-3 text-left text-md font-medium text-(--muted-green-text) hover:bg-(--background)"
                >
                  {countyOption}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ad Type */}
        <div className="relative flex h-[52px] items-center gap-3 rounded-xl border border-(--border-beige)  px-3  ">
          {/* Icon */}
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

          <button
            type="button"
            onClick={() => {
              setShowListingTypeDropdown(!showListingTypeDropdown);
              setShowAnimalDropdown(false);
              setShowBreedDropdown(false);
              setShowCountyDropdown(false);
            }}
            className="flex min-w-0 flex-1 items-center justify-between text-left"
          >
            <div className="min-w-0 ">
              <label className="block text-md font-bold leading-tight ">Ad Type</label>

              <p className="mt-0.5 truncate text-sm font-medium text-(--muted-green-text)">
                {listingType || 'Any Type'}
              </p>
            </div>

            <span className="ml-3 text-xs text-(--primary-green)">▼</span>
          </button>

          {showListingTypeDropdown && (
            <div className="absolute left-0 right-0 top-full z-[999] mt-2 overflow-hidden rounded-xl border border-(--border-beige) bg-white shadow-lg">
              {[
                { label: 'Any Type', value: '' },
                { label: 'For Sale', value: 'For Sale' },
                { label: 'For Stud', value: 'For Stud' },
                { label: 'For Adoption', value: 'For Adoption' },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => {
                    setListingType(option.value);
                    setShowListingTypeDropdown(false);
                  }}
                  className="block w-full border-b border-(--border-beige) px-4 py-3 text-left text-md font-medium text-(--muted-green-text) hover:bg-(--background)"
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
          className="flex w-45 h-[52px] items-center justify-center gap-3 rounded-xl mx-5 bg-(--primary-orange) text-base font-bold text-white shadow-sm transition hover:bg-(--secondary-orange)"
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
