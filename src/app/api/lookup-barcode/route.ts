import { NextRequest } from "next/server";
import { Category } from "@/types";

const CATEGORY_KEYWORDS: Record<string, Category> = {
  dairy: "Dairy",
  milk: "Dairy",
  cheese: "Dairy",
  yogurt: "Dairy",
  butter: "Dairy",
  cream: "Dairy",
  meat: "Proteins",
  chicken: "Proteins",
  beef: "Proteins",
  pork: "Proteins",
  fish: "Proteins",
  seafood: "Proteins",
  egg: "Proteins",
  fruit: "Produce",
  vegetable: "Produce",
  produce: "Produce",
  salad: "Produce",
  grain: "Grains",
  bread: "Grains",
  pasta: "Grains",
  rice: "Grains",
  cereal: "Grains",
  flour: "Baking",
  sugar: "Baking",
  baking: "Baking",
  oil: "Oils & Vinegars",
  vinegar: "Oils & Vinegars",
  sauce: "Condiments",
  condiment: "Condiments",
  ketchup: "Condiments",
  mustard: "Condiments",
  mayonnaise: "Condiments",
  canned: "Canned",
  spice: "Spices",
  seasoning: "Spices",
  herb: "Spices",
  frozen: "Frozen",
  beverage: "Beverages",
  drink: "Beverages",
  juice: "Beverages",
  soda: "Beverages",
  water: "Beverages",
  coffee: "Beverages",
  tea: "Beverages",
  snack: "Snacks",
  chip: "Snacks",
  cookie: "Snacks",
  candy: "Snacks",
  chocolate: "Snacks",
  cleaning: "Household",
  paper: "Household",
  soap: "Household",
};

function mapCategory(tags: string[] | undefined): Category {
  if (!tags) return "Other";
  const joined = tags.join(" ").toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (joined.includes(keyword)) return category;
  }
  return "Other";
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return Response.json({ error: "Missing barcode code parameter" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  let data;
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(code)}.json`,
      { signal: controller.signal }
    );
    data = await res.json();
  } catch {
    return Response.json({ found: false, barcode: code });
  } finally {
    clearTimeout(timeout);
  }

  if (data.status === 1) {
    const product = data.product;
    return Response.json({
      found: true,
      name: product.product_name || "Unknown Product",
      brand: product.brands || null,
      category: mapCategory(product.categories_tags),
      size: product.quantity || null,
      imageUrl: product.image_front_url || null,
      barcode: code,
    });
  }

  return Response.json({ found: false, barcode: code });
}
