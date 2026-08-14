export function headersForPerformanceRequest(
  requestUrl: URL,
  targetUrl: URL,
  headers: Record<string, string>,
  bypassSecret?: string
): Record<string, string>;

export function isExpectedPerformanceRequest(requestUrl: URL, targetUrl: URL): boolean;
