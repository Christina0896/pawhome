'use client';

import { useState } from 'react';
import Header from '../../components/header';
import { counties } from '../../data/countyList';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneCode: '+353',
    phone: '',
    accountType: '',
    county: '',
    password: '',
  });

  const [registerMessage, setRegisterMessage] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;

    setRegisterForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  console.log('Register form before signup:', registerForm);
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterMessage('');

    const { data, error } = await supabase.auth.signUp({
      email: registerForm.email,
      password: registerForm.password,
      options: {
        data: {
          first_name: registerForm.firstName,
          last_name: registerForm.lastName,
          phone_code: registerForm.phoneCode,
          phone: registerForm.phone,
          account_type: registerForm.accountType,
          county: registerForm.county,
        },
      },
    });

    if (error) {
      setRegisterMessage(error.message);
      setRegisterLoading(false);
      return;
    }

    setRegisterMessage('Account created. Please check your email to verify your account.');

    setRegisterLoading(false);
  };
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [loginMessage, setLoginMessage] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLoginChange = (e) => {
    const { name, value } = e.target;

    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoginLoading(true);
    setLoginMessage('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });

    console.log('Login data:', data);
    console.log('Login error:', error);

    if (error) {
      setLoginMessage(error.message);
      setLoginLoading(false);
      return;
    }

    setLoginMessage('Login successful. Redirecting...');

    window.location.href = '/post-ad';
  };

  return (
    <div className="min-h-screen bg-[#FAF6EC]">
      <Header />

      <main className="mx-auto max-w-[1500px] px-6 py-10">
        <div className="grid grid-cols-1 overflow-hidden rounded-3xl border border-[#E8DFD1] bg-white shadow-sm lg:grid-cols-2">
          {/* Login side */}
          <section className="relative border-b border-[#E8DFD1] bg-[#FFFCF5] p-8 lg:border-b-0 lg:border-r lg:p-12">
            <div className="mx-auto max-w-lg">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#0E4F2A] text-3xl text-[#0E4F2A]">
                👤
              </div>

              <div className="mt-5 text-center">
                <h1 className="text-3xl font-bold text-[#123524]">Welcome Back</h1>
                <p className="mt-3 text-sm leading-6 text-[#5F6F64]">Login to your PawHome account to continue.</p>
              </div>

              <form onSubmit={handleLogin} className="mt-8 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#123524]">
                    Email Address <span className="text-[#FF8A2A]">*</span>
                  </label>
                  <input
                    name="email"
                    value={loginForm.email}
                    onChange={handleLoginChange}
                    type="email"
                    placeholder="Enter your email"
                    className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#123524]">
                    Password <span className="text-[#FF8A2A]">*</span>
                  </label>
                  <input
                    name="password"
                    value={loginForm.password}
                    onChange={handleLoginChange}
                    type="password"
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-[#5F6F64]">
                    <input type="checkbox" />
                    Remember me
                  </label>

                  <a href="#" className="font-semibold text-[#0E4F2A]">
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full rounded-xl bg-[#0E4F2A] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#07391D] disabled:opacity-60"
                >
                  {loginLoading ? 'Logging in...' : 'Login'}
                </button>
                {loginMessage && <p className="text-center text-sm font-semibold text-[#0E4F2A]">{loginMessage}</p>}
              </form>

              <div className="mt-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-[#E8DFD1]" />
                <span className="text-xs font-semibold text-[#8A968D]">OR</span>
                <div className="h-px flex-1 bg-[#E8DFD1]" />
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  className="w-full rounded-xl border border-[#E8DFD1] bg-white px-6 py-3 text-sm font-semibold text-[#123524]"
                >
                  Continue with Google
                </button>

                <button
                  type="button"
                  className="w-full rounded-xl border border-[#E8DFD1] bg-white px-6 py-3 text-sm font-semibold text-[#123524]"
                >
                  Continue with Facebook
                </button>
              </div>
            </div>
          </section>

          {/* Register side */}
          <section className="p-8 lg:p-12">
            <div className="mx-auto max-w-2xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#FF8A2A] text-3xl text-[#FF8A2A]">
                +
              </div>

              <div className="mt-5 text-center">
                <h2 className="text-3xl font-bold text-[#123524]">Create Your Account</h2>
                <p className="mt-3 text-sm leading-6 text-[#5F6F64]">
                  Create an account to contact sellers, save listings, and post your own ads.
                </p>
              </div>

              <form onSubmit={handleRegister} className="mt-8 space-y-5">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#123524]">
                      First Name <span className="text-[#FF8A2A]">*</span>
                    </label>
                    <input
                      name="firstName"
                      value={registerForm.firstName}
                      onChange={handleRegisterChange}
                      type="text"
                      placeholder="First name"
                      className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#123524]">
                      Last Name <span className="text-[#FF8A2A]">*</span>
                    </label>
                    <input
                      name="lastName"
                      value={registerForm.lastName}
                      onChange={handleRegisterChange}
                      type="text"
                      placeholder="Last name"
                      className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#123524]">
                    Email Address <span className="text-[#FF8A2A]">*</span>
                  </label>
                  <input
                    name="email"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                    type="email"
                    placeholder="Enter your email"
                    className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-[120px_1fr]">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#123524]">Code</label>
                    <select
                      name="phoneCode"
                      value={registerForm.phoneCode}
                      onChange={handleRegisterChange}
                      className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                    >
                      <option>+353</option>
                      <option>+44</option>
                      <option>+49</option>
                      <option>+351</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#123524]">
                      Phone Number <span className="text-[#FF8A2A]">*</span>
                    </label>
                    <input
                      name="phone"
                      value={registerForm.phone}
                      onChange={handleRegisterChange}
                      type="tel"
                      placeholder="712 345 678"
                      className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#123524]">
                      Account Type <span className="text-[#FF8A2A]">*</span>
                    </label>
                    <select
                      name="accountType"
                      value={registerForm.accountType}
                      onChange={handleRegisterChange}
                      className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                    >
                      <option value="">Select account type</option>
                      <option value="Buyer">Buyer</option>
                      <option value="Private Seller">Private Seller</option>
                      <option value="Registered Breeder">Registered Breeder</option>
                      <option value="Rescue / Shelter">Rescue / Shelter</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#123524]">
                      County / Region <span className="text-[#FF8A2A]">*</span>
                    </label>
                    <select
                      name="county"
                      value={registerForm.county}
                      onChange={handleRegisterChange}
                      className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                    >
                      <option>Select your county</option>
                      {counties.map((county) => (
                        <option key={county} value={county}>
                          {county}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#123524]">
                    Password <span className="text-[#FF8A2A]">*</span>
                  </label>
                  <input
                    name="password"
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                    type="password"
                    placeholder="Create a password"
                    className="w-full rounded-xl border border-[#E8DFD1] bg-white px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
                  />
                  <p className="mt-1 text-xs text-[#8A968D]">Use at least 8 characters with a number and a letter.</p>
                </div>

                <div className="space-y-3 text-sm text-[#123524]">
                  <label className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1" />
                    <span>
                      I agree to the{' '}
                      <a href="#" className="font-semibold text-[#0E4F2A]">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="#" className="font-semibold text-[#0E4F2A]">
                        Privacy Policy
                      </a>
                      .
                    </span>
                  </label>

                  <label className="flex items-start gap-2">
                    <input type="checkbox" className="mt-1" />
                    <span>I would like to receive PawHome updates and safety tips.</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={registerLoading}
                  className="w-full rounded-xl bg-[#FF8A2A] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#E96F12] disabled:opacity-60"
                >
                  {registerLoading ? 'Creating account...' : 'Create Account'}
                </button>
                {registerMessage && (
                  <p className="text-center text-sm font-semibold text-[#0E4F2A]">{registerMessage}</p>
                )}
              </form>
            </div>
          </section>
        </div>

        {/* Bottom trust bar */}
        <div className="mt-8 grid grid-cols-1 gap-5 rounded-2xl border border-[#E8DFD1] bg-white p-6 shadow-sm md:grid-cols-3">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#DDEDD8] text-[#0E4F2A]">
              ✓
            </div>
            <div>
              <h3 className="font-bold text-[#123524]">Safe & Trusted Community</h3>
              <p className="mt-1 text-sm leading-6 text-[#5F6F64]">
                We review users and listings to keep PawHome safer.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#DDEDD8] text-[#0E4F2A]">
              ✉
            </div>
            <div>
              <h3 className="font-bold text-[#123524]">Email Verification</h3>
              <p className="mt-1 text-sm leading-6 text-[#5F6F64]">Verify your email before posting listings.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#DDEDD8] text-[#0E4F2A]">
              🔒
            </div>
            <div>
              <h3 className="font-bold text-[#123524]">Your Data is Secure</h3>
              <p className="mt-1 text-sm leading-6 text-[#5F6F64]">
                Your information is protected and never shared with advertisers.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
