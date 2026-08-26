'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../../components/header';
import { ArrowIcon, CloseIcon, GalleryIcon } from '../../components/Icons';
import { counties } from '../../data/countyList';
import { catBreeds, dogBreeds, otherPetTypes } from '../../data/petOptions';
import { getVerifiedAccessToken } from '../../lib/authTokens';
import { addWeeksToDate, getMinimumLegalAgeWeeks, validateImageFile } from '../../lib/listingValidation';
import CustomSelect from './components/CustomSelect';
import {
  AGE_UNIT_OPTIONS,
  ANIMAL_TYPE_OPTIONS,
  INPUT_CLASS,
  LISTING_TYPE_OPTIONS,
  SECTION_CLASS,
  SEX_OPTIONS,
  SPAYED_OPTIONS,
  YES_NO_OPTIONS,
  YES_NO_UNKNOWN_OPTIONS,
} from './postAdOptions';

const REQUIRE_VERIFICATION_TO_POST = true;

const initialFormData = {
  title: '',
  listing_type: '',
  animal_type: '',
  breed: '',
  age_value: '',
  age_unit: 'weeks',
  age: '',
  sex: '',
  male_count: '',
  female_count: '',
  litter_size: '',
  available_litter_count: '',
  date_of_birth: '',
  ready_to_leave: '',
  mother_can_be_seen: '',
  price: '',
  price_negotiable: false,
  county: '',
  city: '',
  seller_type: '',
  registrationNumber: '',
  organisationName: '',
  microchipped: '',
  vaccinated: '',
  wormed: '',
  vet_checked: '',
  spayed_neutered: '',
  health_tested: '',
  kc_registered: '',
  proven_stud: '',
  stud_terms: '',
  description: '',
};

function getSellerTypeFromAccountType(accountType) {
  if (accountType === 'Breeder') return 'Registered Breeder';
  if (accountType === 'Shelter / Rescue') return 'Shelter / Rescue';
  return 'Private Seller';
}

function formatDateInput(date) {
  if (!date) return '';
  return date.toISOString().split('T')[0];
}

function Field({ label, required = false, error, children }) {
  return (
    <div>
      <div className="min-h-[38px]">
        <label className="block text-sm font-semibold text-(--secondary-green)">
          {label} {required && <span className="text-(--primary-orange)">*</span>}
        </label>
        <p className="min-h-[16px] text-xs text-red-500">{error || ''}</p>
      </div>
      {children}
    </div>
  );
}

function SectionHeader({ title, children }) {
  return (
    <div className={SECTION_CLASS}>
      <h3 className="text-lg font-bold text-(--secondary-green)">{title}</h3>
      {children && <p className="mt-1 text-sm text-(--muted-green-text)">{children}</p>}
    </div>
  );
}

