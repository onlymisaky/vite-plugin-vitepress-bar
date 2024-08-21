import * as fs from 'fs'
import * as path from 'path'
import { DefaultTheme } from 'vitepress'
import { NormalizeOptions } from '../types'
import { FileInfo } from '../core/read-dir-tree/types'
import { readDirTree } from '../core/read-dir-tree'
import { genSilderbarAndNav } from './bar'
import { sort } from './sort'

function isNeedProcess(absolutePath: string, options: NormalizeOptions) {
  const included = options.included(absolutePath)
  const excluded = options.excluded(absolutePath)
  const exists = fs.existsSync(absolutePath)

  if (!exists) return false
  if (!included) return false
  if (excluded) return false

  return true
}

export function createBar(filepath, options: NormalizeOptions): Promise<{
  sidebar: DefaultTheme.Sidebar,
  nav: DefaultTheme.NavItem[]
}> {
  const absolutePath = path.resolve(process.cwd(), filepath)
  return new Promise((resolve) => {
    readDirTree<FileInfo>(absolutePath, {
      processStatsError: 'record',
      processReadDirError: 'record',
      isSkip: (dir, filename, stats, parents) => !isNeedProcess(dir, options),
      childKey: 'items',
      onChildren: (dir, filename, postStats, parents, childFiles, children) => {
        return sort(children, options)
      },
      onComplete(result, errors) {
        if (errors.length) {
          console.log(errors);
        }
        resolve(genSilderbarAndNav(result, options))
      }
    })
  })
}
