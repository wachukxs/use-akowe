# 🚀 Akowe Deployment Guide

## Safe GitHub Deployment Without Exposing Keys

### ✅ What's Already Protected

Your `.gitignore` file is properly configured to exclude:
- `.env.local` (contains your sensitive keys)
- All environment files (`.env*`)
- `node_modules/`
- `.next/` build files
- Other sensitive files

### 🔐 Environment Variables Setup

#### For Local Development
Your `.env.local` file contains:
```bash
# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# AI Services
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
OCR_FALLBACK_ENDPOINT=https://your-ocr-service.example.com/parse
OCR_FALLBACK_TOKEN=optional_ocr_service_token

# Other APIs
SERPAPI_API_KEY=your_serpapi_key
```

#### For Production Deployment (Vercel/Netlify)

**Option 1: Vercel (Recommended)**
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add each variable from your `.env.local`
   - Set them for Production, Preview, and Development

**Option 2: Netlify**
1. Go to [netlify.com](https://netlify.com)
2. Connect your GitHub repository
3. Add environment variables in Netlify dashboard:
   - Go to Site Settings → Environment Variables
   - Add each variable from your `.env.local`

### 📋 Pre-Deployment Checklist

- [ ] All sensitive files are in `.gitignore`
- [ ] No API keys in code
- [ ] Environment variables are properly referenced
- [ ] Database connection uses environment variables
- [ ] Authentication secrets are environment-based

### 🛠️ Deployment Steps

#### 1. Commit Your Changes
```bash
# Add all files (except those in .gitignore)
git add .

# Commit with a descriptive message
git commit -m "feat: implement enhanced citations display and AI assistant UI

- Add search and filter functionality to citations modal
- Implement 'Find More' button for pagination
- Redesign AI assistant interface with better UX
- Fix citation scanning error handling
- Improve success/error message display"

# Push to GitHub
git push origin main
```

#### 2. Create GitHub Repository
```bash
# Create a new repository on GitHub first, then:
git remote add origin https://github.com/yourusername/akowe.git
git branch -M main
git push -u origin main
```

#### 3. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import from GitHub
4. Select your Akowe repository
5. Configure environment variables
6. Deploy!

### 🔒 Security Best Practices

1. **Never commit sensitive files**
   - `.env.local` is already in `.gitignore` ✅
   - Double-check before committing

2. **Use environment variables**
   - All API keys should be in environment variables
   - Never hardcode secrets in source code

3. **Regular key rotation**
   - Rotate API keys periodically
   - Update environment variables in production

4. **Monitor access**
   - Review who has access to your repository
   - Use branch protection rules

### 🚨 Emergency: If You Accidentally Commit Keys

If you accidentally commit sensitive information:

1. **Immediately rotate the keys**
2. **Remove from git history**:
   ```bash
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch .env.local' \
   --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push** (be careful!):
   ```bash
   git push origin --force --all
   ```

### 📊 Post-Deployment

After deployment:
- [ ] Test all functionality
- [ ] Verify environment variables are working
- [ ] Check database connections
- [ ] Test authentication
- [ ] Verify AI features work
- [ ] Test citation discovery

### 🆘 Troubleshooting

**Common Issues:**
- **Build fails**: Check environment variables are set
- **Database connection fails**: Verify MONGODB_URI
- **Authentication issues**: Check NEXTAUTH_SECRET and NEXTAUTH_URL
- **AI features not working**: Verify API keys are set
- **Scanned PDFs fail to import**: Verify OCR_FALLBACK_ENDPOINT and OCR_FALLBACK_TOKEN

### OCR Service Contract (Ops Reference)

If you configure `OCR_FALLBACK_ENDPOINT`, the app sends:

- `POST` multipart/form-data
- fields:
  - `file` (PDF binary)
  - `filename` (original file name)
- optional header:
  - `Authorization: Bearer <OCR_FALLBACK_TOKEN>`

Expected response:

- `200` JSON:
  ```json
  { "text": "extracted plain text..." }
  ```

Failure behavior in app:

- Non-200 response -> `OCR_FAILED`
- Empty OCR text for scanned PDF -> `OCR_REQUIRED`

**Debug Commands:**
```bash
# Check what's being tracked by git
git ls-files | grep -E "\.(env|key|secret)"

# Verify .gitignore is working
git status --ignored
```

---

## 🎉 You're Ready to Deploy!

Your project is properly configured for safe deployment. The `.gitignore` file will prevent any sensitive information from being committed to GitHub.

Schedule a POST to /api/auth/password-reset/cleanup every 5 hours with header x-cron-secret: <PASSWORD_RESET_CLEANUP_SECRET> to enforce periodic cleanup (tokens still auto-expire at 30 minutes via TTL).
