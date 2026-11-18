/** Settings section glyphs shared by the page rail and the sidebar navigation. */
import {
  IconAgentPresetOutlineMedium, IconArchiveOutlineMedium, IconDataOutlineMedium, IconGlobeOutlineMedium,
  IconInfoOutlineMedium,
  IconPersonalizationOutlineMedium, IconSettingsOutlineMedium, IconUserOutlineMedium,
} from '@noharness/client-ui-primitives'

/**
 * Pick the glyph for one settings section.
 * @param id - Registered section id.
 * @returns The section's icon, or the settings gear for an unknown id.
 */
export function sectionIcon(id: string) {
  if (id === 'account') return <IconUserOutlineMedium size={16} />
  if (id === 'models') return <IconDataOutlineMedium size={16} />
  if (id === 'agent-presets') return <IconAgentPresetOutlineMedium size={16} />
  if (id === 'plugins') return <IconPersonalizationOutlineMedium size={16} />
  if (id === 'archived-sessions') return <IconArchiveOutlineMedium size={16} />
  if (id === 'about') return <IconInfoOutlineMedium size={16} />
  if (id === 'network') return <IconGlobeOutlineMedium size={16} />
  return <IconSettingsOutlineMedium size={16} />
}
