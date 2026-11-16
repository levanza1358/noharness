/** The Models section's provider-removal confirmation. */
import type { ReactNode } from 'react'
import { Button, Modal } from '@noharness/client-ui-primitives'
import { providerCopy } from './provider-identity.ts'
import type { EditorTarget } from './provider-identity.ts'
import type { en } from './locales.ts'
import styles from './ModelsSection.module.css'

/** What the removal dialog shows and the two writers it calls. */
export interface DeleteDialogProps {
  readonly target: EditorTarget | undefined
  readonly deleting: boolean
  readonly failure: string | undefined
  readonly t: (key: keyof typeof en) => string
  readonly onCancel: () => void
  readonly onConfirm: () => void
}

/**
 * Confirm one provider's removal, keeping a failed removal visible and retryable.
 * @param props - the target, the in-flight and failure facts, and the two actions.
 * @returns the dialog, open while a target exists.
 */
export function DeleteDialog(props: DeleteDialogProps): ReactNode {
  const { target, deleting, failure, t } = props
  return (
    <Modal
      open={target !== undefined}
      onClose={props.onCancel}
      title={target === undefined ? '' : providerCopy(t('deleteTitle'), target)}
      closeLabel={t('close')}
      description={target === undefined
        ? ''
        : providerCopy(
          target.credentialRef === undefined
            ? t('deleteDescription')
            : t('deleteDescriptionWithCredential'),
          target,
        )}
      className={styles['deleteDialog'] as string}
      footer={(
        <>
          <Button variant="outline" data-modal-autofocus disabled={deleting} onClick={props.onCancel}>
            {t('cancel')}
          </Button>
          <Button
            variant="outline"
            className={styles['deleteConfirm']}
            disabled={deleting}
            onClick={props.onConfirm}
          >
            {target === undefined
              ? ''
              : providerCopy(deleting ? t('deleting') : t('deleteConfirm'), target)}
          </Button>
        </>
      )}
    >
      {failure === undefined ? null : <p className={styles['error']}>{failure}</p>}
    </Modal>
  )
}
