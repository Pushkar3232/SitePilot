# AI Website Builder Feature - Setup Guide

## Overview
You've successfully implemented an AI-powered website builder that uses Google's Gemini API to automatically generate website layouts based on user descriptions.

## What Was Implemented

### 1. **Gemini API Integration** (`lib/gemini.ts`)
- Google Generative AI client initialization
- System and user prompt builders for website generation
- Cost calculation based on token usage
- Component generation function

### 2. **API Endpoint** (`app/api/ai/generate-with-gemini/route.ts`)
- Handles AI generation requests
- Validates user permissions and AI credits
- Integrates with Supabase for component storage
- Logs AI usage for billing purposes

### 3. **AI Builder Modal Component** (`components/organisms/AIBuilderModal/AIBuilderModal.tsx`)
- Beautiful modal UI for website description input
- Example prompts for user guidance
- Real-time character count
- Error handling and user feedback

### 4. **Custom Hook** (`hooks/use-ai-builder.ts`)
- Simple API to trigger AI generation
- State management for loading and errors
- Callbacks for success/error handling

### 5. **Builder Page Integration**
- "AI Builder" button in the toolbar
- Modal integration for seamless UX
- Auto-refreshes components after generation

## Required Setup

### 1. Environment Variables
Add to your `.env.local`:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

To get a Gemini API key:
1. Go to [Google AI Studio](https://ai.google.dev/tutorials/setup)
2. Create a new API key
3. Copy and paste it into your `.env.local`

### 2. Install Dependencies
✅ Already installed: `@google/generative-ai`

## How It Works

### User Flow:
1. User clicks "AI Builder" button in the builder toolbar
2. Modal opens with description input and example prompts
3. User describes their website (e.g., "A SaaS landing page for a project management tool")
4. User clicks "Generate Website"
5. Gemini AI processes the description
6. Auto-generated components are inserted into the page
7. User can edit, rearrange, or delete components as needed

### AI Generation Flow:
1. User description sent to Gemini API
2. Gemini processes with detailed system prompt
3. Returns JSON array of components
4. Components inserted into database with proper ordering
5. UI updates automatically with generated sections

## Generated Component Types
The AI can generate:
- Navbar (with branding and navigation)
- Hero section (with headings and CTAs)
- Features (with icons and descriptions)
- Image + Text sections
- Testimonials
- Team members
- Statistics/stats
- Call-to-action sections
- Pricing tables
- Contact forms
- FAQ sections
- Video embeds
- Footer

## Features Included

✅ User-friendly modal UI
✅ Example prompts for inspiration
✅ AI credit tracking (uses existing plan system)
✅ Error handling and validation
✅ Token usage logging for billing
✅ Proper component ordering with fractional indexing
✅ Permission-based access (requires 'use_ai' permission)

## Cost Estimation

Gemini 2.0 Flash pricing (as of Feb 2026):
- Input: $0.075 per 1M tokens
- Output: $0.3 per 1M tokens

One typical website generation: ~0.01-0.05 USD per generation

## Testing

To test the feature:
1. Ensure GEMINI_API_KEY is set
2. Go to builder page for any website
3. Click "AI Builder" button
4. Enter a website description
5. Click "Generate Website"
6. Components should appear in the preview

## Troubleshooting

### "Gemini generation failed"
- Check GEMINI_API_KEY is set correctly
- Verify API key has access to generative AI models
- Check network connectivity

### "You have used all X AI credits"
- User plan limit reached for the month
- Credits reset on the 1st of each month
- User can upgrade plan for more credits

### Components not appearing
- Check browser console for errors
- Verify page has been selected
- Try refreshing the page

## Future Enhancements

Possible improvements:
- Add AI-powered content editing suggestions
- Image generation for hero/gallery sections
- A/B testing different layouts
- Save and load AI-generated templates
- Batch component generation
- Custom style/color scheme selection

---

**Ready to use!** Just set your GEMINI_API_KEY and start building with AI.
