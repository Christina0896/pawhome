'use client';

import { useEffect, useRef, useState } from 'react';
import Header from '../../components/header';
import { supabase } from '../../lib/supabaseClient';
import { counties } from '../../data/countyList';
import { dogBreeds, catBreeds, otherPetTypes } from '../../data/petOptions';
export default function PostAdPage() {
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    animalType: 'Dogs',
    breed: '',
    age: '',
    sex: '',
    price: '',
    county: '',
    city: '',
    sellerType: '',
    listingType: '',
    microchip: '',
    registrationNumber: '',
    vaccinated: '',
    wormed: '',
    vetChecked: '',
    spayedNeutered: '',
    healthTested: '',
    KCIKCRegistered: '',
    breedingRights: '',
    provenStud: '',
    studFee: '',
    healthTestDetails: '',
    breedingNotes: '',
    sellerRegistrationNumber: '',
    organisationName: '',
    description: '',
  });
  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

      const userMetadata = user.user_metadata || {};

      const contactPhone = `${userMetadata.phone_code || ''} ${userMetadata.phone || ''}`.trim();

      setUser(user);
      setLoading(false);
    };

    checkUser();
  }, []);
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

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    const selectedFiles = files.slice(0, 6);

    setPhotos(selectedFiles);

    const previews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviews(previews);
  };
  const handleSubmitListing = async (e) => {
    e.preventDefault();

    console.log('Submit clicked');
    console.log('Form data:', formData);
    console.log('Photos:', photos);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = '/login';
      return;
    }
    const userMetadata = user.user_metadata || {};

    const contactPhone = `${userMetadata.phone_code || ''} ${userMetadata.phone || ''}`.trim();

    // 1. Insert listing first
    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .insert({
        user_id: user.id,
        title: formData.breed || formData.animalType,
        listing_type: formData.listingType,
        animal_type: formData.animalType,
        breed: formData.breed,
        county: formData.county,
        city: formData.city,
        age: formData.age,
        sex: formData.sex,
        price: formData.price || null,
        listing_type: formData.listingType,
        seller_type: formData.sellerType,
        contact_phone: contactPhone,
        microchip: formData.microchip,
        registration_number: formData.registrationNumber,
        vaccinated: formData.vaccinated,
        wormed: formData.wormed,
        vet_checked: formData.vetChecked,
        spayed_neutered: formData.spayedNeutered,
        health_tested: formData.healthTested,
        kennel_club_registered: formData.kennelClubRegistered,
        breeding_rights: formData.breedingRights,
        proven_stud: formData.provenStud,
        stud_fee: formData.studFee || null,
        health_test_details: formData.healthTestDetails,
        breeding_notes: formData.breedingNotes,
        seller_registration_number: formData.sellerRegistrationNumber,
        organisation_name: formData.organisationName,
        description: formData.description,
        status: 'pending',
      })
      .select()
      .single();

    if (listingError) {
      console.error('Listing insert error:', listingError);
      alert('Could not submit listing.');
      return;
    }

    console.log('Listing created:', listingData);

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
          alert('Listing was created, but photo upload failed.');
          return;
        }

        const { data: publicUrlData } = supabase.storage.from('listing-photos').getPublicUrl(fileName);

        photoRows.push({
          listing_id: listingData.id,
          image_url: publicUrlData.publicUrl,
          sort_order: i,
        });
      }

      // 3. Save photo URLs into listing_photos table
      const { error: photoDbError } = await supabase.from('listing_photos').insert(photoRows);

      if (photoDbError) {
        console.error('Photo DB insert error:', photoDbError);
        alert('Listing was created, but photo records could not be saved.');
        return;
      }
    }

    alert('Listing submitted. It is now pending review.');
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

  return (
    <div className="min-h-screen bg-[#FAF6EC]">
      <Header />

      <main className="mx-auto max-w-[1500px] px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-[#5F6F64]">
          <a href="/" className="hover:text-[#0E4F2A]">
            Home
          </a>
          <span className="mx-2">›</span>
          <span>Post an Ad</span>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          {/* Left Sidebar */}
          <aside className="rounded-2xl border border-[#E8DFD1] bg-[#FFFCF5] p-6">
            <h1 className="text-2xl font-bold text-[#123524]">Post a New Ad</h1>

            <p className="mt-2 text-sm leading-6 text-[#5F6F64]">Fill in the details below to list your pet.</p>

            <div className="mt-10 space-y-7">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0E4F2A] text-sm font-bold text-white">
                  1
                </div>
                <span className="text-sm font-semibold text-[#123524]">Pet Details</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E8DFD1] bg-white text-sm font-bold text-[#5F6F64]">
                  2
                </div>
                <span className="text-sm font-semibold text-[#5F6F64]">Photos</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E8DFD1] bg-white text-sm font-bold text-[#5F6F64]">
                  3
                </div>
                <span className="text-sm font-semibold text-[#5F6F64]">Your Details</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E8DFD1] bg-white text-sm font-bold text-[#5F6F64]">
                  4
                </div>
                <span className="text-sm font-semibold text-[#5F6F64]">Review & Submit</span>
              </div>
            </div>
          </aside>

          {/* Main Form */}
          <form onSubmit={handleSubmitListing} className="rounded-2xl border border-[#E8DFD1] bg-white p-8 shadow-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#123524]">Pet Details</h2>
              <p className="mt-2 text-sm text-[#5F6F64]">
                Add the key information buyers need to understand your listing.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              {/* Listing Type */}
              <div className="md:col-span-4">
                <label className="mb-2 block text-sm font-semibold text-[#123524]">
                  Listing Type <span className="text-[#FF8A2A]">*</span>
                </label>

                <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#E8DFD1] p-4 md:grid-cols-3">
                  <label className="flex items-center gap-2 text-sm text-[#123524]">
                    <input
                      type="radio"
                      name="listingType"
                      value="For Sale"
                      checked={formData.listingType === 'For Sale'}
                      onChange={handleFormChange}
                    />
                    For Sale
                  </label>

                  <label className="flex items-center gap-2 text-sm text-[#123524]">
                    <input
                      type="radio"
                      name="listingType"
                      value="For Adoption"
                      checked={formData.listingType === 'For Adoption'}
                      onChange={handleFormChange}
                    />
                    For Adoption
                  </label>

                  <label className="flex items-center gap-2 text-sm text-[#123524]">
                    <input
                      type="radio"
                      name="listingType"
                      value="For Stud"
                      checked={formData.listingType === 'For Stud'}
                      onChange={handleFormChange}
                    />
                    For Stud
                  </label>
                </div>
              </div>
              {/* Animal Type */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-[#123524]">Animal Type</label>
                <select
                  name="animalType"
                  value={formData.animalType}
                  onChange={(e) => {
                    setAnimalType(e.target.value);
                    setBreedInput('');
                    setShowBreedDropdown(false);

                    setFormData((prev) => ({
                      ...prev,
                      animalType: e.target.value,
                      breed: '',
                    }));
                  }}
                  className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-[#0E4F2A]"
                >
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

                          setFormData((prev) => ({
                            ...prev,
                            breed: e.target.value,
                          }));
                        }}
                        placeholder="Start typing..."
                        className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-[#0E4F2A]"
                      />

                      <button
                        type="button"
                        onClick={() => setShowBreedDropdown(!showBreedDropdown)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#123524]"
                      ></button>
                    </div>

                    {showBreedDropdown && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-[#E8DFD1] bg-white shadow-lg">
                        <p className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#A68B6B]">
                          Suggestions:
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            setBreedInput(breed);

                            setFormData((prev) => ({
                              ...prev,
                              breed: breed,
                            }));

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

                              setFormData((prev) => ({
                                ...prev,
                                breed: breed,
                              }));

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

              {/* Age */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#123524]">
                  Age <span className="text-[#FF8A2A]">*</span>
                </label>
                <input
                  name="age"
                  value={formData.age}
                  onChange={handleFormChange}
                  type="text"
                  placeholder="e.g. 8 weeks"
                  className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                />
              </div>

              {/* Sex */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#123524]">
                  Sex <span className="text-[#FF8A2A]">*</span>
                </label>
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                >
                  <option>Select sex</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Mixed litter</option>
                  <option>Unknown</option>
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#123524]">
                  Price (€) <span className="text-[#FF8A2A]">*</span>
                </label>
                <input
                  name="price"
                  value={formData.price}
                  onChange={handleFormChange}
                  type="number"
                  placeholder="e.g. 1200"
                  className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                />
              </div>

              {/* County */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-[#123524]">County</label>

                <select
                  name="county"
                  value={formData.county}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0E4F2A]"
                >
                  <option>All Counties</option>
                  {counties.map((county) => (
                    <option key={county}>{county}</option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#123524]">City / Town</label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleFormChange}
                  type="text"
                  placeholder="e.g. Dublin"
                  className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                />
              </div>

              {/* Seller Type */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#123524]">
                  Seller Type <span className="text-[#FF8A2A]">*</span>
                </label>
                <select
                  name="sellerType"
                  value={formData.sellerType}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                >
                  <option>Select seller type</option>
                  <option>Private Owner</option>
                  <option>Registered Breeder</option>
                  <option>Rescue</option>
                  <option>Shelter</option>
                </select>
              </div>

              {/* Health & Verification */}
              <div className="md:col-span-4">
                <div className="mt-4 border-t border-[#E8DFD1] pt-6">
                  <h3 className="text-lg font-bold text-[#123524]">Health & Verification</h3>
                  <p className="mt-1 text-sm text-[#5F6F64]">
                    These details help buyers understand the pet’s background and reduce suspicious listings.
                  </p>
                </div>
              </div>

              {/* Microchip */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[#123524]">Microchip / Ear Tattoo</label>
                <input
                  name="microchip"
                  value={formData.microchip}
                  onChange={handleFormChange}
                  type="text"
                  placeholder="Enter microchip or ear tattoo number"
                  className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                />
              </div>

              {/* Registration */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[#123524]">
                  Registration / Kennel Club Number
                </label>
                <input
                  name="registration"
                  value={formData.registration}
                  onChange={handleFormChange}
                  type="text"
                  placeholder="Enter registration or kennel club number"
                  className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                />
              </div>

              {/* Vaccinated */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#123524]">Vaccinated</label>
                <select
                  name="vaccinated"
                  value={formData.vaccinated}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                >
                  <option>Select</option>
                  <option>Yes</option>
                  <option>No</option>
                  <option>Unknown</option>
                </select>
              </div>

              {/* Wormed */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#123524]">Wormed</label>
                <select
                  name="wormed"
                  value={formData.wormed}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                >
                  <option>Select</option>
                  <option>Yes</option>
                  <option>No</option>
                  <option>Unknown</option>
                </select>
              </div>

              {/* Vet Checked */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#123524]">Vet Checked</label>
                <select
                  name="vetChecked"
                  value={formData.vetChecked}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                >
                  <option>Select</option>
                  <option>Yes</option>
                  <option>No</option>
                  <option>Unknown</option>
                </select>
              </div>

              {/* Spayed */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#123524]">Spayed / Neutered</label>
                <select
                  name="spayed"
                  value={formData.spayed}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                >
                  <option>Select</option>
                  <option>Yes</option>
                  <option>No</option>
                  <option>Not applicable</option>
                </select>
              </div>

              {/* Health Tested */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#123524]">Health Tested</label>
                <select
                  name="healthTested"
                  value={formData.healthTested}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                >
                  <option>Select</option>
                  <option>Yes</option>
                  <option>No</option>
                  <option>Not sure</option>
                </select>
              </div>

              {/* Kennel Club Registered */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#123524]">Kennel Club Registered</label>
                <select
                  name="kennelClubRegistered"
                  value={formData.kennelClubRegistered}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                >
                  <option value="">Select</option>
                  <option value="KC Registered">KC Registered</option>
                  <option value="IKC Registered">IKC Registered</option>
                  <option value="Not Registered">Not Registered</option>
                </select>
              </div>

              {/* Breeding Rights */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#123524]">Breeding Rights</label>
                <select
                  name="breedingRights"
                  value={formData.breedingRights}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                >
                  <option>Select</option>
                  <option>Included</option>
                  <option>Not included</option>
                  <option>Not applicable</option>
                </select>
              </div>

              {/* Proven Stud */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#123524]">Proven Stud</label>
                <select
                  name="provenStud"
                  value={formData.provenStud}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                >
                  <option>Select</option>
                  <option>Yes</option>
                  <option>No</option>
                  <option>Not applicable</option>
                </select>
              </div>

              {/* Stud / Breeding Info */}
              <div className="md:col-span-4">
                <div className="mt-4 border-t border-[#E8DFD1] pt-6">
                  <h3 className="text-lg font-bold text-[#123524]">Stud / Breeding Info</h3>
                  <p className="mt-1 text-sm text-[#5F6F64]">
                    Complete this if the listing is for stud or if breeding information is relevant.
                  </p>
                </div>
              </div>

              {/* Stud Fee */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[#123524]">Stud Fee</label>
                <input
                  type="number"
                  name="studFee"
                  value={formData.studFee}
                  onChange={handleFormChange}
                  placeholder="€"
                  className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                />
              </div>

              {/* Health Test Details */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[#123524]">Health Test Details</label>
                <input
                  type="text"
                  name="healthTestDetails"
                  value={formData.healthTestDetails}
                  onChange={handleFormChange}
                  placeholder="e.g. hips, elbows, eyes, genetic panel"
                  className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                />
              </div>

              {/* Breeding Notes */}
              <div className="md:col-span-4">
                <label className="mb-2 block text-sm font-semibold text-[#123524]">Breeding / Stud Notes</label>
                <textarea
                  rows="4"
                  name="breedingNotes"
                  value={formData.breedingNotes}
                  onChange={handleFormChange}
                  placeholder="Add breeding conditions, compatible breeds, previous litters, or important notes..."
                  className="w-full resize-none rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                />
              </div>

              {/* Photos */}
              <div className="md:col-span-4">
                <div className="mt-4 border-t border-[#E8DFD1] pt-6">
                  <h3 className="text-lg font-bold text-[#123524]">Photos</h3>
                  <p className="mt-1 text-sm text-[#5F6F64]">
                    Add clear photos of the pet. You can upload up to 6 images.
                  </p>
                </div>
              </div>

              <div className="md:col-span-4">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E8DFD1] bg-[#FFFCF5] px-6 py-10 text-center transition hover:border-[#0E4F2A]">
                  <span className="text-3xl">📷</span>
                  <span className="mt-3 text-sm font-semibold text-[#123524]">Click to upload photos</span>
                  <span className="mt-1 text-xs text-[#5F6F64]">JPG, PNG or WEBP. Maximum 6 photos.</span>

                  <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
                </label>
              </div>

              {photoPreviews.length > 0 && (
                <div className="md:col-span-4">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
                    {photoPreviews.map((src, index) => (
                      <div key={src} className="relative overflow-hidden rounded-xl border border-[#E8DFD1] bg-white">
                        <img src={src} alt={`Pet photo ${index + 1}`} className="h-28 w-full object-cover" />

                        {index === 0 && (
                          <div className="absolute left-2 top-2 rounded-full bg-[#0E4F2A] px-2 py-1 text-xs font-semibold text-white">
                            Main
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Seller Registration */}
              <div className="md:col-span-4">
                <div className="mt-4 border-t border-[#E8DFD1] pt-6">
                  <h3 className="text-lg font-bold text-[#123524]">Seller Registration</h3>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-[#123524]">
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
                <label className="mb-2 block text-sm font-semibold text-[#123524]">Licence / Organisation Name</label>
                <input
                  type="text"
                  name="organisationName"
                  value={formData.organisationName}
                  onChange={handleFormChange}
                  placeholder="Breeder, rescue, shelter, or organisation name"
                  className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-4">
                <div className="mt-4 border-t border-[#E8DFD1] pt-6">
                  <label className="mb-2 block text-sm font-semibold text-[#123524]">
                    Description <span className="text-[#FF8A2A]">*</span>
                  </label>
                  <textarea
                    rows="6"
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Tell us about your pet, temperament, health, training, family suitability, and anything buyers should know..."
                    className="w-full resize-none rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                  />
                  <p className="mt-1 text-right text-xs text-[#8A968D]">0 / 1000</p>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                className="rounded-xl border border-[#0E4F2A] px-6 py-3 text-sm font-semibold text-[#0E4F2A]"
              >
                Save Draft
              </button>

              <button
                type="submit"
                className="rounded-xl bg-[#FF8A2A] px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#E96F12]"
              >
                Next Step
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
