'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Zap, BookOpen, Shield, Download, Check, ArrowRight, Star } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-indigo-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Akowe
              </h1>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/about" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">
                About
              </Link>
              <Link href="/auth/signin" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">
                Sign In
              </Link>
              <Link href="/auth/signin" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-7xl md:text-8xl font-bold text-gray-900 mb-8 leading-tight">
            Write research that{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              holds up
            </span>
          </h1>
          <p className="text-2xl text-gray-600 mb-16 max-w-4xl mx-auto leading-relaxed">
            The AI-powered academic writing platform that helps researchers, students, and academics create 
            compelling essays, thesis projects, and research papers with confidence and precision.
          </p>
          <div className="flex flex-col sm:flex-row gap-8 justify-center">
            <Link href="/auth/signin" className="group bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-12 py-5 rounded-2xl text-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
              Start Writing Free
              <ArrowRight className="ml-3 inline-block group-hover:translate-x-1 transition-transform" size={24} />
            </Link>
            <button 
              onClick={() => document.getElementById('product-demo')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-2 border-indigo-200 text-indigo-600 px-12 py-5 rounded-2xl text-xl font-semibold hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300 hover:-translate-y-1"
            >
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Product Demo Section */}
      <section id="product-demo" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              See Akọ̀wé in action
            </h2>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto">
              Everything you need for academic writing, right at your fingertips
            </p>
          </div>
          
          {/* Product Screenshot */}
          <div className="relative">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
              <div className="bg-gray-100 px-6 py-4 flex items-center gap-2 border-b border-gray-200">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <div className="ml-4 text-sm text-gray-600 font-medium">Akọ̀wé - Research Writing Platform</div>
              </div>
              <div className="relative">
                <Image 
                  src="/product-demo.png" 
                  alt="Akọ̀wé platform interface showing project management, AI assistant, and thesis writing tools"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                  priority
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                {/* Fallback when image is not available */}
                <div className="hidden w-full h-96 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-2xl">📱</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Product Demo</h3>
                    <p className="text-gray-600">Screenshot coming soon...</p>
                  </div>
                </div>
                {/* Overlay highlights */}
                <div className="absolute top-20 left-8 bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm font-medium animate-pulse">
                  ✨ AI Assistant
                </div>
                <div className="absolute top-32 left-8 bg-purple-600 text-white px-3 py-1 rounded-lg text-sm font-medium animate-pulse" style={{animationDelay: '0.5s'}}>
                  📊 Project Stats
                </div>
                <div className="absolute top-44 left-8 bg-emerald-600 text-white px-3 py-1 rounded-lg text-sm font-medium animate-pulse" style={{animationDelay: '1s'}}>
                  📝 Smart Writing
                </div>
              </div>
            </div>
            
            {/* Floating feature cards */}
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-6 border border-gray-200 hidden lg:block">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">🤖</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">AI-Powered</h3>
                  <p className="text-sm text-gray-600">Smart suggestions</p>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Real-time feedback on your writing
              </div>
            </div>
            
            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-6 border border-gray-200 hidden lg:block">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">📚</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">All-in-One</h3>
                  <p className="text-sm text-gray-600">Complete toolkit</p>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Citations, plagiarism, project management
              </div>
            </div>
          </div>
          
          {/* Feature highlights below the image */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">💬</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI Assistant</h3>
              <p className="text-gray-600">Get instant feedback and suggestions as you write</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Project Tracking</h3>
              <p className="text-gray-600">Monitor progress, word count, and citations in real-time</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Tools</h3>
              <p className="text-gray-600">Auto-citations, plagiarism checks, and more</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8">
              Everything you need to write better research
            </h2>
            <p className="text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              From initial brainstorming to final submission, Akowe provides the tools and guidance 
              you need to produce exceptional academic work.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100 hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI-Powered Writing</h3>
              <p className="text-gray-600 text-lg leading-relaxed">Generate compelling arguments, refine your thesis, and structure your ideas with advanced AI assistance</p>
            </div>
            
            <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100 hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Smart Citations</h3>
              <p className="text-gray-600 text-lg leading-relaxed">Find and integrate credible sources instantly with our intelligent citation discovery and formatting tools</p>
            </div>
            
            <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100 hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Plagiarism Detection</h3>
              <p className="text-gray-600 text-lg leading-relaxed">Maintain academic integrity with real-time plagiarism detection and originality scoring</p>
            </div>
            
            <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100 hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Download className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Export Ready</h3>
              <p className="text-gray-600 text-lg leading-relaxed">Export your research in multiple formats with proper academic formatting and citation styles</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8">
              Simple, transparent pricing
            </h2>
            <p className="text-2xl text-gray-600 mb-8">
              Start free, upgrade when you need more power
            </p>
            
            {/* AI Words Explainer */}
            <div className="max-w-3xl mx-auto mb-12 p-6 bg-white rounded-2xl shadow-lg border border-indigo-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-lg">💡</span>
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">What are AI words & auto-complete?</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    <strong>AI words</strong> include chat responses, AI-written content, and outlines. <strong>AI auto-complete</strong> suggests the next sentence as you type (free users get 100 suggestions to try it out). Your own writing doesn&apos;t count—only AI-generated content does.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-200 hover:shadow-2xl hover:-translate-y-3 transition-all duration-500">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Free</h3>
              <div className="text-6xl font-bold text-gray-900 mb-6">$0</div>
              <p className="text-gray-600 text-lg mb-10">Perfect for getting started</p>
              <ul className="space-y-6 mb-10">
                <li className="flex items-center text-gray-600 text-lg">
                  <Check className="w-6 h-6 text-emerald-500 mr-4 flex-shrink-0" />
                  1,500 AI words per day
                </li>
                <li className="flex items-center text-gray-600 text-lg">
                  <Check className="w-6 h-6 text-emerald-500 mr-4 flex-shrink-0" />
                  100 AI auto-complete (one-time)
                </li>
                <li className="flex items-center text-gray-600 text-lg">
                  <Check className="w-6 h-6 text-emerald-500 mr-4 flex-shrink-0" />
                  3 plagiarism checks per day
                </li>
                <li className="flex items-center text-gray-600 text-lg">
                  <Check className="w-6 h-6 text-emerald-500 mr-4 flex-shrink-0" />
                  3 projects maximum
                </li>
                <li className="flex items-center text-gray-600 text-lg">
                  <Check className="w-6 h-6 text-emerald-500 mr-4 flex-shrink-0" />
                  Smart citation search
                </li>
              </ul>
              <button className="w-full border-2 border-indigo-200 text-indigo-600 py-5 rounded-2xl font-semibold text-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300">
                Get Started
              </button>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-10 shadow-2xl border-2 border-indigo-200 hover:shadow-3xl hover:-translate-y-3 transition-all duration-500 relative">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  POPULAR
                </span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Pro</h3>
              <div className="text-6xl font-bold text-gray-900 mb-6">$15</div>
              <p className="text-gray-600 text-lg mb-10">Unlimited AI and features</p>
              <ul className="space-y-6 mb-10">
                <li className="flex items-center text-gray-600 text-lg">
                  <Check className="w-6 h-6 text-emerald-500 mr-4 flex-shrink-0" />
                  Unlimited AI words
                </li>
                <li className="flex items-center text-gray-600 text-lg">
                  <Check className="w-6 h-6 text-emerald-500 mr-4 flex-shrink-0" />
                  Unlimited AI auto-complete
                </li>
                <li className="flex items-center text-gray-600 text-lg">
                  <Check className="w-6 h-6 text-emerald-500 mr-4 flex-shrink-0" />
                  Unlimited plagiarism checks
                </li>
                <li className="flex items-center text-gray-600 text-lg">
                  <Check className="w-6 h-6 text-emerald-500 mr-4 flex-shrink-0" />
                  Unlimited projects
                </li>
                <li className="flex items-center text-gray-600 text-lg">
                  <Check className="w-6 h-6 text-emerald-500 mr-4 flex-shrink-0" />
                  Advanced citation search
                </li>
                <li className="flex items-center text-gray-600 text-lg">
                  <Check className="w-6 h-6 text-emerald-500 mr-4 flex-shrink-0" />
                  GPT-4 access
                </li>
                <li className="flex items-center text-gray-600 text-lg">
                  <Check className="w-6 h-6 text-emerald-500 mr-4 flex-shrink-0" />
                  Priority support
                </li>
              </ul>
              <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-5 rounded-2xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:shadow-lg">
                Upgrade to Pro
              </button>
            </div>
            
            <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-200 hover:shadow-2xl hover:-translate-y-3 transition-all duration-500">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Team</h3>
              <div className="text-6xl font-bold text-gray-900 mb-6">$99</div>
              <p className="text-gray-600 text-lg mb-10">For research teams</p>
              <ul className="space-y-6 mb-10">
                <li className="flex items-center text-gray-600 text-lg">
                  <Check className="w-6 h-6 text-emerald-500 mr-4 flex-shrink-0" />
                  Everything in Pro
                </li>
                <li className="flex items-center text-gray-600 text-lg">
                  <Check className="w-6 h-6 text-emerald-500 mr-4 flex-shrink-0" />
                  Team collaboration
                </li>
                <li className="flex items-center text-gray-600 text-lg">
                  <Check className="w-6 h-6 text-emerald-500 mr-4 flex-shrink-0" />
                  Admin dashboard
                </li>
                <li className="flex items-center text-gray-600 text-lg">
                  <Check className="w-6 h-6 text-emerald-500 mr-4 flex-shrink-0" />
                  Custom integrations
                </li>
              </ul>
              <button className="w-full border-2 border-indigo-200 text-indigo-600 py-5 rounded-2xl font-semibold text-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Competitive Comparison Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Why researchers choose Akowe
            </h2>
            <p className="text-2xl text-gray-600">
              Better features, better price, better experience
            </p>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl shadow-xl border border-gray-200">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <th className="px-6 py-6 text-left text-lg font-bold text-gray-900">Feature</th>
                  <th className="px-6 py-6 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Akowe</span>
                      <span className="text-sm text-gray-600 mt-1">$15/month</span>
                    </div>
                  </th>
                  <th className="px-6 py-6 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-semibold text-gray-700">Writing Tools</span>
                      <span className="text-sm text-gray-600 mt-1">$25-30/month</span>
                    </div>
                  </th>
                  <th className="px-6 py-6 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-semibold text-gray-700">Plagiarism Tools</span>
                      <span className="text-sm text-gray-600 mt-1">$30-50/month</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-200">
                  <td className="px-6 py-4 text-gray-900 font-medium">AI Writing Assistant</td>
                  <td className="px-6 py-4 text-center"><Check className="w-6 h-6 text-emerald-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-6 h-6 text-gray-300 mx-auto" /></td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                </tr>
                <tr className="border-t border-gray-200 bg-indigo-50/30">
                  <td className="px-6 py-4 text-gray-900 font-medium">AI Auto-Complete</td>
                  <td className="px-6 py-4 text-center"><Check className="w-6 h-6 text-emerald-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="px-6 py-4 text-gray-900 font-medium">Smart Citations</td>
                  <td className="px-6 py-4 text-center"><Check className="w-6 h-6 text-emerald-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                </tr>
                <tr className="border-t border-gray-200 bg-indigo-50/30">
                  <td className="px-6 py-4 text-gray-900 font-medium">Plagiarism Detection</td>
                  <td className="px-6 py-4 text-center"><Check className="w-6 h-6 text-emerald-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-6 h-6 text-gray-300 mx-auto" /></td>
                  <td className="px-6 py-4 text-center"><Check className="w-6 h-6 text-gray-300 mx-auto" /></td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="px-6 py-4 text-gray-900 font-medium">Project Management</td>
                  <td className="px-6 py-4 text-center"><Check className="w-6 h-6 text-emerald-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                </tr>
                <tr className="border-t border-gray-200 bg-indigo-50/30">
                  <td className="px-6 py-4 text-gray-900 font-medium">Academic Focus</td>
                  <td className="px-6 py-4 text-center"><Check className="w-6 h-6 text-emerald-500 mx-auto" /></td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                  <td className="px-6 py-4 text-center"><Check className="w-6 h-6 text-gray-300 mx-auto" /></td>
                </tr>
                <tr className="border-t border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                  <td className="px-6 py-6 text-gray-900 font-bold text-lg">Price per Month</td>
                  <td className="px-6 py-6 text-center">
                    <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">$15</span>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className="text-2xl font-semibold text-gray-700">$25-30</span>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className="text-2xl font-semibold text-gray-700">$30-50</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Value Proposition */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
                50%+
              </div>
              <p className="text-lg text-gray-600">More affordable than alternatives</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                All-in-One
              </div>
              <p className="text-lg text-gray-600">Everything you need in one place</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-3">
                10hrs
              </div>
              <p className="text-lg text-gray-600">Average time saved per month</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <Link href="/about" className="text-indigo-400 hover:text-indigo-300 transition-colors text-lg font-medium">
              Learn Our Story →
            </Link>
          </div>
          <p className="text-gray-400 mb-6 text-xl">© 2025 Akọ̀wé. All rights reserved.</p>
          <p className="text-gray-500 text-lg">Built with ❤️ for researchers and academics worldwide</p>
        </div>
      </footer>
    </div>
  );
}