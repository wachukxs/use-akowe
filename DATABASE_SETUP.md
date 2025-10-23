# 🗄️ Database Setup Guide

This guide will help you set up MongoDB and configure the environment variables to make Akowe work with real database data instead of mock data.

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- Git

## 🚀 Quick Setup

### 1. Install MongoDB

#### Option A: Local MongoDB Installation

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

**Ubuntu/Debian:**
```bash
wget -qO - https://www.mongodb.org/static/gpg/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Windows:**
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the setup wizard
3. Start MongoDB service

#### Option B: MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/akowe`)

### 2. Configure Environment Variables

The `.env.local` file has been created with the following structure:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production

# Google OAuth (Optional - for Google sign-in)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/akowe
# For MongoDB Atlas, use: mongodb+srv://username:password@cluster.mongodb.net/akowe

# OpenAI API (for AI Assistant)
OPENAI_API_KEY=your-openai-api-key

# Application Configuration
NODE_ENV=development
```

**Update the following values:**

1. **NEXTAUTH_SECRET**: Generate a secure random string
   ```bash
   openssl rand -base64 32
   ```

2. **MONGODB_URI**: 
   - For local MongoDB: `mongodb://localhost:27017/akowe`
   - For MongoDB Atlas: Replace with your Atlas connection string

3. **GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET** (Optional):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3000/api/auth/callback/google` as redirect URI

4. **OPENAI_API_KEY** (Optional):
   - Go to [OpenAI Platform](https://platform.openai.com/)
   - Create an API key
   - Add it to your `.env.local`

### 3. Seed the Database

Run the database seeding script to populate your database with sample data:

```bash
npm run seed
```

This will create:
- 3 sample projects
- 10 sample resources
- 1 demo user

### 4. Start the Development Server

```bash
npm run dev
```

## 🔧 Database Models

### Project Model
- **Fields**: name, type, topic, wordCount, targetWordCount, status, citationStyle, methodology
- **Types**: essay, thesis, journal, research
- **Status**: draft, in_progress, completed, archived

### Resource Model
- **Fields**: title, description, category, link, rating, downloads, type, tags
- **Categories**: Writing, Citations, Research, Presentation, Ethics, Methodology
- **Types**: PDF, E-book, DOCX, Article, Video, Template

### User Model
- **Fields**: name, email, image, plan, stripeCustomerId, stripeSubscriptionId
- **Plans**: free, pro, team

## 🚨 Troubleshooting

### MongoDB Connection Issues

**Error: "MongoServerError: Authentication failed"**
- Check your MongoDB URI format
- Ensure username/password are correct
- For Atlas, check if your IP is whitelisted

**Error: "MongoNetworkError: failed to connect"**
- Check if MongoDB is running locally
- Verify the connection string
- Check firewall settings

**Error: "MongoParseError: Invalid connection string"**
- Ensure the URI starts with `mongodb://` or `mongodb+srv://`
- Check for special characters in password (URL encode them)

### Environment Variables Issues

**Error: "Please define the MONGODB_URI environment variable"**
- Ensure `.env.local` file exists in the project root
- Check that the file is not in `.gitignore`
- Restart the development server after adding variables

### Database Seeding Issues

**Error: "Failed to seed database"**
- Ensure MongoDB is running
- Check database connection
- Verify user has write permissions

## 📊 API Endpoints

### Projects
- `GET /api/projects` - Get all user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get specific project
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Resources
- `GET /api/resources` - Get all resources
- `GET /api/resources?projectId=[id]` - Get project-specific recommendations
- `GET /api/resources?category=[category]` - Filter by category
- `POST /api/resources` - Create new resource

## 🎯 Features Now Working

✅ **Real Database Integration**
- Projects stored in MongoDB
- Resources with ratings and categories
- User authentication with NextAuth

✅ **Project-Aware AI Assistant**
- Fetches real project data
- Provides contextual advice based on project type
- Shows project progress and details

✅ **Smart Resource Recommendations**
- Project-specific resource filtering
- Category-based organization
- Real-time search and filtering

✅ **Empty States Handling**
- Loading states while fetching data
- Error handling with retry options
- Empty state messages when no data

## 🔄 Next Steps

1. **Test the Application**: Create projects and see how AI Assistant and Resources adapt
2. **Add Real Data**: Replace sample data with your actual projects and resources
3. **Configure OAuth**: Set up Google sign-in for better user experience
4. **Add OpenAI Integration**: Configure AI responses with real OpenAI API

## 📝 Notes

- The application now uses real MongoDB data instead of mock data
- All project context is persisted in the database
- Resource recommendations are based on actual project characteristics
- Empty states are properly handled with loading and error states
- The AI Assistant provides contextual advice based on real project data

Your Akowe application is now fully functional with real database integration! 🎉
