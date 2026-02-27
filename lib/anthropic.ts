// lib/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('Warning: ANTHROPIC_API_KEY not set. AI features will not work.');
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

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

// Claude pricing (approximate, per 1M tokens)
const CLAUDE_INPUT_PRICE_PER_MILLION = 3.0; // $3 per 1M input tokens
const CLAUDE_OUTPUT_PRICE_PER_MILLION = 15.0; // $15 per 1M output tokens

export function calculateCost(promptTokens: number, completionTokens: number): number {
  const inputCost = (promptTokens / 1_000_000) * CLAUDE_INPUT_PRICE_PER_MILLION;
  const outputCost = (completionTokens / 1_000_000) * CLAUDE_OUTPUT_PRICE_PER_MILLION;
  return inputCost + outputCost;
}

/**
 * Build the system prompt for website generation
 */
export function buildSystemPrompt(): string {
  return `You are an expert web designer AI assistant for SitePilot, a website builder platform.
Your task is to generate website component configurations based on user requirements.

You must respond with ONLY a valid JSON array of components. No explanations, no markdown, just pure JSON.

Each component in the array must follow this structure:
{
  "type": "component_type",
  "props": { ...component-specific props }
}

Available component types and their props:

1. "navbar" - Navigation bar
   props: { logo: string|null, links: [{label: string, href: string}], style: "default"|"transparent"|"sticky" }

2. "hero" - Hero section with headline
   props: { headline: string, subheadline: string, ctaText: string, ctaLink: string, backgroundImage: string|null, style: "centered"|"left-aligned"|"split" }

3. "features" - Feature grid
   props: { title: string, subtitle: string, features: [{icon: string, title: string, description: string}], columns: 2|3|4 }

4. "gallery" - Image gallery
   props: { title: string, images: [{src: string, alt: string, caption?: string}], style: "grid"|"masonry"|"carousel" }

5. "testimonials" - Customer testimonials
   props: { title: string, testimonials: [{quote: string, author: string, role: string, avatar?: string}], style: "cards"|"slider" }

6. "pricing" - Pricing plans
   props: { title: string, subtitle: string, plans: [{name: string, price: string, period: string, features: string[], highlighted: boolean, ctaText: string}] }

7. "cta" - Call to action
   props: { headline: string, subheadline: string, buttonText: string, buttonLink: string, style: "banner"|"centered"|"split" }

8. "contact_form" - Contact form
   props: { title: string, subtitle: string, fields: [{name: string, type: "text"|"email"|"tel"|"textarea", required: boolean}], submitText: string }

9. "team" - Team members
   props: { title: string, subtitle: string, members: [{name: string, role: string, bio: string, image?: string, socials?: [{platform: string, url: string}]}] }

10. "faq" - FAQ section
    props: { title: string, subtitle: string, questions: [{question: string, answer: string}] }

11. "stats" - Statistics/numbers
    props: { title: string, stats: [{value: string, label: string, prefix?: string, suffix?: string}], style: "simple"|"cards" }

12. "footer" - Page footer
    props: { copyright: string, links: [{label: string, href: string}], socialLinks: [{platform: string, url: string}], columns?: [{title: string, links: [{label: string, href: string}]}] }

Always generate a complete, professional website layout including navbar at the start and footer at the end.
Generate compelling, relevant content based on the business category and user answers.
Use placeholder image URLs like "/api/placeholder/800/600" for any images.`;
}

/**
 * Build the user prompt based on answers
 */
export function buildUserPrompt(
  category: string,
  answers: Record<string, string>,
  businessName?: string
): string {
  let prompt = `Generate a complete website layout for a ${category} business`;
  
  if (businessName) {
    prompt += ` called "${businessName}"`;
  }
  prompt += '.\n\n';

  if (Object.keys(answers).length > 0) {
    prompt += 'User provided the following information:\n';
    for (const [key, value] of Object.entries(answers)) {
      prompt += `- ${key}: ${value}\n`;
    }
  }

  prompt += '\nGenerate a complete JSON array of components for this website. Include all sections that would be typical for this type of business.';

  return prompt;
}
