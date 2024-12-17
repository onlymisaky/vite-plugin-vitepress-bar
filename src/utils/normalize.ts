import type { NormalizePluginOptions, PluginOptions } from '../types/index'
import type { FileInfoSlim } from '../types/shared'
import fg from 'fast-glob'

const ignorePathReg = /^(?!.*(?:\/\.vitepress(?:\/|$)|\/\.git(?:\/|$)|\/node_modules(?:\/|$)|\/dist(?:\/|$))).*$/
export const mdReg = /\.md$/i

function matchPathname(soruce: string | RegExp, target: string): boolean {
  if (typeof soruce === 'string') {
    const matchedFiles = fg.sync(soruce)
    const result = matchedFiles.some(file => target.endsWith(file))
    return result
  }
  if (soruce instanceof RegExp) {
    return soruce.test(target)
  }
  return false
}

function normalizeIncluded(param: PluginOptions['included']) {
  if (typeof param === 'string' || param instanceof RegExp) {
    return function included(fileInfo: FileInfoSlim) {
      return matchPathname(param, fileInfo.path)
    }
  }
  if (Array.isArray(param)) {
    return function included(fileInfo: FileInfoSlim) {
      return param.some(item => matchPathname(item, fileInfo.path))
    }
  }
  if (typeof param === 'function') {
    return async function included(fileInfo: FileInfoSlim) {
      try {
        return !!(await param(fileInfo))
      }
      catch {
        return true
      }
    }
  }
  return function included(fileInfo: FileInfoSlim) {
    return ignorePathReg.test(fileInfo.path)
  }
}

function normalizeExcluded(param: PluginOptions['excluded']) {
  if (typeof param === 'string' || param instanceof RegExp) {
    return function excluded(fileInfo: FileInfoSlim) {
      return matchPathname(param, fileInfo.path)
    }
  }
  if (Array.isArray(param)) {
    return function excluded(fileInfo: FileInfoSlim) {
      return param.some(item => matchPathname(item, fileInfo.path))
    }
  }
  if (typeof param === 'function') {
    return async function excluded(fileInfo: FileInfoSlim) {
      try {
        return !!(await param(fileInfo))
      }
      catch {
        return false
      }
    }
  }
  return function excluded(fileInfo: FileInfoSlim) {
    return !ignorePathReg.test(fileInfo.path)
  }
}

function normalizeComplate(param: PluginOptions['complete']) {
  if (typeof param !== 'function') {
    return function complete(...args: Parameters<PluginOptions['complete']>) {
      const [bar] = args
      return bar
    }
  }
  return function complete(...args: Parameters<PluginOptions['complete']>) {
    const [bar] = args
    const res = param(bar)
    if (typeof res !== 'object' || (!('nav' in bar) && !('sidebar' in bar))) {
      return bar
    }
    return res
  }
}

export function normalizePluginOptions(pluginOptions: PluginOptions): NormalizePluginOptions {
  const userOptions: NormalizePluginOptions = {
    included: normalizeIncluded(pluginOptions.included),
    excluded: normalizeExcluded(pluginOptions.excluded),
    complete: normalizeComplate(pluginOptions.complete) as NormalizePluginOptions['complete'],
  }
  return userOptions
}
