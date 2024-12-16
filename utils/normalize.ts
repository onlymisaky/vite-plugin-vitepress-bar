import fg from 'fast-glob'
import { NormalizePluginOptions, PluginOptions, } from '../types/index'
import { FileInfoWithoutParent } from '../types/shared'

const ignorePathReg = /^(?!.*(?:\/\.vitepress(?:\/|$)|\/\.git(?:\/|$)|\/node_modules(?:\/|$)|\/dist(?:\/|$))).*$/
export const mdReg = /\.[mM][dD]$/

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
    return function included(fileInfo: FileInfoWithoutParent) {
      return matchPathname(param, fileInfo.path)
    }
  }
  if (Array.isArray(param)) {
    return function included(fileInfo: FileInfoWithoutParent) {
      return param.some(item => matchPathname(item, fileInfo.path))
    }
  }
  if (typeof param === 'function') {
    return async function included(fileInfo: FileInfoWithoutParent) {
      try {
        return !!(await param(fileInfo))
      } catch (error) {
        return true
      }
    }
  }
  return function included(fileInfo: FileInfoWithoutParent) {
    return ignorePathReg.test(fileInfo.path)
  }
}

function normalizeExcluded(param: PluginOptions['excluded']) {
  if (typeof param === 'string' || param instanceof RegExp) {
    return function excluded(fileInfo: FileInfoWithoutParent) {
      return matchPathname(param, fileInfo.path)
    }
  }
  if (Array.isArray(param)) {
    return function excluded(fileInfo: FileInfoWithoutParent) {
      return param.some(item => matchPathname(item, fileInfo.path))
    }
  }
  if (typeof param === 'function') {
    return async function excluded(fileInfo: FileInfoWithoutParent) {
      try {
        return !!(await param(fileInfo))
      } catch (error) {
        return false
      }
    }
  }
  return function excluded(fileInfo: FileInfoWithoutParent) {
    return !ignorePathReg.test(fileInfo.path)
  }
}

export function normalizePluginOptions(pluginOptions: PluginOptions): NormalizePluginOptions {
  const userOptions: NormalizePluginOptions = {
    included: normalizeIncluded(pluginOptions.included),
    excluded: normalizeExcluded(pluginOptions.excluded),
  }
  return userOptions
}
