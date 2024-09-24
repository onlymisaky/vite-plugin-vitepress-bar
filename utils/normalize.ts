import fg from 'fast-glob'
import { DefaultTheme } from 'vitepress'
import { FileInfo } from '../core/read-dir-tree/types'
import { repeatTreeBF } from '../core/tree'
import { Bar, NormalizePluginOptions, PluginOptions, SortItem } from '../types/index'

const ignorePathReg = /^(?!.*(?:\/\.vitepress(?:\/|$)|\/\.git(?:\/|$)|\/node_modules(?:\/|$)|\/dist(?:\/|$))).*$/
export const mdReg = /\.[mM][dD]$/

function fixNav(nav) {
  repeatTreeBF<'items', DefaultTheme.NavItem>({ items: nav }, {
    childKey: 'items',
    onItem: (item, index, siblings, parent, parents) => {
      if (item.items) {
        if (item.items.length === 0) {
          Reflect.deleteProperty(item, 'items')
        } else {
          Reflect.deleteProperty(item, 'link')
        }
      }
    }
  })
}

function fixSidebar(sidebar) {
  repeatTreeBF<'items', DefaultTheme.SidebarItem>({ items: sidebar }, {
    childKey: 'items',
    onItem: (item, index, siblings, parent, parents) => {
      if (item.items) {
        if (item.items.length === 0) {
          Reflect.deleteProperty(item, 'items')
        } else {
          Reflect.deleteProperty(item, 'link')
        }
      }
    }
  })
}

function normalizeGenType(param: PluginOptions['genType']): PluginOptions['genType'] {
  if (typeof param === 'function') {
    return function genType(sourceBar, genBar) {
      const { sidebar: sourceSidebar, nav: sourceNav } = sourceBar
      const _genBar = param(sourceBar, genBar)
      const { sidebar, nav } = _genBar
      const bar: Bar = { ...genBar }
      // TODO 校验
      if (!sidebar) {
        bar.sidebar = sourceSidebar
      }
      if (!nav) {
        bar.nav = sourceNav
      }
      return { sidebar, nav }
    }
  }
  return function genType(sourceBar, genBar) {
    const { sidebar: sourceSidebar, nav: sourceNav } = sourceBar
    const { sidebar, nav } = genBar
    const bar: Bar = { ...genBar }
    if (!sidebar) {
      bar.sidebar = sourceSidebar
    }
    if (!nav) {
      bar.nav = sourceNav
    }
    // TODO
    fixNav(nav)
    fixSidebar(sidebar)
    return bar
  }
}

function matchPathname(soruce: string | RegExp, target: string) {
  if (typeof soruce === 'string') {
    const matchedFiles = fg.sync(soruce)
    const result = matchedFiles.some((file) => target.endsWith(file))
    return result
  }
  if (soruce instanceof RegExp) {
    return soruce.test(target)
  }
  return false
}

function normalizeIncluded(param: PluginOptions['included']) {
  if (typeof param === 'string' || param instanceof RegExp) {
    return function included(fullpath: string) {
      return matchPathname(param, fullpath)
    }
  }
  if (Array.isArray(param)) {
    return function included(fullpath: string) {
      return param.some(item => matchPathname(item, fullpath))
    }
  }
  if (typeof param === 'function') {
    return function included(fullpath: string) {
      return !!param(fullpath)
    }
  }
  return function included(fullpath: string) {
    return ignorePathReg.test(fullpath)
  }
}

function normalizeExcluded(param: PluginOptions['excluded']) {
  if (typeof param === 'string' || param instanceof RegExp) {
    return (fullpath: string) => matchPathname(param, fullpath)
  }
  if (Array.isArray(param)) {
    return (fullpath: string) => param.some(item => matchPathname(item, fullpath))
  }
  if (typeof param === 'function') {
    return function excluded(fullpath: string) {
      return !param(fullpath)
    }
  }
  return function excluded(fullpath: string) {
    return !ignorePathReg.test(fullpath)
  }
}

