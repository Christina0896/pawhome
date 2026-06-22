'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '../../../../../components/header';
import Footer from '../../../../../components/footer';
import { supabase } from '../../../../../lib/supabaseClient';
import { counties } from '../../../../../data/countyList';
import { dogBreeds, catBreeds, otherPetTypes } from '../../../../../data/petOptions';
import Link from 'next/link';

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
  seller_type: '',
  microchipped: '',
  vaccinated: '',
  wormed: '',
  vet_checked: '',
  spayed_neutered: '',
  health_tested: '',
  kennel_club_registered: '',
  litter_size: '',
  available_litter_count: '',
  date_of_birth: '',
  ready_to_leave: '',
  mother_can_be_seen: '',
  registration_number: '',
  organisation_name: '',
  description: '',
};

export default function EditListingPage() {
  const params = useParams();
  const listingId = params.id;

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [originalFormData, setOriginalFormData] = useState(null);
  const fileInputRef = useRef(null);

  const [newPhotos, setNewPhotos] = useState([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState([]);
  const [photosToDelete, setPhotosToDelete] = useState([]);

  const isDogOrCat = ['dogs', 'cats'].includes(formData.animal_type?.toLowerCase());
  const isMixedLitter = formData.sex === 'Mixed Litter';

  const breedOptions =
    formData.animal_type === 'Dogs'
      ? dogBreeds
      : formData.animal_type === 'Cats'
        ? catBreeds
        : formData.animal_type === 'Other Pets'
          ? otherPetTypes
          : [];

  useEffect(() => {
    const loadListing = async () => {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = '/';
        return;
      }

      setUser(user);

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
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        console.error('Listing fetch error:', error);
        window.location.href = '/profile';
        return;
      }

      const loadedFormData = {
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
        seller_type: data.seller_type || '',
        microchipped: data.microchipped || '',
        vaccinated: data.vaccinated || '',
        wormed: data.wormed || '',
        vet_checked: data.vet_checked || '',
        spayed_neutered: data.spayed_neutered || '',
        health_tested: data.health_tested || '',
        kennel_club_registered: data.kennel_club_registered || '',
        litter_size: data.litter_size || '',
        available_litter_count: data.available_litter_count || '',
        date_of_birth: data.date_of_birth || '',
        ready_to_leave: data.ready_to_leave || '',
        mother_can_be_seen: data.mother_can_be_seen || '',
        father_can_be_seen: data.father_can_be_seen || '',
        registration_number: data.registration_number || '',
        organisation_name: data.organisation_name || '',
        description: data.description || '',
        status: data.status || 'pending',
      };

      setFormData(loadedFormData);
      setOriginalFormData(loadedFormData);

      setPhotos([...(data.listing_photos || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));

      setLoading(false);
    };

    if (listingId) {
      loadListing();
    }
  }, [listingId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: '',
    }));

    setMessage('');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required.';
    if (!formData.listing_type) newErrors.listing_type = 'Ad type is required.';
    if (!formData.animal_type) newErrors.animal_type = 'Animal type is required.';
    if (!formData.breed.trim()) newErrors.breed = 'Breed or pet type is required.';
    if (!formData.age.trim()) newErrors.age = 'Age is required.';
    if (!formData.sex) newErrors.sex = 'Sex is required.';
    if (formData.price === '' || Number(formData.price) < 0) newErrors.price = 'Price is required.';
    if (!formData.county) newErrors.county = 'County is required.';
    if (!formData.seller_type) newErrors.seller_type = 'Seller type is required.';

    if (formData.animal_type === 'Dogs' && !formData.microchipped) {
      newErrors.microchipped = 'Please confirm if the dog is microchipped.';
    }

    if (!formData.description || formData.description.trim().length < 80) {
      newErrors.description = 'Description must be at least 80 characters.';
    }

    if (isDogOrCat && isMixedLitter) {
      if (!formData.litter_size) newErrors.litter_size = 'Litter size is required.';
      if (!formData.available_litter_count) {
        newErrors.available_litter_count = 'Available litter count is required.';
      }
    }
    if (totalPhotoCount === 0) {
      newErrors.photos = 'Please keep at least one photo.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const doesEditNeedAdminApproval = () => {
    if (!originalFormData) return true;

    const adminApprovalFields = [
      'title',
      'listing_type',
      'animal_type',
      'breed',
      'age',
      'sex',
      'price',
      'price_negotiable',
      'county',
      'city',
      'seller_type',
      'microchipped',
      'vaccinated',
      'wormed',
      'vet_checked',
      'spayed_neutered',
      'health_tested',
      'kennel_club_registered',
      'litter_size',
      'date_of_birth',
      'ready_to_leave',
      'mother_can_be_seen',
      'father_can_be_seen',
      'registration_number',
      'organisation_name',
    ];

    return adminApprovalFields.some((field) => String(originalFormData[field] ?? '') !== String(formData[field] ?? ''));
  };

  const getStoragePathFromPublicUrl = (url) => {
    if (!url) return null;

    const marker = '/storage/v1/object/public/listing-photos/';
    const markerIndex = url.indexOf(marker);

    if (markerIndex === -1) return null;

    return decodeURIComponent(url.slice(markerIndex + marker.length));
  };

  const visiblePhotos = photos.filter((photo) => !photosToDelete.some((deletedPhoto) => deletedPhoto.id === photo.id));

  const totalPhotoCount = visiblePhotos.length + newPhotos.length;

  const handleAddEditPhotos = (files) => {
    const allowedFiles = files.filter((file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type));

    if (allowedFiles.length === 0) return;

    const remainingSlots = 6 - totalPhotoCount;

    if (remainingSlots <= 0) {
      setMessage('You can upload a maximum of 6 photos.');
      return;
    }

    const filesToAdd = allowedFiles.slice(0, remainingSlots);

    setNewPhotos((current) => [...current, ...filesToAdd]);

    setNewPhotoPreviews((current) => [...current, ...filesToAdd.map((file) => URL.createObjectURL(file))]);

    setMessage('');
  };

  const handleEditPhotoChange = (e) => {
    const files = Array.from(e.target.files || []);

    handleAddEditPhotos(files);

    e.target.value = '';
  };

  const handleRemoveExistingPhoto = (photo) => {
    setPhotosToDelete((current) => {
      if (current.some((item) => item.id === photo.id)) return current;

      return [...current, photo];
    });
  };

  const handleRemoveNewPhoto = (indexToRemove) => {
    setNewPhotos((current) => current.filter((_, index) => index !== indexToRemove));

    setNewPhotoPreviews((current) => current.filter((_, index) => index !== indexToRemove));
  };

  const handleSaveListing = async (e) => {
    e.preventDefault();

    if (!user) return;

    const isValid = validateForm();

    if (!isValid) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('listings')
      .update({
        title: formData.title.trim(),
        listing_type: formData.listing_type,
        animal_type: formData.animal_type,
        breed: formData.breed.trim(),
        age: formData.age.trim(),
        sex: formData.sex,

        price: Number(formData.price),
        price_negotiable: formData.price_negotiable,

        county: formData.county,
        city: formData.city.trim(),

        seller_type: formData.seller_type,

        microchipped: formData.microchipped,
        vaccinated: formData.vaccinated,
        wormed: formData.wormed,
        vet_checked: formData.vet_checked,
        spayed_neutered: formData.spayed_neutered,
        health_tested: formData.health_tested,
        kennel_club_registered: formData.kennel_club_registered,

        litter_size: formData.litter_size || null,
        available_litter_count: formData.available_litter_count || null,
        date_of_birth: formData.date_of_birth || null,
        ready_to_leave: formData.ready_to_leave || null,
        mother_can_be_seen: formData.mother_can_be_seen || null,

        registration_number: formData.registration_number.trim(),
        organisation_name: formData.organisation_name.trim(),

        description: formData.description.trim(),

        status: doesEditNeedAdminApproval() ? 'pending' : originalFormData.status,
      })

      .eq('id', listingId)
      .eq('user_id', user.id);
    if (error) {
      console.warn('Listing update failed:', {
        message: error.message,
        code: error.code,
      });

      setMessage('Could not save listing. Please try again.');
      setSaving(false);
      return;
    }

    if (photosToDelete.length > 0) {
      const photoIdsToDelete = photosToDelete.map((photo) => photo.id).filter(Boolean);

      console.log('Photos to delete:', photosToDelete);
      console.log('Photo IDs to delete:', photoIdsToDelete);

      if (photoIdsToDelete.length > 0) {
        const { error: photoDeleteError } = await supabase.from('listing_photos').delete().in('id', photoIdsToDelete);

        if (photoDeleteError) {
          console.error('Photo DB delete error:', photoDeleteError);
          setMessage(photoDeleteError.message || 'Could not delete old photos.');
          setSaving(false);
          return;
        }
      }

      const storagePaths = photosToDelete.map((photo) => getStoragePathFromPublicUrl(photo.image_url)).filter(Boolean);

      console.log('Storage paths to delete:', storagePaths);

      if (storagePaths.length > 0) {
        const { error: storageDeleteError } = await supabase.storage.from('listing-photos').remove(storagePaths);

        if (storageDeleteError) {
          console.error('Photo storage delete error:', storageDeleteError);
        }
      }
    }

    if (newPhotos.length > 0) {
      const photoRows = [];

      for (let i = 0; i < newPhotos.length; i++) {
        const file = newPhotos[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${listingId}-edit-${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from('listing-photos').upload(fileName, file);

        if (uploadError) {
          console.error('Photo upload error:', uploadError);
          setMessage(uploadError.message || 'Photo upload failed.');
          setSaving(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage.from('listing-photos').getPublicUrl(fileName);

        photoRows.push({
          listing_id: listingId,
          image_url: publicUrlData.publicUrl,
          sort_order: visiblePhotos.length + i,
        });
      }

      const { error: photoInsertError } = await supabase.from('listing_photos').insert(photoRows);

      if (photoInsertError) {
        console.error('Photo DB insert error:', photoInsertError);
        setMessage(photoInsertError.message || 'Could not save new photos.');
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    window.location.href = '/profile';
    return;
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
          <Link href="/profile" className="hover:text-(--primary-green)">
            Profile
          </Link>
          <span className="mx-2">›</span>
          <span>Edit Listing</span>
        </div>

        <form
          onSubmit={handleSaveListing}
          className="rounded-3xl border border-(--border-beige) bg-white p-6 shadow-sm"
        >
          <div className="mb-8 flex flex-col justify-between gap-4 border-b border-(--border-beige) pb-6 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-extrabold text-(--secondary-green)">Edit Listing</h1>

              <p className="mt-2 text-sm text-(--muted-green-text)">Changes will send your ad back for review.</p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/profile"
                className="flex h-11 items-center justify-center rounded-xl border border-(--border-beige) px-5 text-sm font-bold text-(--secondary-green) transition hover:border-(--primary-green)"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="flex h-11 items-center justify-center rounded-xl bg-(--primary-green) px-5 text-sm font-bold text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {message && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
              {message}
            </div>
          )}

          {Object.values(errors).filter(Boolean).length > 0 && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              <p className="font-bold">Please fix the following:</p>

              <ul className="mt-2 list-disc space-y-1 pl-5">
                {Object.values(errors)
                  .filter(Boolean)
                  .map((error) => (
                    <li key={error}>{error}</li>
                  ))}
              </ul>
            </div>
          )}

          <section className="mb-8">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-(--secondary-green)">Photos</h2>

                <p className="mt-1 text-xs text-(--muted-green-text)">Add or remove photos. Maximum 6 photos.</p>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={totalPhotoCount >= 6}
                className="flex h-10 items-center justify-center rounded-xl bg-(--primary-green) px-4 text-sm font-bold text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add Photos
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleEditPhotoChange}
                className="hidden"
              />
            </div>

            {totalPhotoCount === 0 && (
              <div className="rounded-2xl border border-dashed border-(--border-beige) bg-(--background) p-6 text-center text-sm font-semibold text-(--muted-green-text)">
                No photos selected.
              </div>
            )}

            {totalPhotoCount > 0 && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
                {visiblePhotos.map((photo) => (
                  <div
                    key={photo.id || photo.image_url}
                    className="relative h-28 overflow-hidden rounded-2xl border border-(--border-beige) bg-(--light-green)"
                  >
                    <img src={photo.image_url} alt="Listing photo" className="h-full w-full object-cover" />

                    <button
                      type="button"
                      onClick={() => handleRemoveExistingPhoto(photo)}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-extrabold text-red-600 shadow-sm transition hover:bg-red-50"
                      aria-label="Remove photo"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {newPhotoPreviews.map((preview, index) => (
                  <div
                    key={preview}
                    className="relative h-28 overflow-hidden rounded-2xl border border-(--border-beige) bg-(--light-green)"
                  >
                    <img src={preview} alt="New listing photo" className="h-full w-full object-cover" />

                    <span className="absolute left-2 top-2 rounded-full bg-(--primary-green) px-2 py-1 text-[10px] font-bold text-white">
                      New
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveNewPhoto(index)}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-extrabold text-red-600 shadow-sm transition hover:bg-red-50"
                      aria-label="Remove new photo"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-2 text-xs text-(--muted-green-text)">{totalPhotoCount}/6 photos selected.</p>
          </section>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <SelectField
              label="Ad Type"
              name="listing_type"
              value={formData.listing_type}
              onChange={handleChange}
              error={errors.listing_type}
              options={['For Sale', 'For Stud', 'For Adoption']}
              required
            />

            <SelectField
              label="Animal Type"
              name="animal_type"
              value={formData.animal_type}
              onChange={handleChange}
              error={errors.animal_type}
              options={['Dogs', 'Cats', 'Other Pets']}
              required
            />

            <TextField
              label="Listing Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              error={errors.title}
              required
            />

            <SelectField
              label={formData.animal_type === 'Other Pets' ? 'Pet Type' : 'Breed'}
              name="breed"
              value={formData.breed}
              onChange={handleChange}
              error={errors.breed}
              options={breedOptions}
              required
            />

            <TextField
              label="Age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              error={errors.age}
              required
            />

            <SelectField
              label="Sex"
              name="sex"
              value={formData.sex}
              onChange={handleChange}
              error={errors.sex}
              options={['Male', 'Female', 'Mixed Litter']}
              required
            />

            <div>
              <label className="mb-2 block text-sm font-bold text-(--secondary-green)">
                Price <span className="text-(--primary-orange)">*</span>
              </label>

              <div className="flex h-12 overflow-hidden rounded-xl border border-(--border-beige) bg-white">
                <div className="flex items-center border-r border-(--border-beige) px-3 font-bold text-(--muted-green-text)">
                  €
                </div>

                <input
                  name="price"
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  className="min-w-0 flex-1 px-3 text-sm text-(--secondary-green) outline-none"
                />

                <label className="flex items-center gap-2 border-l border-(--border-beige) px-3 text-xs font-bold text-(--muted-green-text)">
                  <input
                    name="price_negotiable"
                    type="checkbox"
                    checked={formData.price_negotiable}
                    onChange={handleChange}
                    className="h-4 w-4 accent-(--primary-green)"
                  />
                  Negotiable
                </label>
              </div>

              {errors.price && <p className="mt-2 text-xs font-medium text-red-500">{errors.price}</p>}
            </div>

            <SelectField
              label="County"
              name="county"
              value={formData.county}
              onChange={handleChange}
              error={errors.county}
              options={counties}
              required
            />

            <TextField label="Town / City" name="city" value={formData.city} onChange={handleChange} />

            <SelectField
              label="Seller Type"
              name="seller_type"
              value={formData.seller_type}
              onChange={handleChange}
              error={errors.seller_type}
              options={['Private Owner', 'Breeder', 'Shelter / Rescue']}
              required
            />

            <TextField
              label="Organisation Name"
              name="organisation_name"
              value={formData.organisation_name}
              onChange={handleChange}
            />

            <TextField
              label="Registration Number"
              name="registration_number"
              value={formData.registration_number}
              onChange={handleChange}
            />

            <SelectField
              label="Microchipped"
              name="microchipped"
              value={formData.microchipped}
              onChange={handleChange}
              error={errors.microchipped}
              options={['Yes', 'No']}
            />

            <SelectField
              label="Vaccinated"
              name="vaccinated"
              value={formData.vaccinated}
              onChange={handleChange}
              options={['Yes', 'No']}
            />

            <SelectField
              label="Wormed"
              name="wormed"
              value={formData.wormed}
              onChange={handleChange}
              options={['Yes', 'No']}
            />

            <SelectField
              label="Vet Checked"
              name="vet_checked"
              value={formData.vet_checked}
              onChange={handleChange}
              options={['Yes', 'No']}
            />

            <SelectField
              label="Spayed / Neutered"
              name="spayed_neutered"
              value={formData.spayed_neutered}
              onChange={handleChange}
              options={['Yes', 'No']}
            />

            <SelectField
              label="Health Tested"
              name="health_tested"
              value={formData.health_tested}
              onChange={handleChange}
              options={['Yes', 'No']}
            />

            <SelectField
              label="IKC / KC Registered"
              name="kennel_club_registered"
              value={formData.kennel_club_registered}
              onChange={handleChange}
              options={['Yes', 'No']}
            />
          </div>

          {isDogOrCat && (
            <section className="mt-8 rounded-2xl border border-(--border-beige) bg-(--background) p-5">
              <h2 className="text-lg font-extrabold text-(--secondary-green)">Litter Information / Pet Background</h2>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                {isMixedLitter && (
                  <>
                    <TextField
                      label="Litter Size"
                      name="litter_size"
                      type="number"
                      value={formData.litter_size}
                      onChange={handleChange}
                      error={errors.litter_size}
                    />

                    <TextField
                      label="Available"
                      name="available_litter_count"
                      type="number"
                      value={formData.available_litter_count}
                      onChange={handleChange}
                      error={errors.available_litter_count}
                    />
                  </>
                )}

                <TextField
                  label="Date of Birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                />

                <TextField
                  label="Ready to Leave"
                  name="ready_to_leave"
                  type="date"
                  value={formData.ready_to_leave}
                  onChange={handleChange}
                />

                <SelectField
                  label="Mother Can Be Seen"
                  name="mother_can_be_seen"
                  value={formData.mother_can_be_seen}
                  onChange={handleChange}
                  options={['Yes', 'No']}
                />
              </div>
            </section>
          )}

          <section className="mt-8">
            <label className="mb-2 block text-sm font-bold text-(--secondary-green)">
              Description <span className="text-(--primary-orange)">*</span>
            </label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={8}
              maxLength={800}
              className="min-h-[200px] w-full resize-y rounded-xl border border-(--border-beige) bg-white px-4 py-3 text-sm leading-6 text-(--secondary-green) outline-none transition focus:border-(--primary-green) focus:ring-4 focus:ring-[rgba(14,79,42,0.10)]"
            />

            <div className="mt-2 flex justify-between text-xs text-(--muted-green-text)">
              <span>{errors.description || 'Minimum 80 characters.'}</span>
              <span>{formData.description.length}/800</span>
            </div>
          </section>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-(--border-beige) pt-6 sm:flex-row sm:justify-end">
            <Link
              href="/profile"
              className="flex h-12 items-center justify-center rounded-xl border border-(--border-beige) px-6 text-sm font-bold text-(--secondary-green) transition hover:border-(--primary-green)"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="flex h-12 items-center justify-center rounded-xl bg-(--primary-green) px-6 text-sm font-bold text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}

const TextField = ({ label, name, value, onChange, error, type = 'text', required = false }) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-(--secondary-green)">
        {label}
        {required && <span className="text-(--primary-orange)"> *</span>}
      </label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className={`h-12 w-full rounded-xl border bg-white px-4 text-sm text-(--secondary-green) outline-none transition focus:ring-4 focus:ring-[rgba(14,79,42,0.10)] ${
          error ? 'border-red-400 focus:border-red-500' : 'border-(--border-beige) focus:border-(--primary-green)'
        }`}
      />

      {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
};

const SelectField = ({ label, name, value, onChange, error, options, required = false }) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-(--secondary-green)">
        {label}
        {required && <span className="text-(--primary-orange)"> *</span>}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`h-12 w-full rounded-xl border bg-white px-4 text-sm text-(--secondary-green) outline-none transition focus:ring-4 focus:ring-[rgba(14,79,42,0.10)] ${
          error ? 'border-red-400 focus:border-red-500' : 'border-(--border-beige) focus:border-(--primary-green)'
        }`}
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
};
