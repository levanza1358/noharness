/**
 * Virtual root of the worker host's in-memory filesystem. Kept
 * in one module so the process shim, the path/os shims, and the VFS image
 * collector cannot drift apart.
 */

/** Virtual filesystem root; `process.cwd()` and every absolute path start here. */
export const NHS_ROOT = '/nhs'

/** `$NHS_HOME`: durable-state directory inside the image. */
export const NHS_HOME = `${NHS_ROOT}/home`

/** Flat, symlink-free package tree resolved by the worker module loader. */
export const NHS_NODE_MODULES = `${NHS_ROOT}/node_modules`

/** Image configuration directory: the VFS manifest and the shipped agent presets. */
export const NHS_CONFIG = `${NHS_ROOT}/config`

/** Default (empty) workspace directory. */
export const NHS_WORKSPACE = `${NHS_ROOT}/workspace`

/** Temporary directory reported by `os.tmpdir()`. */
export const NHS_TMP = `${NHS_ROOT}/tmp`
