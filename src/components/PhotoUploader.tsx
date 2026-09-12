import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Trash2, X, RefreshCw, Eye } from 'lucide-react';
import { JobPhoto } from '../types';

interface PhotoUploaderProps {
  photos: JobPhoto[];
  onChange: (photos: JobPhoto[]) => void;
  maxPhotos?: number;
}

// 🗜️ Helper to compress and resize images on client-side (max 1200px, JPEG 0.78 quality ~90-150KB)
const compressImage = (fileOrDataUrl: File | string, maxWidth = 1200, quality = 0.78): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
      }
    };
    img.onerror = () => {
      resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          resolve('');
        }
      };
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
};

// Helper to upload image to public CDN in background
const uploadImageToCdn = async (dataUrl: string): Promise<string> => {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) return dataUrl;
  try {
    const res = await fetch('/api/images/upload-cdn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.url) {
        return data.url;
      }
    }
  } catch (err) {
    console.warn('Background upload to CDN failed:', err);
  }
  return dataUrl;
};

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photos,
  onChange,
  maxPhotos = 8,
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<JobPhoto | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start Live Camera
  const startCamera = async (facingMode: 'environment' | 'user' = cameraFacing) => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera stream failed, fallback to native file input:', err);
      // Fallback: trigger standard mobile camera input
      if (fileInputRef.current) {
        fileInputRef.current.setAttribute('capture', 'environment');
        fileInputRef.current.click();
      } else {
        setCameraError('ไม่สามารถเปิดกล้องได้โดยตรง กรุณาใช้ปุ่มเลือกรูปภาพหรือเปิดสิทธิ์กล้อง');
      }
    }
  };

  // Stop Live Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Switch Camera Front/Back
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // Capture photo from video stream
  const captureSnapshot = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 600;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.85);

    setIsProcessing(true);
    const compressedUrl = await compressImage(rawDataUrl, 1200, 0.78);
    setIsProcessing(false);

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const newPhotoId = `photo-${Date.now()}`;
    const newPhoto: JobPhoto = {
      id: newPhotoId,
      url: compressedUrl,
      source: 'camera',
      tag: 'during',
      timestamp: timeStr,
    };

    const updatedList = [...photos, newPhoto];
    onChange(updatedList);
    stopCamera();

    // Background upload to public CDN for instant LINE & Sheets compatibility
    uploadImageToCdn(compressedUrl).then((cdnUrl) => {
      if (cdnUrl && cdnUrl !== compressedUrl) {
        onChange(updatedList.map((p) => (p.id === newPhotoId ? { ...p, url: cdnUrl } : p)));
      }
    });
  };

  // Handle files selected from gallery or native file input
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newPhotosList: JobPhoto[] = [...photos];
    const newlyAdded: Array<{ id: string; compressedUrl: string }> = [];
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const filesArray: File[] = Array.from(files);
    for (let i = 0; i < filesArray.length; i++) {
      if (newPhotosList.length >= maxPhotos) break;
      const file: File = filesArray[i];
      try {
        const compressedUrl = await compressImage(file, 1200, 0.78);
        const pid = `photo-${Date.now()}-${i}`;
        newPhotosList.push({
          id: pid,
          url: compressedUrl,
          source: 'gallery',
          tag: 'site_overview',
          timestamp: timeStr,
        });
        newlyAdded.push({ id: pid, compressedUrl });
      } catch (compressErr) {
        console.warn('Image compression failed:', compressErr);
      }
    }

    setIsProcessing(false);
    onChange([...newPhotosList]);
    e.target.value = '';

    // Background CDN upload for all added files
    newlyAdded.forEach(({ id, compressedUrl }) => {
      uploadImageToCdn(compressedUrl).then((cdnUrl) => {
        if (cdnUrl && cdnUrl !== compressedUrl) {
          onChange(newPhotosList.map((p) => (p.id === id ? { ...p, url: cdnUrl } : p)));
        }
      });
    });
  };

  const removePhoto = (id: string) => {
    onChange(photos.filter((p) => p.id !== id));
  };

  const updatePhotoTag = (id: string, tag: JobPhoto['tag']) => {
    onChange(
      photos.map((p) => (p.id === id ? { ...p, tag } : p))
    );
  };

  const tagLabels: Record<string, { label: string; color: string }> = {
    before: { label: 'ก่อนทำ', color: 'bg-amber-100 text-amber-800' },
    during: { label: 'ระหว่างทำ', color: 'bg-blue-100 text-blue-800' },
    after: { label: 'เสร็จสิ้น/ส่งมอบ', color: 'bg-emerald-100 text-emerald-800' },
    site_overview: { label: 'ภาพรวมหน้างาน', color: 'bg-purple-100 text-purple-800' },
    receipt: { label: 'ใบเสร็จ/ป้ายสินค้า', color: 'bg-slate-100 text-slate-800' },
  };

  return (
    <div className="w-full space-y-3">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => startCamera('environment')}
          disabled={photos.length >= maxPhotos || isProcessing}
          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3.5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-medium rounded-xl transition-all shadow-xs active:scale-95 disabled:opacity-50"
        >
          <Camera className="w-4 h-4" />
          <span>{isProcessing ? 'กำลังประมวลผลรูปภาพ...' : 'ถ่ายภาพหน้างาน'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.removeAttribute('capture');
              fileInputRef.current.click();
            }
          }}
          disabled={photos.length >= maxPhotos || isProcessing}
          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-xl transition-all border border-slate-200 active:scale-95 disabled:opacity-50"
        >
          <ImageIcon className="w-4 h-4 text-slate-500" />
          <span>เลือกจากคลังภาพ</span>
        </button>
      </div>

      {cameraError && (
        <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
          {cameraError}
        </p>
      )}

      {/* Live Camera View Overlay */}
      {isCameraActive && (
        <div className="relative w-full rounded-2xl overflow-hidden bg-black aspect-video sm:aspect-4/3 flex items-center justify-center border-2 border-sky-500 shadow-xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Camera Controls Overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex items-center justify-between">
            <button
              type="button"
              onClick={toggleCameraFacing}
              className="p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-xs transition-colors"
              title="สลับกล้องหน้า/หลัง"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {/* Shutter Button */}
            <button
              type="button"
              onClick={captureSnapshot}
              disabled={isProcessing}
              className="w-14 h-14 rounded-full bg-white border-4 border-sky-500 flex items-center justify-center shadow-lg active:scale-90 transition-transform disabled:opacity-50"
              title="กดเพื่อถ่ายภาพ"
            >
              <div className="w-10 h-10 rounded-full bg-sky-600" />
            </button>

            <button
              type="button"
              onClick={stopCamera}
              className="p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-xs transition-colors"
              title="ยกเลิก"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Photo Gallery Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square shadow-xs flex flex-col justify-between"
            >
              <img
                src={photo.url}
                alt="รูปภาพหน้างาน"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />

              {/* Tag dropdown / badge */}
              <div className="relative z-10 p-1.5 flex justify-between items-start">
                <select
                  value={photo.tag || 'during'}
                  onChange={(e) => updatePhotoTag(photo.id, e.target.value as any)}
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border shadow-xs bg-white/95 cursor-pointer backdrop-blur-xs focus:outline-none`}
                >
                  <option value="before">ก่อนทำ</option>
                  <option value="during">ระหว่างทำ</option>
                  <option value="after">เสร็จสิ้น/ส่งมอบ</option>
                  <option value="site_overview">ภาพรวม</option>
                  <option value="receipt">ใบเสร็จ/ป้าย</option>
                </select>

                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-xs transition-colors"
                  title="ลบรูปภาพ"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {/* View Overlay Button */}
              <div className="relative z-10 p-1.5 bg-gradient-to-t from-black/60 to-transparent flex justify-between items-center text-white text-[10px]">
                <span>{photo.source === 'camera' ? '📷 สด' : '📁 คลัง'}</span>
                <button
                  type="button"
                  onClick={() => setPreviewPhoto(photo)}
                  className="px-1.5 py-0.5 bg-white/30 hover:bg-white/50 rounded flex items-center gap-0.5 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  <span>ขยาย</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center text-slate-400 bg-slate-50/50">
          <Camera className="w-8 h-8 mx-auto text-slate-300 mb-1" />
          <p className="text-xs font-medium text-slate-600">ยังไม่มีภาพประกอบหน้างาน</p>
          <p className="text-[11px] text-slate-400">กดปุ่มด้านบนเพื่อถ่ายภาพ หรืออัพโหลดจากคลังภาพ (สูงสุด {maxPhotos} รูป)</p>
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-[1000] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-1 bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewPhoto.url}
              alt="รูปภาพขนาดเต็ม"
              className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
            />
            <div className="mt-3 text-center text-white text-xs bg-slate-800/80 px-4 py-1.5 rounded-full">
              แท็ก: {tagLabels[previewPhoto.tag || 'during']?.label || 'ภาพหน้างาน'} • บันทึกเมื่อ {previewPhoto.timestamp}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
