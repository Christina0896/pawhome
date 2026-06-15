'use client';

import { useState } from 'react';

const contactOptions = [
  {
    type: 'issue',
    title: 'Report an issue',
    description: 'Tell us about a bug, broken page, suspicious listing, or problem on the website.',
    icon: '!',
  },
  {
    type: 'feedback',
    title: 'Share feedback',
    description: 'Send us suggestions, ideas, or general feedback about PawHome.',
    icon: '✉',
  },
];

export default function ContactModal({ onClose }) {
  // Modal state
  const [type, setType] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const selectedOption = contactOptions.find((option) => option.type === type);

  // Update form fields
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Send contact request
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setStatusMessage('');

    try {
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
    } catch {
      setStatusMessage('Could not send message. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-7 shadow-xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-5 cursor-pointer text-(--secondary-green) transition hover:text-(--primary-orange)"
          aria-label="Close contact modal"
        >
          <svg height="24" width="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M7 17L16.8995 7.10051"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7 7.00001L16.8995 16.8995"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold text-(--secondary-green)">Contact Us</h2>

        <p className="mt-2 text-sm text-(--muted-green-text)">What can we help you with?</p>

        {!type ? (
          // Contact type selection
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {contactOptions.map((option) => (
              <button
                key={option.type}
                type="button"
                onClick={() => setType(option.type)}
                className="rounded-2xl border border-(--border-beige) bg-white p-5 text-left transition hover:border-(--primary-green) hover:bg-(--background)"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-(--light-green) text-(--primary-green)">
                  {option.icon}
                </div>

                <h3 className="mt-4 font-bold text-(--secondary-green)">{option.title}</h3>

                <p className="mt-2 text-sm leading-6 text-(--muted-green-text)">{option.description}</p>
              </button>
            ))}
          </div>
        ) : (
          // Contact form
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <button
              type="button"
              onClick={() => {
                setType('');
                setStatusMessage('');
              }}
              className="text-sm font-semibold text-(--primary-green) hover:text-(--primary-orange) cursor-pointer"
            >
              ← Back
            </button>

            <h3 className="text-lg font-bold text-(--secondary-green)">{selectedOption?.title}</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Your name"
                className="rounded-xl border border-(--border-beige) px-4 py-3 text-sm outline-none focus:border-(--primary-green)"
              />

              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                type="email"
                placeholder="Your email"
                className="rounded-xl border border-(--border-beige) px-4 py-3 text-sm outline-none focus:border-(--primary-green)"
              />
            </div>

            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              placeholder={type === 'issue' ? 'Describe the issue...' : 'Write your feedback...'}
              className="w-full rounded-xl border border-(--border-beige) px-4 py-3 text-sm outline-none focus:border-(--primary-green)"
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-(--primary-orange) px-7 py-3 text-sm font-semibold text-white hover:bg-(--secondary-orange) disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>

            {statusMessage && <p className="text-sm font-semibold text-(--primary-green)">{statusMessage}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
