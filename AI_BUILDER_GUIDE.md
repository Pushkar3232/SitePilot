# AI Website Builder Feature - Setup Guide

## Overview
This feature adds an AI‑powered website builder that uses the **Grok (X) API** to automatically generate page layouts from a plain‑language description.

## What Was Implemented

### 1. **Grok API Integration** (`lib/grok.ts`)
- Simple fetch-based client calling X’s Grok endpoint
- System & user prompt builders (identical logic to prior Gemini prompts)
- Cost estimation helper
- Component parsing from model output

### 2. **API Endpoint** (`app/api/ai/generate-with-grok/route.ts`)
- Handles POST requests from the builder UI
- Validates user permissions and monthly AI credits
- Calls Grok and inserts returned components into the database
- Logs usage/errors for billing and debugging

### 3. **AI Builder Modal Component** (`components/organisms/AIBuilderModal/AIBuilderModal.tsx`)
- Modal UI where the user describes their website
- Example prompts and character counter
- Shows loading/spinner state and error messages

### 4. **Custom Hook** (`hooks/use-ai-builder.ts`)
- Wraps the API call in a React hook
- Provides loading/error state and success callbacks

### 5. **Builder Page Integration**
- Adds "AI Builder" button to toolbar
- Opens modal and refreshes page components on success

## Required Setup

### 1. Environment Variables
Add this to your `.env.local` or Vercel project settings:
```
GROK_API_KEY=your_grok_api_key_here
```

> You obtain a Grok key from X (visit https://developer.x.com/docs/grok or the Grok docs).

### 2. Install Dependencies
- No new packages required; the feature uses the built-in `fetch` API (previously Google SDK removed).

## How It Works

### User Flow:
1. Click the **AI Builder** button in the page editor
2. Enter a website description (e.g. “A restaurant site with menu and reservations”)
3. Hit **Generate Website**
4. Grok processes the request and returns JSON components
5. Components are inserted into the page and shown in preview
6. User can tweak, reorder, or delete them as desired

### AI Flow:
1. Generate system+user prompt via helper functions
2. Send POST to `https://api.grok.com/v1/generate` with model `grok-1`
3. Parse JSON array from the response text
4. Store components in Supabase, log usage

## Components the AI May Produce
- `navbar` (branding & links)
- `hero` with CTAs
- `features` grid
- `rich_text` sections
- `image_text`, `gallery`, `testimonials`, `team`, `stats`
- `cta`, `pricing`, `contact_form`, `faq`, `video_embed`, `footer`

## Features at a Glance

✅ Friendly modal input UI
✅ Example prompts for inspiration
✅ Monthly AI credit enforcement
✅ Token‑based cost estimates
✅ Logging for diagnostics & billing
✅ Seamless builder integration
✅ Permission check (`use_ai` role required)

## Cost Estimation

Estimated token pricing:
- Input: ~$0.05 per 1M tokens
- Output: ~$0.20 per 1M tokens

Typical generation is ~$0.01–0.05 USD.

## Testing
1. Ensure `GROK_API_KEY` is set.
2. Open the builder for a website.
3. Click **AI Builder**, describe your site, and generate.
4. Verify components appear and the preview updates.

## Troubleshooting

### API returns 429 quota error
- Your Grok project has exhausted its free‑tier limits.
- Upgrade or wait until limits reset (~1 minute).
- See https://ai.dev/rate-limit for details.

### API returns config error
- Make sure `GROK_API_KEY` is correct and unrestricted.
- Check that the Grok API is enabled on your X account.

### Components don’t show up
- Inspect server logs for errors (see new `console.log` messages).
- Confirm you selected the correct page before generating.

## Future Enhancements
- Add AI suggestions for editing existing pages
- Support image generation for hero/gallery blocks
- Allow selecting color themes/style during generation
- Provide template library from AI results

---

**Ready to go!** Add your `GROK_API_KEY` and start building with Grok.