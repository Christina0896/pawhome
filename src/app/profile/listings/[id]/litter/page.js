'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '../../../../../components/header';
import Footer from '../../../../../components/footer';
import { getVerifiedAccessToken } from '../../../../../lib/authTokens';
import LitterAnimalsEditor, { createEmptyLitterAnimal } from '../../../../post-ad/components/LitterAnimalsEditor';

function mapSavedAnimal(animal) {
  return {
    ...animal,
    client_key: `existing-${animal.id}`,
    price: animal.price ?? '',
    colour: animal.colour || '',
    description: animal.description || '',
    photo: null,
    photo_preview: animal.image_url || '',
  };
}

export default function LitterManagerPage() {
  const params = useParams();
  const listingId = params.id;
  const [listing, setListing] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');

  useEffect(() => {
    let active = true;

    const load = async () => {
      const token = await getVerifiedAccessToken();
      if (!token) return;

      try {
        const response = await fetch(`/api/profile/listings/${listingId}/litter-animals`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();

        if (!response.ok) throw new Error(result.error || 'Could not load the litter manager.');
        if (!active) return;

        setListing(result.listing);
        setAnimals((result.animals || []).map(mapSavedAnimal));
      } catch (error) {
        if (active) setMessage(error.message || 'Could not load the litter manager.');
      } finally {
        if (active) setLoading(false);
      }
    };

    if (listingId) load();
    return () => {
      active = false;
    };
  }, [listingId]);

  const setError = (error) => {
    setMessageType('error');
    setMessage(error);
  };

  const saveAnimals = async () => {
    for (const [index, animal] of animals.entries()) {
      if (!animal.name?.trim()) return setError(`Please enter a name or number for animal ${index + 1}.`);
      if (!animal.sex) return setError(`Please select a sex for ${animal.name || `animal ${index + 1}`}.`);
      if (!animal.id && !animal.photo) return setError(`Please add an individual photo for ${animal.name}.`);
    }

    const token = await getVerifiedAccessToken();
    if (!token) return;

    const body = new FormData();
    body.append(
      'litter_animals',
      JSON.stringify(
        animals.map((animal) => ({
          id: animal.id || null,
          client_key: animal.client_key,
          name: animal.name,
          sex: animal.sex,
          colour: animal.colour,
          price: animal.price,
          status: animal.status,
          description: animal.description,
        })),
      ),
    );
    animals.forEach((animal) => {
      if (animal.photo) body.append(`litter_photo_${animal.client_key}`, animal.photo);
    });

    setSaving(true);
    setMessage('');

    try {
      const response = await fetch(`/api/profile/listings/${listingId}/litter-animals`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Could not save the litter animals.');

      setAnimals((result.animals || []).map(mapSavedAnimal));
      setListing((current) => ({ ...current, status: result.status || current.status }));
      setMessageType('success');
      setMessage('Litter animals saved. Content changes have sent the listing back for review.');
    } catch (error) {
      setError(error.message || 'Could not save the litter animals.');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (animal, status) => {
    if (!animal.id) return;

    const token = await getVerifiedAccessToken();
    if (!token) return;

    try {
      const response = await fetch(`/api/profile/listings/${listingId}/litter-animals`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ animalId: animal.id, status }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Could not change the animal status.');
      setAnimals((result.animals || []).map(mapSavedAnimal));
      setMessageType('success');
      setMessage(`${animal.name} is now ${status}.`);
    } catch (error) {
      setAnimals((current) => current.map((item) => (item.id === animal.id ? { ...item, status: animal.status } : item)));
      setError(error.message || 'Could not change the animal status.');
    }
  };

  return (
    <div className="min-h-screen bg-(--background)">
      <Header />
      <main className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="mb-6 text-sm text-(--muted-green-text)">
          <Link href="/profile" className="hover:text-(--primary-green)">Profile</Link>
          <span className="mx-2">›</span>
          <span>Manage litter</span>
        </div>

        <section className="rounded-3xl border border-(--border-beige) bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col justify-between gap-4 border-b border-(--border-beige) pb-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-bold text-(--primary-green)">Litter Manager</p>
              <h1 className="mt-1 text-3xl font-extrabold text-(--secondary-green)">{listing?.title || 'Your litter'}</h1>
              {listing && <p className="mt-2 text-sm text-(--muted-green-text)">{listing.breed} · {listing.litter_size || 0} in litter · Status: {listing.status}</p>}
            </div>
            <div className="flex gap-3">
              <Link href={`/profile/listings/${listingId}/edit`} className="rounded-xl border border-(--border-beige) px-5 py-3 text-sm font-bold text-(--secondary-green)">Edit ad</Link>
              <button type="button" onClick={saveAnimals} disabled={saving || loading || !listing} className="rounded-xl bg-(--primary-orange) px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
                {saving ? 'Saving...' : 'Save litter'}
              </button>
            </div>
          </div>

          {message && (
            <p className={`mt-5 rounded-xl px-4 py-3 text-sm font-bold ${messageType === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </p>
          )}

          {loading ? (
            <p className="py-10 text-sm text-(--muted-green-text)">Loading litter animals...</p>
          ) : listing ? (
            <LitterAnimalsEditor
              animals={animals}
              onChange={(nextAnimals) => {
                setAnimals(nextAnimals);
                setMessage('');
              }}
              onError={setError}
              onStatusChange={changeStatus}
            />
          ) : null}

          {!loading && listing && animals.length === 0 && (
            <button
              type="button"
              onClick={() => setAnimals([createEmptyLitterAnimal(0)])}
              className="mt-4 text-sm font-bold text-(--primary-green)"
            >
              Create the first individual card
            </button>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
