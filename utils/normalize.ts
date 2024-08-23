import { Bar, NormalizeOptions, Options } from '../types/index'
import { FileInfo } from '../core/read-dir-tree/types'

export function normalizeGenType(param: Options['genType']): Options['genType'] {
  if (typeof param === 'function') {
    return param
  }
  return (source, target) => {
    const { sidebar: sourceSidebar, nav: sourceNav } = source
    const { sidebar, nav } = target
    const bar: Bar = { ...target }
    if (!sidebar) {
      bar.sidebar = sourceSidebar
    }
    if (!nav) {
      bar.nav = sourceNav
    }
    return bar
  }
}

const ignorePathReg = /^(?!.*(?:\.vitepress|\.git|node_modules|dist)).*$/

function matchPathname(soruce: string | RegExp, target: string) {
  if (typeof soruce === 'string') {
    return soruce === target
  }
  if (soruce instanceof RegExp) {
    return soruce.test(target)
  }
  return false
}

export function normalizeIncluded(param: Options['included']) {
  if (typeof param === 'string' || param instanceof RegExp) {
    return (fullPath: string) => matchPathname(param, fullPath)
  }
  if (Array.isArray(param)) {
    return (fullPath: string) => param.some(item => matchPathname(item, fullPath))
  }
  if (typeof param === 'function') {
    return param
  }
  return (fullPath: string) => {
    return ignorePathReg.test(fullPath)
  }
}

export function normalizeSort(param: Options['sort']) {
  if (param && typeof param === 'object' && param.by) {
    return (a, b) => {
      const { order, by } = param
      const _a = a[by]
      const _b = b[by]
      return order === 'asc' ? _a.localeCompare(_b) : _b.localeCompare(_a)
    }
  }
  if (typeof param === 'function') {
    return param
  }
  return (a, b) => 0
}

export function normalizeText(param: Options['text']) {
  if (typeof param === 'function') {
    return param
  }
  return (fileInfo: FileInfo) => {
    const { filename, parents } = fileInfo
    const parent = parents[parents.length - 1]
    if (filename.toLowerCase() === 'index.md' && parent) {
      const lastPathname = parent.filename
      return lastPathname.replace(/\.[mM][dD]$/, '')
    }
    return filename.replace(/\.[mM][dD]$/, '')
  }
}

export function normalizeCollapsed(param: Options['collapsed']) {
  if (typeof param === 'function') {
    return param
  }
  if (typeof param === 'boolean') {
    return (fileInfo: FileInfo) => param
  }
  return (fileInfo: FileInfo) => true
}

export function normalizeGenFor(param: Options['genFor']) {
  if (typeof param === 'function') {
    return param
  }
  if (param && typeof param === 'object') {
    const { nav, sidebar } = param
    return () => {
      return {
        nav: nav ?? true,
        sidebar: sidebar ?? true
      }
    }
  }
  return (fileInfo: FileInfo) => {
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

export function normalizeOptions(options: Options): NormalizeOptions {
  const userOptions: NormalizeOptions = {
    genType: normalizeGenType(options.genType),
    included: normalizeIncluded(options.included),
    excluded: (fullPath: string) => !normalizeIncluded(options.included)(fullPath),
    useContent: !!options.useContent,
    sort: normalizeSort(options.sort),
    text: normalizeText(options.text),
    collapsed: normalizeCollapsed(options.collapsed),
    genFor: normalizeGenFor(options.genFor)
  }
  return userOptions
}
