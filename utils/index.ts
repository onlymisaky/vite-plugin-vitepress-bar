import * as fs from 'fs'
import * as path from 'path'
import { DefaultTheme } from 'vitepress'
import { readDirTree } from '../core/read-dir-tree'
import { FileInfo } from '../core/read-dir-tree/types'
import { repeatTreeBF } from '../core/tree'
import { Bar, BarItem, NormalizePluginOptions } from '../types'
import { Tree } from '../types/shared'
import { mdReg } from './normalize'
import { readContent } from './read-content'
import { sort } from './sort'

const sortedkey = Symbol('__sorted__')

function createNavItem(barItem: BarItem): DefaultTheme.NavItem {
  const navItem: DefaultTheme.NavItem = {
    text: barItem.text,
    link: barItem.link,
    activeMatch: barItem.link,
  }
  if (barItem.fileInfo.stat.isFile()) {
    return navItem
  }
  Reflect.set(navItem, 'items', [])
  return navItem
}

function createSidebarItem(barItem: BarItem, options: NormalizePluginOptions): DefaultTheme.SidebarItem {
  const sidebarItem: DefaultTheme.SidebarItem = {
    text: barItem.text,
    link: barItem.link,
  }
  if (barItem.fileInfo.stat.isFile()) {
    return sidebarItem
  }
  Reflect.set(sidebarItem, 'items', [])
  const collapsed = options.collapsed(barItem.fileInfo)
  if (collapsed !== undefined) {
    Reflect.set(sidebarItem, 'collapsed', collapsed)
  }
  return sidebarItem
}

function genBar(tree: Tree<'items', BarItem>, options: NormalizePluginOptions): Bar {
  const nav: DefaultTheme.NavItem[] = []
  const sidebar: DefaultTheme.SidebarItem[] = []

  const navMap: Map<string, DefaultTheme.NavItem> = new Map()
  const sidebarMap: Map<string, DefaultTheme.SidebarItem> = new Map()

  repeatTreeBF(tree, {
    childKey: 'items',
    onBeforeChildren: (children, current, parents) => {
      if (options.useContent) {
        children.forEach((item) => {
          item.text = options.text(item.fileInfo)
        })
        if (!Reflect.get(current, sortedkey)) {
          sort(children, options)
        }
      }
    },
    onItem: (item, index, siblings, parent, parents) => {
      if (item.fileInfo.stat.isDirectory() && (!item.items || item.items.length === 0)) {
        return
      }
      const { nav: forNav, sidebar: forSidebar } = options.genFor(item.fileInfo)
      if (forNav) {
        const navItem = createNavItem(item)
        navMap.set(item.fileInfo.fullpath, navItem)
      }
      if (forSidebar) {
        const sidebarItem = createSidebarItem(item, options)
        sidebarMap.set(item.fileInfo.fullpath, sidebarItem)
      }
    },
  })

  const navPaths = Array.from(navMap.keys())

  for (const [fullpath, navItem] of navMap.entries()) {
    const paths = navPaths.filter((item) => fullpath.startsWith(item) && item !== fullpath).sort((a, b) => b.length - a.length)
    if (paths.length > 0) {
      const parent = navMap.get(paths[0])
      if (parent) {
        const items = Reflect.get(parent, 'items') as DefaultTheme.NavItem[]
        if (items) {
          items.push(navItem)
        } else {
          Reflect.set(parent, 'items', [navItem])
        }
      } else {
        nav.push(navItem)
      }
    } else {
      nav.push(navItem)
    }
  }

  const sidebarPaths = Array.from(sidebarMap.keys())

  for (const [fullpath, sidebarItem] of sidebarMap.entries()) {
    const paths = sidebarPaths.filter((item) => fullpath.startsWith(item) && item !== fullpath).sort((a, b) => b.length - a.length)
    if (paths.length > 0) {
      const parent = sidebarMap.get(paths[0])
      if (parent) {
        const items = Reflect.get(parent, 'items') as DefaultTheme.SidebarItem[]
        if (items) {
          items.push(sidebarItem)
        } else {
          Reflect.set(parent, 'items', [sidebarItem])
        }
      } else {
        sidebar.push(sidebarItem)
      }
    } else {
      sidebar.push(sidebarItem)
    }
  }

  return { nav, sidebar }
}

function createFileInfo(fullpath: string, filename: string, stat: fs.Stats, parents: Tree<'items', BarItem>[], files?: string[]): FileInfo {
  const fileInfo: FileInfo = {
    filename,
    fullpath,
    stat,
    parents: parents.map((item) => item.fileInfo),
  }
  if (stat.isDirectory()) {
    fileInfo.files = files
  }
  return fileInfo
}

function getLinkByPaths(paths: string[]) {
  let link = paths.map((item) => path.basename(item, path.extname(item))).join('/')
  if (!link.startsWith('/')) { link = '/' + link }
  if (link.endsWith('/index')) { link = link.slice(0, -6) }
  return link
}

function isNeedProcess(fullpath: string, options: NormalizePluginOptions) {
  const included = options.included(fullpath)
  const excluded = options.excluded(fullpath)
  const exists = fs.existsSync(fullpath)

  if (!exists) return false
  if (!included) return false
  if (excluded) return false

  return true
}

function readDocsDir(filepath, options: NormalizePluginOptions): Promise<Tree<'items', BarItem>> {
  const fullpath = path.resolve(process.cwd(), filepath)
  const readContentPromises: Promise<string>[] = []
  const readContentResult: Record<string, string | Error> = {}
  return new Promise((resolve, reject) => {
    readDirTree<'items', BarItem>(fullpath, {
      processStatError: 'record',
      processReadDirError: 'record',
      isSkip: (fullpath, filename, stat, parents) => {
        if (stat.isFile() && !mdReg.test(filename)) {
          return true
        }
        let skip = !isNeedProcess(fullpath, options)
        return skip
      },
      childKey: 'items',
      onRead: (fullpath, filename, stat, parents, files) => {
        const fileInfo = createFileInfo(fullpath, filename, stat, parents, files)
        const parentPaths = fileInfo.parents.slice(1, fileInfo.parents.length).map((item) => item.fullpath)
        const bar: BarItem = {
          link: getLinkByPaths([...parentPaths, fileInfo.fullpath]),
          text: options.useContent ? filename.replace(mdReg, '') : options.text(fileInfo),
          fileInfo
        }
        if (options.useContent) {
          readContent(stat, bar, fullpath, readContentPromises, readContentResult)
        }
        return bar
      },
      onChildren: (fullpath, filename, stat, readResult, parents, files, children) => {
        if (options.useContent) {
          if (children.every((item) => item.fileInfo.fullpath in readContentResult)) {
            Reflect.set(parents[parents.length - 1], sortedkey, true)
            return sort(children, options)
          }
          return children
        }
        return sort(children, options)
      },
      onComplete(result, errors) {
        Promise.all(readContentPromises).then(() => {
          if (Object.keys(result).length) {
            resolve(result)
          } else {
            reject(errors)
          }
        })
      }
    })
  })
}

export function createBar(filepath, options: NormalizePluginOptions): Promise<{
  sidebar: DefaultTheme.SidebarItem[],
  nav: DefaultTheme.NavItem[]
}> {
  return readDocsDir(filepath, options).then((tree) => {
    const { nav, sidebar } = genBar(tree, options)

    return { nav, sidebar }
  })
}
