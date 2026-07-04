import Link from 'next/link';
import Header from '../../../components/header';
import Footer from '../../../components/footer';

export default function PostAdSuccessPage() {
  return (
    <div className="min-h-screen bg-(--background)">
      <Header />

      <main className="mx-auto flex max-w-[900px] items-center justify-center px-6 py-20">
        <div className="w-full rounded-3xl border border-(--border-beige) bg-white px-6 py-12 text-center shadow-[0_10px_30px_rgba(18,53,36,0.07)] sm:px-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-(--light-green)">
            <span className="text-4xl font-extrabold text-(--primary-green)">✓</span>
          </div>

          <h1 className="mt-6 text-3xl font-extrabold text-(--secondary-green)">Your ad has been submitted</h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-(--muted-green-text)">
            Thank you. Your listing has been sent for review. Once approved, it will appear on PawHome.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/profile" className="inline-flex items-center justify-center rounded-xl bg-(--primary-green) px-6 py-3 text-sm font-bold text-white transition hover:scale-105">
              Back to profile
            </Link>

            <Link href="/listings" className="inline-flex items-center justify-center rounded-xl border border-(--border-beige) bg-white px-6 py-3 text-sm font-bold text-(--secondary-green) transition hover:scale-105">
              Browse listings
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
