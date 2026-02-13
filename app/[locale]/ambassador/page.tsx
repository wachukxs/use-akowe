'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowRight, Check, Zap, Users, Sparkles, Gift, Award, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildFormLink } from '@/lib/external-links';

const APPLICATION_FORM_URL = buildFormLink('https://docs.google.com/forms/d/e/1FAIpQLSdNiEq1ChtNKp_Ecv6FSHE25wJSjxWFdUDPQ7mxqL4EotTT9w/viewform?usp=dialog', 'Ambassador Application');

export default function AmbassadorPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const benefits = [
    {
      icon: Zap,
      iconColor: 'text-[hsl(var(--primary))]',
      bgColor: 'bg-[hsl(var(--surface-muted))]',
      title: 'Free Akowe Pro Access',
      description: 'Lifetime access during the program - write unlimited papers with premium features',
    },
    {
      icon: Users,
      iconColor: 'text-[hsl(var(--secondary))]',
      bgColor: 'bg-[hsl(var(--surface-muted))]',
      title: 'Direct Product Team Access',
      description: 'Shape what we build next - your feedback goes straight to our team in Lagos',
    },
    {
      icon: Sparkles,
      iconColor: 'text-[hsl(var(--accent))]',
      bgColor: 'bg-[hsl(var(--surface-muted))]',
      title: 'Early Feature Access',
      description: 'Be the first to try new Akowe features before anyone else',
    },
    {
      icon: Gift,
      iconColor: 'text-[hsl(var(--primary))]',
      bgColor: 'bg-[hsl(var(--surface-muted))]',
      title: 'Cash Bonuses',
      description: 'Earn $25-50/month for top performance - get paid for helping your peers',
    },
    {
      icon: Award,
      iconColor: 'text-[hsl(var(--accent))]',
      bgColor: 'bg-[hsl(var(--surface-muted))]',
      title: 'Ambassador Certificate & Badge',
      description: 'Official recognition for your LinkedIn and resume',
    },
    {
      icon: Globe,
      iconColor: 'text-[hsl(var(--secondary))]',
      bgColor: 'bg-[hsl(var(--surface-muted))]',
      title: 'Paid Creator Opportunities',
      description: 'Top ambassadors get invited to become paid content creators',
    },
  ];

  const criteria = [
    'Current university students (undergrad or grad)',
    'Active in student communities',
    'Any country, any follower count',
    'Already using Akowe or excited to start',
    'Comfortable sharing tools you love',
    'Passionate about helping peers succeed',
  ];

  const steps = [
    {
      number: 1,
      numberColor: 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]',
      title: 'Apply',
      description: 'Fill out our quick application form. We review within 5-7 days.',
    },
    {
      number: 2,
      numberColor: 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]',
      title: 'Get Onboarded',
      description: 'Join our Slack, get your Pro access, and receive your welcome kit.',
    },
    {
      number: 3,
      numberColor: 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]',
      title: 'Start Sharing',
      description: 'Share Akowe with your network, earn rewards, and help students succeed.',
    },
  ];

  const stats = [
    { value: '20+', label: 'Countries', color: 'text-[hsl(var(--primary))]' },
    { value: '50+', label: 'Universities', color: 'text-[hsl(var(--secondary))]' },
    { value: '$50', label: 'Monthly Top Reward', color: 'text-[hsl(var(--accent))]' },
    { value: '6-12', label: 'Months Program', color: 'text-[hsl(var(--primary))]' },
  ];

  const faqs = [
    {
      question: 'Do I need a large social media following?',
      answer: 'Not at all! We value authenticity over reach. Even if you have 0 followers, you can be a great ambassador through group chats, study sessions, and one-on-one conversations.',
    },
    {
      question: 'How much time does this take?',
      answer: 'As little as 1-2 hours per week for casual ambassadors. You choose your level of involvement based on your schedule.',
    },
    {
      question: 'Can I apply from any country?',
      answer: "Yes! We're building a global program. Whether you're in Nigeria, US, UK, India, Kenya, or anywhere else - we want you.",
    },
    {
      question: "What if I'm not currently using Akowe?",
      answer: "That's fine! As long as you're excited about academic writing tools and willing to try Akowe, you can apply.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <header className="sticky top-0 z-50 border-b-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-0 sm:h-20">
            <Link href="/" className="flex flex-col gap-0.5">
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.28em] sm:tracking-[0.4em] text-[hsl(var(--muted-foreground))]">
                Akọ̀wé
              </span>
              <span className="text-xl sm:text-2xl font-bold uppercase tracking-[0.12em] sm:tracking-[0.16em]">
                Research Studio
              </span>
            </Link>
            <nav className="flex flex-wrap items-center gap-3 sm:gap-6 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] sm:tracking-[0.28em]">
              <a
                href="https://blog.useakowe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[hsl(var(--secondary))] transition-colors"
              >
                Blog
              </a>
              <Link href="/auth/signin" className="hover:text-[hsl(var(--secondary))] transition-colors">
                Sign In
              </Link>
              <Link
                href="/auth/signin"
                className="inline-flex items-center justify-center border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-5 sm:px-6 py-2.5 sm:py-3 font-semibold uppercase tracking-[0.18em] transition-transform duration-150 hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem]"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-[hsl(var(--surface-muted))] border-[2px] border-[hsl(var(--border-strong))] mb-6">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--primary))]">
              Now Accepting Applications
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Become an Akowe{' '}
            <span className="text-[hsl(var(--primary))]">
              Student Ambassador
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto mb-8">
            Join a global community of students helping students write better papers. Get rewarded for sharing a tool you love.
          </p>

          <a
            href={APPLICATION_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-4 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-2 border-[hsl(var(--primary))] font-semibold uppercase tracking-[0.18em] shadow-[6px_6px_0_rgba(29,41,57,0.16)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[8px_8px_0_rgba(29,41,57,0.18)] transition-all duration-150"
          >
            Apply Now
            <ArrowRight className="ml-2" size={20} />
          </a>
        </section>

        {/* What You'll Get Section */}
        <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            What You&apos;ll Get
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg"
                >
                  <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center mb-4', benefit.bgColor)}>
                    <Icon className={cn('w-6 h-6', benefit.iconColor)} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Who We're Looking For Section */}
        <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20">
          <div className="bg-[hsl(var(--primary))] border-4 border-[hsl(var(--border-strong))] rounded-lg p-8 sm:p-12 text-[hsl(var(--primary-foreground))]">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center">
              Who We&apos;re Looking For
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              {criteria.map((criterion, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">{criterion}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold', step.numberColor)}>
                  {step.number}
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Statistics Section */}
        <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={cn('text-4xl sm:text-5xl font-bold mb-2', stat.color)}>
                  {stat.value}
                </div>
                <div className="text-sm uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-6 hover:bg-[hsl(var(--surface-muted))] transition-colors text-left"
                >
                  <span className="font-semibold text-lg pr-4">{faq.question}</span>
                  {openFAQ === index ? (
                    <ChevronUp className="flex-shrink-0" size={20} />
                  ) : (
                    <ChevronDown className="flex-shrink-0" size={20} />
                  )}
                </button>
                {openFAQ === index && (
                  <div className="px-6 pb-6 pt-0 border-t border-[hsl(var(--border-strong))]">
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-4">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20">
          <div className="bg-[hsl(var(--primary))] border-4 border-[hsl(var(--border-strong))] rounded-lg p-8 sm:p-12 text-[hsl(var(--primary-foreground))] text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Join?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Applications reviewed within 5-7 business days
            </p>
            
            <a
              href={APPLICATION_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-[hsl(var(--surface))] text-[hsl(var(--primary))] border-2 border-[hsl(var(--border-strong))] font-semibold uppercase tracking-[0.18em] shadow-[6px_6px_0_rgba(29,41,57,0.16)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[8px_8px_0_rgba(29,41,57,0.18)] transition-all duration-150 mb-6"
            >
              Apply to be an Ambassador
              <ArrowRight className="ml-2" size={20} />
            </a>
            
            <p className="text-sm opacity-80">
              Questions? Email us at{' '}
              <a
                href="mailto:ambassadors@placeholderllc.name.ng"
                className="underline hover:opacity-100 transition-opacity"
              >
                ambassadors@placeholderllc.name.ng
              </a>
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] py-8">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[hsl(var(--muted-foreground))]">
            <p>© {new Date().getFullYear()} Akowe. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-[hsl(var(--foreground))] transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-[hsl(var(--foreground))] transition-colors">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
