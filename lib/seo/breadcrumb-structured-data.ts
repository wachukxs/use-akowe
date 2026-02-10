/**
 * Server-safe utility to build BreadcrumbList JSON-LD.
 * Use this in Server Components; do not import from the client Breadcrumbs component.
 */

export interface BreadcrumbItem {
  label: string;
  href: string;
}

const defaultBaseUrl =
  process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://useakowe.com';

export function getBreadcrumbStructuredData(
  items: BreadcrumbItem[],
  baseUrl: string = defaultBaseUrl
) {
  const allItems = [{ label: 'Home', href: '/' }, ...items];

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: allItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: `${baseUrl}${item.href}`,
    })),
  };
}
