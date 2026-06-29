'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

const TOAST_DURATION_MS = 4500;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'info') => {
      if (!message) return;

      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      setToasts((current) => [...current, { id, message, type }]);

      window.setTimeout(() => {
        removeToast(id);
      }, TOAST_DURATION_MS);
    },
    [removeToast],
  );

  const value = useMemo(
    () => ({
      showToast,
      success: (message) => showToast(message, 'success'),
      error: (message) => showToast(message, 'error'),
      info: (message) => showToast(message, 'info'),
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="fixed right-4 top-4 z-[10000] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-[0_12px_34px_rgba(18,53,36,0.16)] ${
              toast.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : toast.type === 'success'
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-(--border-beige) bg-white text-(--secondary-green)'
            }`}
            role="status"
          >
            <div className="flex items-start justify-between gap-3">
              <span>{toast.message}</span>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-lg leading-none opacity-70 hover:opacity-100"
                aria-label="Close message"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider.');
  }

  return context;
}
