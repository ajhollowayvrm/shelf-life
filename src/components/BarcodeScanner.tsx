"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onError?: (error: string) => void;
  active: boolean;
}

const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
];

export default function BarcodeScanner({
  onScan,
  onError,
  active,
}: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const lastScanRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);

  const startScanner = useCallback(async () => {
    if (!containerRef.current || scannerRef.current?.isScanning) return;

    const elementId = "barcode-reader";

    try {
      const scanner = new Html5Qrcode(elementId, {
        formatsToSupport: BARCODE_FORMATS,
        useBarCodeDetectorIfSupported: true,
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            // Scan nearly the full viewfinder — barcode can be anywhere
            const width = Math.floor(viewfinderWidth * 0.95);
            const height = Math.floor(viewfinderHeight * 0.7);
            return { width, height };
          },
          aspectRatio: 4 / 3,
          disableFlip: true,
        },
        (decodedText) => {
          const now = Date.now();
          if (
            decodedText === lastScanRef.current &&
            now - lastScanTimeRef.current < 3000
          ) {
            return;
          }
          lastScanRef.current = decodedText;
          lastScanTimeRef.current = now;

          if (navigator.vibrate) navigator.vibrate(100);
          onScan(decodedText);
        },
        undefined
      );

      setHasPermission(true);
    } catch (err) {
      setHasPermission(false);
      onError?.(err instanceof Error ? err.message : "Camera access denied");
    }
  }, [onScan, onError]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    scannerRef.current = null;
  }, []);

  useEffect(() => {
    if (active) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [active, startScanner, stopScanner]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        id="barcode-reader"
        className="w-full rounded-[var(--radius-lg)] overflow-hidden bg-black"
      />

      {/* Scan region overlay — wide rectangle for barcodes */}
      {active && hasPermission && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-[85%] max-w-[350px] h-[80px]">
            {/* Corner brackets */}
            <span className="absolute top-0 left-0 w-6 h-4 border-t-2 border-l-2 border-accent rounded-tl" />
            <span className="absolute top-0 right-0 w-6 h-4 border-t-2 border-r-2 border-accent rounded-tr" />
            <span className="absolute bottom-0 left-0 w-6 h-4 border-b-2 border-l-2 border-accent rounded-bl" />
            <span className="absolute bottom-0 right-0 w-6 h-4 border-b-2 border-r-2 border-accent rounded-br" />
            {/* Scan line */}
            <div className="absolute left-3 right-3 h-0.5 bg-accent/70 animate-scan-line" />
          </div>
        </div>
      )}

      {/* Permission denied state */}
      {hasPermission === false && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-secondary rounded-[var(--radius-lg)] p-6 text-center">
          <span className="text-3xl mb-3">📷</span>
          <p className="text-sm text-text-secondary">
            Camera access is needed to scan barcodes. Please allow camera access
            in your browser settings.
          </p>
        </div>
      )}
    </div>
  );
}