function normalizeSort(param: PluginOptions['sort']) {
  if (param && typeof param === 'object') {
    return function sort(a: SortItem, b: SortItem) {
      const { order, by } = param
      if (['fullpath', 'content', 'create', 'modify', 'size'].includes(by)) {
        const _a = a[by]
        const _b = b[by]
        if (order === 'asc') {
          return _a.localeCompare(_b)
        }
        if (order === 'desc') {
          return _b.localeCompare(_a)
        }
        return 0
      }
      if (order === 'asc') {
        return -1
      }
      if (order === 'desc') {
        return 1
      }
      return 0
    }
  }
  if (typeof param === 'function') {
    return function sort(a: SortItem, b: SortItem) {
      const n = param(a, b)
      return isNaN(n) ? 0 : n
    }
  }
  return function sort(a: SortItem, b: SortItem) {
    return 0
  }
}

function normalizeText(param: PluginOptions['text']) {
  if (typeof param === 'function') {
    return function text(fileInfo: FileInfo) {
      const title = param(fileInfo)
      return title + ''
    }
  }
  return function text(fileInfo: FileInfo) {
    const { filename, parents } = fileInfo
    const parent = parents[parents.length - 1]
    if (filename.toLowerCase() === 'index.md' && parent) {
      const lastPathname = parent.filename
      return lastPathname.replace(mdReg, '')
    }
    return filename.replace(mdReg, '')
  }
}

function normalizeCollapsed(param: PluginOptions['collapsed']) {
  if (typeof param === 'function') {
    return function collapsed(fileInfo: FileInfo) {
      return !!param(fileInfo)
    }
  }
  if (typeof param === 'boolean') {
    return function collapsed(fileInfo: FileInfo) {
      return param
    }
  }
  return function collapsed(fileInfo: FileInfo) {
    return true
  }
}

function normalizeGenFor(param: PluginOptions['genFor']) {
  if (typeof param === 'function') {
    return function genFor(fileInfo: FileInfo) {
      const result = param(fileInfo)
      if (result && typeof result === 'object') {
        let nav = 'nav' in param ? !!param.nav : false
        let sidebar = 'sidebar' in param ? !!param.sidebar : false
        if (!nav && !sidebar) {
          sidebar = true
        }
        return { nav, sidebar }
      }
      return { nav: false, sidebar: true, }
    }
  }
  if (param && typeof param === 'object') {
    let nav = 'nav' in param ? !!param.nav : false
    let sidebar = 'sidebar' in param ? !!param.sidebar : false
    if (!nav && !sidebar) {
      sidebar = true
    }
    return function genFor() {
      return { nav, sidebar }
    }
  }
  return function genFor(fileInfo: FileInfo) {
    const parents = fileInfo.parents ?? []
    if (parents.length === 0) {
      return { nav: false, sidebar: false }
    }
    if (parents.length === 1) {
      return { nav: true, sidebar: false }
    }
    return { nav: false, sidebar: true }
  }
}

export function normalizePluginOptions(pluginOptions: PluginOptions): NormalizePluginOptions {
  const userOptions: NormalizePluginOptions = {
    genType: normalizeGenType(pluginOptions.genType),
    included: normalizeIncluded(pluginOptions.included),
    excluded: normalizeExcluded(pluginOptions.excluded),
    useContent: !!pluginOptions.useContent,
    sort: normalizeSort(pluginOptions.sort),
    text: normalizeText(pluginOptions.text),
    collapsed: normalizeCollapsed(pluginOptions.collapsed),
    genFor: normalizeGenFor(pluginOptions.genFor)
  }
  return userOptions
}

/**
 * @description 处理用户传入的 excluded 与 vitepress 默认的 srcDir 、srcExclude 的优先级
 * @param options
 * @param param1
 */
export function postProcessOptions(
  options: NormalizePluginOptions,
  { srcDir, srcExclude }: { srcDir: string; srcExclude: string[] | undefined }
) {
  const originalExcluded = options.excluded
  options.excluded = (fullPath: string) => {
    if (fullPath === srcDir) {
      return false
    }
    let excluded = originalExcluded(fullPath)
    if (excluded) {
      return excluded
    }
    if (srcExclude) {
      const matchedFiles = fg.sync(srcExclude)
      excluded = matchedFiles.some((item) => fullPath.endsWith(item))
    }
    return excluded
  }
}
