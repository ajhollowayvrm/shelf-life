import { ProductLookupResult } from "@/types";

export async function lookupBarcode(
  code: string
): Promise<ProductLookupResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      `/api/lookup-barcode?code=${encodeURIComponent(code)}`,
      { signal: controller.signal }
    );
    return res.json();
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { found: false, name: "", barcode: code };
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
