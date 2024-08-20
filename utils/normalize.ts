import { NormalizeOptions, Options } from './../types/index'

export function normalizeType(param: string): 'merge' | 'replace' {
  // TODO
  // if (['merge', 'replace'].includes(param)) {
  //   return param as 'merge' | 'replace'
  // }
  return 'replace'
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
    return (absolutePath: string) => matchPathname(param, absolutePath)
  }
  if (Array.isArray(param)) {
    return (absolutePath: string) => param.some(item => matchPathname(item, absolutePath))
  }
  if (typeof param === 'function') {
    return param
  }
  return (absolutePath: string) => {
    return ignorePathReg.test(absolutePath)
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
  return (absolutePath: string, lastPathname: string) => {
    return lastPathname.replace(/\.[mM][dD]$/, '')
  }
}

export function normalizeCollapsed(param: Options['collapsed']) {
  if (typeof param === 'function') {
    return param
  }
  if (typeof param === 'boolean') {
    return () => param
  }
  return () => void 0
}

export function normalizeUsedFor(param: Options['usedFor']) {
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
  return (absolutePath: string) => {
    if (absolutePath.includes('node_modules')) {
      return {
        nav: true,
        sidebar: true
      }
    }
    return {
      nav: false,
      sidebar: true
    }
  }
}

export function normalizeOptions(options: Options): NormalizeOptions {
  const userOptions: NormalizeOptions = {
    type: normalizeType(options.type),
    included: normalizeIncluded(options.included),
    excluded: (absolutePath: string) => !normalizeIncluded(options.included)(absolutePath),
    useContent: !!options.useContent,
    sort: normalizeSort(options.sort),
    text: normalizeText(options.text),
    collapsed: normalizeCollapsed(options.collapsed),
    usedFor: normalizeUsedFor(options.usedFor)
  }
  return userOptions
}
