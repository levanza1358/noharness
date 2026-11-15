/** Initial module manifests; owned Client libraries are compiled before shell assembly. */
import * as React from 'react'
import * as ReactJsxRuntime from 'react/jsx-runtime'
import * as ReactDom from 'react-dom'
import * as ReactDomClient from 'react-dom/client'
import * as Cordis from '@noharness/cordis'
import * as Zod from 'zod'
import * as ReactVirtual from '@tanstack/react-virtual'
import * as ClientStore from '@noharness/client-store'
import * as UiSlots from '@noharness/client-ui-slots'
import * as UiPrimitives from '@noharness/client-ui-primitives'
import * as UiDockkit from '@noharness/client-ui-dockkit'
import type { DshClientModuleManifest } from '@noharness/package-manifest'
import { STATIC_MODULE_MANIFEST_EXPORT, type PlatformModule } from './platform.ts'

/** Read the manifest a `staticLinked` library exports beside its ordinary exports. */
function compiledModule(id: string, namespace: object): DshClientModuleManifest {
  const manifest: unknown = Reflect.get(namespace, STATIC_MODULE_MANIFEST_EXPORT)
  if (typeof manifest !== 'object' || manifest === null
    || !('id' in manifest) || manifest.id !== id
    || !('factory' in manifest) || typeof manifest.factory !== 'function'
    || ('meta' in manifest && manifest.meta !== undefined && typeof manifest.meta !== 'function')) {
    throw new Error(`web boot: ${id} must be built with staticLinked before shell assembly`)
  }
  return manifest as DshClientModuleManifest
}

function platform(id: string, exports: Record<string, unknown>): DshClientModuleManifest {
  return { id, factory: () => exports }
}

/**
 * Supply shared third-party identities and package-generated manifests through one protocol.
 * @returns Initial module registrations; JavaScript and metadata factories are not evaluated here.
 */
export function getStaticModules(): readonly DshClientModuleManifest[] {
  return Object.values({
    'react': platform('react', React),
    'react/jsx-runtime': platform('react/jsx-runtime', ReactJsxRuntime),
    'react-dom': platform('react-dom', ReactDom),
    'react-dom/client': platform('react-dom/client', ReactDomClient),
    '@noharness/cordis': platform('@noharness/cordis', Cordis),
    'zod': platform('zod', Zod),
    '@tanstack/react-virtual': platform('@tanstack/react-virtual', ReactVirtual),
    '@noharness/client-store': compiledModule('@noharness/client-store', ClientStore),
    '@noharness/client-ui-slots': compiledModule('@noharness/client-ui-slots', UiSlots),
    '@noharness/client-ui-primitives': compiledModule('@noharness/client-ui-primitives', UiPrimitives),
    '@noharness/client-ui-dockkit': compiledModule('@noharness/client-ui-dockkit', UiDockkit),
  } satisfies Record<PlatformModule, DshClientModuleManifest>)
}
