import * as fs from 'fs'

export function readFile(filePath: string, encoding: BufferEncoding = 'utf-8') {
  let resolve, reject;
  const promise = new Promise<string>((res, rej) => {
    resolve = res;
    reject = rej;
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
