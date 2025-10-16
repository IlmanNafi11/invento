export function getProfileImageUrl(
  fotoProfilPath: string | null | undefined,
  updatedAt?: string | null
): string | undefined {
  if (!fotoProfilPath) {
    return undefined;
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
  const staticBaseUrl = apiBaseUrl.replace('/api/v1', '');

  const path = fotoProfilPath.startsWith('/') ? fotoProfilPath : `/${fotoProfilPath}`;
  
  const fullUrl = `${staticBaseUrl}${path}`;
  
  
  if (updatedAt) {
    try {
      const cacheBuster = new Date(updatedAt).getTime();
      return `${fullUrl}?v=${cacheBuster}`;
    } catch {
      return fullUrl;
    }
  }
  
  return fullUrl;
}
