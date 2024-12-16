import * as fs from 'node:fs'
import fg from 'fast-glob'
import { NormalizePluginOptions } from '../types'
import { mdReg } from './normalize'
import { readDirTree } from '../core/read-dir-tree/index'
import { FileInfoWithoutParent } from '../types/shared'

export async function isNeedProcess(
  fileInfo: FileInfoWithoutParent,
  options: NormalizePluginOptions,
  src: { srcDir: string; srcExclude: string[] | undefined }
) {

  // 处理用户传入的 excluded 与 vitepress 默认的 srcDir 、srcExclude 的优先级
  const { srcDir, srcExclude } = src

  if (srcDir === fileInfo.path) {
    return true
  }

  if (!fileInfo.path.startsWith(srcDir)) {
    return false
  }

  if (srcExclude) {
    const matchedFiles = fg.sync(srcExclude)
    const excluded = matchedFiles.some((item) => fileInfo.path.endsWith(item))
    if (excluded) {
      return false
    }
  }

  const included = await options.included(fileInfo)
  const excluded = await options.excluded(fileInfo)
  const exists = fs.existsSync(fileInfo.path)

  if (!exists) return false
  if (!included) return false
  if (excluded) return false

  return true
}

interface NodeData {
  text: string
  link?: string
  items?: NodeData[]
  activeMatch: string
  collapsed?: boolean
}

export function createBar(
  srcDir: string,
  options: NormalizePluginOptions,
  srcExclude: string[] | undefined
) {
  const root = srcDir

  return readDirTree<NodeData, 'items'>(root, {
    childrenKey: 'items',
    type: 'iterative',
    async shouldSkip(fileInfo) {
      if (fileInfo.stat.isFile() && !mdReg.test(fileInfo.name)) {
        return true
      }
      let skip = !(await isNeedProcess(fileInfo, options, { srcDir, srcExclude }))
      return skip
    },
    transform: (fileInfo, parent) => {
      let text = ''
      let link = ''
      if (fileInfo.path !== srcDir) {
        text = fileInfo.name.replace(mdReg, '');
        link = (parent?.link ? parent.link + '/' : '/') + text;
      }
      return { text, link, activeMatch: link, collapsed: true }
    }
  }).then((res) => {
    if (!res) {
      return { nav: [], sidebar: {} }
    }
    const nav = res.items || []
    const sidebar = nav.reduce((acc, cur) => {
      const link = cur.link || ''
      if (acc[link]) {
        acc[link].push(cur)
      } else {
        acc[link] = [cur]
      }
      return acc
    }, {} as Record<string, NodeData[]>)

    return { nav, sidebar }
  })

}
