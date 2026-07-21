"use client";

import * as React from "react";
import { Camera, Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label = "Product Image" }: ImageUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [cameraOpen, setCameraOpen] = React.useState(false);
  const [stream, setStream] = React.useState<MediaStream | null>(null);

  // Resize image to max 300x300 and return as JPEG data URL
  function resizeImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 300;
          let { width, height } = img;
          if (width > height && width > maxDim) {
            height = (height * maxDim) / width;
            width = maxDim;
          } else if (height > maxDim) {
            width = (width * maxDim) / height;
            height = maxDim;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.8));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file);
      onChange(dataUrl);
    } catch {
      // fallback to raw
      const reader = new FileReader();
      reader.onload = (ev) => onChange(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function startCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      setStream(s);
      setCameraOpen(true);
      setTimeout(() => {
        if (cameraRef.current) {
          cameraRef.current.srcObject = s;
          cameraRef.current.play();
        }
      }, 100);
    } catch {
      alert("Cannot access camera. Please check permissions or use file upload.");
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setCameraOpen(false);
  }

  function capturePhoto() {
    if (!cameraRef.current || !canvasRef.current) return;
    const video = cameraRef.current;
    const canvas = canvasRef.current;
    const maxDim = 300;
    let w = video.videoWidth;
    let h = video.videoHeight;
    if (w > h && w > maxDim) {
      h = (h * maxDim) / w;
      w = maxDim;
    } else if (h > maxDim) {
      w = (w * maxDim) / h;
      h = maxDim;
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      onChange(dataUrl);
      stopCamera();
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />

      {value ? (
        <div className="flex items-center gap-3">
          <img
            src={value}
            alt="Product"
            className="w-16 h-16 rounded-lg object-cover border"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(null)}
            className="text-red-600 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1" /> Remove
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-1" /> Upload File
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startCamera}
          >
            <Camera className="w-4 h-4 mr-1" /> Camera
          </Button>
        </div>
      )}

      {/* Camera dialog */}
      {cameraOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-lg p-4 max-w-md w-full">
            <h3 className="text-lg font-bold mb-3 text-center">Take Photo</h3>
            <video
              ref={cameraRef}
              className="w-full rounded-lg mb-3"
              playsInline
              muted
            />
            <div className="flex gap-2 justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={stopCamera}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={capturePhoto}
              >
                <Camera className="w-4 h-4 mr-1" /> Capture
              </Button>
            </div>
          </div>
        </div>
      )}

      {!value && !cameraOpen && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <ImageIcon className="w-3 h-3" />
          Optional — upload from device or take a photo
        </p>
      )}
    </div>
  );
}
