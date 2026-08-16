"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Camera, X, ImageIcon } from "lucide-react";

export type ImageUploaderHandle = {
  getFiles: () => File[];
  clear: () => void;
};

type ImageUploaderProps = {
  maxFiles?: number;
  accept?: string;
};

const ImageUploader = forwardRef<ImageUploaderHandle, ImageUploaderProps>(
  function ImageUploader(
    { maxFiles = 2, accept = "image/jpeg,image/png,image/webp" },
    ref,
  ) {
    const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [cameraError, setCameraError] = useState("");

    useImperativeHandle(ref, () => ({
      getFiles: () => previews.map((p) => p.file),
      clear: () => {
        previews.forEach((p) => URL.revokeObjectURL(p.url));
        setPreviews([]);
      },
    }));

    const addFiles = useCallback(
      (files: File[]) => {
        const remaining = maxFiles - previews.length;
        const toAdd = files
          .filter((f) => f.type.startsWith("image/"))
          .slice(0, remaining);

        if (toAdd.length === 0) return;

        setPreviews((prev) => [
          ...prev,
          ...toAdd.map((file) => ({ file, url: URL.createObjectURL(file) })),
        ]);
      },
      [previews.length, maxFiles],
    );

    const closeCamera = useCallback(() => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraOpen(false);
    }, []);

    useEffect(() => closeCamera, [closeCamera]);

    useEffect(() => {
      if (!cameraOpen) return;
      const video = videoRef.current;
      const stream = streamRef.current;
      if (video && stream) {
        video.srcObject = stream;
        void video.play().catch(() => {});
      }
    }, [cameraOpen]);

    async function openCamera() {
      setCameraError("");
      if (!navigator.mediaDevices?.getUserMedia) {
        cameraInputRef.current?.click();
        return;
      }
      const candidates: MediaStreamConstraints[] = [
        { video: { facingMode: { exact: "environment" } }, audio: false },
        { video: { facingMode: { ideal: "environment" } }, audio: false },
        { video: true, audio: false },
      ];
      let stream: MediaStream | null = null;
      for (const constraints of candidates) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch {
          // coba constraint berikutnya
        }
      }
      if (!stream) {
        setCameraError(
          "Kamera tidak dapat diakses. Izinkan kamera di pengaturan browser atau gunakan Galeri.",
        );
        return;
      }
      streamRef.current = stream;
      setCameraOpen(true);
    }

    function takePhoto() {
      const video = videoRef.current;
      if (!video?.videoWidth || !video.videoHeight) return;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.drawImage(video, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          addFiles([
            new File([blob], `camera-${Date.now()}.jpg`, {
              type: "image/jpeg",
            }),
          ]);
          closeCamera();
        },
        "image/jpeg",
        0.9,
      );
    }

    const remove = useCallback((index: number) => {
      setPreviews((prev) => {
        URL.revokeObjectURL(prev[index].url);
        return prev.filter((_, i) => i !== index);
      });
    }, []);

    const atLimit = previews.length >= maxFiles;

    return (
      <div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="button secondary"
            onClick={openCamera}
            disabled={atLimit}
            style={{ flex: 1 }}
          >
            <Camera size={15} />
            Kamera
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={atLimit}
            style={{ flex: 1 }}
          >
            <ImageIcon size={15} />
            Galeri
          </button>
        </div>

        <div className="field-hint">
          {previews.length}/{maxFiles} foto. Format: JPEG, PNG, WebP. Maks 3 MB
          per foto.
        </div>
        {cameraError && <div className="feedback error">{cameraError}</div>}

        {previews.length > 0 && (
          <div className="image-uploader-previews">
            {previews.map((p, i) => (
              <div key={p.url} className="image-uploader-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`Foto ${i + 1}`} />
                <button
                  type="button"
                  className="image-uploader-remove"
                  onClick={() => remove(i)}
                  aria-label={`Hapus foto ${i + 1}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          hidden
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        {cameraOpen && (
          <div className="camera-overlay" role="dialog" aria-modal="true" aria-label="Ambil foto">
            <div className="camera-panel">
              <video ref={videoRef} playsInline muted />
              <div className="camera-actions">
                <button
                  type="button"
                  className="camera-close"
                  onClick={closeCamera}
                  aria-label="Tutup kamera"
                >
                  <X size={22} />
                </button>
                <button
                  type="button"
                  className="camera-shutter"
                  onClick={takePhoto}
                  aria-label="Ambil foto"
                >
                  <span />
                </button>
                <button
                  type="button"
                  className="camera-gallery"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Buka galeri"
                >
                  <ImageIcon size={22} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

export { ImageUploader };
