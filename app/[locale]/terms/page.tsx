import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Metadata } from 'next';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'terms' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function TermsOfServicePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'terms' });

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            {t('backTo')}
          </Link>
          <h1 className="text-4xl font-bold mt-6 mb-4">{t('title')}</h1>
          <p className="text-[hsl(var(--muted-foreground))]">{t('lastUpdated')}</p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('s1Title')}</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{t('s1Body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('s2Title')}</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{t('s2Body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('s3Title')}</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed mb-4">{t('s3Intro')}</p>
            <ul className="list-disc pl-6 space-y-2 text-[hsl(var(--muted-foreground))]">
              <li>{t('s3Li1')}</li>
              <li>{t('s3Li2')}</li>
              <li>{t('s3Li3')}</li>
              <li>{t('s3Li4')}</li>
              <li>{t('s3Li5')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('s4Title')}</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed mb-4">{t('s4Intro')}</p>
            <ul className="list-disc pl-6 space-y-2 text-[hsl(var(--muted-foreground))]">
              <li>{t('s4Li1')}</li>
              <li>{t('s4Li2')}</li>
              <li>{t('s4Li3')}</li>
              <li>{t('s4Li4')}</li>
              <li>{t('s4Li5')}</li>
              <li>{t('s4Li6')}</li>
              <li>{t('s4Li7')}</li>
              <li>{t('s4Li8')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('s5Title')}</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed mb-4">{t('s5Intro')}</p>
            <ul className="list-disc pl-6 space-y-2 text-[hsl(var(--muted-foreground))]">
              <li>{t('s5Li1')}</li>
              <li>{t('s5Li2')}</li>
              <li>{t('s5Li3')}</li>
              <li>{t('s5Li4')}</li>
              <li>{t('s5Li5')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('s6Title')}</h2>
            <h3 className="text-xl font-medium mb-3 mt-6">{t('s6YourTitle')}</h3>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{t('s6YourBody')}</p>
            <h3 className="text-xl font-medium mb-3 mt-6">{t('s6OurTitle')}</h3>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{t('s6OurBody')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('s7Title')}</h2>
            <h3 className="text-xl font-medium mb-3 mt-6">{t('s7aTitle')}</h3>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{t('s7aBody')}</p>
            <h3 className="text-xl font-medium mb-3 mt-6">{t('s7bTitle')}</h3>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{t('s7bBody')}</p>
            <h3 className="text-xl font-medium mb-3 mt-6">{t('s7cTitle')}</h3>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{t('s7cBody')}</p>
            <h3 className="text-xl font-medium mb-3 mt-6">{t('s7dTitle')}</h3>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{t('s7dBody')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('s8Title')}</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed mb-4">{t('s8Intro')}</p>
            <ul className="list-disc pl-6 space-y-2 text-[hsl(var(--muted-foreground))]">
              <li>{t('s8Li1')}</li>
              <li>{t('s8Li2')}</li>
              <li>{t('s8Li3')}</li>
              <li>{t('s8Li4')}</li>
              <li>{t('s8Li5')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('s9Title')}</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{t('s9Body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('s10Title')}</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{t('s10Body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('s11Title')}</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{t('s11Body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('s12Title')}</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{t('s12Body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('s13Title')}</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{t('s13Body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('s14Title')}</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{t('s14Body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('s15Title')}</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{t('s15Body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('s16Title')}</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{t('s16Body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('s17Title')}</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{t('s17Body')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">{t('s18Title')}</h2>
            <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{t('s18Intro')}</p>
            <p className="text-[hsl(var(--muted-foreground))] mt-4">
              <strong>{t('emailLabel')}</strong> {t('contactEmail')}
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-[hsl(var(--border))]">
          <div className="flex flex-wrap gap-6 text-sm text-[hsl(var(--muted-foreground))]">
            <Link href="/privacy" className="hover:text-[hsl(var(--foreground))] transition-colors">
              {t('footerPrivacy')}
            </Link>
            <Link href="/" className="hover:text-[hsl(var(--foreground))] transition-colors">
              {t('footerHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
