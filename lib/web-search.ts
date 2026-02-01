// Web search utility using DuckDuckGo Lite
export async function webSearch(query: string): Promise<string> {
  try {
    const response = await fetch(
      `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      }
    );

    if (!response.ok) {
      console.error('Web search failed:', response.status);
      return '';
    }

    const html = await response.text();

    // Extract text content from search results (remove HTML tags, clean up)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000); // Limit to ~8k chars to fit in Claude context

    return textContent;
  } catch (error) {
    console.error('Web search error:', error);
    return '';
  }
}
