import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(request: Request) {
  const { image } = await request.json();

  if (!image) {
    return Response.json({ error: "Missing image data" }, { status: 400 });
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: image,
            },
          },
          {
            type: "text",
            text: `Identify this grocery/pantry item from the image. Return ONLY valid JSON with no markdown:
{
  "name": "Product name",
  "brand": "Brand name or null",
  "category": "one of: Produce, Dairy, Proteins, Grains, Baking, Oils & Vinegars, Condiments, Canned, Spices, Frozen, Beverages, Snacks, Household, Other",
  "suggestedUnit": "most appropriate unit (cups, lbs, pieces, bottle, etc.)",
  "emoji": "single emoji representing this item"
}`,
          },
        ],
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const parsed = JSON.parse(text);
    return Response.json(parsed);
  } catch {
    return Response.json(
      { error: "Failed to parse AI response", raw: text },
      { status: 500 }
    );
  }
}
