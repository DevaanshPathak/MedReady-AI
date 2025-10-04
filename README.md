# MedReady AI 🧠

An AI-powered exam preparation assistant for medical students, providing personalized MCQs, adaptive learning, and real-time analytics.

![MedReady AI](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat&logo=supabase)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--3.5-orange?style=flat&logo=openai)

## 🚀 Features

- **AI-Generated MCQs**: Personalized multiple-choice questions powered by OpenAI GPT-3.5 or Vercel AI Gateway
- **Adaptive Learning**: Intelligent question targeting based on weak areas
- **Real-Time Analytics**: Track your progress with detailed performance insights
- **Enhanced Authentication**: Secure signup/login with email, Google OAuth, and GitHub OAuth via Supabase
- **Password Reset**: Easy password recovery via email
- **Session Management**: Automatic session handling with protected routes
- **Performance Dashboard**: Visual representation of your learning progress
- **Topic-Based Practice**: Focus on specific medical topics
- **Difficulty Levels**: Choose from easy, medium, or hard questions
- **Detailed Explanations**: Comprehensive answers to help you understand concepts
- **Progress Tracking**: Monitor accuracy, streaks, and time spent
- **Modern UI/UX**: Beautiful gradient designs, smooth transitions, and toast notifications
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with OAuth (Google, GitHub) and email/password
- **AI**: OpenAI GPT-3.5 Turbo or Vercel AI Gateway
- **UI Components**: Lucide React Icons
- **Charts**: Recharts (for analytics visualization)
- **State Management**: React Context API for auth
- **Deployment**: Vercel

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ and npm
- A Supabase account ([Sign up here](https://supabase.com))
- An OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DevaanshPathak/MedReady-AI.git
   cd MedReady-AI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # AI Provider Configuration
   AI_PROVIDER=openai  # or 'vercel' for Vercel AI Gateway
   
   # OpenAI Configuration (when AI_PROVIDER=openai)
   OPENAI_API_KEY=your_openai_api_key
   
   # Vercel AI Gateway Configuration (when AI_PROVIDER=vercel)
   VERCEL_AI_GATEWAY_URL=your_vercel_gateway_url
   ```
   
   **Note**: You can choose between OpenAI directly or Vercel AI Gateway by setting the `AI_PROVIDER` variable.

4. **Set up Supabase Database**
   
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Copy and paste the content from `database-schema.sql`
   - Execute the SQL to create all necessary tables and functions

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
MedReady-AI/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate-questions/  # OpenAI question generation
│   │   │   └── submit-answer/       # Answer submission handler
│   │   ├── auth/
│   │   │   ├── login/               # Login page
│   │   │   └── signup/              # Signup page
│   │   ├── dashboard/               # User dashboard with analytics
│   │   ├── quiz/                    # Quiz interface
│   │   ├── globals.css              # Global styles
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Landing page
│   ├── components/                  # Reusable React components
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client
│   │   └── openai.ts               # OpenAI client
│   ├── types/
│   │   └── index.ts                # TypeScript type definitions
│   └── utils/                      # Utility functions
├── database-schema.sql             # Supabase database schema
├── .env.example                    # Environment variables template
├── next.config.js                  # Next.js configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # Project dependencies
```

## 🎯 Usage

### For Students

1. **Sign Up**: Create an account with your email
2. **Choose a Topic**: Select from various medical topics (Cardiology, Neurology, etc.)
3. **Set Difficulty**: Choose easy, medium, or hard
4. **Take Quiz**: Answer AI-generated questions
5. **Review**: Get instant feedback with detailed explanations
6. **Track Progress**: View your performance on the dashboard

### For Developers

#### Generate Questions API

```typescript
POST /api/generate-questions
Content-Type: application/json

{
  "topic": "Cardiology",
  "difficulty": "medium",
  "count": 5
}
```

#### Submit Answer API

```typescript
POST /api/submit-answer
Content-Type: application/json

{
  "user_id": "uuid",
  "question_id": "uuid",
  "selected_answer": 2,
  "is_correct": true,
  "time_taken": 45
}
```

## 🎨 Features in Detail

### Adaptive Learning
The system analyzes your performance across different topics and automatically identifies weak areas. Future quizzes prioritize questions from these topics to help you improve.

### Real-Time Analytics
- Overall accuracy percentage
- Questions attempted
- Current learning streak
- Time spent studying
- Performance breakdown by topic
- Visual progress indicators

### AI-Powered Questions
Questions are generated in real-time using OpenAI's GPT-3.5, ensuring:
- Clinically relevant content
- Evidence-based information
- Appropriate difficulty levels
- Comprehensive explanations

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/DevaanshPathak/MedReady-AI)

## 🔐 Database Schema

The application uses the following main tables:
- `profiles`: User profile information
- `questions`: Generated MCQs
- `user_answers`: Student responses
- `quiz_sessions`: Quiz attempts and scores
- `user_progress`: Performance metrics and analytics

See `database-schema.sql` for the complete schema with Row Level Security policies.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Supabase](https://supabase.com/) for backend infrastructure
- [OpenAI](https://openai.com/) for AI capabilities
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide](https://lucide.dev/) for beautiful icons

## 📧 Contact

Devaansh Pathak - [@DevaanshPathak](https://github.com/DevaanshPathak)

Project Link: [https://github.com/DevaanshPathak/MedReady-AI](https://github.com/DevaanshPathak/MedReady-AI)

---

Built with ❤️ for medical students worldwide