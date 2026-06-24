'use client';

import { useState } from 'react';
import Header from '../../components/header';
import { counties } from '../../data/countyList';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    code: '+353',
    phone: '',
    accountType: '',
    county: '',
    password: '',
    terms: false,
    marketing: false,
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const inputClass =
    'w-full rounded-xl border border-[var(--border-beige)] bg-white px-4 py-3 text-sm text-[var(--primary-dark-green)] outline-none transition focus:border-[var(--primary-dark-green)] focus:ring-4 focus:ring-[rgba(14,79,42,0.10)]';

  const labelClass = 'mb-2 block text-sm font-semibold text-[var(--primary-dark-green)]';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!formData.terms) {
      setMessage('You need to accept the Terms of Service and Privacy Policy.');
      return;
    }

    if (formData.password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    const password = formData.password;

    const strongPassword =
      password.length >= 10 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);

    if (!strongPassword) {
      setMessage('Password must be at least 10 characters and include uppercase, lowercase, and a number.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/register/success`,
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_code: formData.code,
          phone_number: formData.phone,
          account_type: formData.accountType,
          county: formData.county,
          marketing: formData.marketing,
        },
      },
    });

    if (error) {
      console.warn('Signup failed:', {
        message: error.message,
        status: error.status,
        code: error.code,
      });

      const message = error.message?.toLowerCase() || '';

      if (message.includes('rate limit')) {
        setMessage('Too many signup emails were sent. Please wait a few minutes and try again.');
      } else if (message.includes('already') || message.includes('registered')) {
        setMessage('This email is already registered. Please log in or use forgot password.');
      } else if (message.includes('redirect')) {
        setMessage('Signup redirect URL is not configured correctly.');
      } else {
        setMessage(`Could not create account: ${error.message}`);
      }

      setLoading(false);
      return;
    }

    if (!data?.user?.id) {
      setMessage('Could not create account. Please try again or use forgot password if you already registered.');
      setLoading(false);
      return;
    }

    router.push('/register/success');
  };

  return (
    <>
      <Header />

      <section className="mx-auto max-w-205 rounded-[28px] border border-(--border-beige) bg-white p-8 mt-8 shadow-[0_18px_50px_rgba(18,53,36,0.08)]">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold ">Create Your Account</h1>

          <p className="mt-3 text-sm text-(--muted-green-text)">
            Contact sellers, save listings, and post your own ads.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>
                First Name <span className="text-(--primary-orange)">*</span>
              </label>
              <input
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First name"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Last Name <span className="text-(--primary-orange)">*</span>
              </label>
              <input
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last name"
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>
                Email Address <span className="text-(--primary-orange)">*</span>
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@email.com"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Phone Number <span className="text-(--primary-orange)">*</span>
              </label>

              <div className="grid grid-cols-[110px_1fr] gap-3">
                <select name="code" value={formData.code} onChange={handleChange} className={inputClass}>
                  <option value="+353">+353</option>
                  <option value="+44">+44</option>
                  <option value="+49">+49</option>
                  <option value="+351">+351</option>
                </select>

                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="712 345 678"
                  required
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>
                Account Type <span className="text-(--primary-orange)">*</span>
              </label>
              <select
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
                required
                className={inputClass}
              >
                <option value="">Select account type</option>
                <option value="Buyer">Buyer</option>
                <option value="Private Seller">Private Seller</option>
                <option value="Breeder">Breeder</option>
                <option value="Shelter / Rescue">Shelter / Rescue</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                County / Region <span className="text-(--primary-orange)">*</span>
              </label>
              <select name="county" value={formData.county} onChange={handleChange} required className={inputClass}>
                <option value="">Select your county</option>
                {counties.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Password <span className="text-(--primary-orange)">*</span>
            </label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
              className={inputClass}
            />
            <p className="mt-2 text-xs text-(--muted-green-text)">
              Use at least 8 characters with a number and a letter.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-3 text-sm text-(--primary-green)">
              <input
                name="terms"
                type="checkbox"
                checked={formData.terms}
                onChange={handleChange}
                className="mt-1 h-4 w-4 accent-(--primary-green-hover)"
              />
              <span className="text-black">
                I agree to the{' '}
                <Link href="/terms" className="font-semibold text-(--primary-green) hover:text-(--primary-orange)">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="font-semibold text-(--primary-green) hover:text-(--primary-orange)">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <label className="flex items-start gap-3 text-sm text-(--primary-dark-green)  ">
              <input
                name="marketing"
                type="checkbox"
                checked={formData.marketing}
                onChange={handleChange}
                className="mt-1 h-4 w-4 accent-(--primary-dark-green)"
              />
              <span>I would like to receive PawHome updates and safety tips.</span>
            </label>
          </div>

          {message && (
            <p className="rounded-xl bg-(--light-orange) px-4 py-3 text-sm text-(--primary-dark-green)">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-(--primary-orange) px-5 py-3.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(249,115,22,0.22)] transition hover:bg-[var(--secondary-orange)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-(--muted-green-text)">
          Already have an account?{' '}
          <Link href="/" className="font-semibold text-(--primary-green) hover:text-(--primary-orange)">
            Login
          </Link>
        </p>
      </section>
    </>
  );
}
