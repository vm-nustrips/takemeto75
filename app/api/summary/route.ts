import { NextResponse } from 'next/server';
import { destinations } from '@/lib/destinations';
import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

// Approximate flight cost multipliers based on distance from origin
const getFlightMultiplier = (origin: string, destCountry: string): number => {
  const domestic = ['USA', 'Mexico', 'Canada'];
  const caribbean = ['Puerto Rico', 'Dominican Republic', 'Jamaica', 'Bahamas', 'Aruba'];
  const longHaul = ['Thailand', 'Vietnam', 'Indonesia', 'South Africa', 'Australia', 'Japan'];
  
  if (domestic.includes(destCountry)) return 1.0;
  if (caribbean.includes(destCountry)) return 1.2;
  if (longHaul.includes(destCountry)) return 2.0;
  return 1.5; // Europe, South America
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destinationId, origin = 'SFO' } = body;

    const destination = destinations.find(d => d.id === destinationId);
    if (!destination) {
      return NextResponse.json({ error: 'Destination not found' }, { status: 400 });
    }

    const multiplier = getFlightMultiplier(origin, destination.country);
    
    // Helper to round to nearest 100
    const roundTo100 = (n: number) => Math.round(n / 100) * 100;
    
    // Base prices adjusted by distance
    // Base tier: Economy flights (~$300) + 3-star hotels (~$100-150/night)
    const baseLow = roundTo100((280 + 300) * multiplier);
    const baseHigh = roundTo100((400 + 450) * multiplier);
    
    // Premium tier: Economy/Premium Economy (~$400-600) + 4-star hotels (~$200-300/night)
    const premiumLow = roundTo100((450 + 600) * multiplier);
    const premiumHigh = roundTo100((700 + 900) * multiplier);
    
    // Luxe tier: Business class (~$900-1200) + 5-star hotels (~$500-800/night)
    const luxeLow = roundTo100((950 + 1500) * multiplier);
    const luxeHigh = roundTo100((1400 + 2400) * multiplier);

    // Get current month for timing hooks
    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'long' });
    const isHoliday = now.getMonth() === 11 || now.getMonth() === 0;
    const isSummer = now.getMonth() >= 5 && now.getMonth() <= 8;

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({
        summary: `${destination.city} offers ${destination.description.toLowerCase()}. Perfect weather awaits with temperatures near 75°F. ${isHoliday ? 'Post-holiday deals available.' : isSummer ? 'Peak season - book early!' : 'Shoulder season pricing in effect.'}`,
        prices: {
          base: `$${baseLow}-${baseHigh}`,
          premium: `$${premiumLow}-${premiumHigh}`,
          luxe: `$${luxeLow}-${luxeHigh}`,
        },
      });
    }

    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Generate a SHORT trip summary for ${destination.city}, ${destination.country} for someone flying from ${origin}. Current month: ${month}.

STRICT: Maximum 2 sentences, under 40 words total. Be punchy and enticing.

Include ONE timing hook naturally: "post-holiday lull" (Dec/Jan), "shoulder season pricing" (Mar-May, Sep-Nov), "peak season" (Jun-Aug), or "off-peak deals".

Estimate realistic price ranges for a 3-night trip from ${origin}:
- Base: $${baseLow}-${baseHigh} range (economy flights, 3★ hotels)
- Premium: $${premiumLow}-${premiumHigh} range (economy/premium economy, 4★ hotels)
- Luxe: $${luxeLow}-${luxeHigh} range (business class, 5★ luxury hotels)

Respond in JSON:
{"summary": "2 short sentences, max 40 words", "prices": {"base": "$X-Y", "premium": "$X-Y", "luxe": "$X-Y"}}`,
      }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return NextResponse.json({
      summary: parsed.summary,
      prices: parsed.prices,
    });
  } catch (error) {
    console.error('Summary API error:', error);
    
    return NextResponse.json({
      summary: 'Perfect weather and great value await. Shoulder season pricing makes this an ideal time to book.',
      prices: {
        base: '$600-900',
        premium: '$1,100-1,700',
        luxe: '$2,500-4,000',
      },
    });
  }
}
