import { getStoragePathFromPublicUrl } from '../../../../../lib/storagePaths';

export function getStoragePathFromPublicUrl(url, bucketName) {
  if (!url || !bucketName) return null;

  const markers = [`/object/public/${bucketName}/`, `/storage/v1/object/public/${bucketName}/`];

  const marker = markers.find((item) => url.includes(item));

  if (!marker) return null;

  const index = url.indexOf(marker);

  return decodeURIComponent(url.slice(index + marker.length).split('?')[0]);
}
