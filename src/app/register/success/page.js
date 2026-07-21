import Link from 'next/link';
import Header from '../../../components/header';
import Footer from '../../../components/footer';

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-(--background)">
      <Header />

      <main className="mx-auto flex min-h-[70vh] max-w-[900px] items-center justify-center px-6 py-12">
        <div className="w-full rounded-3xl border border-(--border-beige) bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF1E6]">
            <span className="text-4xl">✉</span>
          </div>

          <h1 className="mt-6 text-3xl font-bold text-(--secondary-green)">Check your email</h1>

          <p className="mx-auto mt-4 max-w-[620px] text-sm leading-7 text-(--muted-green-text)">
            PawHome sent you a confirmation link. Confirm your email first, then return to PawHome and log in. After
            logging in, save your phone number and verify it by automated call before posting an ad.
          </p>

          <div className="mx-auto mt-7 max-w-[560px] rounded-2xl bg-(--background) px-5 py-4 text-left text-sm leading-6 text-(--secondary-green)">
            <p><strong>1.</strong> Open the confirmation email from PawHome.</p>
            <p><strong>2.</strong> Press the confirmation link.</p>
            <p><strong>3.</strong> Log in and complete phone verification.</p>
          </div>

          <div className="mt-8 flex items-center justify-center">
            <Link
              href="/"
              className="rounded-full bg-(--primary-green) px-7 py-3 text-sm font-bold text-white transition hover:bg-(--secondary-green)"
            >
              Return to PawHome
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
