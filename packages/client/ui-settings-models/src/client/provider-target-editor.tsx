/** One provider's editor card, addressed from its joined row. */
import type { ReactNode } from 'react'
import type { SettingsNamespaceView } from '@noharness/api-remotes/client'
import { renderProviderEditor } from './provider-row.tsx'
import type { EditorTarget } from './provider-identity.ts'
import type { ProviderRow } from './store.ts'
import type { ModelsOperations } from './operations.ts'
import type { SettingsSchemaOperations } from './schema-operations.ts'
import type { en } from './locales.ts'
import styles from './ModelsSection.module.css'

/** The target row and the namespace its write lands in. */
export interface TargetEditorProps {
  readonly target: EditorTarget
  readonly row: ProviderRow
  readonly namespace: SettingsNamespaceView
  readonly schema: SettingsSchemaOperations
  readonly operations: ModelsOperations
  readonly t: (key: keyof typeof en) => string
  readonly readOnly: boolean
  readonly onClose: (changed: boolean) => void
}

/**
 * Render the editor card of one provider the page already declared.
 * @param props - the addressed provider, its row, its namespace, and the card's writers.
 * @returns the editor card in its own block.
 */
export function TargetEditor(props: TargetEditorProps): ReactNode {
  const { target, row, namespace, schema, operations, t, readOnly, onClose } = props
  return (
    <div className={styles['addCard']}>
      {renderProviderEditor({ target, row, namespace, schema, operations, t, readOnly, onClose, hideModels: true })}
    </div>
  )
}
