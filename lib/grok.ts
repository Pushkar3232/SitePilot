// lib/grok.ts

// Minimal helper for calling the Grok API (X)
// We'll use fetch directly since there's no official SDK yet.

const apiKey = process.env.GROK_API_KEY;

if (!apiKey) {
  console.warn('⚠️  GROK_API_KEY is not set. Grok AI features will not work.');
}

export interface AIGenerationResult {
  components: Array<{
    type: string;
    props: Record<string, unknown>;
  }>;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  estimatedCost: number;
}

// rough pricing estimate (placeholder numbers)
const GROK_INPUT_PRICE_PER_MILLION = 0.05;
const GROK_OUTPUT_PRICE_PER_MILLION = 0.2;

export function calculateGrokCost(promptTokens: number, completionTokens: number): number {
  const inputCost = (promptTokens / 1_000_000) * GROK_INPUT_PRICE_PER_MILLION;
  const outputCost = (completionTokens / 1_000_000) * GROK_OUTPUT_PRICE_PER_MILLION;
  return inputCost + outputCost;
}

// build system and user prompts remain same as earlier
export function buildGrokSystemPrompt(): string {
  return `You are an expert web designer AI assistant for SitePilot, a website builder platform.
Your task is to generate website component configurations based on user descriptions of their website.

You must respond with ONLY a valid JSON array of components. No explanations, no markdown, just pure JSON.

Each component in the array must follow this structure:
{
  "type": "component_type",
  "props": { ...component-specific props }
}

Available component types and their props:

1. navbar
   Props: brand (text), links (array of strings), bg_color (hex), text_color (hex), cta_text (text)

2. hero
   Props: heading (text), subheading (text), bg_color (hex), cta_primary (text), cta_secondary (text)

3. features
   Props: heading (text), subheading (text), columns (number), items (array of {icon, title, description})

4. rich_text
   Props: heading (text), content (text), align (left/center/right)

5. image_text
   Props: heading (text), text (text), image_url (url), image_side (left/right), cta_text (text)

6. gallery
   Props: heading (text), columns (number), images (array of urls)

7. testimonials
   Props: heading (text), items (array of {name, role, quote})

8. team
   Props: heading (text), subheading (text), members (array of {name, role, avatar})

9. stats
   Props: heading (text), items (array of {value, label})

10. cta
    Props: heading (text), subheading (text), button_text (text), bg_color (hex), text_color (hex)

11. pricing
    Props: heading (text), subheading (text), plans (array of {name, price, period, features, cta, highlight})

12. contact_form
    Props: heading (text), subheading (text), fields (array of field names), submit_text (text)

13. faq
    Props: heading (text), items (array of {question, answer})

14. video_embed
    Props: heading (text), url (video url), autoplay (boolean)

15. footer
    Props: brand (text), tagline (text), links (array of strings), bg_color (hex), text_color (hex)

IMPORTANT RULES:
- Always start with a navbar component
- Always end with a footer component
- Create a logical flow: navbar → hero/intro → features/description → content sections → testimonials/social proof → pricing/cta → contact → footer
- For icons in features, use emoji (⚡, 🎨, 🔒, etc.)
- Use realistic, professional colors (avoid overly bright colors)
- Keep the number of components between 5-10
- Make all text content relevant to the website description provided
- For colors, use dark blues (#1e3a8a, #0f172a), professional grays, and one accent color
- Ensure all props are properly formatted and complete

Return ONLY the JSON array, nothing else.`;
}

export function buildGrokUserPrompt(description: string, websiteName: string): string {
  return `Create a complete website layout for: "${websiteName}"

User's description: ${description}

Generate a JSON array of website components that match this description. Make sure the content, features, and overall structure align with what the user described.`;
}

export async function generateWebsiteComponents(description: string, websiteName: string): Promise<AIGenerationResult> {
  if (!apiKey) {
    throw new Error('GROK_API_KEY environment variable is not set.');
  }

  const systemPrompt = buildGrokSystemPrompt();
  const userPrompt = buildGrokUserPrompt(description, websiteName);

  const response = await fetch('https://api.grok.com/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-1',
      prompt: systemPrompt + '\n' + userPrompt,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Grok API error: ${response.status} ${response.statusText} - ${text}`);
  }

  const json = await response.json();
  const responseText: string = json.choices?.[0]?.text || '';

  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  const components = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

  const promptTokens = Math.ceil((systemPrompt + userPrompt).length / 4);
  const completionTokens = Math.ceil(responseText.length / 4);
  const estimatedCost = calculateGrokCost(promptTokens, completionTokens);

  return {
    components,
    tokensUsed: { prompt: promptTokens, completion: completionTokens, total: promptTokens + completionTokens },
    estimatedCost,
  };
}
