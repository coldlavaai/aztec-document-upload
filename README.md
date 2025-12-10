# Aztec Landscapes - Document Upload Page

Document upload portal for job applicants to submit required documents.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase credentials (already configured)

3. **Run development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   cd /Users/oliver/Documents/Donna/AZTEC/aztec-document-upload
   git init
   git add .
   git commit -m "Initial commit - Aztec document upload page"
   gh repo create aztec-document-upload --public --source=. --remote=origin --push
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import the GitHub repository
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `NEXT_PUBLIC_N8N_WEBHOOK_URL`
   - Deploy!

3. **Your upload URL will be:**
   ```
   https://aztec-document-upload.vercel.app/?token=xxx&name=xxx
   ```

## Features

- ✅ Token validation against Supabase
- ✅ Upload 3 required documents (Passport, CSCS front/back)
- ✅ Upload to Supabase Storage (`applicant-documents` bucket)
- ✅ Webhook callback to n8n on upload complete
- ✅ Responsive design
- ✅ Error handling

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Supabase (Database + Storage)
- Vercel (Hosting)
