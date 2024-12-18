import type { DefaultTheme } from 'vitepress'
import type { Bar, NavItem, NormalizePluginOptions, SidebarMulti } from '../types'
import type { FileInfo, Tree } from '../types/shared'
import { readDirTree } from '../core/read-dir-tree/index'
import { isNeedProcess } from './is-need-process'
import { mdReg } from './normalize'

function setSidebarMulti(
  sidebarMulti: SidebarMulti,
  key: string,
  value: DefaultTheme.SidebarItem,
): void {
  if (key in sidebarMulti) {
    sidebarMulti[key].push(value)
  }
  else {
    sidebarMulti[key] = [value]
  }
}

function getLinkPrefixByParent(parent: FileInfo | null | undefined, root: string): string {
  if (!parent)
    return '/'

  const pathSegments: string[] = []
  let currentParent: FileInfo | null | undefined = parent

  while (currentParent && currentParent.path !== root) {
    pathSegments.unshift(currentParent.name)
    currentParent = currentParent.parent
  }

  if (pathSegments.length === 0)
    return '/'

  return `/${pathSegments.join('/')}/`
}

interface NodeData {
  text: string
  link?: string
  items?: NodeData[]
  activeMatch: string
  collapsed?: boolean
}

function docTree2Bar(docTree: Tree<NodeData, 'items'> | null): Bar {
  if (!docTree) {
    const nav: NavItem[] = []
    const sidebar: SidebarMulti = {}
    const bar: Bar = { nav, sidebar }
    return bar
  }

  const nav: NavItem[] = docTree.items
    .filter(item => !item.link?.toLowerCase().endsWith('/index'))
    .map(({ link, items, ...item }) => {
      if (link) {
        return {
          link,
          ...item,
        } as DefaultTheme.NavItemWithLink
      }
      return {
        items,
        ...item,
      } as DefaultTheme.NavItemChildren
    })

  // 将 nav 作为 sidebar 的 key
  const sidebar = docTree.items
    .reduce((sidebarMulti, cur) => {
      const { text, activeMatch, link, items } = cur

      // 你是来捣乱的吧 (空文件夹，正常情况不会出现，因为 shouldSkip 已经排除掉了)
      if (!link && !items) {
        return sidebarMulti
      }

      // 首页
      if (text.toLowerCase() === 'index' || text === '') {
        return sidebarMulti
      }

      // 根目录下的 md 文件，属于未分类的情况
      if (!items) {
        setSidebarMulti(sidebarMulti, `/`, cur as unknown as DefaultTheme.SidebarItem)
        return sidebarMulti
      }

      setSidebarMulti(sidebarMulti, activeMatch, cur as unknown as DefaultTheme.SidebarItem)

      return sidebarMulti
    }, { '/': [] } as SidebarMulti)

  const bar: Bar = { nav, sidebar }

  return bar
}

export async function createBar(
  srcDir: string,
  options: NormalizePluginOptions,
  srcExclude: string[] | undefined,
): Promise<Bar> {
  const root = srcDir

  const docTree = await readDirTree<NodeData, 'items'>(root, {
    childrenKey: 'items',
    type: 'iterative',
    async shouldSkip(fileInfo) {
      // 不是 md 文件
      if (fileInfo.stat.isFile() && !mdReg.test(fileInfo.name))
        return true
      // 空文件夹
      if (fileInfo.stat.isDirectory() && fileInfo.files?.length === 0)
        return true

      return !(await isNeedProcess(fileInfo, options, { srcDir, srcExclude }))
    },
    transform: (fileInfo) => {
      // 根节点
      if (fileInfo.path === root) {
        return {
          text: fileInfo.name,
          link: '/',
          activeMatch: '/',
        }
      }

      const text = fileInfo.name.replace(mdReg, '')
      const link = getLinkPrefixByParent(fileInfo.parent, root) + text

      const nodeData: NodeData = {
        text,
        link,
        activeMatch: link,
      }

      // 处理目录节点
      if (fileInfo.stat.isDirectory()) {
        const hasIndex = fileInfo.files.some(item => item.toLowerCase() === 'index.md')
        // 没有 index.md 的文件夹, 需要删除 link
        if (!hasIndex) {
          delete nodeData.link
        }
      }

      // 处理文件节点
      if (fileInfo.stat.isFile()) {
        const isIndex = fileInfo.name.toLowerCase() === 'index.md'
        // 排除非根目录下的 index.md 文件
        if (isIndex && fileInfo.path !== root)
          return null
      }

      return nodeData
    },
  })
  const bar = docTree2Bar(docTree)
  return bar
}
