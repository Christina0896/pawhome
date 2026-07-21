'use client';

// Legacy page-patching logic was removed. Listing creation, editing, admin state,
// and review notifications are now handled by their owning React components and
// server routes instead of mutating the DOM or replacing window.fetch globally.
export default function ReviewPing() {
  return null;
}
