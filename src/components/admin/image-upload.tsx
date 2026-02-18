'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface UploadedImage {
  id?: string;
  url: string;
  alt?: string;
  order?: number;
}

interface ImageUploadProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function ImageUpload({ images, onImagesChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File): Promise<UploadedImage | null> => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`Gecersiz dosya tipi: ${file.name}. Sadece JPG, PNG, WebP, GIF.`);
      return null;
    }
    if (file.size > MAX_SIZE) {
      setError(`Dosya cok buyuk: ${file.name}. Maksimum 5MB.`);
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Yukleme hatasi');
    }

    const { data } = await res.json();
    return { url: data.url, alt: file.name };
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    setUploading(true);

    try {
      const fileArray = Array.from(files);
      const results = await Promise.all(fileArray.map(uploadFile));
      const successful = results.filter((r): r is UploadedImage => r !== null);

      if (successful.length > 0) {
        onImagesChange([...images, ...successful.map((img, i) => ({
          ...img,
          order: images.length + i,
        }))]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yukleme sirasinda hata olustu');
    } finally {
      setUploading(false);
    }
  }, [images, onImagesChange, uploadFile]);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // reset so the same file can be re-selected
    e.target.value = '';
  }

  function removeImage(index: number) {
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all ${
          dragOver
            ? 'border-[#00f0ff] bg-[#00f0ff]/5'
            : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-[#00f0ff]" />
            <p className="text-sm text-gray-400">Yukleniyor...</p>
          </div>
        ) : (
          <>
            <svg className="mb-3 h-10 w-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-400">
              <span className="font-medium text-[#00f0ff]">Dosya secin</span> veya surukleyip birakin
            </p>
            <p className="mt-1 text-xs text-gray-500">JPG, PNG, WebP, GIF (maks. 5MB)</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {error && (
        <p className="text-sm text-[#ff006e]">{error}</p>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, index) => (
            <div
              key={`${img.url}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-lg border border-gray-700 bg-gray-800"
            >
              <Image
                src={img.url}
                alt={img.alt || 'Urun gorseli'}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#ff006e] text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Gorseli kaldir"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="text-xs text-gray-200 truncate">{img.alt || 'Gorsel'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
