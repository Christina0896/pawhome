import Header from '../components/header';
import Hero from '../components/hero';
import FeaturedListings from '../components/FeaturedListings';
import Footer from '../components/footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAF6EC]">
      <Header />
      <Hero />
      <FeaturedListings />
      <Footer />
    </div>
  );
}
