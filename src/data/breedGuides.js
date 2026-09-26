export const breedGuides = {
  'australian-shepherd': {
    slug: 'australian-shepherd',
    name: 'Australian Shepherd',
    animalType: 'Dogs',
    seoTitle: 'Australian Shepherd Guide Ireland | Temperament, Care & Listings | PawHome',
    metaDescription:
      'Learn about Australian Shepherds in Ireland, including temperament, exercise needs, grooming, health considerations, suitability and what to check before buying or adopting.',
    intro:
      'Australian Shepherds are intelligent, energetic dogs known for their loyalty, trainability and striking coats. This guide covers temperament, exercise needs, grooming, health, suitability and what to check before choosing an Australian Shepherd in Ireland.',
    heroNote: 'Active, clever and loyal dogs for owners who enjoy training, outdoor activity and daily enrichment.',
    quickFacts: [
      { label: 'Size', value: 'Medium', icon: 'size' },
      { label: 'Lifespan', value: '12 - 15 years', icon: 'lifespan' },
      { label: 'Family Friendly', value: 'Yes', icon: 'family' },
      { label: 'Good with Pets', value: 'Usually', icon: 'pets' },
      { label: 'Exercise Needs', value: 'Very High', icon: 'exercise' },
      { label: 'Grooming Needs', value: 'Medium', icon: 'grooming' },
      { label: 'Intelligence', value: 'Above Average', icon: 'intelligence' },
    ],
    gallery: [
      { label: 'Blue Merle', tone: 'from-slate-300 via-stone-100 to-orange-100' },
      { label: 'Red Merle', tone: 'from-orange-200 via-stone-100 to-red-100' },
      { label: 'Black Tri', tone: 'from-zinc-800 via-stone-700 to-orange-300' },
      { label: 'Red Tri', tone: 'from-amber-800 via-orange-200 to-white' },
      { label: 'Black Bi', tone: 'from-zinc-900 via-zinc-700 to-white' },
      { label: 'Blue Merle Long Coat', tone: 'from-slate-400 via-white to-stone-200' },
    ],
    about:
      'Australian Shepherds are active working-style dogs that often thrive when they have training, exercise and close involvement with their household. They are popular with people who enjoy outdoor activity, dog training and a highly responsive companion. They may not be suitable for quiet homes that want a very low-energy dog.',
    sections: [
      {
        title: 'Temperament',
        icon: 'temperament',
        items: ['Intelligent and eager to learn', 'Energetic and work-driven', 'Loyal with their family', 'Can be sensitive and alert'],
        text: 'Australian Shepherds are usually clever, active dogs that bond closely with their owners. They often need structure, training and daily mental stimulation.',
      },
      {
        title: 'Size & Appearance',
        icon: 'size',
        items: ['Male: about 51 - 58 cm', 'Female: about 46 - 53 cm', 'Athletic medium-sized build', 'Common colours include blue merle, red merle, black tri and red tri'],
        text: 'They have a double coat, expressive eyes and an athletic body. Some Australian Shepherds may have striking merle patterns or different coloured eyes.',
      },
      {
        title: 'Exercise & Enrichment',
        icon: 'exercise',
        items: ['Needs 1.5 - 2+ hours of activity daily', 'Enjoys training and games', 'Benefits from puzzle feeders and scent work', 'Can become restless without enough stimulation'],
        text: 'This breed is best suited to active owners who can provide exercise, training, social time and jobs to do.',
      },
      {
        title: 'Grooming & Care',
        icon: 'grooming',
        items: ['Brush several times per week', 'More brushing during shedding periods', 'Check ears and paws regularly', 'Nail trimming and dental care are important'],
        text: 'Australian Shepherds have a medium-length double coat that sheds. Regular brushing helps reduce matting and keeps the coat healthy.',
      },
      {
        title: 'Health Considerations',
        icon: 'health',
        items: ['Hip and elbow issues', 'Eye conditions', 'MDR1 drug sensitivity can occur', 'Epilepsy can occur in the breed', 'Weight and joint care are important'],
        text: 'Ask about health testing, vet checks, vaccination, microchip details and any known hereditary issues before buying or adopting.',
      },
      {
        title: 'Suitability',
        icon: 'suitability',
        items: ['May suit active families', 'Good for owners who enjoy training', 'Best with time, space and routine', 'May not suit homes where the dog is left alone all day'],
        text: 'Australian Shepherds are not usually low-maintenance dogs. They need a household that can provide consistent exercise, attention and training.',
      },
    ],
    costs: [
      { label: 'Purchase/Adoption', value: '€800 - €2,500+', icon: 'purchase' },
      { label: 'Food', value: '€45 - €90 / month', icon: 'food' },
      { label: 'Vet Care', value: '€300 - €700 / year', icon: 'vet' },
      { label: 'Insurance', value: '€20 - €50 / month', icon: 'insurance' },
      { label: 'Equipment', value: '€150 - €350', icon: 'equipment' },
    ],
    safety: [
      'View the dog in person where possible',
      'Ask for vet records and vaccination history',
      'Check microchip details',
      'Ask why the dog is being sold or rehomed',
      'Avoid paying large deposits without verification',
      'Be careful with unrealistic prices',
      'Never send money to someone you do not know',
      'Report suspicious listings',
    ],
    faqs: [
      ['Is an Australian Shepherd good for families?', 'Australian Shepherds can be good family dogs when properly trained, socialised and exercised. They are usually better suited to active families with time for daily training and enrichment.'],
      ['How much exercise does an Australian Shepherd need?', 'Most Australian Shepherds need high daily exercise and mental stimulation. A short walk alone is usually not enough for this breed.'],
      ['Is an Australian Shepherd suitable for first-time owners?', 'They can be challenging for first-time owners because of their intelligence, energy and need for structure. A committed first-time owner may manage well with training support.'],
      ['What should I ask before buying an Australian Shepherd?', 'Ask about microchip details, vet checks, vaccination, worming, parent health, temperament, socialisation, age and why the dog or puppy is being sold.'],
      ['Where can I find Australian Shepherds in Ireland?', 'You can check PawHome listings for Australian Shepherd puppies, adult dogs and adoption listings across Ireland.'],
    ],
    listingLinks: {
      primary: '/australian-shepherd-puppies',
      secondary: '/australian-shepherd-dogs',
      county: '/dogs-for-sale',
    },
  },
};

export function getBreedGuide(slug) {
  return breedGuides[slug] || null;
}
