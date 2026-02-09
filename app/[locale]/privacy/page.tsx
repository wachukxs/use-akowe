import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Akọ̀wé',
  description: 'Privacy Policy for Akọ̀wé - Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link 
            href="/" 
            className="text-xs font-semibold uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            ← Back to Akọ̀wé
          </Link>
          <h1 className="text-4xl font-bold mt-6 mb-4">Privacy Policy</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Last updated: January 14, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              Welcome to Akọ̀wé (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our academic writing platform and related services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2 text-[hsl(var(--muted-foreground))]">
              <li><strong>Account Information:</strong> Name, email address, and password when you create an account.</li>
              <li><strong>Profile Information:</strong> Any additional information you choose to add to your profile.</li>
              <li><strong>Content:</strong> Research papers, documents, notes, and other content you create or upload to our platform.</li>
              <li><strong>Payment Information:</strong> Billing details processed securely through our payment provider (Stripe). We do not store your full credit card details.</li>
              <li><strong>Communications:</strong> Messages and feedback you send to us.</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-2 text-[hsl(var(--muted-foreground))]">
              <li><strong>Usage Data:</strong> Information about how you interact with our services, including features used, time spent, and actions taken.</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device identifiers, and IP address.</li>
              <li><strong>Cookies:</strong> We use cookies and similar technologies to enhance your experience and analyze usage patterns.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[hsl(var(--muted-foreground))]">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
              <li>Personalize and improve your experience</li>
              <li>Facilitate AI-powered features to assist with your writing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. AI and Your Content</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed mb-4">
              Our platform uses artificial intelligence to provide writing assistance, suggestions, and analysis. When you use these features:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[hsl(var(--muted-foreground))]">
              <li>Your content may be processed by our AI systems to generate responses and suggestions.</li>
              <li>We do not use your personal content to train our AI models without your explicit consent.</li>
              <li>AI-generated responses are provided for assistance purposes only and should be reviewed for accuracy.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Information Sharing</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed mb-4">
              We do not sell your personal information. We may share your information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[hsl(var(--muted-foreground))]">
              <li><strong>Service Providers:</strong> With third-party vendors who perform services on our behalf (e.g., payment processing, hosting, analytics).</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights, privacy, safety, or property.</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide you services. We will retain and use your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements. You may request deletion of your account and associated data at any time through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Your Rights and Choices</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed mb-4">
              Depending on your location, you may have certain rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[hsl(var(--muted-foreground))]">
              <li><strong>Access:</strong> Request access to the personal information we hold about you.</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information.</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information.</li>
              <li><strong>Export:</strong> Request a copy of your data in a portable format.</li>
              <li><strong>Opt-out:</strong> Opt out of marketing communications at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Cookies</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              We use cookies and similar tracking technologies to collect and track information and to improve and analyze our service. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Third-Party Services</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              Our service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read the privacy policies of any third-party services you access.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Children&apos;s Privacy</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              Our service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. International Data Transfers</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that are different from the laws of your country. We take appropriate safeguards to ensure that your personal information remains protected.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Changes to This Policy</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. We encourage you to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <p className="text-[hsl(var(--muted-foreground))] mt-4">
              <strong>Email:</strong> support@placeholderllc.name.ng
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-[hsl(var(--border))]">
          <div className="flex flex-wrap gap-6 text-sm text-[hsl(var(--muted-foreground))]">
            <Link href="/terms" className="hover:text-[hsl(var(--foreground))] transition-colors">
              Terms of Service
            </Link>
            <Link href="/" className="hover:text-[hsl(var(--foreground))] transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
