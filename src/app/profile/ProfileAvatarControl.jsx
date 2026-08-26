import { GalleryIcon } from '../../components/Icons';

export default function ProfileAvatarControl({ profile, fullName, uploading, onUpload, onRemove }) {
  return (
    <div className="text-center">
      <div className="relative mx-auto h-24 w-24">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-(--light-green) text-4xl font-extrabold text-(--primary-green)">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          ) : (
            fullName.charAt(0).toUpperCase()
          )}
        </div>
        <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-(--primary-green) text-white shadow-md transition hover:scale-105">
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onUpload} className="hidden" />
          {uploading ? <span className="text-xs">...</span> : <GalleryIcon className="h-4 w-4" />}
        </label>
      </div>
      {profile?.avatar_url && <button type="button" onClick={onRemove} disabled={uploading} className="mt-3 text-xs font-semibold text-red-500 hover:underline disabled:opacity-60">Remove profile picture</button>}
    </div>
  );
}
