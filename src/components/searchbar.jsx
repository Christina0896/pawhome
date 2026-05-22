'use client';

import { useEffect, useRef, useState } from 'react';
import { dogBreeds, catBreeds, otherPetTypes } from '../data/petOptions';
import { counties } from '../data/countyList';

const SearchBar = () => {
  const [animalType, setAnimalType] = useState('Dogs');
  const [breedInput, setBreedInput] = useState('');
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);

  const breedOptions = animalType === 'Dogs' ? dogBreeds : animalType === 'Cats' ? catBreeds : [];

  const filteredBreeds = breedOptions.filter((breed) => breed.toLowerCase().includes(breedInput.toLowerCase()));

  const breedSuggestions = breedInput.trim() === '' ? breedOptions : filteredBreeds;

  const breedDropdownRef = useRef(null);

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
            className="w-full rounded-lg border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0E4F2A]"
          >
            <option>Dogs</option>
            <option>Cats</option>
            <option>Other Pets</option>
          </select>
        </div>

        {/* Breed / Pet Type */}
        <div className="relative" ref={breedDropdownRef}>
          <label className="mb-2 block text-xs font-semibold text-[#123524]">
            {animalType === 'Other Pets' ? 'Pet Type' : 'Breed'}
          </label>

          {animalType === 'Other Pets' ? (
            <select className="w-full rounded-lg border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0E4F2A]">
              <option>All Pet Types</option>
              {otherPetTypes.map((type) => (
                <option key={type}>{type}</option>
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
                  className="w-full rounded-lg border border-[#E8DFD1] bg-white px-4 py-3 pr-10 text-sm outline-none transition focus:border-[#0E4F2A]"
                />

                <button
                  type="button"
                  onClick={() => setShowBreedDropdown(!showBreedDropdown)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#123524]"
                ></button>
              </div>

              {showBreedDropdown && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-[#E8DFD1] bg-white shadow-lg">
                  <p className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#A68B6B]">Suggestions:</p>

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
                  {breedSuggestions.length === 0 && (
                    <p className="px-4 py-3 text-sm text-[#5F6F64]">
                      No breed found. You can still search with your typed text.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* County */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-[#123524]">County</label>

          <select className="w-full rounded-lg border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0E4F2A]">
            <option>All Counties</option>
            {counties.map((county) => (
              <option key={county}>{county}</option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-[#123524]">Price Range</label>

          <select className="w-full rounded-lg border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0E4F2A]">
            <option>Any Price</option>
            <option>Under €500</option>
            <option>€500 - €1000</option>
            <option>€1000+</option>
          </select>
        </div>

        {/* Search Button */}
        <div className="flex items-end">
          <button className="w-full rounded-xl bg-[#FF8A2A] px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-[#E96F12]">
            Search
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
