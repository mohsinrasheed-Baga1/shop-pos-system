"use client";

import * as React from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { IScannerControls } from "@zxing/browser";
import { Camera, CameraOff, X, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose?: () => void;
  /** debounce ms between same-code scans */
  debounceMs?: number;
}

export function BarcodeScanner({
  onScan,
  onClose,
  debounceMs = 1500,
}: BarcodeScannerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const controlsRef = React.useRef<IScannerControls | null>(null);
  const lastScanRef = React.useRef<{ code: string; t: number }>({ code: "", t: 0 });
  const [active, setActive] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [devices, setDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = React.useState<string | undefined>(undefined);

  const stop = React.useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    setActive(false);
  }, []);

  const start = React.useCallback(
    async (selectedId?: string) => {
      setError(null);
      if (!videoRef.current) return;
      try {
        const reader = new BrowserMultiFormatReader();
        // list cameras
        try {
          const list = await BrowserMultiFormatReader.listVideoInputDevices();
          setDevices(list);
          const chosen =
            selectedId ||
            list.find((d) => /back|rear|environment/i.test(d.label))?.deviceId ||
            list[0]?.deviceId;
          setDeviceId(chosen);
        } catch {}

        const controls = await reader.decodeFromVideoDevice(
          deviceId || undefined,
          videoRef.current,
          (result, err) => {
            if (result) {
              const code = result.getText();
              const now = Date.now();
              if (
                code === lastScanRef.current.code &&
                now - lastScanRef.current.t < debounceMs
              ) {
                return;
              }
              lastScanRef.current = { code, t: now };
              onScan(code);
            }
          }
        );
        controlsRef.current = controls;
        setActive(true);
      } catch (e: any) {
        setError(e?.message || "Camera failed to start");
        toast.error("Cannot access camera");
      }
    },
    [deviceId, onScan, debounceMs]
  );

  React.useEffect(() => {
    return () => {
      if (controlsRef.current) controlsRef.current.stop();
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-w-md mx-auto border-2 border-emerald-200">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
        />
        {/* scan overlay */}
        {active && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-3/4 h-1/2 border-2 border-emerald-400 rounded-lg relative">
              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-emerald-400 animate-pulse" />
            </div>
          </div>
        )}
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 gap-2">
            <CameraOff className="w-10 h-10" />
            <p className="text-sm">Camera is off</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}

      <div className="flex flex-wrap gap-2 justify-center">
        {!active ? (
          <Button onClick={() => start()} className="bg-emerald-600 hover:bg-emerald-700">
            <Camera className="w-4 h-4 ml-2" /> Start Camera
          </Button>
        ) : (
          <Button variant="outline" onClick={stop}>
            <X className="w-4 h-4 ml-2" /> Stop
          </Button>
        )}
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {devices.length > 1 && (
        <select
          className="w-full max-w-md mx-auto block rounded-md border px-3 py-2 text-sm"
          value={deviceId || ""}
          onChange={(e) => {
            setDeviceId(e.target.value);
            if (active) {
              stop();
              setTimeout(() => start(e.target.value), 200);
            }
          }}
        >
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
            </option>
          ))}
        </select>
      )}
      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
        <ScanLine className="w-3 h-3" />
        Place the barcode in front of the camera
      </p>
    </div>
  );
}
