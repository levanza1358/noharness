/** Render complete persistence documentation without Git or file mutation. */

/** One repository-relative generated file and its complete UTF-8 content. */
export interface PersistenceArtifact {
  readonly path: string
  readonly content: string
}

/**
 * Render one persistence document.
 * Link existence remains the Markdown gate's responsibility.
 * @param source - repository-relative document path.
 * @param content - complete authored or generated Markdown.
 * @returns the document, without writing files.
 */
export function renderPersistenceDocument(source: string, content: string): PersistenceArtifact[] {
  return [{ path: source, content }]
}
