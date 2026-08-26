'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '../../../../../components/header';
import Footer from '../../../../../components/footer';
import { supabase } from '../../../../../lib/supabaseClient';
import { counties } from '../../../../../data/countyList';
import { dogBreeds, catBreeds, otherPetTypes } from '../../../../../data/petOptions';
import { getVerifiedAccessToken } from '../../../../../lib/authTokens';
import {
  addWeeksToDate,
  getMinimumLegalAgeWeeks,
  validateImageFile,
  validateListingAgeAndDates,
} from '../../../../../lib/listingValidation';

const emptyForm = {
  title: '',
  listing_type: '',
  animal_type: 'Dogs',
  breed: '',
  age: '',
  sex: '',
  price: '',
  price_negotiable: false,
  county: '',
  city: '',
  microchipped: '',
  vaccinated: '',
  wormed: '',
  vet_checked: '',
  spayed_neutered: '',
  health_tested: '',
  kennel_club_registered: '',
  proven_stud: '',
  stud_terms: '',
  litter_size: '',
  available_litter_count: '',
  male_count: '',
  female_count: '',
  date_of_birth: '',
  ready_to_leave: '',
  mother_can_be_seen: '',
  registration_number: '',
  organisation_name: '',
  description: '',
  seller_type: 'Private Seller',
  seller_verified: false,
};

function formatDateInput(date) {
  if (!date) return '';
  return date.toISOString().split('T')[0];
}

