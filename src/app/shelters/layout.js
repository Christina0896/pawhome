export const metadata = {
  title: 'Animal Shelters and Rescues in Ireland',
  description:
    'Find animal shelters and rescue organisations in Ireland through PawHome. Discover adoption listings and responsible rehoming information.',
  alternates: {
    canonical: '/shelters',
  },
  openGraph: {
    title: 'Animal Shelters and Rescues in Ireland | PawHome',
    description: 'Find shelters, rescues and adoption information in Ireland.',
    url: '/shelters',
    type: 'website',
  },
};

export default function SheltersLayout({ children }) {
  return children;
}
