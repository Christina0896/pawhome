'use client';

import { useEffect, useRef, useState } from 'react';
import Header from '../../components/header';
import { supabase } from '../../lib/supabaseClient';
import { counties } from '../../data/countyList';
import { dogBreeds, catBreeds, otherPetTypes } from '../../data/petOptions';
import Link from 'next/link'

const REQUIRE_VERIFICATION_TO_POST = false;

// Custom select component
function CustomSelect({
  id,
  label,
  required = false,
  value,
  placeholder,
  options,
  error,
  openDropdown,
  setOpenDropdown,
  onChange,
}) {
  const open = openDropdown === id;

  return (
    <div className="relative w-full data-dropdown-root">
      <div className=" min-h-[38px]">
        <label className="block text-sm font-semibold text-(--secondary-green)">
          {label} {required && <span className="text-(--primary-orange)">*</span>}
        </label>

        <p className=" min-h-[16px] text-xs text-red-500">{error || ''}</p>
      </div>

      <button
        type="button"
        onClick={() => setOpenDropdown(open ? null : id)}
        className={`flex h-[45px] w-full items-center justify-between rounded-xl border bg-white px-4 text-left text-sm outline-none ring-0 transition focus:outline-none focus:ring-0 ${
          error
            ? 'border-red-400'
            : open
              ? 'border-(--primary-green)'
              : 'border-(--border-beige) hover:border-(--primary-green)'
        }`}
      >
        <span className={`block truncate ${value ? 'text-(--secondary-green)' : 'text-(--muted-green-text)'}`}>
          {value || placeholder}
        </span>

        <span className={`ml-3 shrink-0 text-xs text-(--primary-green) transition ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[9999] mt-2 max-h-72 overflow-y-auto rounded-xl border border-(--border-beige) bg-white shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(option.value);
                setOpenDropdown(null);
              }}
              className="block w-full border-b border-(--border-beige) px-4 py-3 text-left text-sm text-(--secondary-green) outline-none transition hover:bg-(--background) focus:outline-none"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
export default function PostAdPage() {
  const fileInputRef = useRef(null);
  const [showAnimalDropdown, setShowAnimalDropdown] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    listing_type: '',
    animal_type: '',
    breed: '',
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
    sellerRegistrationNumber: '',
    organisationName: '',

    microchipped: '',
    registrationNumber: '',
    vaccinated: '',
    wormed: '',
    vet_checked: '',
    spayed_neutered: '',
    health_tested: '',
    kc_registered: '',

    proven_stud: '',
    stud_terms: '',

    description: '',
  });
  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const validateForm = () => {
    const newErrors = {};

    if (!formData.listing_type) {
      newErrors.listing_type = 'Please select an ad type.';
    }

    if (!formData.animal_type) {
      newErrors.animal_type = 'Please select an animal type.';
    }

    if (!formData.breed || formData.breed.trim().length < 2) {
      newErrors.breed = 'Please enter a breed or pet type.';
    }

    if (!formData.age) {
      newErrors.age = "Please enter the pet's age.";
    }

    if (!formData.sex) {
      newErrors.sex = 'Please select the sex.';
    }

    if (
      (formData.listing_type === 'For Sale' || formData.listing_type === 'For Stud') &&
      (!formData.price || Number(formData.price) <= 0)
    ) {
      newErrors.price = 'Please enter a valid price.';
    }

    if (!formData.county) {
      newErrors.county = 'Please select a county.';
    }

    if (!formData.seller_type) {
      newErrors.seller_type = 'Please select the seller type.';
    }

    if (formData.animal_type === 'Dogs' && !formData.microchipped) {
      newErrors.microchipped = 'Please confirm if the dog is microchipped.';
    }

    if (!formData.description || formData.description.trim().length < 80) {
      newErrors.description = 'Description must be at least 80 characters.';
    }

    if (formData.description && formData.description.trim().length > 800) {
      newErrors.description = 'Description cannot be longer than 800 characters.';
    }

    if (!photos || photos.length === 0) {
      newErrors.photos = 'Please upload at least one photo.';
    }

    const isMixedLitter = formData.sex === 'Mixed Litter';
    const isDogOrCat = ['dogs', 'cats'].includes(formData.animal_type?.toLowerCase());

    if (isDogOrCat && isMixedLitter) {
      if (!formData.litter_size) {
        newErrors.litter_size = 'Please enter the litter size.';
      }

      if (!formData.available_litter_count) {
        newErrors.available_litter_count = 'Please enter how many are available.';
      }

      const litterSize = Number(formData.litter_size || 0);
      const availableLitterCount = Number(formData.available_litter_count || 0);
      const boys = Number(formData.male_count || 0);
      const girls = Number(formData.female_count || 0);

      if (availableLitterCount > litterSize) {
        newErrors.available_litter_count = 'Available cannot be higher than litter size.';
      }

      if (boys + girls !== availableLitterCount) {
        newErrors.male_count = 'Boys and girls together must match the available count.';
        newErrors.female_count = 'Boys and girls together must match the available count.';
      }
      if (!formData.date_of_birth) {
        newErrors.date_of_birth = 'Please enter the litter date of birth.';
      }

      if (!formData.ready_to_leave) {
        newErrors.ready_to_leave = 'Please enter when the litter is ready to leave.';
      }

      if (readyToLeaveTooEarly) {
        newErrors.ready_to_leave = `This litter is too young to leave. Minimum age is ${minimumLegalAgeWeeks} weeks.`;
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = '/login';
        return;
      }
      const metadata = user.user_metadata || {};

      const emailVerified = Boolean(metadata.email_verified || user.email_confirmed_at);
      const phoneVerified = Boolean(metadata.phone_verified);

      if (REQUIRE_VERIFICATION_TO_POST && (!emailVerified || !phoneVerified)) {
        alert('Please verify your email and phone number before posting an ad.');
        return;
      }
      const userMetadata = user.user_metadata || {};

      const contactPhone = `${userMetadata.phone_code || ''} ${
        userMetadata.phone_number || userMetadata.phone || ''
      }`.trim();

      setUser(user);
      setLoading(false);
    };

    checkUser();
  }, []);

  const [openDropdown, setOpenDropdown] = useState(null);
  const formRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-dropdown-root]')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const priceRequired = formData.listing_type === 'For Sale' || formData.listing_type === 'For Stud';

  const breedSuggestions =
    formData.animal_type === 'Dogs'
      ? dogBreeds
      : formData.animal_type === 'Cats'
        ? catBreeds
        : formData.animal_type === 'Other Pets'
          ? []
          : [...dogBreeds, ...catBreeds];

  const filteredBreedSuggestions = breedSuggestions.filter((breed) =>
    breed.toLowerCase().includes(formData.breed.toLowerCase()),
  );

  const breedDropdownRef = useRef(null);

  const addPhotos = (files) => {
    const allowedFiles = files.filter((file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type));

    if (allowedFiles.length === 0) return;

    setPhotos((prevPhotos) => {
      const remainingSlots = 6 - prevPhotos.length;
      const filesToAdd = allowedFiles.slice(0, remainingSlots);

      return [...prevPhotos, ...filesToAdd];
    });

    setPhotoPreviews((prevPreviews) => {
      const remainingSlots = 6 - prevPreviews.length;
      const filesToAdd = allowedFiles.slice(0, remainingSlots);
      const newPreviews = filesToAdd.map((file) => URL.createObjectURL(file));

      return [...prevPreviews, ...newPreviews];
    });

    setErrors({
      ...errors,
      photos: '',
    });
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || []);

    addPhotos(files);

    e.target.value = '';
  };

  const handlePhotoDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files || []);

    addPhotos(files);
  };
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const handleSubmitListing = async (e) => {
    e.preventDefault();

    setHasTriedSubmit(true);

    const isValid = validateForm();

    if (!isValid) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });

      return;
    }

    // rest of submit code

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = '/login';
      return;
    }
    const userMetadata = user.user_metadata || {};

    const contactPhone = `${userMetadata.phone_code || ''} ${
      userMetadata.phone_number || userMetadata.phone || ''
    }`.trim();
    const sellerMemberSince = user.created_at;
    if (formData.price === '' || Number(formData.price) < 0) {
      setErrors((prev) => ({
        ...prev,
        price: 'Price is required.',
      }));
      return;
    }
    // 1. Insert listing first
    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .insert({
        user_id: user.id,

        title: formData.title,
        animal_type: formData.animal_type,
        listing_type: formData.listing_type,
        breed: formData.breed,

        age: formData.age,
        sex: formData.sex,

        county: formData.county,
        city: formData.city,

        seller_name:
          `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || 'Seller',

        seller_type: formData.seller_type || 'Private Owner',

        price: Number(formData.price),
        price_negotiable: formData.price_negotiable,

        microchipped: formData.microchipped,
        vaccinated: formData.vaccinated,
        wormed: formData.wormed,
        vet_checked: formData.vet_checked,
        spayed_neutered: formData.spayed_neutered,
        health_tested: formData.health_tested,
        kennel_club_registered: formData.kc_registered,
        breeding_rights: formData.breedingRights,

        litter_size: formData.litter_size || null,
        available_litter_count: formData.available_litter_count || null,
        male_count: formData.sex === 'Mixed Litter' ? Number(formData.male_count || 0) : 0,

        female_count: formData.sex === 'Mixed Litter' ? Number(formData.female_count || 0) : 0,

        date_of_birth: formData.date_of_birth || null,
        ready_to_leave: formData.ready_to_leave || null,
        mother_can_be_seen: formData.mother_can_be_seen || null,

        registration_number: formData.registrationNumber,
        organisation_name: formData.organisationName,

        seller_member_since: user.created_at,
        contact_phone: contactPhone,

        description: formData.description,
        status: 'pending',
      })
      .select()
      .single();

    if (listingError) {
      console.error('Listing insert error full:', listingError);
      console.error('Message:', listingError.message);
      console.error('Details:', listingError.details);
      console.error('Hint:', listingError.hint);
      console.error('Code:', listingError.code);

      setErrors({
        submit: listingError.message || listingError.details || 'Could not submit listing. Please try again.',
      });

      return;
    }

    // 2. Upload photos
    if (photos.length > 0) {
      const photoRows = [];

      for (let i = 0; i < photos.length; i++) {
        const file = photos[i];

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${listingData.id}-${i}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from('listing-photos').upload(fileName, file);

        if (uploadError) {
          console.error('Photo upload error:', uploadError);
          setErrors({ submit: 'Listing was created, but photo upload failed.' });
          return;
        }

        const { data: publicUrlData } = supabase.storage.from('listing-photos').getPublicUrl(fileName);

        photoRows.push({
          listing_id: listingData.id,
          image_url: publicUrlData.publicUrl,
          sort_order: i,
        });
      }
      const sellerName = `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim();

      // 3. Save photo URLs into listing_photos table

      const { error: photoDbError } = await supabase.from('listing_photos').insert(photoRows);

      if (photoDbError) {
        console.error('Photo DB insert error:', photoDbError);
        setErrors({
          submit: 'Listing was created, but photo records could not be saved.',
        });
        return;
      }

      window.location.href = '/post-ad/success';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EC]">
        <Header />
        <main className="mx-auto max-w-[1500px] px-6 py-10">
          <p className="text-[#123524]">Checking account...</p>
        </main>
      </div>
    );
  }
  const isDogOrCat = ['dogs', 'cats'].includes(formData.animal_type?.toLowerCase());

  const isMixedLitter = formData.sex === 'Mixed Litter';

  const showLitterInfo = isMixedLitter && ['dogs', 'cats'].includes(formData.animal_type?.toLowerCase());

  const labelClass = 'mb-2 block text-sm font-bold text-(--secondary-green)';
  const getMinimumLegalAgeWeeks = () => {
    const animalType = String(formData.animal_type || '')
      .trim()
      .toLowerCase();
    const petType = String(formData.breed || '')
      .trim()
      .toLowerCase();

    if (animalType === 'dogs' || animalType === 'cats') return 8;

    if (petType.includes('rabbit')) return 6;

    if (
      petType.includes('guinea pig') ||
      petType.includes('gerbil') ||
      petType.includes('hamster') ||
      petType.includes('mouse') ||
      petType.includes('mice') ||
      petType.includes('rat')
    ) {
      return 4;
    }

    if (petType.includes('ferret')) return 8;

    return null;
  };

  const addWeeksToDate = (dateString, weeks) => {
    if (!dateString || !weeks) return '';

    const date = new Date(dateString);
    date.setDate(date.getDate() + weeks * 7);

    return date.toISOString().split('T')[0];
  };

  const minimumLegalAgeWeeks = getMinimumLegalAgeWeeks();

  const minimumReadyToLeaveDate = addWeeksToDate(formData.date_of_birth, minimumLegalAgeWeeks);

  const readyToLeaveTooEarly =
    formData.ready_to_leave &&
    minimumReadyToLeaveDate &&
    new Date(formData.ready_to_leave) < new Date(minimumReadyToLeaveDate);

  return (
    <div className="min-h-screen bg-[#FAF6EC]">
      <Header />

      <main className="mx-auto max-w-[1500px] px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-[#5F6F64]">
          <Link href="/" className="hover:text-[#0E4F2A]">
            Home
          </Link>
          <span className="mx-2">›</span>
          <span>Post an Ad</span>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          <form
            ref={formRef}
            onSubmit={handleSubmitListing}
            className="col-span-full rounded-2xl border border-[#E8DFD1] bg-white p-8 shadow-sm"
          >
            {hasTriedSubmit &&
              Object.values(errors).filter((error) => typeof error === 'string' && error.trim() !== '').length > 0 && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                  <p className="font-bold">Please fix the following:</p>

                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {Object.values(errors)
                      .filter((error) => typeof error === 'string' && error.trim() !== '')
                      .map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                  </ul>
                </div>
              )}
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 xl:grid-cols-4">
              {/* Listing Type */}

              <CustomSelect
                id="listing_type"
                label="Ad Type"
                required
                value={formData.listing_type}
                placeholder="Select ad type"
                error={errors.listing_type}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
                options={[
                  { label: 'For Sale', value: 'For Sale' },
                  { label: 'For Stud', value: 'For Stud' },
                  { label: 'For Adoption', value: 'For Adoption' },
                ]}
                onChange={(value) => {
                  setFormData({
                    ...formData,
                    listing_type: value,
                    health_tested: value === 'For Stud' ? formData.health_tested : '',
                    proven_stud: value === 'For Stud' ? formData.proven_stud : '',
                    stud_terms: value === 'For Stud' ? formData.stud_terms : '',
                  });

                  setErrors({
                    ...errors,
                    listing_type: '',
                    price: '',
                    health_tested: '',
                    proven_stud: '',
                    stud_terms: '',
                  });
                }}
              />

              {/* Animal Type */}
              <CustomSelect
                id="animal_type"
                label="Animal Type"
                required
                value={formData.animal_type}
                placeholder="Select animal type"
                error={errors.animal_type}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
                options={[
                  { label: 'Dogs', value: 'Dogs' },
                  { label: 'Cats', value: 'Cats' },
                  { label: 'Other Pets', value: 'Other Pets' },
                ]}
                onChange={(value) => {
                  setFormData({
                    ...formData,
                    animal_type: value,
                    breed: '',
                  });

                  setErrors({
                    ...errors,
                    animal_type: '',
                    breed: '',
                  });
                }}
              />

              {/* Title */}
              <div className="">
                <label className="mb-4 block text-sm font-bold text-(--secondary-green)">
                  Listing Title <span className="text-(--primary-orange)">*</span>
                </label>
                <input
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Example: Beautiful family-raised Akita puppies"
                  required
                  maxLength={80}
                  className="h-[45px] w-full rounded-xl border border-(--border-beige) bg-white px-4 text-sm text-(--secondary-green) outline-none transition focus:border-(--primary-green) focus:ring-4 focus:ring-[rgba(14,79,42,0.10)]"
                />
              </div>
              {/* Breed */}
              <div className="relative data-dropdown-root">
                <div className=" min-h-[38px]">
                  <label className="block text-sm font-semibold text-(--secondary-green)">
                    Breed <span className="text-(--primary-orange)">*</span>
                  </label>

                  <p className=" min-h-[16px] text-xs text-red-500">{errors.breed || ''}</p>
                </div>

                <div
                  className={`h-[45px] flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-sm transition ${
                    errors.breed
                      ? 'border-red-400'
                      : openDropdown === 'breed'
                        ? 'border-(--primary-green)'
                        : 'border-(--border-beige) hover:border-(--primary-green)'
                  }`}
                >
                  <input
                    type="text"
                    name="breed"
                    value={formData.breed}
                    onFocus={() => {
                      if (formData.animal_type !== 'Other Pets') {
                        setOpenDropdown('breed');
                      }
                    }}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        breed: e.target.value,
                      });

                      setErrors({
                        ...errors,
                        breed: '',
                      });

                      if (formData.animal_type !== 'Other Pets') {
                        setOpenDropdown('breed');
                      }
                    }}
                    placeholder={formData.animal_type === 'Other Pets' ? 'Enter pet type...' : 'Start typing...'}
                    className="min-w-0 flex-1 bg-transparent text-(--secondary-green) outline-none ring-0 placeholder:text-(--muted-green-text) focus:outline-none focus:ring-0"
                  />

                  {formData.animal_type !== 'Other Pets' && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(openDropdown === 'breed' ? null : 'breed');
                      }}
                      className="ml-3 shrink-0 text-xs text-(--primary-green) outline-none focus:outline-none"
                    >
                      ▼
                    </button>
                  )}
                </div>

                {openDropdown === 'breed' && formData.animal_type !== 'Other Pets' && (
                  <div className="absolute left-0 right-0 top-full z-[9999] mt-2 max-h-72 overflow-y-auto rounded-xl border border-(--border-beige) bg-white shadow-lg">
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        setFormData({
                          ...formData,
                          breed: '',
                        });

                        setErrors({
                          ...errors,
                          breed: '',
                        });

                        setOpenDropdown(null);
                      }}
                      className="block w-full border-b border-(--border-beige) px-4 py-3 text-left text-sm text-(--secondary-green) outline-none hover:bg-(--background) focus:outline-none"
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

                          setFormData({
                            ...formData,
                            breed,
                          });

                          setErrors({
                            ...errors,
                            breed: '',
                          });

                          setOpenDropdown(null);
                        }}
                        className="block w-full border-b border-(--border-beige) px-4 py-3 text-left text-sm text-(--secondary-green) outline-none hover:bg-(--background) focus:outline-none"
                      >
                        {breed}
                      </button>
                    ))}

                    {filteredBreedSuggestions.length === 0 && (
                      <p className="px-4 py-3 text-sm text-(--muted-green-text)">No breeds found</p>
                    )}
                  </div>
                )}
              </div>

              {/* Age */}
              <div className="w-full">
                <div className=" min-h-[38px]">
                  <label className="block text-sm font-semibold text-(--secondary-green)">
                    Age <span className="text-(--primary-orange)">*</span>
                  </label>

                  <p className=" min-h-[16px] text-xs text-red-500">{errors.age || ''}</p>
                </div>

                <input
                  type="text"
                  name="age"
                  value={formData.age}
                  onChange={(e) => {
                    handleFormChange(e);
                    setErrors({ ...errors, age: '' });
                  }}
                  placeholder="e.g. 8 weeks"
                  className={`h-[45px] w-full rounded-xl border bg-white px-4 text-sm text-(--secondary-green) outline-none ring-0 transition placeholder:text-(--muted-green-text) focus:outline-none focus:ring-0 ${
                    errors.age
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-(--border-beige) focus:border-(--primary-green)'
                  }`}
                />
              </div>

              {/* Sex */}
              <CustomSelect
                id="sex"
                label="Sex"
                required
                value={formData.sex}
                placeholder="Select sex"
                error={errors.sex}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
                options={[
                  { label: 'Male', value: 'Male' },
                  { label: 'Female', value: 'Female' },
                  { label: 'Mixed Litter', value: 'Mixed Litter' },
                ]}
                onChange={(value) => {
                  setFormData({
                    ...formData,
                    sex: value,
                  });

                  setErrors({
                    ...errors,
                    sex: '',
                  });
                }}
              />

              {/* County */}
              <CustomSelect
                id="county"
                label="County"
                required
                value={formData.county}
                placeholder="All Counties"
                error={errors.county}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
                options={counties.map((county) => ({
                  label: county,
                  value: county,
                }))}
                onChange={(value) => {
                  setFormData({
                    ...formData,
                    county: value,
                  });

                  setErrors({
                    ...errors,
                    county: '',
                  });
                }}
              />

              {/* City / Town */}
              <div>
                <div className=" min-h-[34px]">
                  <label className="block text-sm font-semibold text-(--secondary-green)">City / Town</label>

                  <p className=" min-h-[16px] text-xs text-red-500">{errors.city || ''}</p>
                </div>

                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={(e) => {
                    handleFormChange(e);
                    setErrors({ ...errors, city: '' });
                  }}
                  placeholder="e.g. Dublin"
                  className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-(--secondary-green) outline-none ring-0 transition placeholder:text-(--muted-green-text) focus:outline-none focus:ring-0 ${
                    errors.city
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-(--border-beige) focus:border-(--primary-green)'
                  }`}
                />
              </div>

              {/* Seller Type */}
              <CustomSelect
                id="seller_type"
                label="Seller Type"
                required
                value={formData.seller_type}
                placeholder="Select seller type"
                error={errors.seller_type}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
                options={[
                  { label: 'Private Owner', value: 'Private Owner' },
                  { label: 'Breeder', value: 'Breeder' },
                  { label: 'Shelter / Rescue', value: 'Shelter / Rescue' },
                ]}
                onChange={(value) => {
                  setFormData({
                    ...formData,
                    seller_type: value,
                  });

                  setErrors({
                    ...errors,
                    seller_type: '',
                  });
                }}
              />

              {/* Price */}
              <div>
                <label className="mb-4.5 block text-sm font-semibold text-(--secondary-green)">
                  Price <span className="text-(--primary-orange)">*</span>
                </label>

                <div
                  className={`flex h-[45px] w-full items-center overflow-hidden rounded-xl border bg-white text-sm text-(--secondary-green) transition focus-within:ring-4 focus-within:ring-[rgba(14,79,42,0.10)] ${
                    errors.price
                      ? 'border-red-400 focus-within:border-red-500'
                      : 'border-(--border-beige) focus-within:border-(--primary-green)'
                  }`}
                >
                  <div className="flex h-full items-center border-r border-(--border-beige) px-3 font-bold text-(--muted-green-text)">
                    €
                  </div>

                  <input
                    name="price"
                    type="number"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }));

                      setErrors((prev) => ({
                        ...prev,
                        price: '',
                      }));
                    }}
                    placeholder="e.g. 1200"
                    className="h-full min-w-0 flex-1 bg-white px-3 text-sm text-(--secondary-green) outline-none"
                  />

                  <label className="flex h-full shrink-0 cursor-pointer items-center gap-2 border-l border-(--border-beige) px-3 text-xs font-bold text-(--muted-green-text)">
                    <input
                      type="checkbox"
                      checked={formData.price_negotiable}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price_negotiable: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-(--primary-green)"
                    />
                    Negotiable
                  </label>
                </div>

                {errors.price && <p className="mt-2 text-xs font-medium text-red-500">{errors.price}</p>}
              </div>

              {/* IKC / KC Registered */}
              <CustomSelect
                id="kc_registered"
                label="IKC / KC Registered"
                value={formData.kc_registered}
                placeholder="Select option"
                error={errors.kc_registered}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
                options={[
                  { label: 'Yes', value: 'Yes' },
                  { label: 'No', value: 'No' },
                ]}
                onChange={(value) => {
                  setFormData({
                    ...formData,
                    kc_registered: value,
                  });

                  setErrors({
                    ...errors,
                    kc_registered: '',
                  });
                }}
              />

              {/* Second Section */}
              {/* Health & Verification */}
              <div className="md:col-span-4">
                <div className="mt-4 border-t border-[#E8DFD1] pt-6">
                  <h3 className="text-lg font-bold text-[#123524]">Health & Verification</h3>
                  <p className="mt-1 text-sm text-[#5F6F64]">
                    These details help buyers understand the pet’s background and reduce suspicious listings.
                  </p>
                </div>
              </div>

              {/* Microchipped */}
              {['dogs', 'cats'].includes(formData.animal_type?.toLowerCase()) && (
                <div>
                  <div className=" min-h-[38px]">
                    <label className="block text-sm font-semibold text-(--secondary-green)">
                      Microchipped{' '}
                      {formData.animal_type?.toLowerCase() === 'dogs' && (
                        <span className="text-(--primary-orange)">*</span>
                      )}
                    </label>

                    <p className="min-h-[16px] text-xs text-red-500">{errors.microchipped || ''}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const nextValue = formData.microchipped === 'Yes' ? '' : 'Yes';

                      setFormData({
                        ...formData,
                        microchipped: nextValue,
                      });

                      setErrors({
                        ...errors,
                        microchipped: '',
                      });
                    }}
                    className={`flex h-[45px] w-full items-center justify-between rounded-xl border px-4 text-sm font-semibold transition ${
                      formData.microchipped === 'Yes'
                        ? 'border-(--primary-green) bg-(--light-green) text-(--secondary-green)'
                        : errors.microchipped
                          ? 'border-red-400 bg-white text-(--secondary-green)'
                          : 'border-(--border-beige) bg-white text-(--muted-green-text) hover:border-(--primary-green)'
                    }`}
                  >
                    <span>
                      {formData.animal_type?.toLowerCase() === 'cats' ? 'Cat is microchipped' : 'Dog is microchipped'}
                    </span>

                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                        formData.microchipped === 'Yes'
                          ? 'border-(--primary-green) bg-(--primary-green) text-white'
                          : 'border-(--border-beige) bg-white'
                      }`}
                    >
                      {formData.microchipped === 'Yes' ? '✓' : ''}
                    </span>
                  </button>
                </div>
              )}

              {/* Vaccinated */}
              <CustomSelect
                id="vaccinated"
                label="Vaccinated"
                value={formData.vaccinated}
                placeholder="Select"
                error={errors.vaccinated}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
                options={[
                  { label: 'Yes', value: 'Yes' },
                  { label: 'No', value: 'No' },
                  { label: 'Unknown', value: 'Unknown' },
                ]}
                onChange={(value) => {
                  setFormData({
                    ...formData,
                    vaccinated: value,
                  });

                  setErrors({
                    ...errors,
                    vaccinated: '',
                  });
                }}
              />

              {/* Wormed */}
              <CustomSelect
                id="wormed"
                label="Wormed"
                value={formData.wormed}
                placeholder="Select"
                error={errors.wormed}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
                options={[
                  { label: 'Yes', value: 'Yes' },
                  { label: 'No', value: 'No' },
                  { label: 'Unknown', value: 'Unknown' },
                ]}
                onChange={(value) => {
                  setFormData({ ...formData, wormed: value });
                  setErrors({ ...errors, wormed: '' });
                }}
              />

              {/* Vet Checked */}
              <CustomSelect
                id="vet_checked"
                label="Vet Checked"
                value={formData.vet_checked}
                placeholder="Select"
                error={errors.vet_checked}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
                options={[
                  { label: 'Yes', value: 'Yes' },
                  { label: 'No', value: 'No' },
                ]}
                onChange={(value) => {
                  setFormData({ ...formData, vet_checked: value });
                  setErrors({ ...errors, vet_checked: '' });
                }}
              />

              {/* Spayed */}
              <CustomSelect
                id="spayed_neutered"
                label="Spayed / Neutered"
                value={formData.spayed_neutered}
                placeholder="Select"
                error={errors.spayed_neutered}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
                options={[
                  { label: 'Yes', value: 'Yes' },
                  { label: 'No', value: 'No' },
                  { label: 'Not applicable', value: 'Not applicable' },
                ]}
                onChange={(value) => {
                  setFormData({ ...formData, spayed_neutered: value });
                  setErrors({ ...errors, spayed_neutered: '' });
                }}
              />

              {/* Health Tested */}
              <CustomSelect
                id="health_tested"
                label="Health Tested"
                value={formData.health_tested}
                placeholder="Select"
                error={errors.health_tested}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
                options={[
                  { label: 'Yes', value: 'Yes' },
                  { label: 'No', value: 'No' },
                ]}
                onChange={(value) => {
                  setFormData({ ...formData, health_tested: value });
                  setErrors({ ...errors, health_tested: '' });
                }}
              />

              {formData.listing_type === 'For Stud' && (
                <div className="col-span-full rounded-2xl border border-(--border-beige) bg-(--background) p-5">
                  <h3 className="text-lg font-bold text-(--secondary-green)">Stud Information</h3>

                  <p className="mt-1 text-sm text-(--muted-green-text)">Add extra details for stud listings.</p>

                  <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
                    {/* Health Tested */}
                    <CustomSelect
                      id="health_tested"
                      label="Health Tested"
                      value={formData.health_tested}
                      placeholder="Select option"
                      error={errors.health_tested}
                      openDropdown={openDropdown}
                      setOpenDropdown={setOpenDropdown}
                      options={[
                        { label: 'Yes', value: 'Yes' },
                        { label: 'No', value: 'No' },
                      ]}
                      onChange={(value) => {
                        setFormData({
                          ...formData,
                          health_tested: value,
                        });

                        setErrors({
                          ...errors,
                          health_tested: '',
                        });
                      }}
                    />

                    {/* Proven Stud */}
                    <CustomSelect
                      id="proven_stud"
                      label="Proven Stud"
                      value={formData.proven_stud}
                      placeholder="Select option"
                      error={errors.proven_stud}
                      openDropdown={openDropdown}
                      setOpenDropdown={setOpenDropdown}
                      options={[
                        { label: 'Yes', value: 'Yes' },
                        { label: 'No', value: 'No' },
                      ]}
                      onChange={(value) => {
                        setFormData({
                          ...formData,
                          proven_stud: value,
                        });

                        setErrors({
                          ...errors,
                          proven_stud: '',
                        });
                      }}
                    />

                    {/* Stud Terms */}
                    <div className="col-span-full">
                      <div className="mb-2 min-h-[38px]">
                        <label className="block text-sm font-semibold text-(--secondary-green)">Stud Terms</label>

                        <p className="mt-1 min-h-[16px] text-xs text-red-500">{errors.stud_terms || ''}</p>
                      </div>

                      <textarea
                        name="stud_terms"
                        value={formData.stud_terms}
                        onChange={(e) => {
                          handleFormChange(e);
                          setErrors({ ...errors, stud_terms: '' });
                        }}
                        rows={4}
                        placeholder="Add details about stud fee, conditions, health testing, and requirements."
                        className={`min-h-[120px] w-full resize-y rounded-2xl border bg-white px-4 py-3 text-sm text-(--secondary-green) outline-none ring-0 transition placeholder:text-(--muted-green-text) focus:outline-none focus:ring-0 ${
                          errors.stud_terms
                            ? 'border-red-400 focus:border-red-500'
                            : 'border-(--border-beige) focus:border-(--primary-green)'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Litter background */}
              {showLitterInfo && (
                <section className="col-span-full mt-6 rounded-2xl border border-(--border-beige) bg-white p-6">
                  <h2 className="text-xl font-extrabold text-(--secondary-green)">Litter Info</h2>

                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-(--secondary-green)">Litter Size</label>

                      <input
                        type="number"
                        min="1"
                        value={formData.litter_size}
                        onChange={(e) =>
                          setFormData((current) => ({
                            ...current,
                            litter_size: e.target.value,
                          }))
                        }
                        placeholder="e.g. 6"
                        className="h-12 w-full rounded-xl border border-(--border-beige) bg-white px-4 text-sm font-semibold text-(--secondary-green) outline-none transition focus:border-(--primary-green)"
                      />

                      {errors.litter_size && (
                        <p className="mt-1 text-xs font-semibold text-red-600">{errors.litter_size}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-(--secondary-green)">Available</label>

                      <input
                        type="number"
                        min="0"
                        max={formData.litter_size || undefined}
                        value={formData.available_litter_count}
                        onChange={(e) =>
                          setFormData((current) => ({
                            ...current,
                            available_litter_count: e.target.value,
                          }))
                        }
                        placeholder="e.g. 4"
                        className="h-12 w-full rounded-xl border border-(--border-beige) bg-white px-4 text-sm font-semibold text-(--secondary-green) outline-none transition focus:border-(--primary-green)"
                      />

                      {errors.available_litter_count && (
                        <p className="mt-1 text-xs font-semibold text-red-600">{errors.available_litter_count}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-(--secondary-green)">Number of Boys</label>

                      <input
                        type="number"
                        min="0"
                        value={formData.male_count}
                        onChange={(e) =>
                          setFormData((current) => ({
                            ...current,
                            male_count: e.target.value,
                          }))
                        }
                        placeholder="e.g. 3"
                        className="h-12 w-full rounded-xl border border-(--border-beige) bg-white px-4 text-sm font-semibold text-(--secondary-green) outline-none transition focus:border-(--primary-green)"
                      />

                      {errors.male_count && (
                        <p className="mt-1 text-xs font-semibold text-red-600">{errors.male_count}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-(--secondary-green)">Number of Girls</label>

                      <input
                        type="number"
                        min="0"
                        value={formData.female_count}
                        onChange={(e) =>
                          setFormData((current) => ({
                            ...current,
                            female_count: e.target.value,
                          }))
                        }
                        placeholder="e.g. 3"
                        className="h-12 w-full rounded-xl border border-(--border-beige) bg-white px-4 text-sm font-semibold text-(--secondary-green) outline-none transition focus:border-(--primary-green)"
                      />

                      {errors.female_count && (
                        <p className="mt-1 text-xs font-semibold text-red-600">{errors.female_count}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-(--secondary-green)">Date of Birth</label>

                      <input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) =>
                          setFormData((current) => ({
                            ...current,
                            date_of_birth: e.target.value,
                            ready_to_leave:
                              e.target.value && minimumLegalAgeWeeks
                                ? addWeeksToDate(e.target.value, minimumLegalAgeWeeks)
                                : current.ready_to_leave,
                          }))
                        }
                        className="h-12 w-full rounded-xl border border-(--border-beige) bg-white px-4 text-sm font-semibold text-(--secondary-green) outline-none transition focus:border-(--primary-green)"
                      />

                      {errors.date_of_birth && (
                        <p className="mt-1 text-xs font-semibold text-red-600">{errors.date_of_birth}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-(--secondary-green)">Ready to Leave</label>

                      <input
                        type="date"
                        min={minimumReadyToLeaveDate || undefined}
                        value={formData.ready_to_leave}
                        onChange={(e) =>
                          setFormData((current) => ({
                            ...current,
                            ready_to_leave: e.target.value,
                          }))
                        }
                        className="h-12 w-full rounded-xl border border-(--border-beige) bg-white px-4 text-sm font-semibold text-(--secondary-green) outline-none transition focus:border-(--primary-green)"
                      />

                      {minimumReadyToLeaveDate && (
                        <p className="mt-1 text-xs font-semibold text-(--muted-green-text)">
                          Minimum legal ready date: {minimumReadyToLeaveDate}
                        </p>
                      )}

                      {readyToLeaveTooEarly && (
                        <p className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                          This litter is too young to leave. Minimum age is {minimumLegalAgeWeeks} weeks.
                        </p>
                      )}

                      {errors.ready_to_leave && (
                        <p className="mt-1 text-xs font-semibold text-red-600">{errors.ready_to_leave}</p>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Photos */}
              <div className="md:col-span-4">
                <div className="mt-4 border-t border-[#E8DFD1] pt-6">
                  <h3 className="text-lg font-bold text-[#123524]">Photos</h3>
                  <p className="mt-1 text-sm text-[#5F6F64]">
                    Add clear photos of the pet. You can upload up to 6 images.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                />

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={(e) => e.preventDefault()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handlePhotoDrop}
                  className={`mt-6 flex min-h-[170px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition ${
                    errors.photos
                      ? 'border-red-300 bg-red-50'
                      : 'border-(--border-beige) bg-(--background) hover:border-(--primary-green)'
                  }`}
                >
                  <div className="text-3xl">📷</div>

                  <p className="mt-3 text-sm font-semibold text-(--secondary-green)">Click or drag photos here</p>

                  <p className="mt-1 text-xs text-(--muted-green-text)">JPG, PNG or WEBP. Maximum 6 photos.</p>
                </div>

                {errors.photos && <p className="mt-2 text-xs font-medium text-red-500">{errors.photos}</p>}

                {photoPreviews.length > 0 && (
                  <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
                    {photoPreviews.map((preview, index) => (
                      <div
                        key={preview}
                        className="relative h-28 overflow-hidden rounded-xl border border-(--border-beige)"
                      >
                        <img src={preview} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />

                        <button
                          type="button"
                          onClick={() => {
                            URL.revokeObjectURL(preview);

                            setPhotos((prev) => prev.filter((_, i) => i !== index));
                            setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
                          }}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-bold text-red-500 shadow"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Seller Registration */}
              <div className="md:col-span-4">
                <div className="mt-4 border-t border-[#E8DFD1] pt-6">
                  <h3 className="text-lg font-bold text-[#123524]">Seller Registration</h3>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-[#123524]">
                  Pet Seller Registration Number
                </label>
                <input
                  type="text"
                  name="sellerRegistrationNumber"
                  value={formData.sellerRegistrationNumber}
                  onChange={handleFormChange}
                  placeholder="Enter registration number if applicable"
                  className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-[#123524]">Licence / Organisation Name</label>
                <input
                  type="text"
                  name="organisationName"
                  value={formData.organisationName}
                  onChange={handleFormChange}
                  placeholder="Breeder, rescue, shelter, or organisation name"
                  className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                />
              </div>
            </div>
            {/* Description */}
            <div className="mt-5 md:col-span-2 xl:col-span-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-lg font-semibold text-(--secondary-green)">
                  Description <span className="text-(--primary-orange)">*</span>
                </label>

                {errors.description && <p className="text-xs font-medium text-red-500">{errors.description}</p>}
              </div>

              <textarea
                name="description"
                value={formData.description}
                onChange={(e) => {
                  if (e.target.value.length <= 800) {
                    handleFormChange(e);
                    setErrors({ ...errors, description: '' });
                  }
                }}
                minLength={80}
                maxLength={800}
                rows={7}
                placeholder="Tell buyers about the pet’s personality, age, health, temperament, living situation, and what kind of home would suit them best."
                className={`min-h-[180px] w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm text-(--secondary-green) outline-none ring-0 transition placeholder:text-(--muted-green-text) focus:outline-none focus:ring-0 ${
                  errors.description
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-(--border-beige) focus:border-(--primary-green)'
                }`}
              />

              <div className="mt-1 flex justify-end text-xs text-(--muted-green-text)">Minimum 80 characters.</div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-8 flex items-center justify-end">
              <button
                type="submit"
                className="rounded-xl bg-(--primary-orange) px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-(--secondary-orange)"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
