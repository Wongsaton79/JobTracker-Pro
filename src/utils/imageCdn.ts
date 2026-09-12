// 🌐 Utility to upload images (Base64 / Blobs) directly to Public CDNs (ImgBB / FreeImage)
// Works seamlessly in Browser (GitHub Pages, Mobile Chrome/Safari, Desktop) and Node.js

const IMGBB_KEYS = [
  '2740a6b7e2898495aa97576403d1591f',
  'd84fbda79a4ec868aef2eb9d9b62a632',
  '2788f4b2383ce404ea2aa7742d4a5204',
];

const FREEIMAGE_KEY = '6d207e02198a847aa98d0a2a901485a5';

/**
 * Uploads a base64 dataUrl directly to a public HTTPS image CDN.
 * Returns a high-speed direct image URL (e.g., https://i.ibb.co/xyz/image.jpg)
 */
export async function uploadBase64ToPublicCdn(dataUrl: string): Promise<string> {
  if (!dataUrl || typeof dataUrl !== 'string') return '';
  
  // If already a valid public HTTPS URL, return as is
  if (
    dataUrl.startsWith('https://') &&
    !dataUrl.includes('localhost') &&
    !dataUrl.includes('127.0.0.1')
  ) {
    return dataUrl;
  }

  const cleanBase64 = dataUrl.replace(/^data:image\/[a-zA-Z0-9\+\-\.]+;base64,/, '');
  if (!cleanBase64 || cleanBase64.length < 50) return dataUrl;

  // 1. Direct upload to ImgBB (Primary)
  for (const key of IMGBB_KEYS) {
    try {
      const formData = new FormData();
      formData.append('image', cleanBase64);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const json = (await res.json()) as any;
        const finalUrl = json?.data?.url || json?.data?.display_url || json?.data?.image?.url;
        if (finalUrl && finalUrl.startsWith('https://')) {
          console.log('✅ CDN Upload Success (ImgBB):', finalUrl);
          return finalUrl;
        }
      }
    } catch (err) {
      console.warn('ImgBB direct upload attempt error:', err);
    }
  }

  // 2. Direct upload to FreeImage.host (Secondary)
  try {
    const formData = new FormData();
    formData.append('key', FREEIMAGE_KEY);
    formData.append('action', 'upload');
    formData.append('source', cleanBase64);
    formData.append('format', 'json');
    const res = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: formData,
    });
    if (res.ok) {
      const json = (await res.json()) as any;
      const finalUrl = json?.image?.url || json?.image?.display_url;
      if (finalUrl && finalUrl.startsWith('https://')) {
        console.log('✅ CDN Upload Success (FreeImage):', finalUrl);
        return finalUrl;
      }
    }
  } catch (err) {
    console.warn('FreeImage direct upload error:', err);
  }

  // 3. Fallback to local server endpoint if running on fullstack Express
  try {
    const res = await fetch('/api/images/upload-cdn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.url && typeof data.url === 'string') return data.url;
    }
  } catch {}

  return dataUrl;
}

/**
 * Ensures all photos within a JobItem or photos array are converted to public HTTPS URLs.
 */
export async function ensureJobPhotosPublicUrls<T extends { photos?: any[] }>(job: T): Promise<T> {
  if (!job || !job.photos || !Array.isArray(job.photos) || job.photos.length === 0) {
    return job;
  }

  const updatedPhotos = await Promise.all(
    job.photos.map(async (photo) => {
      const rawUrl = typeof photo === 'string' ? photo : photo?.url;
      if (rawUrl && typeof rawUrl === 'string' && rawUrl.startsWith('data:image/')) {
        try {
          const publicUrl = await uploadBase64ToPublicCdn(rawUrl);
          if (publicUrl && publicUrl.startsWith('https://')) {
            if (typeof photo === 'object' && photo !== null) {
              return { ...photo, url: publicUrl };
            }
            return publicUrl;
          }
        } catch (err) {
          console.warn('Failed to convert photo to public CDN URL:', err);
        }
      }
      return photo;
    })
  );

  return {
    ...job,
    photos: updatedPhotos,
  };
}
