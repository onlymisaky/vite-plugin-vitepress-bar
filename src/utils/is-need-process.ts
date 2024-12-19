import * as path from 'node:path'
import fg from 'fast-glob'

/**
 * @description 根据 srcDir 、srcExclude 优先判断是否需要处理文件
 * @param filePath 文件全路径
 */
export function isNeedProcess(filePath: string, src: { srcDir: string, srcExclude?: string[] }): boolean {
  const { srcDir, srcExclude } = src

  // 不是 srcDir 目录下的文件
  if ((!filePath.startsWith(srcDir) && filePath !== srcDir))
    return false

  // 不是 md 或文件夹
  const extension = path.extname(filePath)
  if (!['', '.md'].includes(extension))
    return false

  // 已排除的文件
  if (srcExclude) {
    const matchedFiles = fg.sync(srcExclude, {
      dot: true,
      onlyFiles: false,
      onlyDirectories: false,
      ignore: ['**/*.!(md|MD|Md|mD)'],
    })
    const excluded = matchedFiles.some(item => filePath.endsWith(item))
    if (excluded) {
      return false
    }
  }

  return true
}
