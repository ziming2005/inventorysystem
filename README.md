<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1WTTT6Ptl8xpTB1QOD08Hbsig14p18aCS

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Add Supabase credentials to `.env.local`:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. In your Supabase project (`SupabaseMCP`), run `supabase/schema.sql` in the SQL editor to create tables/policies for user profiles, clinic designs, and inventory.
5. Run the app:
   `npm run dev`
