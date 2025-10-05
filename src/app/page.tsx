import Link from 'next/link'
import { BookOpen, Brain, BarChart3, Target, Sparkles, Zap, Shield } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              MedReady AI
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/auth/login" 
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-semibold transition"
            >
              Login
            </Link>
            <Link 
              href="/auth/signup" 
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-indigo-200 mb-6">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-600">Powered by AI Technology</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI-Powered Medical
            </span>
            <br />
            <span className="text-gray-900">Exam Preparation</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Personalized MCQs, adaptive learning, and real-time analytics 
            tailored to your weak areas. Master medical exams with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/auth/signup" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              <Zap className="w-5 h-5" />
              Get Started Free
            </Link>
            <Link 
              href="/auth/login" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/80 backdrop-blur-sm text-gray-700 text-lg font-semibold rounded-lg hover:bg-white transition shadow-lg border-2 border-gray-200"
            >
              Sign In
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">No credit card required • Free forever</p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:-translate-y-2 border border-gray-100">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">AI-Generated MCQs</h3>
            <p className="text-gray-600 leading-relaxed">
              Get personalized multiple-choice questions powered by cutting-edge AI
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:-translate-y-2 border border-gray-100">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <Target className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Adaptive Learning</h3>
            <p className="text-gray-600 leading-relaxed">
              Focus on your weak areas with intelligent question targeting
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:-translate-y-2 border border-gray-100">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Real-Time Analytics</h3>
            <p className="text-gray-600 leading-relaxed">
              Track your progress with detailed performance insights
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:-translate-y-2 border border-gray-100">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-red-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Detailed Explanations</h3>
            <p className="text-gray-600 leading-relaxed">
              Understand concepts with comprehensive answer explanations
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-12 mb-20 border border-gray-100">
          <h3 className="text-4xl font-bold text-center mb-4 text-gray-900">How It Works</h3>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Get started in three simple steps and begin your journey to medical exam mastery
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg group-hover:scale-110 transition transform">
                1
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-900">Sign Up & Set Goals</h4>
              <p className="text-gray-600 leading-relaxed">
                Create your account and tell us what you want to master
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg group-hover:scale-110 transition transform">
                2
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-900">Take AI-Powered Quizzes</h4>
              <p className="text-gray-600 leading-relaxed">
                Practice with personalized questions tailored to your needs
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg group-hover:scale-110 transition transform">
                3
              </div>
              <h4 className="text-xl font-bold mb-3 text-gray-900">Track & Improve</h4>
              <p className="text-gray-600 leading-relaxed">
                Monitor your progress and focus on areas that need work
              </p>
            </div>
          </div>
        </div>

        {/* Trust Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl shadow-2xl p-12 mb-20 text-white">
          <div className="text-center mb-12">
            <Shield className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-3xl font-bold mb-4">Trusted by Medical Students</h3>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto">
              Join thousands of medical students who are acing their exams with AI-powered preparation
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-blue-100">Questions Generated</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-blue-100">Student Satisfaction</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">AI Support</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-600 py-8">
          <p className="mb-2">© 2024 MedReady AI. Built with Next.js, Supabase, and AI Technology.</p>
          <p className="text-sm text-gray-500">Empowering medical students worldwide</p>
        </footer>
      </div>
    </main>
  )
}
