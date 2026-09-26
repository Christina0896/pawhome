'use client';

import { useRef } from 'react';
import { validateImageFile } from '../../../lib/listingValidation';
import { MAX_LITTER_ANIMALS } from '../../../lib/litterAnimals';
import { INPUT_CLASS } from '../postAdOptions';

function createClientKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `animal-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createEmptyLitterAnimal(index = 0) {
  return {
    client_key: createClientKey(),
    name: `Animal ${index + 1}`,
    sex: '',
    colour: '',
    price: '',
    status: 'available',
    description: '',
    photo: null,
    photo_preview: '',
  };
}

function AnimalPhotoInput({ animal, onChange, onError }) {
  const inputRef = useRef(null);

  const choosePhoto = (file) => {
    if (!file) return;

    const error = validateImageFile(file);

    if (error) {
      onError(`${animal.name || 'Animal'}: ${error}`);
      return;
    }

    if (animal.photo_preview?.startsWith('blob:')) URL.revokeObjectURL(animal.photo_preview);
    onChange({ photo: file, photo_preview: URL.createObjectURL(file) });
    onError('');
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => {
          choosePhoto(event.target.files?.[0]);
          event.target.value = '';
        }}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-(--border-beige) bg-(--background) text-sm font-bold text-(--primary-green) hover:border-(--primary-green)"
      >
        {animal.photo_preview ? (
          <img src={animal.photo_preview} alt={`${animal.name || 'Animal'} preview`} className="h-full w-full object-cover" />
        ) : (
          'Add individual photo'
        )}
      </button>
    </div>
  );
}

export default function LitterAnimalsEditor({ animals, onChange, onError, onStatusChange }) {
  const addAnimal = () => {
    if (animals.length >= MAX_LITTER_ANIMALS) {
      onError(`You can add a maximum of ${MAX_LITTER_ANIMALS} animals to one litter.`);
      return;
    }

    onChange([...animals, createEmptyLitterAnimal(animals.length)]);
  };

  const updateAnimal = (clientKey, patch) => {
    onChange(animals.map((animal) => (animal.client_key === clientKey ? { ...animal, ...patch } : animal)));
  };

  const removeAnimal = (clientKey) => {
    const animal = animals.find((item) => item.client_key === clientKey);
    if (animal?.photo_preview?.startsWith('blob:')) URL.revokeObjectURL(animal.photo_preview);
    onChange(animals.filter((item) => item.client_key !== clientKey));
  };

  return (
    <div id="litter-animals" className="mt-8 border-t border-(--border-beige) pt-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-extrabold text-(--secondary-green)">Individual animals</h3>
          <p className="mt-1 text-sm text-(--muted-green-text)">
            Optional during launch. Add a separate card for each available puppy or kitten.
          </p>
        </div>
        <button
          type="button"
          onClick={addAnimal}
          className="rounded-xl bg-(--primary-green) px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          disabled={animals.length >= MAX_LITTER_ANIMALS}
        >
          + Add animal
        </button>
      </div>

      {animals.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-(--border-beige) bg-(--background) p-6 text-center text-sm text-(--muted-green-text)">
          No individual cards added. The litter ad will still work exactly as before.
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {animals.map((animal, index) => (
            <article key={animal.client_key} className="rounded-2xl border border-(--border-beige) bg-(--background) p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h4 className="font-extrabold text-(--secondary-green)">Animal {index + 1}</h4>
                <button type="button" onClick={() => removeAnimal(animal.client_key)} className="text-xs font-bold text-red-600">
                  Remove
                </button>
              </div>

              <AnimalPhotoInput
                animal={animal}
                onChange={(patch) => updateAnimal(animal.client_key, patch)}
                onError={onError}
              />

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  value={animal.name}
                  onChange={(event) => updateAnimal(animal.client_key, { name: event.target.value })}
                  placeholder="Name or number"
                  maxLength={80}
                  className={INPUT_CLASS}
                />
                <select value={animal.sex} onChange={(event) => updateAnimal(animal.client_key, { sex: event.target.value })} className={INPUT_CLASS}>
                  <option value="">Select sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <input
                  value={animal.colour}
                  onChange={(event) => updateAnimal(animal.client_key, { colour: event.target.value })}
                  placeholder="Colour"
                  maxLength={80}
                  className={INPUT_CLASS}
                />
                <div className="flex h-[45px] overflow-hidden rounded-xl border border-(--border-beige) bg-white">
                  <span className="flex items-center border-r border-(--border-beige) px-3 font-bold text-(--muted-green-text)">€</span>
                  <input
                    value={animal.price}
                    onChange={(event) => updateAnimal(animal.client_key, { price: event.target.value })}
                    type="number"
                    min="1"
                    placeholder="Uses litter price"
                    className="min-w-0 flex-1 px-3 text-sm outline-none"
                  />
                </div>
                <select
                  value={animal.status}
                  onChange={(event) => {
                    const status = event.target.value;
                    updateAnimal(animal.client_key, { status });
                    onStatusChange?.(animal, status);
                  }}
                  className={`${INPUT_CLASS} sm:col-span-2`}
                >
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="sold">Sold</option>
                </select>
                <textarea
                  value={animal.description}
                  onChange={(event) => updateAnimal(animal.client_key, { description: event.target.value })}
                  placeholder="Optional short description"
                  maxLength={300}
                  rows={3}
                  className="min-h-[90px] rounded-xl border border-(--border-beige) bg-white px-4 py-3 text-sm outline-none sm:col-span-2"
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
