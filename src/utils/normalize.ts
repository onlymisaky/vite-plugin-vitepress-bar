import type { Bar, NormalizePluginOptions, PluginOptions } from '../types/index'
import type { FileInfo } from '../types/shared'
import fg from 'fast-glob'

// eslint-disable-next-line unused-imports/no-unused-vars
const ignorePathReg = /^(?!.*(?:\/\.vitepress(?:\/|$)|\/\.git(?:\/|$)|\/node_modules(?:\/|$)|\/dist(?:\/|$))).*$/
export const mdReg = /\.md$/i

// eslint-disable-next-line unused-imports/no-unused-vars
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

function normalizeFilter(param: PluginOptions['filter']) {
  // if (typeof param === 'string' || param instanceof RegExp) {
  //   return function filter(fileInfo: FileInfo) {
  //     return matchPathname(param, fileInfo.path)
  //   }
  // }
  // if (Array.isArray(param)) {
  //   return function filter(fileInfo: FileInfo) {
  //     return param.some(item => matchPathname(item, fileInfo.path))
  //   }
  // }
  if (typeof param === 'function') {
    return async function filter(fileInfo: FileInfo) {
      try {
        return !!(await param(fileInfo))
      }
      catch {
        return true
      }
    }
  }
  return function filter(_fileInfo: FileInfo) {
    return true
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
    filter: normalizeFilter(pluginOptions.filter) as NormalizePluginOptions['filter'],
    complete: normalizeComplate(pluginOptions.complete) as NormalizePluginOptions['complete'],
  }
  return userOptions
}