export default function PostAdPageClient() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState(initialFormData);

  const breedOptions =
    formData.animal_type === 'Dogs'
      ? dogBreeds
      : formData.animal_type === 'Cats'
        ? catBreeds
        : [];

  const filteredBreedOptions = breedOptions.filter((breed) => breed.toLowerCase().includes(formData.breed.toLowerCase()));
  const isDogOrCat = ['dogs', 'cats'].includes(formData.animal_type?.toLowerCase());
  const showLitterInfo = isDogOrCat && formData.sex === 'Mixed Litter';
  const priceRequired = formData.listing_type === 'For Sale' || formData.listing_type === 'For Stud';
  const minimumLegalAgeWeeks = useMemo(
    () => getMinimumLegalAgeWeeks(formData.animal_type, formData.breed),
    [formData.animal_type, formData.breed],
  );
  const minimumReadyToLeaveDate = useMemo(
    () => formatDateInput(addWeeksToDate(formData.date_of_birth, minimumLegalAgeWeeks)),
    [formData.date_of_birth, minimumLegalAgeWeeks],
  );
  const readyToLeaveTooEarly =
    formData.ready_to_leave &&
    minimumReadyToLeaveDate &&
    new Date(formData.ready_to_leave) < new Date(minimumReadyToLeaveDate);

  const updateField = (name, value) => {
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '', submit: '' }));
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    updateField(name, type === 'checkbox' ? checked : value);
  };

  useEffect(() => {
    const loadAccount = async () => {
      const accessToken = await getVerifiedAccessToken();

      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/profile/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const result = await response.json();

        if (!response.ok) {
          alert(result.error || 'Your profile could not be loaded.');
          router.push('/profile');
          return;
        }

        const isEmailVerified = Boolean(result.user?.email_confirmed_at || result.user?.confirmed_at);

        if (REQUIRE_VERIFICATION_TO_POST && !isEmailVerified) {
          alert('Please verify your email before posting an ad.');
          router.push('/');
          return;
        }

        if (REQUIRE_VERIFICATION_TO_POST && !result.profile?.phone_verified) {
          alert('Please verify your phone number before posting an ad.');
          router.push('/profile');
          return;
        }

        setFormData((current) => ({
          ...current,
          seller_type: getSellerTypeFromAccountType(result.profile?.account_type),
          county: result.profile?.county || current.county,
        }));
      } catch (error) {
        console.error('Post ad account check failed:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    loadAccount();
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('[data-dropdown-root]')) setOpenDropdown(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.title || formData.title.trim().length < 5) nextErrors.title = 'Please enter a listing title with at least 5 characters.';
    if (!formData.listing_type) nextErrors.listing_type = 'Please select an ad type.';
    if (!formData.animal_type) nextErrors.animal_type = 'Please select an animal type.';
    if (!formData.breed || formData.breed.trim().length < 2) nextErrors.breed = 'Please enter a breed or pet type.';
    if (!formData.age_value) nextErrors.age_value = "Please enter the pet's age.";
    if (!formData.sex) nextErrors.sex = 'Please select the sex.';
    if (priceRequired && (!formData.price || Number(formData.price) <= 0)) nextErrors.price = 'Please enter a valid price.';
    if (!formData.county) nextErrors.county = 'Please select a county.';
    if (formData.animal_type === 'Dogs' && !formData.microchipped) nextErrors.microchipped = 'Please confirm if the dog is microchipped.';
    if (!formData.description || formData.description.trim().length < 80) nextErrors.description = 'Description must be at least 80 characters.';
    if (photos.length === 0) nextErrors.photos = 'Please upload at least one photo.';

    if (showLitterInfo) {
      const litterSize = Number(formData.litter_size || 0);
      const available = Number(formData.available_litter_count || 0);
      const boys = Number(formData.male_count || 0);
      const girls = Number(formData.female_count || 0);

      if (!formData.litter_size) nextErrors.litter_size = 'Please enter the litter size.';
      if (!formData.available_litter_count) nextErrors.available_litter_count = 'Please enter how many are available.';
      if (available > litterSize) nextErrors.available_litter_count = 'Available cannot be higher than litter size.';
      if (boys + girls !== available) {
        nextErrors.male_count = 'Boys and girls together must match the available count.';
        nextErrors.female_count = 'Boys and girls together must match the available count.';
      }
      if (!formData.date_of_birth) nextErrors.date_of_birth = 'Please enter the litter date of birth.';
      if (!formData.ready_to_leave) nextErrors.ready_to_leave = 'Please enter when the litter is ready to leave.';
      if (readyToLeaveTooEarly) nextErrors.ready_to_leave = `Minimum legal ready date is ${minimumReadyToLeaveDate}.`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const addPhotos = (files) => {
    const validFiles = [];

    files.forEach((file) => {
      const validationError = validateImageFile(file);

      if (validationError) {
        setErrors((current) => ({ ...current, photos: `${file.name}: ${validationError}` }));
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length === 0) return;

    setPhotos((current) => [...current, ...validFiles].slice(0, 6));
    setPhotoPreviews((current) => [...current, ...validFiles.map((file) => URL.createObjectURL(file))].slice(0, 6));
    setErrors((current) => ({ ...current, photos: '' }));
  };

  const handlePhotoChange = (event) => {
    addPhotos(Array.from(event.target.files || []));
    event.target.value = '';
  };

  const handlePhotoDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    addPhotos(Array.from(event.dataTransfer.files || []));
  };

  const removePhoto = (index) => {
    const preview = photoPreviews[index];
    if (preview) URL.revokeObjectURL(preview);
    setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setPhotoPreviews((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const notifyAdminAboutNewListing = async (listingId) => {
    const accessToken = await getVerifiedAccessToken({ openLogin: false });
    if (!accessToken) return;

    await fetch('/api/notify-new-listing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ listingId }),
    }).catch(() => {});
  };

  const handleSubmitListing = async (event) => {
    event.preventDefault();
    setHasTriedSubmit(true);

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const accessToken = await getVerifiedAccessToken();
    if (!accessToken) return;

    const submitData = new FormData();
    Object.entries(formData).forEach(([key, value]) => submitData.append(key, value ?? ''));
    photos.forEach((file) => submitData.append('photos', file));

    setSubmitting(true);

    try {
      const response = await fetch('/api/listings/create', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: submitData,
      });
      const result = await response.json();

      if (!response.ok) {
        setErrors({ submit: result.error || 'Could not submit listing. Please check your details and try again.' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      await notifyAdminAboutNewListing(result.listing.id);
      router.push('/post-ad/success');
    } catch (error) {
      console.error('Listing create request failed:', error);
      setErrors({ submit: 'Could not submit listing. Please try again.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const selectProps = { openDropdown, setOpenDropdown };
  const fieldErrorCount = Object.values(errors).filter((error) => typeof error === 'string' && error.trim()).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-(--background)">
        <Header />
        <main className="mx-auto max-w-[1500px] px-6 py-10">
          <p className="text-(--secondary-green)">Checking account...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--background)">
      <Header />
      <main className="mx-auto max-w-[1500px] px-6 py-8">
        <div className="mb-6 text-sm text-(--muted-green-text)">
          <Link href="/" className="hover:text-(--primary-green)">Home</Link>
          <span className="mx-2">›</span>
          <span>Post an Ad</span>
        </div>

        <form onSubmit={handleSubmitListing} className="rounded-2xl border border-(--border-beige) bg-white p-8 shadow-sm">
          {hasTriedSubmit && fieldErrorCount > 0 && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              <p className="font-bold">Please fix the following:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {Object.values(errors).filter(Boolean).map((error) => <li key={error}>{error}</li>)}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 xl:grid-cols-4">
            <CustomSelect id="listing_type" label="Ad Type" required value={formData.listing_type} placeholder="Select ad type" error={errors.listing_type} options={LISTING_TYPE_OPTIONS} {...selectProps} onChange={(value) => updateField('listing_type', value)} />
            <CustomSelect id="animal_type" label="Animal Type" required value={formData.animal_type} placeholder="Select animal type" error={errors.animal_type} options={ANIMAL_TYPE_OPTIONS} {...selectProps} onChange={(value) => setFormData((current) => ({ ...current, animal_type: value, breed: '' }))} />

            <Field label="Listing Title" required error={errors.title}>
              <input name="title" value={formData.title} onChange={handleInputChange} placeholder="Example: Family-raised Akita puppies" maxLength={80} className={INPUT_CLASS} />
            </Field>

            {formData.animal_type === 'Other Pets' ? (
              <CustomSelect id="breed" label="Category" required value={formData.breed} placeholder="Select category" error={errors.breed} options={otherPetTypes.map((item) => ({ label: item, value: item }))} {...selectProps} onChange={(value) => updateField('breed', value)} />
            ) : (
              <Field label="Breed" required error={errors.breed}>
                <div className="relative data-dropdown-root">
                  <div className="flex h-[45px] w-full items-center rounded-xl border border-(--border-beige) bg-white px-4">
                    <input name="breed" value={formData.breed} onFocus={() => setOpenDropdown('breed')} onChange={handleInputChange} placeholder="Start typing..." className="min-w-0 flex-1 bg-transparent text-sm text-(--secondary-green) outline-none" />
                    <button type="button" onClick={() => setOpenDropdown(openDropdown === 'breed' ? null : 'breed')} className="ml-3 text-(--primary-green)"><ArrowIcon className="h-3.5 w-3.5 rotate-90" /></button>
                  </div>
                  {openDropdown === 'breed' && (
                    <div className="absolute left-0 right-0 top-full z-[9999] mt-2 max-h-72 overflow-y-auto rounded-xl border border-(--border-beige) bg-white shadow-lg">
                      {filteredBreedOptions.map((breed) => (
                        <button key={breed} type="button" onMouseDown={(event) => { event.preventDefault(); updateField('breed', breed); setOpenDropdown(null); }} className="block w-full border-b border-(--border-beige) px-4 py-3 text-left text-sm text-(--secondary-green) hover:bg-(--background)">{breed}</button>
                      ))}
                    </div>
                  )}
                </div>
              </Field>
            )}

            <Field label="Age" required error={errors.age_value}>
              <div className="grid grid-cols-[1fr_120px] gap-2">
                <input name="age_value" type="number" min="1" value={formData.age_value} onChange={handleInputChange} placeholder="8" className={INPUT_CLASS} />
                <CustomSelect id="age_unit" label="" value={formData.age_unit} placeholder="weeks" options={AGE_UNIT_OPTIONS} {...selectProps} onChange={(value) => updateField('age_unit', value)} />
              </div>
            </Field>

            <CustomSelect id="sex" label="Sex" required value={formData.sex} placeholder="Select sex" error={errors.sex} options={SEX_OPTIONS} {...selectProps} onChange={(value) => updateField('sex', value)} />
            <CustomSelect id="county" label="County" required value={formData.county} placeholder="Select county" error={errors.county} options={counties.map((county) => ({ label: county, value: county }))} {...selectProps} onChange={(value) => updateField('county', value)} />

            <Field label="City / Town" error={errors.city}>
              <input name="city" value={formData.city} onChange={handleInputChange} placeholder="e.g. Dublin" className={INPUT_CLASS} />
            </Field>

            <Field label="Price" required={priceRequired} error={errors.price}>
              <div className="flex h-[45px] overflow-hidden rounded-xl border border-(--border-beige) bg-white">
                <div className="flex h-full items-center border-r border-(--border-beige) px-3 font-bold text-(--muted-green-text)">€</div>
                <input name="price" type="number" min="0" value={formData.price} onChange={handleInputChange} placeholder="e.g. 1200" className="min-w-0 flex-1 px-3 text-sm text-(--secondary-green) outline-none" />
                <label className="flex h-full shrink-0 cursor-pointer items-center gap-2 border-l border-(--border-beige) px-3 text-xs font-bold text-(--muted-green-text)">
                  <input name="price_negotiable" type="checkbox" checked={formData.price_negotiable} onChange={handleInputChange} className="h-4 w-4 accent-(--primary-green)" /> Negotiable
                </label>
              </div>
            </Field>

            <CustomSelect id="kc_registered" label="IKC / KC Registered" value={formData.kc_registered} placeholder="Select option" options={YES_NO_OPTIONS} {...selectProps} onChange={(value) => updateField('kc_registered', value)} />

            <div className="col-span-full"><SectionHeader title="Health & Verification">These details help buyers understand the pet’s background.</SectionHeader></div>
            {isDogOrCat && <CustomSelect id="microchipped" label="Microchipped" required={formData.animal_type === 'Dogs'} value={formData.microchipped} placeholder="Select" error={errors.microchipped} options={YES_NO_OPTIONS} {...selectProps} onChange={(value) => updateField('microchipped', value)} />}
            <CustomSelect id="vaccinated" label="Vaccinated" value={formData.vaccinated} placeholder="Select" options={YES_NO_UNKNOWN_OPTIONS} {...selectProps} onChange={(value) => updateField('vaccinated', value)} />
            <CustomSelect id="wormed" label="Wormed" value={formData.wormed} placeholder="Select" options={YES_NO_UNKNOWN_OPTIONS} {...selectProps} onChange={(value) => updateField('wormed', value)} />
            <CustomSelect id="vet_checked" label="Vet Checked" value={formData.vet_checked} placeholder="Select" options={YES_NO_OPTIONS} {...selectProps} onChange={(value) => updateField('vet_checked', value)} />
            <CustomSelect id="spayed_neutered" label="Spayed / Neutered" value={formData.spayed_neutered} placeholder="Select" options={SPAYED_OPTIONS} {...selectProps} onChange={(value) => updateField('spayed_neutered', value)} />
            <CustomSelect id="health_tested" label="Health Tested" value={formData.health_tested} placeholder="Select" options={YES_NO_OPTIONS} {...selectProps} onChange={(value) => updateField('health_tested', value)} />

            {formData.listing_type === 'For Stud' && (
              <div className="col-span-full rounded-2xl border border-(--border-beige) bg-(--background) p-5">
                <h3 className="text-lg font-bold text-(--secondary-green)">Stud Information</h3>
                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <CustomSelect id="proven_stud" label="Proven Stud" value={formData.proven_stud} placeholder="Select option" options={YES_NO_OPTIONS} {...selectProps} onChange={(value) => updateField('proven_stud', value)} />
                  <Field label="Stud Terms" error={errors.stud_terms}>
                    <textarea name="stud_terms" value={formData.stud_terms} onChange={handleInputChange} rows={4} placeholder="Add details about fee, conditions, and requirements." className="min-h-[120px] w-full resize-y rounded-2xl border border-(--border-beige) bg-white px-4 py-3 text-sm text-(--secondary-green) outline-none focus:border-(--primary-green)" />
                  </Field>
                </div>
              </div>
            )}

            {showLitterInfo && (
              <section className="col-span-full rounded-2xl border border-(--border-beige) bg-white p-6">
                <h2 className="text-xl font-extrabold text-(--secondary-green)">Litter Info</h2>
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {['litter_size', 'available_litter_count', 'male_count', 'female_count'].map((name) => (
                    <Field key={name} label={name === 'litter_size' ? 'Litter Size' : name === 'available_litter_count' ? 'Available' : name === 'male_count' ? 'Number of Boys' : 'Number of Girls'} error={errors[name]}>
                      <input name={name} type="number" min="0" value={formData[name]} onChange={handleInputChange} className={INPUT_CLASS} />
                    </Field>
                  ))}
                  <Field label="Date of Birth" error={errors.date_of_birth}><input name="date_of_birth" type="date" value={formData.date_of_birth} onChange={(event) => { updateField('date_of_birth', event.target.value); if (event.target.value && minimumLegalAgeWeeks) updateField('ready_to_leave', formatDateInput(addWeeksToDate(event.target.value, minimumLegalAgeWeeks))); }} className={INPUT_CLASS} /></Field>
                  <Field label="Ready to Leave" error={errors.ready_to_leave}><input name="ready_to_leave" type="date" min={minimumReadyToLeaveDate || undefined} value={formData.ready_to_leave} onChange={handleInputChange} className={INPUT_CLASS} />{minimumReadyToLeaveDate && <p className="mt-1 text-xs font-semibold text-red-600">Minimum legal ready date: {minimumReadyToLeaveDate}</p>}{readyToLeaveTooEarly && <p className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">This litter is too young to leave. Minimum age is {minimumLegalAgeWeeks} weeks.</p>}</Field>
                </div>
              </section>
            )}

            <div className="col-span-full">
              <SectionHeader title="Photos">Add clear photos of the pet. You can upload up to 6 images.</SectionHeader>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { addPhotos(Array.from(event.target.files || [])); event.target.value = ''; }} className="hidden" />
              <div role="button" tabIndex={0} onClick={() => fileInputRef.current?.click()} onDragEnter={(event) => event.preventDefault()} onDragOver={(event) => event.preventDefault()} onDrop={handlePhotoDrop} className={`mt-6 flex min-h-[170px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition ${errors.photos ? 'border-red-300 bg-red-50' : 'border-(--border-beige) bg-(--background) hover:border-(--primary-green)'}`}>
                <GalleryIcon className="h-8 w-8 text-(--primary-green)" />
                <p className="mt-3 text-sm font-semibold text-(--secondary-green)">Click or drag photos here</p>
                <p className="mt-1 text-xs text-(--muted-green-text)">JPG, PNG or WEBP. Maximum 6 photos.</p>
              </div>
              {errors.photos && <p className="mt-2 text-xs font-medium text-red-500">{errors.photos}</p>}
              {photoPreviews.length > 0 && <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">{photoPreviews.map((preview, index) => <div key={preview} className="relative h-28 overflow-hidden rounded-xl border border-(--border-beige)"><img src={preview} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" /><button type="button" onClick={() => removePhoto(index)} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-red-500 shadow" aria-label="Remove photo"><CloseIcon className="h-3.5 w-3.5" /></button></div>)}</div>}
            </div>

            <div className="col-span-full"><SectionHeader title="Seller Registration" /></div>
            <Field label="Pet Seller Registration Number"><input name="registrationNumber" value={formData.registrationNumber} onChange={handleInputChange} placeholder="Enter registration number if applicable" className={INPUT_CLASS} /></Field>
            <Field label="Licence / Organisation Name"><input name="organisationName" value={formData.organisationName} onChange={handleInputChange} placeholder="Breeder, rescue, shelter, or organisation name" className={INPUT_CLASS} /></Field>

            <div className="col-span-full">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-lg font-semibold text-(--secondary-green)">Description <span className="text-(--primary-orange)">*</span></label>
                {errors.description && <p className="text-xs font-medium text-red-500">{errors.description}</p>}
              </div>
              <textarea name="description" value={formData.description} onChange={handleInputChange} minLength={80} maxLength={800} rows={7} placeholder="Tell buyers about the pet’s personality, health, temperament, living situation, and what kind of home would suit them best." className="min-h-[180px] w-full resize-y rounded-xl border border-(--border-beige) bg-white px-4 py-3 text-sm text-(--secondary-green) outline-none focus:border-(--primary-green)" />
              <div className="mt-1 flex justify-end text-xs text-(--muted-green-text)">Minimum 80 characters.</div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end">
            <button type="submit" disabled={submitting} className="rounded-xl bg-(--primary-orange) px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-(--secondary-orange) disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
