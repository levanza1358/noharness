import { join } from 'node:path'
import { clearAmbientProxyEnv } from '../../../../../../scripts/test-proxy-environment.ts'

/** Isolate SDK profile processes from ambient profile, runtime and Node loader settings. */
export function profileEnvironment(root: string, baseUrl: string): NodeJS.ProcessEnv {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('NHS_')))
  Object.assign(env, {
    NHS_PERMISSION_MODE: 'danger-full-access', NHS_TELEMETRY_DISABLED: '1',
    NHS_AGENTS_HOME: join(root, 'agents'), NHS_PRIMARY_RUNTIME: '',
    DEEPSEEK_API_KEY: 'keyless-profile-test', DEEPSEEK_BASE_URL: baseUrl,
    NODE_OPTIONS: '', NODE_PATH: '',
  })
  clearAmbientProxyEnv(env)
  return env
}
