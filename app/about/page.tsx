'use client';

import Link from 'next/link';
import { BookOpen, Heart, Lightbulb, Users, ArrowLeft } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-indigo-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Akowe
              </h1>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin" className="text-gray-600 hover:text-indigo-600 transition-colors font-medium">
                Sign In
              </Link>
              <Link href="/auth/signin" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:shadow-lg">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6">
            The Story Behind{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Akọ̀wé
            </span>
          </h1>
          <p className="text-2xl text-gray-600 leading-relaxed">
            From ancient Yoruba wisdom to modern academic excellence
          </p>
        </div>
      </section>

      {/* The Name Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center mb-12">
            <BookOpen className="w-16 h-16 text-indigo-600" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 text-center">
            What is Akọ̀wé?
          </h2>
          <div className="prose prose-xl max-w-none">
            <p className="text-xl text-gray-700 leading-relaxed mb-6">
              <strong className="text-indigo-600">Akọ̀wé</strong> (ah-KOH-weh) is a Yoruba word meaning{' '}
              <span className="text-2xl font-semibold text-gray-900">&quot;the educated one&quot;</span> or{' '}
              <span className="text-2xl font-semibold text-gray-900">&quot;scribe.&quot;</span>
            </p>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              In Yoruba culture, an <em>Akọ̀wé</em> was more than just someone who could read and write. They were the keepers of knowledge, the recorders of history, and the trusted scholars who preserved wisdom for future generations. They held a position of great respect in society—entrusted with documenting important events, maintaining records, and serving as the bridge between oral tradition and written word.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              An <em>Akọ̀wé</em> wasn&apos;t just literate; they were <strong>responsible</strong>, <strong>meticulous</strong>, and <strong>dedicated to truth</strong>. Their role was sacred—to ensure that knowledge was accurate, accessible, and enduring.
            </p>
            <div className="bg-indigo-50 border-l-4 border-indigo-600 p-6 my-8 rounded-r-lg">
              <p className="text-xl text-indigo-900 italic font-medium">
                &quot;We chose this name because every scholar should be an Akọ̀wé—not just educated, but committed to excellence, integrity, and the advancement of knowledge.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center mb-12">
            <Heart className="w-16 h-16 text-pink-600" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 text-center">
            Our Mission
          </h2>
          <p className="text-xl text-gray-700 leading-relaxed text-center max-w-3xl mx-auto mb-12">
            We exist to help every researcher, student, and academic become a true <em>Akọ̀wé</em>—someone who produces work of integrity, rigor, and lasting value.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Lightbulb className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Empower Excellence</h3>
              <p className="text-gray-600 leading-relaxed">
                Give scholars the tools to produce research that meets the highest academic standards—work they can be proud of.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Preserve Integrity</h3>
              <p className="text-gray-600 leading-relaxed">
                Ensure every citation is accurate, every source is credible, and every piece of work upholds academic integrity.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Democratize Knowledge</h3>
              <p className="text-gray-600 leading-relaxed">
                Make world-class research tools accessible to everyone, not just those at elite institutions with big budgets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Founder's Story */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-12 text-center">
            The Founder&apos;s Drive
          </h2>
          <div className="prose prose-xl max-w-none">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Akọ̀wé was born from a simple frustration: <strong>academic writing tools are either too expensive, too complicated, or simply not built for researchers.</strong>
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              The founders—themselves graduate students and researchers—spent countless hours juggling multiple subscriptions: one tool for writing feedback, another for plagiarism checks, a third for citation management, and still more for project organization. It was expensive, inefficient, and exhausting.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              But the breaking point wasn&apos;t the cost or complexity. It was seeing brilliant research delayed, underfunded students struggling to afford basic tools, and talented scholars giving up on projects because the infrastructure was too burdensome.
            </p>
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-8 rounded-2xl my-8 border border-indigo-200">
              <p className="text-xl text-gray-900 font-medium mb-4">
                <strong>We asked ourselves:</strong>
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                What if there was <em>one</em> platform that did everything? What if it was affordable enough for a student in their first year, yet powerful enough for a professor working on their next publication? What if we built it <em>right</em>—with integrity, simplicity, and a genuine commitment to advancing scholarship?
              </p>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              That&apos;s why we built Akọ̀wé. Not as a side project or a cash grab, but as a mission—to honor the tradition of the <em>Akọ̀wé</em> by creating a tool worthy of scholars everywhere.
            </p>
            <p className="text-xl text-indigo-600 font-semibold leading-relaxed text-center mt-12">
              We&apos;re not backed by venture capital. We&apos;re funded by users who believe in our mission. And that means we answer to <em>you</em>, not investors.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-12 text-center">
            Our Values
          </h2>
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-indigo-600 mb-3">🎯 Excellence Without Compromise</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                We don&apos;t cut corners. Every feature is built to the highest standard because your research deserves nothing less.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-purple-600 mb-3">💡 Accessibility First</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                Great tools shouldn&apos;t be locked behind paywalls. Our free tier is genuinely useful, and our Pro tier is affordable—because knowledge should be for everyone.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-pink-600 mb-3">🤝 Community-Driven</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                We listen to our users. Every feature request, every bug report, every piece of feedback shapes what we build next.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-emerald-600 mb-3">🌍 Cultural Heritage</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                We honor our roots. The name Akọ̀wé isn&apos;t just branding—it&apos;s a commitment to upholding the values of scholarship, truth, and responsibility that have defined scholars for generations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to become an Akọ̀wé?
          </h2>
          <p className="text-xl text-indigo-100 mb-10 leading-relaxed">
            Join thousands of scholars who are producing their best work with Akọ̀wé.
          </p>
          <Link href="/auth/signin" className="inline-block bg-white text-indigo-600 px-12 py-5 rounded-2xl text-xl font-semibold hover:bg-gray-50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            Start Writing Free
          </Link>
          <p className="text-indigo-200 mt-6">No credit card required. Get started in seconds.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400 mb-4 text-lg">© 2025 Akọ̀wé. All rights reserved.</p>
          <p className="text-gray-500">Built with ❤️ for scholars, by scholars.</p>
        </div>
      </footer>
    </div>
  );
}

