'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, BarChart3, BookOpen, Target, TrendingUp, Award, Clock } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  
  // Mock data - in a real app, this would come from the database
  const [stats] = useState({
    totalQuestions: 156,
    correctAnswers: 124,
    accuracy: 79,
    weeklyProgress: 23,
    streak: 7,
    totalTimeSpent: '12h 34m',
    recentTopics: [
      { name: 'Cardiology', questions: 45, accuracy: 82 },
      { name: 'Neurology', questions: 38, accuracy: 76 },
      { name: 'Pharmacology', questions: 32, accuracy: 85 },
      { name: 'Anatomy', questions: 41, accuracy: 73 },
    ],
    weakAreas: [
      { topic: 'Anatomy', accuracy: 73 },
      { topic: 'Neurology', accuracy: 76 },
    ],
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <Brain className="w-8 h-8 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">MedReady AI</h1>
          </div>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/quiz')}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
            >
              Start Quiz
            </button>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
          <p className="text-gray-600">Here&apos;s your learning progress</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-green-600 font-medium">+{stats.weeklyProgress} this week</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalQuestions}</div>
            <div className="text-sm text-gray-600">Questions Attempted</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.accuracy}%</div>
            <div className="text-sm text-gray-600">Overall Accuracy</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.streak} days</div>
            <div className="text-sm text-gray-600">Current Streak</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalTimeSpent}</div>
            <div className="text-sm text-gray-600">Time Spent</div>
          </div>
        </div>

        {/* Performance by Topic */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Performance by Topic</h3>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {stats.recentTopics.map((topic) => (
                <div key={topic.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{topic.name}</span>
                    <span className="text-sm text-gray-600">
                      {topic.questions} questions • {topic.accuracy}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        topic.accuracy >= 80 ? 'bg-green-500' : topic.accuracy >= 70 ? 'bg-blue-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${topic.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weak Areas - Adaptive Learning */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Focus Areas</h3>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-4">
              These topics need more attention. We&apos;ll prioritize questions from these areas in your next quiz.
            </p>
            <div className="space-y-3">
              {stats.weakAreas.map((area) => (
                <div key={area.topic} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <span className="font-medium text-gray-900">{area.topic}</span>
                  <span className="text-sm text-orange-600 font-medium">{area.accuracy}% accuracy</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push('/quiz')}
              className="w-full mt-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              Practice Weak Areas
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 pb-4 border-b border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Completed Cardiology Quiz</div>
                <div className="text-sm text-gray-600">Scored 82% • 2 hours ago</div>
              </div>
            </div>
            <div className="flex items-center space-x-4 pb-4 border-b border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">7-Day Streak Achievement</div>
                <div className="text-sm text-gray-600">Keep up the great work! • Yesterday</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Started Neurology Practice</div>
                <div className="text-sm text-gray-600">Completed 15 questions • 2 days ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
