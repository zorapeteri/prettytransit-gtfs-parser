import * as fs from 'fs'
import path from 'path'

export const saveFunc = (city: string) => {
  return (folder: string, obj: any) => {
    ensureDirectoryExistence(`data/${city}/` + folder + '/something')
    fs.writeFileSync(
      `data/${city}/` +
        (folder ? folder + '/' : '') +
        Object.keys(obj)[0] +
        '.json',
      JSON.stringify(Object.values(obj)[0], null, 2).replace(
        /[\u200B-\u200D\uFEFF]/g,
        ''
      ),
      { encoding: 'utf8' }
    )
  }
}

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath)
  if (fs.existsSync(dirname)) {
    return true
  }
  ensureDirectoryExistence(dirname)
  fs.mkdirSync(dirname)
}

export const readFunc = (city: string) => {
  return (path: string | string[]) => {
    const _path =
      `data/${city}/` + (Array.isArray(path) ? path.join('/') : path) + '.json'
    return JSON.parse(fs.readFileSync(_path, 'utf8'))
  }
}