export default function EditListingPage() {
  const params = useParams();
  const listingId = params.id;
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [photos, setPhotos] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState([]);
  const [photosToDelete, setPhotosToDelete] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');

  const isDogOrCat = ['dogs', 'cats'].includes(formData.animal_type?.toLowerCase());
  const isMixedLitter = formData.sex === 'Mixed Litter';
  const priceRequired = ['For Sale', 'For Stud'].includes(formData.listing_type);
  const minimumLegalAgeWeeks = useMemo(
    () => getMinimumLegalAgeWeeks(formData.animal_type, formData.breed),
    [formData.animal_type, formData.breed],
  );
  const minimumReadyDate = useMemo(
    () => formatDateInput(addWeeksToDate(formData.date_of_birth, minimumLegalAgeWeeks)),
    [formData.date_of_birth, minimumLegalAgeWeeks],
  );

  const breedOptions =
    formData.animal_type === 'Dogs'
      ? dogBreeds
      : formData.animal_type === 'Cats'
        ? catBreeds
        : formData.animal_type === 'Other Pets'
          ? otherPetTypes
          : [];

  useEffect(() => {
    let active = true;

    const loadListing = async () => {
      setLoading(true);

      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        window.location.href = '/';
        return;
      }

      setUser(currentUser);

      const { data, error } = await supabase
        .from('listings')
        .select(
          `
            *,
            listing_photos (
              id,
              image_url,
              sort_order
            )
          `,
        )
        .eq('id', listingId)
        .eq('user_id', currentUser.id)
        .single();

      if (!active) return;

      if (error || !data) {
        console.error('Listing fetch error:', error);
        window.location.href = '/profile';
        return;
      }

      setFormData({
        ...emptyForm,
        title: data.title || '',
        listing_type: data.listing_type || '',
        animal_type: data.animal_type || 'Dogs',
        breed: data.breed || '',
        age: data.age || '',
        sex: data.sex || '',
        price: data.price ?? '',
        price_negotiable: Boolean(data.price_negotiable),
        county: data.county || '',
        city: data.city || '',
        microchipped: data.microchipped || '',
        vaccinated: data.vaccinated || '',
        wormed: data.wormed || '',
        vet_checked: data.vet_checked || '',
        spayed_neutered: data.spayed_neutered || '',
        health_tested: data.health_tested || '',
        kennel_club_registered: data.kennel_club_registered || '',
        proven_stud: data.proven_stud || '',
        stud_terms: data.stud_terms || '',
        litter_size: data.litter_size ?? '',
        available_litter_count: data.available_litter_count ?? '',
        male_count: data.male_count ?? '',
        female_count: data.female_count ?? '',
        date_of_birth: data.date_of_birth || '',
        ready_to_leave: data.ready_to_leave || '',
        mother_can_be_seen: data.mother_can_be_seen || '',
        registration_number: data.registration_number || '',
        organisation_name: data.organisation_name || '',
        description: data.description || '',
        seller_type: data.seller_type || 'Private Seller',
        seller_verified: Boolean(data.seller_verified),
      });

      setPhotos([...(data.listing_photos || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
      setLoading(false);
    };

    if (listingId) loadListing();

    return () => {
      active = false;
    };
  }, [listingId]);

  useEffect(
    () => () => {
      newPhotoPreviews.forEach((preview) => URL.revokeObjectURL(preview));
    },
    [newPhotoPreviews],
  );

  const visiblePhotos = photos.filter(
    (photo) => !photosToDelete.some((deletedPhoto) => String(deletedPhoto.id) === String(photo.id)),
  );
  const totalPhotoCount = visiblePhotos.length + newPhotos.length;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => {
      const next = {
        ...current,
        [name]: type === 'checkbox' ? checked : value,
      };

      if (name === 'animal_type') next.breed = '';
      if (name === 'listing_type' && value === 'For Adoption') {
        next.price_negotiable = false;
      }

      return next;
    });

    setErrors((current) => ({ ...current, [name]: '', submit: '' }));
    setMessage('');
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.title.trim() || formData.title.trim().length < 5) nextErrors.title = 'Title must be at least 5 characters.';
    if (!formData.listing_type) nextErrors.listing_type = 'Ad type is required.';
    if (!formData.animal_type) nextErrors.animal_type = 'Animal type is required.';
    if (!formData.breed.trim()) nextErrors.breed = 'Breed or pet type is required.';
    if (!formData.age.trim()) nextErrors.age = 'Age is required.';
    if (!formData.sex) nextErrors.sex = 'Sex is required.';
    if (priceRequired && (!formData.price || Number(formData.price) <= 0)) nextErrors.price = 'A positive price is required.';
    if (formData.price !== '' && !Number.isFinite(Number(formData.price))) nextErrors.price = 'Enter a valid price.';
    if (!formData.county) nextErrors.county = 'County is required.';

    if (formData.animal_type === 'Dogs' && !formData.microchipped) {
      nextErrors.microchipped = 'Please confirm if the dog is microchipped.';
    }

    if (!formData.description || formData.description.trim().length < 80) {
      nextErrors.description = 'Description must be at least 80 characters.';
    }

    const ageError = validateListingAgeAndDates({
      animalType: formData.animal_type,
      breed: formData.breed,
      age: formData.age,
      dateOfBirth: formData.date_of_birth,
      readyToLeave: formData.ready_to_leave,
      requireDates: isDogOrCat && isMixedLitter,
    });

    if (ageError) {
      if (ageError.toLowerCase().includes('ready')) nextErrors.ready_to_leave = ageError;
      else if (ageError.toLowerCase().includes('date of birth')) nextErrors.date_of_birth = ageError;
      else nextErrors.age = ageError;
    }

    if (isDogOrCat && isMixedLitter) {
      const litterSize = Number(formData.litter_size);
      const available = Number(formData.available_litter_count);
      const boys = Number(formData.male_count || 0);
      const girls = Number(formData.female_count || 0);

      if (!Number.isInteger(litterSize) || litterSize < 1) nextErrors.litter_size = 'Litter size must be at least 1.';
      if (!Number.isInteger(available) || available < 1) nextErrors.available_litter_count = 'Available count must be at least 1.';
      if (available > litterSize) nextErrors.available_litter_count = 'Available cannot be higher than litter size.';
      if (!Number.isInteger(boys) || boys < 0) nextErrors.male_count = 'Enter a valid number of boys.';
      if (!Number.isInteger(girls) || girls < 0) nextErrors.female_count = 'Enter a valid number of girls.';
      if (boys + girls !== available) {
        nextErrors.male_count = 'Boys and girls together must match the available count.';
        nextErrors.female_count = 'Boys and girls together must match the available count.';
      }
    }

    if (totalPhotoCount === 0) nextErrors.photos = 'Please keep at least one photo.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAddEditPhotos = (files) => {
    const validFiles = [];

    for (const file of files) {
      const validationError = validateImageFile(file);

      if (validationError) {
        setMessageType('error');
        setMessage(`${file.name}: ${validationError}`);
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) return;

    const remainingSlots = 6 - totalPhotoCount;
    if (remainingSlots <= 0) {
      setMessageType('error');
      setMessage('You can upload a maximum of 6 photos.');
      return;
    }

    const filesToAdd = validFiles.slice(0, remainingSlots);
    setNewPhotos((current) => [...current, ...filesToAdd]);
    setNewPhotoPreviews((current) => [...current, ...filesToAdd.map((file) => URL.createObjectURL(file))]);

    if (validFiles.length > remainingSlots) {
      setMessageType('error');
      setMessage('Only the files that fit within the 6-photo limit were added.');
    }
  };

  const handleRemoveExistingPhoto = (photo) => {
    setPhotosToDelete((current) => (current.some((item) => item.id === photo.id) ? current : [...current, photo]));
  };

  const handleRemoveNewPhoto = (indexToRemove) => {
    const preview = newPhotoPreviews[indexToRemove];
    if (preview) URL.revokeObjectURL(preview);
    setNewPhotos((current) => current.filter((_, index) => index !== indexToRemove));
    setNewPhotoPreviews((current) => current.filter((_, index) => index !== indexToRemove));
  };

  const handleSaveListing = async (event) => {
    event.preventDefault();
    if (!user || saving) return;

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const accessToken = await getVerifiedAccessToken();
      if (!accessToken) return;

      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => submitData.append(key, value ?? ''));
      photosToDelete.forEach((photo) => photo.id && submitData.append('photosToDelete', String(photo.id)));
      newPhotos.forEach((file) => submitData.append('newPhotos', file));

      const response = await fetch(`/api/profile/listings/${listingId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: submitData,
      });
      const result = await response.json();

      if (!response.ok) {
        setMessageType('error');
        setMessage(result.error || 'Could not save listing. Please try again.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (result.warning) {
        setMessageType('warning');
        setMessage(result.warning);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.setTimeout(() => {
          window.location.href = '/profile';
        }, 2500);
      } else {
        window.location.href = '/profile';
      }
    } catch (error) {
      console.error('Listing edit request failed:', error);
      setMessageType('error');
      setMessage('Could not save listing. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-(--background)">
        <Header />
        <main className="mx-auto max-w-[1440px] px-6 py-10">
          <p className="text-sm text-(--secondary-green)">Loading listing...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--background)">
      <Header />

      <main className="mx-auto max-w-[1440px] px-6 py-10">
        <div className="mb-6 text-sm text-(--muted-green-text)">
          <Link href="/profile" className="hover:text-(--primary-green)">Profile</Link>
          <span className="mx-2">›</span>
          <span>Edit Listing</span>
        </div>

        <form onSubmit={handleSaveListing} className="rounded-3xl border border-(--border-beige) bg-white p-6 shadow-sm">
          <div className="mb-8 flex flex-col justify-between gap-4 border-b border-(--border-beige) pb-6 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-(--secondary-green)">Edit Listing</h1>
              <p className="mt-2 text-sm text-(--muted-green-text)">Changes send your ad back for review.</p>
              <p className="mt-1 text-xs font-semibold text-(--primary-green)">
                Public seller status: {formData.seller_type}{formData.seller_verified ? ' — verified by PawHome' : ''}
              </p>
            </div>

            <div className="flex gap-3">
              <Link href="/profile" className="flex h-11 items-center justify-center rounded-xl border border-(--border-beige) px-5 text-sm font-bold text-(--secondary-green) transition hover:border-(--primary-green)">Cancel</Link>
              <button type="submit" disabled={saving} className="flex h-11 items-center justify-center rounded-xl bg-(--primary-green) px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {message && (
            <div className={`mb-6 rounded-2xl border px-5 py-4 text-sm font-bold ${messageType === 'warning' ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}

          {Object.values(errors).filter(Boolean).length > 0 && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              <p className="font-bold">Please fix the following:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {Object.values(errors).filter(Boolean).map((error) => <li key={error}>{error}</li>)}
              </ul>
            </div>
          )}

          <section className="mb-8">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-(--secondary-green)">Photos</h2>
                <p className="mt-1 text-xs text-(--muted-green-text)">Add or remove photos. Maximum 6 photos.</p>
              </div>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={totalPhotoCount >= 6} className="flex h-10 items-center justify-center rounded-xl bg-(--primary-green) px-4 text-sm font-bold text-white disabled:opacity-50">Add Photos</button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { handleAddEditPhotos(Array.from(event.target.files || [])); event.target.value = ''; }} className="hidden" />
            </div>

            {totalPhotoCount === 0 && <div className="rounded-2xl border border-dashed border-(--border-beige) bg-(--background) p-6 text-center text-sm font-semibold text-(--muted-green-text)">No photos selected.</div>}

            {totalPhotoCount > 0 && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
                {visiblePhotos.map((photo) => (
                  <PhotoTile key={photo.id || photo.image_url} src={photo.image_url} alt="Listing photo" onRemove={() => handleRemoveExistingPhoto(photo)} />
                ))}
                {newPhotoPreviews.map((preview, index) => (
                  <PhotoTile key={preview} src={preview} alt="New listing photo" badge="New" onRemove={() => handleRemoveNewPhoto(index)} />
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-(--muted-green-text)">{totalPhotoCount}/6 photos selected.</p>
            {errors.photos && <p className="mt-2 text-xs font-medium text-red-500">{errors.photos}</p>}
          </section>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <SelectField label="Ad Type" name="listing_type" value={formData.listing_type} onChange={handleChange} error={errors.listing_type} options={['For Sale', 'For Stud', 'For Adoption']} required />
            <SelectField label="Animal Type" name="animal_type" value={formData.animal_type} onChange={handleChange} error={errors.animal_type} options={['Dogs', 'Cats', 'Other Pets']} required />
            <TextField label="Listing Title" name="title" value={formData.title} onChange={handleChange} error={errors.title} required maxLength={80} />
            <SelectField label={formData.animal_type === 'Other Pets' ? 'Pet Type' : 'Breed'} name="breed" value={formData.breed} onChange={handleChange} error={errors.breed} options={breedOptions} required />
            <TextField label="Age" name="age" value={formData.age} onChange={handleChange} error={errors.age} required placeholder="8 weeks" />
            <SelectField label="Sex" name="sex" value={formData.sex} onChange={handleChange} error={errors.sex} options={['Male', 'Female', 'Mixed Litter']} required />

            <div>
              <label className="mb-2 block text-sm font-bold text-(--secondary-green)">Price {priceRequired && <span className="text-(--primary-orange)">*</span>}</label>
              <div className="flex h-12 overflow-hidden rounded-xl border border-(--border-beige) bg-white">
                <div className="flex items-center border-r border-(--border-beige) px-3 font-bold text-(--muted-green-text)">€</div>
                <input name="price" type="number" min="0" value={formData.price} onChange={handleChange} disabled={formData.listing_type === 'For Adoption' && formData.price === ''} className="min-w-0 flex-1 px-3 text-sm text-(--secondary-green) outline-none" />
                {formData.listing_type !== 'For Adoption' && (
                  <label className="flex items-center gap-2 border-l border-(--border-beige) px-3 text-xs font-bold text-(--muted-green-text)">
                    <input name="price_negotiable" type="checkbox" checked={formData.price_negotiable} onChange={handleChange} className="h-4 w-4 accent-(--primary-green)" /> Negotiable
                  </label>
                )}
              </div>
              {formData.listing_type === 'For Adoption' && <p className="mt-1 text-xs text-(--muted-green-text)">A fee is optional for adoption listings.</p>}
              {errors.price && <p className="mt-2 text-xs font-medium text-red-500">{errors.price}</p>}
            </div>

            <SelectField label="County" name="county" value={formData.county} onChange={handleChange} error={errors.county} options={counties} required />
            <TextField label="Town / City" name="city" value={formData.city} onChange={handleChange} maxLength={80} />
            <TextField label="Organisation Name" name="organisation_name" value={formData.organisation_name} onChange={handleChange} maxLength={120} />
            <TextField label="Registration Number" name="registration_number" value={formData.registration_number} onChange={handleChange} maxLength={120} />
            <SelectField label="Microchipped" name="microchipped" value={formData.microchipped} onChange={handleChange} error={errors.microchipped} options={['Yes', 'No']} />
            <SelectField label="Vaccinated" name="vaccinated" value={formData.vaccinated} onChange={handleChange} options={['Yes', 'No', 'Unknown']} />
            <SelectField label="Wormed" name="wormed" value={formData.wormed} onChange={handleChange} options={['Yes', 'No', 'Unknown']} />
            <SelectField label="Vet Checked" name="vet_checked" value={formData.vet_checked} onChange={handleChange} options={['Yes', 'No']} />
            <SelectField label="Spayed / Neutered" name="spayed_neutered" value={formData.spayed_neutered} onChange={handleChange} options={['Yes', 'No', 'Not old enough']} />
            <SelectField label="Health Tested" name="health_tested" value={formData.health_tested} onChange={handleChange} options={['Yes', 'No']} />
            {formData.animal_type === 'Dogs' && <SelectField label="IKC / KC Registered" name="kennel_club_registered" value={formData.kennel_club_registered} onChange={handleChange} options={['Yes', 'No']} />}
          </div>

          {formData.listing_type === 'For Stud' && (
            <section className="mt-8 rounded-2xl border border-(--border-beige) bg-(--background) p-5">
              <h2 className="text-lg font-extrabold text-(--secondary-green)">Stud Information</h2>
              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                <SelectField label="Proven Stud" name="proven_stud" value={formData.proven_stud} onChange={handleChange} options={['Yes', 'No']} />
                <div>
                  <label className="mb-2 block text-sm font-bold text-(--secondary-green)">Stud Terms</label>
                  <textarea name="stud_terms" value={formData.stud_terms} onChange={handleChange} maxLength={800} rows={5} className="w-full rounded-xl border border-(--border-beige) bg-white px-4 py-3 text-sm outline-none focus:border-(--primary-green)" />
                </div>
              </div>
            </section>
          )}

          {(minimumLegalAgeWeeks || isMixedLitter) && (
            <section className="mt-8 rounded-2xl border border-(--border-beige) bg-(--background) p-5">
              <h2 className="text-lg font-extrabold text-(--secondary-green)">{isMixedLitter ? 'Litter Information' : 'Age & Ready-to-Leave Information'}</h2>
              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                {isMixedLitter && (
                  <>
                    <TextField label="Litter Size" name="litter_size" type="number" min="1" value={formData.litter_size} onChange={handleChange} error={errors.litter_size} required />
                    <TextField label="Available" name="available_litter_count" type="number" min="1" value={formData.available_litter_count} onChange={handleChange} error={errors.available_litter_count} required />
                    <TextField label="Number of Boys" name="male_count" type="number" min="0" value={formData.male_count} onChange={handleChange} error={errors.male_count} required />
                    <TextField label="Number of Girls" name="female_count" type="number" min="0" value={formData.female_count} onChange={handleChange} error={errors.female_count} required />
                  </>
                )}
                <TextField label="Date of Birth" name="date_of_birth" type="date" max={formatDateInput(new Date())} value={formData.date_of_birth} onChange={(event) => { handleChange(event); if (event.target.value && minimumLegalAgeWeeks) setFormData((current) => ({ ...current, ready_to_leave: formatDateInput(addWeeksToDate(event.target.value, minimumLegalAgeWeeks)) })); }} error={errors.date_of_birth} required={isMixedLitter} />
                <TextField label="Ready to Leave" name="ready_to_leave" type="date" min={minimumReadyDate || undefined} value={formData.ready_to_leave} onChange={handleChange} error={errors.ready_to_leave} required={isMixedLitter} />
                {isMixedLitter && <SelectField label="Mother Can Be Seen" name="mother_can_be_seen" value={formData.mother_can_be_seen} onChange={handleChange} options={['Yes', 'No']} />}
              </div>
              {minimumReadyDate && <p className="mt-3 text-xs font-semibold text-(--muted-green-text)">Minimum ready date: {minimumReadyDate}</p>}
            </section>
          )}

          <section className="mt-8">
            <label className="mb-2 block text-sm font-bold text-(--secondary-green)">Description <span className="text-(--primary-orange)">*</span></label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={8} maxLength={800} className="min-h-[200px] w-full resize-y rounded-xl border border-(--border-beige) bg-white px-4 py-3 text-sm leading-6 text-(--secondary-green) outline-none focus:border-(--primary-green)" />
            <div className="mt-2 flex justify-between text-xs text-(--muted-green-text)">
              <span>{errors.description || 'Minimum 80 characters.'}</span>
              <span>{formData.description.length}/800</span>
            </div>
          </section>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-(--border-beige) pt-6 sm:flex-row sm:justify-end">
            <Link href="/profile" className="flex h-12 items-center justify-center rounded-xl border border-(--border-beige) px-6 text-sm font-bold text-(--secondary-green)">Cancel</Link>
            <button type="submit" disabled={saving} className="flex h-12 items-center justify-center rounded-xl bg-(--primary-green) px-6 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}

function PhotoTile({ src, alt, badge, onRemove }) {
  return (
    <div className="relative h-28 overflow-hidden rounded-2xl border border-(--border-beige) bg-(--light-green)">
      <img src={src} alt={alt} className="h-full w-full object-cover" />
      {badge && <span className="absolute left-2 top-2 rounded-full bg-(--primary-green) px-2 py-1 text-[10px] font-bold text-white">{badge}</span>}
      <button type="button" onClick={onRemove} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-extrabold text-red-600 shadow-sm" aria-label="Remove photo">×</button>
    </div>
  );
}

function TextField({ label, name, value, onChange, error, type = 'text', required = false, ...inputProps }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-(--secondary-green)">
        {label}{required && <span className="text-(--primary-orange)"> *</span>}
      </label>
      <input name={name} type={type} value={value} onChange={onChange} required={required} {...inputProps} className={`h-12 w-full rounded-xl border bg-white px-4 text-sm text-(--secondary-green) outline-none ${error ? 'border-red-400' : 'border-(--border-beige) focus:border-(--primary-green)'}`} />
      {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}

function SelectField({ label, name, value, onChange, error, options, required = false }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-(--secondary-green)">
        {label}{required && <span className="text-(--primary-orange)"> *</span>}
      </label>
      <select name={name} value={value} onChange={onChange} required={required} className={`h-12 w-full rounded-xl border bg-white px-4 text-sm text-(--secondary-green) outline-none ${error ? 'border-red-400' : 'border-(--border-beige) focus:border-(--primary-green)'}`}>
        <option value="">Select</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
