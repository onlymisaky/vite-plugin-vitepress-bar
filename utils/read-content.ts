import * as fs from 'fs'
import { readFile } from '../core/read-file'
import { BarItem } from '../types'

export function readContent(
  stat: fs.Stats,
  bar: BarItem,
  dir: string,
  promises: Promise<string>[],
  resultMap: Record<string, string | Error>
) {
  if (stat.isFile()) {
    const ps = readFile(dir)
      .then((content) => {
        bar.content = content
        resultMap[dir] = content
        return content
      })
      .catch((err) => {
        resultMap[dir] = err
        return ''
      })
    promises.push(ps)
  } else {
    bar.content = ''
    resultMap[dir] = ''
  }
}
