import type { Bar, NormalizePluginOptions, PluginOptions } from '../types/index'
import type { FileInfo } from '../types/shared'
import fg from 'fast-glob'

const ignorePathReg = /^(?!.*(?:\/\.vitepress(?:\/|$)|\/\.git(?:\/|$)|\/node_modules(?:\/|$)|\/dist(?:\/|$))).*$/
export const mdReg = /\.md$/i

function matchPathname(soruce: string | RegExp, target: string): boolean {
  if (typeof soruce === 'string') {
    const matchedFiles = fg.sync(soruce, {
      dot: true,
      onlyFiles: false,
      onlyDirectories: false,
      ignore: ['**/*.!(md|MD|Md|mD)'],
    })
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
    return function included(fileInfo: FileInfo) {
      return matchPathname(param, fileInfo.path)
    }
  }
  if (Array.isArray(param)) {
    return function included(fileInfo: FileInfo) {
      return param.some(item => matchPathname(item, fileInfo.path))
    }
  }
  if (typeof param === 'function') {
    return async function included(fileInfo: FileInfo) {
      try {
        return !!(await param(fileInfo))
      }
      catch {
        return true
      }
    }
  }
  return function included(fileInfo: FileInfo) {
    return ignorePathReg.test(fileInfo.path)
  }
}

function normalizeExcluded(param: PluginOptions['excluded']) {
  if (typeof param === 'string' || param instanceof RegExp) {
    return function excluded(fileInfo: FileInfo) {
      return matchPathname(param, fileInfo.path)
    }
  }
  if (Array.isArray(param)) {
    return function excluded(fileInfo: FileInfo) {
      return param.some(item => matchPathname(item, fileInfo.path))
    }
  }
  if (typeof param === 'function') {
    return async function excluded(fileInfo: FileInfo) {
      try {
        return !!(await param(fileInfo))
      }
      catch {
        return false
      }
    }
  }
  return function excluded(fileInfo: FileInfo) {
    return !ignorePathReg.test(fileInfo.path)
  }
}

function filterNavAndSidebar(bar: Bar, maxNavItemsWithoutChildren = 6): Bar {
  const { nav, sidebar } = bar
  const navNoChildren = nav.every(item => !item.items)

  if (navNoChildren) {
    if (nav.length < maxNavItemsWithoutChildren) {
      return { nav, sidebar: {} }
    }
    return { nav: [], sidebar }
  }

  return bar
}

function normalizeComplate(param: PluginOptions['complete']) {
  if (typeof param !== 'function') {
    return function complete(...args: Parameters<PluginOptions['complete']>) {
      const [bar] = args
      return filterNavAndSidebar(bar)
    }
  }
  return function complete(...args: Parameters<PluginOptions['complete']>) {
    const [bar] = args
    const res = param(bar)
    if (typeof res !== 'object' || (!('nav' in bar) && !('sidebar' in bar))) {
      return filterNavAndSidebar(bar)
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
