/** Time-of-day hero greeting: a period phrase plus one of the shared closing lines. */

import type { ConversationKey } from '../locales.ts'

/** Time-of-day buckets the hero greeting distinguishes. */
export type GreetingPeriod = 'morning' | 'afternoon' | 'evening' | 'night'

/** Closing lines each period can pair with; the locale carries one key per line. */
export const GREETING_LINE_COUNT = 6

/** Locale key holding each period's opening phrase. */
export const GREETING_PERIOD_KEYS = {
  morning: 'hero.greeting.morning',
  afternoon: 'hero.greeting.afternoon',
  evening: 'hero.greeting.evening',
  night: 'hero.greeting.night',
} as const satisfies Record<GreetingPeriod, ConversationKey>

/** Locale keys holding the closing lines, in variant order. */
export const GREETING_LINE_KEYS = [
  'hero.greeting.line.1', 'hero.greeting.line.2', 'hero.greeting.line.3',
  'hero.greeting.line.4', 'hero.greeting.line.5', 'hero.greeting.line.6',
] as const satisfies readonly ConversationKey[]

/**
 * Select the period for one local hour of the day.
 * @param hour - Local hour in 0–23.
 * @returns Morning (05–11), afternoon (12–16), evening (17–21), or night.
 */
export function greetingPeriod(hour: number): GreetingPeriod {
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 22) return 'evening'
  return 'night'
}

/**
 * Pick one closing line from a random sample.
 * @param random - Sample in [0, 1), normally `Math.random()`.
 * @returns The locale key of the selected line.
 */
export function pickGreetingLine(random: number): (typeof GREETING_LINE_KEYS)[number] {
  const index = Math.min(GREETING_LINE_COUNT, Math.max(1, Math.floor(random * GREETING_LINE_COUNT) + 1))
  return GREETING_LINE_KEYS[index - 1] ?? GREETING_LINE_KEYS[0]
}
