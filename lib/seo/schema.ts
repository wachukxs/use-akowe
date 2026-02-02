const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://useakowe.com';

export interface HowToStep {
  name: string;
  text: string;
  image?: string;
}

export interface WebPageSchemaOptions {
  url: string;
  title: string;
  description: string;
  datePublished?: string;
  dateModified?: string;
}

export interface HowToSchemaOptions {
  name: string;
  description: string;
  steps: HowToStep[];
  image?: string;
}

/**
 * Generate WebPage schema markup
 */
export function generateWebPageSchema(options: WebPageSchemaOptions) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': options.url,
    url: options.url,
    name: options.title,
    description: options.description,
    ...(options.datePublished && { datePublished: options.datePublished }),
    ...(options.dateModified && { dateModified: options.dateModified }),
    publisher: {
      '@type': 'Organization',
      name: 'Akowe',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/icon.png`,
      },
    },
  };
}

/**
 * Generate HowTo schema markup for step-by-step guides
 */
export function generateHowToSchema(options: HowToSchemaOptions) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: options.name,
    description: options.description,
    ...(options.image && {
      image: {
        '@type': 'ImageObject',
        url: options.image,
      },
    }),
    step: options.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && {
        image: {
          '@type': 'ImageObject',
          url: step.image,
        },
      }),
    })),
  };
}
