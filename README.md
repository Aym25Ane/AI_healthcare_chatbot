# AI Healthcare Chatbot

A modern, responsive AI-powered healthcare chatbot built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🤖 **Intelligent AI Responses** - Context-aware health information
- 🚨 **Emergency Detection** - Automatic emergency keyword detection
- 🏥 **Facility Finder** - Locate nearby hospitals, clinics, and pharmacies
- 💬 **Natural Conversations** - Smooth chat interface with typing indicators
- 📱 **Mobile Responsive** - Works perfectly on all devices
- 💾 **Local Storage** - Chat history saved locally
- 🎯 **Quick Replies** - Common health questions at your fingertips

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone or download this project**
   \`\`\`bash
   git clone <your-repo-url>
   cd ai-healthcare-chatbot
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. **Run the development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

\`\`\`
ai-healthcare-chatbot/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── chat/             # Chat-specific components
│   │   ├── chat-interface.tsx
│   │   ├── chat-message.tsx
│   │   ├── quick-replies.tsx
│   │   └── typing-indicator.tsx
│   └── ui/               # UI components
├── lib/                  # Utility libraries
│   ├── ai-service.ts     # AI response logic
│   ├── chat-storage.ts   # Local storage management
│   └── utils.ts          # Helper functions
├── types/                # TypeScript type definitions
│   └── chat.ts
└── README.md
\`\`\`

## Key Features Explained

### 🤖 AI Service
The `AIHealthService` class handles:
- Emergency keyword detection
- Medical category classification
- Response generation
- Facility search integration

### 💾 Chat Storage
The `ChatStorageService` manages:
- Session creation and management
- Message persistence
- Local storage operations

### 🎨 UI Components
- **ChatInterface**: Main chat container
- **ChatMessage**: Individual message bubbles
- **QuickReplies**: Preset question buttons
- **TypingIndicator**: Loading animation

## Customization

### Adding New Medical Categories
Edit `lib/ai-service.ts`:

\`\`\`typescript
const MEDICAL_CATEGORIES = {
  // Add your new categories here
  NEW_CATEGORY: 'new_category'
}

const RESPONSE_DATABASE = {
  // Add responses for your new category
  new_category: [
    "Your response here..."
  ]
}
\`\`\`

### Styling
The app uses Tailwind CSS. Modify styles in:
- `app/globals.css` for global styles
- Component files for component-specific styles
- `tailwind.config.js` for theme customization

### Adding Real AI Integration
Replace the mock AI service with real AI:

1. **OpenAI Integration**:
   \`\`\`typescript
   import OpenAI from 'openai'
   
   const openai = new OpenAI({
     apiKey: process.env.OPENAI_API_KEY
   })
   \`\`\`

2. **Google Places API**:
   \`\`\`typescript
   // Add real facility search
   const response = await fetch(
     `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=hospital&key=${API_KEY}`
   )
   \`\`\`

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

### Other Platforms
- **Netlify**: `npm run build` then deploy `out/` folder
- **Docker**: Create Dockerfile for containerized deployment

## Environment Variables

Create a `.env.local` file:

\`\`\`env
OPENAI_API_KEY=your_openai_key_here
GOOGLE_PLACES_API_KEY=your_google_places_key_here
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository.

---

**⚠️ Medical Disclaimer**: This chatbot is for informational purposes only and should not replace professional medical advice. In case of medical emergencies, contact emergency services immediately.
