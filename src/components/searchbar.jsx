'use client';

import { useEffect, useRef, useState } from 'react';
import { dogBreeds, catBreeds, otherPetTypes } from '../data/petOptions';
import { counties } from '../data/countyList';

const SearchBar = () => {
  const [animalType, setAnimalType] = useState('');
  const [breedInput, setBreedInput] = useState('');
  const [county, setCounty] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);

  const breedOptions = animalType === 'Dogs' ? dogBreeds : animalType === 'Cats' ? catBreeds : [];

  const filteredBreeds = breedOptions.filter((breed) => breed.toLowerCase().includes(breedInput.toLowerCase()));

  const breedSuggestions = breedInput.trim() === '' ? breedOptions : filteredBreeds;
  const breedDropdownRef = useRef(null);

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (animalType) params.set('animalType', animalType);
    if (breedInput) params.set('breed', breedInput);
    if (county) params.set('county', county);

    if (priceRange === 'under-500') {
      params.set('maxPrice', '500');
    }

    if (priceRange === '500-1000') {
      params.set('minPrice', '500');
      params.set('maxPrice', '1000');
    }

    if (priceRange === '1000-plus') {
      params.set('minPrice', '1000');
    }

    const queryString = params.toString();

    window.location.href = queryString ? `/listings?${queryString}` : '/listings';
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (breedDropdownRef.current && !breedDropdownRef.current.contains(event.target)) {
        setShowBreedDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative z-20 mx-auto -mt-4 max-w-6xl rounded-2xl border border-[#E8DFD1] bg-white p-5 shadow-[0_12px_35px_rgba(18,53,36,0.08)]">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {/* Animal Type */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-[#123524]">Animal Type</label>
          <select
            value={animalType}
            onChange={(e) => {
              setAnimalType(e.target.value);
              setBreedInput('');
              setShowBreedDropdown(false);
            }}
            className="w-full rounded-lg border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="">All Animals</option>
            <option value="Dogs">Dogs</option>
            <option value="Cats">Cats</option>
            <option value="Other Pets">Other Pets</option>
          </select>
        </div>

        {/* Breed / Pet Type */}
        <div className="relative" ref={breedDropdownRef}>
          <label className="mb-2 block text-xs font-semibold text-[#123524]">
            {animalType === 'Other Pets' ? 'Pet Type' : 'Breed'}
          </label>

          {animalType === 'Other Pets' ? (
            <select
              value={breedInput}
              onChange={(e) => setBreedInput(e.target.value)}
              className="w-full rounded-lg border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none"
            >
              <option value="">All Pet Types</option>
              {otherPetTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          ) : (
            <>
              <div className="relative">
                <input
                  type="text"
                  value={breedInput}
                  onFocus={() => setShowBreedDropdown(true)}
                  onChange={(e) => {
                    setBreedInput(e.target.value);
                    setShowBreedDropdown(true);
                  }}
                  placeholder="Start typing..."
                  className="w-full rounded-lg border border-[#E8DFD1] bg-white px-4 py-3 pr-10 text-sm outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowBreedDropdown(!showBreedDropdown)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#123524]"
                >
                  ▼
                </button>
              </div>

              {showBreedDropdown && (
                <div className="absolute left-0 right-0 top-full z-[999] mt-2 max-h-72 overflow-y-auto rounded-xl border border-[#E8DFD1] bg-white shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setBreedInput('');
                      setShowBreedDropdown(false);
                    }}
                    className="block w-full border-b border-[#EFE5D6] px-4 py-3 text-left text-sm text-[#123524] hover:bg-[#FAF6EC]"
                  >
                    All Breeds
                  </button>

                  {breedSuggestions.map((breed) => (
                    <button
                      key={breed}
                      type="button"
                      onClick={() => {
                        setBreedInput(breed);
                        setShowBreedDropdown(false);
                      }}
                      className="block w-full border-b border-[#EFE5D6] px-4 py-3 text-left text-sm text-[#123524] hover:bg-[#FAF6EC]"
                    >
                      {breed}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* County */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-[#123524]">County</label>

          <select
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            className="w-full rounded-lg border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="">All Counties</option>
            {counties.map((county) => (
              <option key={county} value={county}>
                {county}
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-[#123524]">Price Range</label>

          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="w-full rounded-lg border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="">Any Price</option>
            <option value="under-500">Under €500</option>
            <option value="500-1000">€500 - €1000</option>
            <option value="1000-plus">€1000+</option>
          </select>
        </div>

        {/* Search Button */}
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleSearch}
            className="w-full rounded-xl bg-[#FF8A2A] px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-[#E96F12]"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
