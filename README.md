# Akowe - Write research that holds up

Akowe is an AI-powered academic writing and research tool optimized for essays, thesis projects, and longform research documents. It combines drafting, citations, source analysis, plagiarism detection, and export tools in a single workspace.

## Features

- 🤖 **AI-Powered Writing** - Generate academic content with GPT-3.5/GPT-4
- 📚 **Smart Citations** - Search and add citations from OpenAlex and Crossref
- ✅ **Plagiarism Detection** - Built-in plagiarism checking
- 📄 **PDF Assistant** - Upload PDFs and ask questions
- 📝 **Section-Based Editor** - Organize your work with structured sections
- 📤 **Export** - Download as PDF or DOCX
- 🎨 **Beautiful UI** - Notion-style interface with vibrant colors

## Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript, Tailwind CSS
- **Editor**: Native contentEditable with rich text formatting
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **AI**: OpenAI GPT-3.5/GPT-4
- **Citations**: OpenAlex, Crossref APIs

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- OpenAI API key

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd Akowe
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit `.env.local` and add your credentials:
- MongoDB connection string
- OpenAI API key
- NextAuth secret
- (Optional) Google OAuth credentials
- (Optional) Copyleaks API key for plagiarism checking
- (Optional) OCR fallback endpoint for scanned PDFs

### OCR Fallback (Optional, Recommended)

The import pipeline attempts normal PDF text extraction first. If a PDF appears scanned/image-only,
it can call an external OCR service.

Add these env vars if you have an OCR service:

```bash
OCR_FALLBACK_ENDPOINT=https://your-ocr-service.example.com/parse
OCR_FALLBACK_TOKEN=your_service_token_optional
```

#### Request contract (Akowe -> OCR service)

- Method: `POST`
- Content-Type: `multipart/form-data`
- Form fields:
  - `file`: uploaded PDF binary
  - `filename`: original filename string
- Optional header:
  - `Authorization: Bearer <OCR_FALLBACK_TOKEN>` (only when token is configured)

#### Response contract (OCR service -> Akowe)

- Success (`200`):
  ```json
  { "text": "extracted plain text..." }
  ```
- Failure (`>=400`): any non-200 response is treated as OCR failure.

#### Runtime behavior

- If OCR returns valid `text`, import continues with OCR output.
- If OCR is not configured or returns empty text for scanned PDFs, API returns:
  - `errorCode: "OCR_REQUIRED"` (unprocessable scanned document)
- If OCR endpoint errors, API returns:
  - `errorCode: "OCR_FAILED"`

4. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

\`\`\`
/app                  # Next.js app directory
  /api               # API routes
  /auth              # Authentication pages
  /dashboard         # Dashboard pages
  /project           # Project editor pages
  /settings          # Settings page
/components          # React components
  /Editor            # Editor components (removed - using native contentEditable)
  /ui                # Reusable UI components
/lib                 # Utility functions
  mongodb.ts         # Database connection
  auth.ts            # Auth configuration
  usage.ts           # Usage tracking
  citations.ts       # Citation helpers
  export.ts          # Export utilities
/models              # Mongoose models
  User.ts
  Project.ts
  DailyUsage.ts
/types               # TypeScript types
\`\`\`

## Pricing Plans

### Free Plan
- 500 AI words/day
- 2 PDFs/project
- 1 plagiarism check/month
- Basic citation support

### Pro Plan ($10/month with annual billing)
- Unlimited AI words
- 50 PDFs/project
- Unlimited plagiarism checks
- GPT-4 access

### Team Plan (Coming Soon)
- All Pro features
- Shared workspaces
- Admin controls
- Common bibliography pool

## API Endpoints

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project details
- `PATCH /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### AI
- `POST /api/ai/write` - Generate text with AI
- `POST /api/ai/outline` - Generate project outline

### Citations
- `GET /api/citations/search?q=query` - Search citations
- `GET /api/citations/doi?doi=...` - Get citation by DOI
- `POST /api/projects/[id]/citations` - Add citation to project

### Plagiarism
- `POST /api/plagiarism/check` - Check text for plagiarism
- `GET /api/projects/[id]/plagiarism` - Get plagiarism history

### Export
- `GET /api/projects/[id]/export?format=pdf|docx` - Export project

## Development

### Run linter
\`\`\`bash
npm run lint
\`\`\`

### Build for production
\`\`\`bash
npm run build
\`\`\`

### Start production server
\`\`\`bash
npm start
\`\`\`

## Roadmap

### Month 1 ✅
- [x] Project + editor UI
- [x] MongoDB setup
- [x] AI writing + word counter
- [x] Citation tool

### Month 2 ✅
- [x] Plagiarism check
- [x] PDF Q&A assistant
- [x] Outline generator

### Month 3 (In Progress)
- [ ] Export support (PDF/DOCX)
- [ ] Stripe billing integration
- [ ] Usage enforcement
- [ ] Team workspaces

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is proprietary software. All rights reserved.

## Support

For support, email ola@placeholderllc.name.ng or join our Slack community.
