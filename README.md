# Aztec Landscapes - Document Upload System

Next.js application for WhatsApp recruitment agent document uploads.

## Status: ✅ WORKING

**Live URL:** https://aztec-document-upload-j6vcihncf-olivers-projects-a3cbd2e0.vercel.app

Files successfully upload to Supabase Storage. Success message may need hard refresh (cache).

---

## What It Does

1. Validates upload token against Supabase `applicants` table
2. Allows applicants to upload 3 required documents:
   - Passport or ID
   - CSCS card (front)
   - CSCS card (back)
3. Uploads files to Supabase Storage bucket `applicant-documents`
4. Webhooks back to n8n (when webhook is active)
5. Shows success confirmation

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Storage:** Supabase Storage
- **Hosting:** Vercel
- **Styling:** Inline JSX CSS

---

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ybfhkcvrzbgzrayjskfp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.coldlava.ai/webhook/document-uploaded
```

### 3. Run Development Server
```bash
npm run dev
```

Visit: http://localhost:3000/?token=test-token&name=TestUser

---

## Deployment

### Vercel (Automatic)

1. Push to GitHub (already configured)
2. Vercel auto-deploys on push to `master`
3. Environment variables already set in Vercel project

### Manual Deploy
```bash
vercel --prod
```

---

## URL Format

```
https://aztec-document-upload-j6vcihncf-olivers-projects-a3cbd2e0.vercel.app/?token={token}&name={first_name}
```

**Parameters:**
- `token` (required): Upload token from `applicants.document_upload_token`
- `name` (optional): Applicant's first name for personalization

---

## Supabase Configuration

### Storage Bucket: `applicant-documents`
- **Type:** Public
- **Policies:** INSERT, SELECT, UPDATE, DELETE enabled
- **Path Structure:** `{token}/passport.png`, `{token}/cscs_front.png`, `{token}/cscs_back.png`

### Database Schema

**applicants table:**
- `document_upload_token` (TEXT UNIQUE) - Upload token
- `documents_uploaded` (BOOLEAN) - Upload completion flag

**documents table:**
- `applicant_id` (UUID FK) - Links to applicants
- `document_type` (TEXT) - passport, cscs_front, cscs_back
- `file_path` (TEXT) - Storage path
- `file_url` (TEXT) - Public URL

---

## How It Works

### 1. Token Validation
```typescript
// Check token exists and not already uploaded
const { data } = await supabase
  .from('applicants')
  .select('id, first_name, documents_uploaded')
  .eq('document_upload_token', token)
  .single();
```

### 2. File Upload
```typescript
// Upload to Supabase Storage
await supabase.storage
  .from('applicant-documents')
  .upload(`${token}/passport.png`, file, { upsert: true });
```

### 3. Webhook Notification
```typescript
// Notify n8n (optional - non-critical)
await fetch(webhookUrl, {
  method: 'POST',
  body: JSON.stringify({ token, status: 'success', files })
});
```

---

## Integration with n8n

### Main Workflow (Qualification Agent)
After Q7 (second reference), workflow should:
1. Generate upload token: `${timestamp}-${applicant_id}`
2. Save to `applicants.document_upload_token`
3. Send WhatsApp with upload link

### Webhook Handler Workflow
Receives upload confirmation and:
1. Inserts file records to `documents` table
2. Updates `documents_uploaded = true`
3. Sets `status = complete`
4. Sends WhatsApp confirmation

---

## File Structure

```
aztec-document-upload/
├── app/
│   ├── page.tsx          # Main upload page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles (minimal)
├── public/
│   └── aztec-logo.png    # Company logo
├── .env.local            # Environment variables (not in git)
├── .env.local.example    # Template
├── next.config.js        # Next.js config
├── tsconfig.json         # TypeScript config
├── package.json          # Dependencies
└── README.md            # This file
```

---

## Troubleshooting

### "Invalid upload link" Error
- Check token exists in `applicants.document_upload_token`
- Verify token not already used (`documents_uploaded = false`)
- Check Supabase credentials in `.env.local`

### Upload 400 Error
- Verify bucket name is `applicant-documents` (lowercase, hyphen)
- Check bucket is set to Public in Supabase
- Confirm storage policies are active

### Success Message Not Showing
- Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
- Try incognito window
- Check files uploaded in Supabase Storage despite error

### Webhook CORS Error
- Non-critical - files still upload successfully
- Will resolve when n8n webhook workflow is imported and active

---

## Development Notes

### Branding
- **Colors:** Gold (#a69438), Grey (#949494), Black (#000000)
- **Logo:** `/public/aztec-logo.png`
- **Gradient:** Black to grey background

### File Types Accepted
- Images: `image/*` (PNG, JPG, etc.)
- PDFs: `application/pdf`

### Max Upload Size
- Default: 50MB (Supabase limit)
- Can be configured in Supabase bucket settings

---

## Testing

### Test Token
```
c91b8d95-b82b-4722-9ae9-020fcb03e42e
```

### Test URL
```
https://aztec-document-upload-j6vcihncf-olivers-projects-a3cbd2e0.vercel.app/?token=c91b8d95-b82b-4722-9ae9-020fcb03e42e&name=Oliver
```

### Verify Upload
1. Go to Supabase → Storage → applicant-documents
2. Look for folder with token name
3. Should contain 3 files: passport, cscs_front, cscs_back

---

## Next Steps

- [ ] Import n8n webhook handler workflow
- [ ] Update main n8n workflow to generate upload links
- [ ] End-to-end test: WhatsApp → upload → confirmation
- [ ] Add upload instructions to form fields (future enhancement)
- [ ] Add 5 additional optional document slots (future enhancement)

---

## Links

- **GitHub:** https://github.com/coldlavaai/aztec-document-upload
- **Vercel:** https://vercel.com/olivers-projects-a3cbd2e0/aztec-document-upload
- **Supabase:** https://supabase.com/dashboard/project/ybfhkcvrzbgzrayjskfp

---

**Last Updated:** 2025-12-10
**Status:** Production ready, n8n integration pending
