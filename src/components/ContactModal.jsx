'use client';

import { useState } from 'react';

export default function ContactModal({ onClose }) {
  const [type, setType] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setStatusMessage('');

    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        subject: type === 'issue' ? 'Report a website issue' : 'Share feedback',
        message: formData.message,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setStatusMessage(result.error || 'Could not send message.');
      setLoading(false);
      return;
    }

    setStatusMessage('Message sent successfully.');
    setFormData({
      name: '',
      email: '',
      message: '',
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-7 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-5 text-2xl text-[#123524] cursor-pointer
        "
        >
          ×
        </button>

        <h2 className="text-2xl font-bold text-[#123524] ">Contact Us</h2>

        <p className="mt-2 text-sm text-[#5F6F64]">What can we help you with?</p>

        {!type ? (
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setType('issue')}
              className="rounded-2xl border border-[#E8DFD1] bg-white p-5 text-left transition hover:border-[#0E4F2A] hover:bg-[#FAF6EC]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DDEDD8] text-[#0E4F2A]">
                !
              </div>

              <h3 className="mt-4 font-bold text-[#123524]">Report an issue</h3>

              <p className="mt-2 text-sm leading-6 text-[#5F6F64]">
                Tell us about a bug, broken page, suspicious listing, or problem on the website.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setType('feedback')}
              className="rounded-2xl border border-[#E8DFD1] bg-white p-5 text-left transition hover:border-[#0E4F2A] hover:bg-[#FAF6EC]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DDEDD8] text-[#0E4F2A]">
                ✉
              </div>

              <h3 className="mt-4 font-bold text-[#123524]">Share feedback</h3>

              <p className="mt-2 text-sm leading-6 text-[#5F6F64]">
                Send us suggestions, ideas, or general feedback about PawHome.
              </p>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <button
              type="button"
              onClick={() => {
                setType('');
                setStatusMessage('');
              }}
              className="text-sm font-semibold text-[#0E4F2A]"
            >
              ← Back
            </button>

            <h3 className="text-lg font-bold text-[#123524]">
              {type === 'issue' ? 'Report an issue' : 'Share feedback'}
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Your name"
                className="rounded-xl border border-[#E8DFD1] px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
              />

              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                type="email"
                placeholder="Your email"
                className="rounded-xl border border-[#E8DFD1] px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
              />
            </div>

            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              placeholder={type === 'issue' ? 'Describe the issue...' : 'Write your feedback...'}
              className="w-full rounded-xl border border-[#E8DFD1] px-4 py-3 text-sm outline-none focus:border-[#0E4F2A]"
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#FF8A2A] px-7 py-3 text-sm font-semibold text-white hover:bg-[#E96F12] disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>

            {statusMessage && <p className="text-sm font-semibold text-[#0E4F2A]">{statusMessage}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
