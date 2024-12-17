import * as fs from 'node:fs'

export function readFile(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
  let resolve: (data: string) => void, reject: (err: Error) => void
  const promise = new Promise<string>((res, rej) => {
    resolve = res
    reject = rej
  })

  let data = ''
  const rs = fs.createReadStream(filePath, encoding)
    .on('data', (chunk) => {
      data += chunk
    })
    .on('end', () => {
      resolve(data)
      rs.destroy()
    })
    .on('error', (err) => {
      reject(err)
      rs.destroy()
    })

  return promise
}
