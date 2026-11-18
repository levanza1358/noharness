/** Seam for feature pages that open or leave a section of the settings shell. */

/** Navigation the settings shell publishes while it is mounted. */
export interface SettingsNavigationService {
  /**
   * Show the settings page on one section.
   * @param sectionId - Registered section id to select.
   */
  open(sectionId: string): void
  /** Return the center column to the Conversation. */
  close(): void
}

declare module '@noharness/cordis' {
  interface Context {
    /**
     * Present while the settings shell is mounted. A feature page that has no
     * settings section to open leaves the lookup undefined.
     */
    settingsNavigation?: SettingsNavigationService
  }
}
