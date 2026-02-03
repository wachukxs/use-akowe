/**
 * Server-side tracking utilities
 * Creates tracking metadata that can be returned in API responses
 * Client-side code will pick up this metadata and track events via gtag
 */

/**
 * Creates tracking metadata for API responses
 * Returns null if condition is false, otherwise returns tracking object
 */
export function createTrackingMetadata(
  condition: boolean,
  eventName: string,
  params: Record<string, any>
): { trackEvent: { eventName: string; params: Record<string, any> } } | null {
  if (!condition) return null;
  
  return {
    trackEvent: {
      eventName,
      params: {
        ...params,
        timestamp: Date.now(),
      },
    },
  };
}
