#!/usr/bin/env node

import { Context } from '@noharness/cordis'
import { pathToFileURL } from 'node:url'
import Loader from '@noharness/cordis-plugin-loader'

const ctx = new Context()
ctx.baseUrl = pathToFileURL(process.cwd()).href + '/'

await ctx.plugin(Loader)
await ctx.loader.create({
  name: '@noharness/cordis-plugin-include',
  config: {
    path: './cordis.yml',
  },
})
