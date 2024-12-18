import type { NormalizePluginOptions } from '../types'
import type { FileInfo } from '../types/shared'
import * as fs from 'node:fs'
import fg from 'fast-glob'

export async function isNeedProcess(
  fileInfo: FileInfo,
  options: NormalizePluginOptions,
  src: { srcDir: string, srcExclude: string[] | undefined },
): Promise<boolean> {
  // 处理用户传入的 excluded 与 vitepress 默认的 srcDir 、srcExclude 的优先级
  const { srcDir, srcExclude } = src

  if (srcDir === fileInfo.path) {
    return true
  }

  if (srcExclude) {
    const matchedFiles = fg.sync(srcExclude, {
      dot: true,
      onlyFiles: false,
      onlyDirectories: false,
      ignore: ['**/*.!(md|MD|Md|mD)'],
    })
    const excluded = matchedFiles.some(item => fileInfo.path.endsWith(item))
    if (excluded) {
      return false
    }
  }

  if (!fileInfo.path.startsWith(srcDir)) {
    return false
  }

  const included = await options.included(fileInfo)
  const excluded = await options.excluded(fileInfo)
  const exists = fs.existsSync(fileInfo.path)

  if (!exists)
    return false
  if (!included)
    return false
  if (excluded)
    return false

  return true
}
