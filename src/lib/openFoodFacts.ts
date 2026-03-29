import { ProductLookupResult } from "@/types";

export async function lookupBarcode(
  code: string
): Promise<ProductLookupResult> {
  const res = await fetch(`/api/lookup-barcode?code=${encodeURIComponent(code)}`);
  return res.json();
}
