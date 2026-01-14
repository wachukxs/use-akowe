import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | Akọ̀wé',
  description: 'Terms of Service for Akọ̀wé - Read our terms and conditions for using the academic writing platform.',
};

export default function TermsOfServicePage() {
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
          <h1 className="text-4xl font-bold mt-6 mb-4">Terms of Service</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Last updated: January 14, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              By accessing or using Akọ̀wé (&quot;the Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the Service. We reserve the right to modify these Terms at any time, and your continued use of the Service constitutes acceptance of any modifications.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              Akọ̀wé is an academic writing platform that provides tools for research paper writing, citation management, AI-assisted writing, and plagiarism checking. The Service is designed to assist users in creating original academic work while maintaining academic integrity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed mb-4">
              To use certain features of the Service, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[hsl(var(--muted-foreground))]">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed mb-4">
              You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree NOT to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[hsl(var(--muted-foreground))]">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Submit content that infringes on intellectual property rights of others</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use the Service to generate content intended for submission as someone else&apos;s work (contract cheating)</li>
              <li>Share your account credentials with others</li>
              <li>Use automated scripts or bots to access the Service</li>
              <li>Reverse engineer or attempt to extract the source code of the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Academic Integrity</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed mb-4">
              Akọ̀wé is designed to support legitimate academic work. By using the Service, you acknowledge and agree that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[hsl(var(--muted-foreground))]">
              <li>AI-generated content is intended as a writing aid, not a replacement for your own work</li>
              <li>You are responsible for ensuring your work complies with your institution&apos;s academic integrity policies</li>
              <li>You must properly cite all sources, including any AI assistance if required by your institution</li>
              <li>The plagiarism checker is a tool to help identify potential issues, not a guarantee of originality</li>
              <li>You retain full responsibility for the originality and integrity of your submitted work</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">6.1 Your Content</h3>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              You retain ownership of all content you create using the Service. By using the Service, you grant us a limited license to store, process, and display your content as necessary to provide the Service. We will not claim ownership of your academic work.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">6.2 Our Content</h3>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              The Service, including its original content, features, and functionality, is owned by Akọ̀wé and protected by international copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works based on the Service without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Subscription and Payments</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">7.1 Free and Paid Plans</h3>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              The Service offers both free and paid subscription plans. Free plans have usage limitations, while paid plans provide additional features and higher usage limits.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">7.2 Billing</h3>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              Paid subscriptions are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law or as explicitly stated in these Terms.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">7.3 Cancellation</h3>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              You may cancel your subscription at any time through your account settings. Upon cancellation, you will continue to have access to paid features until the end of your current billing period.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">7.4 Price Changes</h3>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              We reserve the right to modify our pricing. Any price changes will be communicated in advance and will apply to subsequent billing periods.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. AI-Powered Features</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed mb-4">
              The Service includes AI-powered features for writing assistance. You acknowledge that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[hsl(var(--muted-foreground))]">
              <li>AI-generated content may contain errors or inaccuracies</li>
              <li>You are responsible for reviewing and verifying all AI suggestions</li>
              <li>AI features are provided &quot;as is&quot; without guarantees of accuracy or suitability</li>
              <li>We may update or modify AI features without notice</li>
              <li>Usage of AI features is subject to fair use limits based on your subscription plan</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Third-Party Services</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              The Service may integrate with or contain links to third-party services. We are not responsible for the content, privacy policies, or practices of third-party services. Your use of third-party services is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Disclaimers</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Limitation of Liability</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL AKỌWÉ, ITS DIRECTORS, EMPLOYEES, PARTNERS, OR SUPPLIERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Indemnification</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              You agree to indemnify, defend, and hold harmless Akọ̀wé and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including attorneys&apos; fees) arising from your use of the Service, your violation of these Terms, or your violation of any rights of another.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Termination</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Service will immediately cease. You may request export of your data before account termination.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Governing Law</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Akọ̀wé operates, without regard to its conflict of law provisions. Any disputes arising from these Terms or the Service shall be resolved in the courts of that jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">15. Changes to Terms</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days&apos; notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use the Service after revisions become effective, you agree to be bound by the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">16. Severability</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">17. Entire Agreement</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and Akọ̀wé regarding the use of the Service and supersede any prior agreements between you and Akọ̀wé relating to your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">18. Contact Us</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="text-[hsl(var(--muted-foreground))] mt-4">
              <strong>Email:</strong> legal@akowe.io
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-[hsl(var(--border))]">
          <div className="flex flex-wrap gap-6 text-sm text-[hsl(var(--muted-foreground))]">
            <Link href="/privacy" className="hover:text-[hsl(var(--foreground))] transition-colors">
              Privacy Policy
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
