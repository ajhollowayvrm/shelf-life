"use client";

import { useState, useCallback } from "react";
import * as Sentry from "@sentry/nextjs";
import BarcodeScanner from "@/components/BarcodeScanner";
import AddItemModal from "@/components/AddItemModal";
import Toast from "@/components/Toast";
import { lookupBarcode } from "@/lib/openFoodFacts";
import { ProductLookupResult, Category } from "@/types";

type ScanState = "scanning" | "loading" | "found" | "not-found" | "error";

interface Prefill {
  name?: string;
  category?: Category;
  emoji?: string;
  unit?: string;
  brand?: string;
  barcode?: string;
  imageUrl?: string;
}

export default function ScanPage() {
  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [product, setProduct] = useState<ProductLookupResult | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [prefill, setPrefill] = useState<Prefill>({});
  const [toast, setToast] = useState<string | null>(null);

  const handleScan = useCallback(async (code: string) => {
    if (scanState !== "scanning") return;
    Sentry.addBreadcrumb({ category: "scan", message: `Barcode detected: ${code}`, level: "info" });
    setScanState("loading");

    try {
      const result = await lookupBarcode(code);
      setProduct(result);
      Sentry.addBreadcrumb({ category: "scan", message: `Lookup result: ${result.found ? result.name : "not found"}`, level: "info" });

      if (result.found) {
        setScanState("found");
      } else {
        setScanState("not-found");
        setPrefill({ barcode: code });
      }
    } catch (err) {
      Sentry.captureException(err, { extra: { barcode: code } });
      setScanState("error");
      setToast("Failed to look up barcode. Check your connection.");
    }
  }, [scanState]);

  const handleAddFromProduct = () => {
    if (product?.found) {
      setPrefill({
        name: product.name,
        brand: product.brand ?? undefined,
        category: product.category ?? "Other",
        barcode: product.barcode,
        emoji: "📦",
        imageUrl: product.imageUrl ?? undefined,
      });
    }
    setShowAddModal(true);
  };

  const handleAddManual = () => {
    setPrefill({ barcode: product?.barcode });
    setShowAddModal(true);
  };

  const resetScanner = () => {
    setScanState("scanning");
    setProduct(null);
    setPrefill({});
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setToast("Item added to pantry!");
    resetScanner();
  };

  return (
    <main className="flex-1 flex flex-col pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-2xl font-bold text-text-primary">Scan</h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Point your camera at a barcode
        </p>
      </div>

      {/* Scanner */}
      <div className="px-4 mb-4">
        <BarcodeScanner
          onScan={handleScan}
          active={scanState === "scanning"}
          onError={(err) => {
            setScanState("error");
            setToast(err);
          }}
        />
      </div>

      {/* Status area */}
      <div className="px-4 flex-1">
        {/* Loading */}
        {scanState === "loading" && (
          <div className="flex flex-col items-center py-8">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-text-secondary">Looking up product...</p>
          </div>
        )}

        {/* Product found */}
        {scanState === "found" && product?.found && (
          <div className="bg-bg-secondary rounded-[var(--radius-lg)] p-4">
            <div className="flex items-start gap-3 mb-4">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-16 h-16 rounded-[var(--radius-md)] object-cover bg-bg-tertiary"
                />
              ) : (
                <div className="w-16 h-16 rounded-[var(--radius-md)] bg-bg-tertiary flex items-center justify-center text-2xl">
                  📦
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-text-primary truncate">
                  {product.name}
                </h3>
                {product.brand && (
                  <p className="text-xs text-text-tertiary">{product.brand}</p>
                )}
                {product.category && (
                  <span className="inline-block mt-1 text-[10px] font-medium bg-accent/10 text-accent px-2 py-0.5 rounded-[var(--radius-pill)]">
                    {product.category}
                  </span>
                )}
                {product.size && (
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {product.size}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetScanner}
                className="flex-1 h-10 text-sm font-medium text-text-secondary border border-border rounded-[var(--radius-md)] hover:bg-bg-tertiary transition-colors"
              >
                Scan Again
              </button>
              <button
                onClick={handleAddFromProduct}
                className="flex-1 h-10 bg-primary text-white text-sm font-semibold rounded-[var(--radius-md)] hover:bg-primary-light active:scale-[0.98] transition-all"
              >
                Add to Pantry
              </button>
            </div>
          </div>
        )}

        {/* Not found */}
        {scanState === "not-found" && (
          <div className="bg-bg-secondary rounded-[var(--radius-lg)] p-4 text-center">
            <span className="text-3xl block mb-2">🤷</span>
            <p className="text-sm text-text-secondary mb-1">
              Product not found in database.
            </p>
            <p className="text-xs text-text-muted mb-4">
              Barcode: {product?.barcode}
            </p>
            <div className="flex gap-2">
              <button
                onClick={resetScanner}
                className="flex-1 h-10 text-sm font-medium text-text-secondary border border-border rounded-[var(--radius-md)] hover:bg-bg-tertiary transition-colors"
              >
                Scan Again
              </button>
              <button
                onClick={handleAddManual}
                className="flex-1 h-10 bg-primary text-white text-sm font-semibold rounded-[var(--radius-md)] hover:bg-primary-light transition-colors"
              >
                Add Manually
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {scanState === "error" && (
          <div className="bg-bg-secondary rounded-[var(--radius-lg)] p-4 text-center">
            <span className="text-3xl block mb-2">😵</span>
            <p className="text-sm text-text-secondary mb-4">
              Something went wrong.
            </p>
            <button
              onClick={resetScanner}
              className="w-full h-10 bg-primary text-white text-sm font-semibold rounded-[var(--radius-md)] hover:bg-primary-light transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Add modal */}
      {showAddModal && (
        <AddItemModal onClose={handleModalClose} prefill={prefill} />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </main>
  );
}
