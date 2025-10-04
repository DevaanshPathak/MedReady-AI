import Link from 'next/link'
import { BookOpen, Brain, BarChart3, Target } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center space-x-2">
            <Brain className="w-8 h-8 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">MedReady AI</h1>
          </div>
          <div className="space-x-4">
            <Link 
              href="/auth/login" 
              className="px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              Login
            </Link>
            <Link 
              href="/auth/signup" 
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Sign Up
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            AI-Powered Medical Exam Preparation
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Personalized MCQs, adaptive learning, and real-time analytics 
            tailored to your weak areas. Master medical exams with confidence.
          </p>
          <Link 
            href="/auth/signup" 
            className="inline-block px-8 py-4 bg-primary-600 text-white text-lg font-semibold rounded-lg hover:bg-primary-700 transition shadow-lg"
          >
            Get Started Free
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">AI-Generated MCQs</h3>
            <p className="text-gray-600">
              Get personalized multiple-choice questions powered by advanced AI
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Adaptive Learning</h3>
            <p className="text-gray-600">
              Focus on your weak areas with intelligent question targeting
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Real-Time Analytics</h3>
            <p className="text-gray-600">
              Track your progress with detailed performance insights
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Detailed Explanations</h3>
            <p className="text-gray-600">
              Understand concepts with comprehensive answer explanations
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-xl p-12 mb-20">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="text-xl font-semibold mb-2 text-gray-900">Sign Up & Set Goals</h4>
              <p className="text-gray-600">
                Create your account and tell us what you want to master
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="text-xl font-semibold mb-2 text-gray-900">Take AI-Powered Quizzes</h4>
              <p className="text-gray-600">
                Practice with personalized questions tailored to your needs
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="text-xl font-semibold mb-2 text-gray-900">Track & Improve</h4>
              <p className="text-gray-600">
                Monitor your progress and focus on areas that need work
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-600">
          <p>© 2024 MedReady AI. Built with Next.js, Supabase, and OpenAI.</p>
        </footer>
      </div>
    </main>
  )
}
