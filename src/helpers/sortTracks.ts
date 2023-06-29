import { Track } from '../types.js'

const isNumberString = (str: string) => /^\d+$/.test(str)

const compareValues = (a: string, b: string) => {
  const isNumA = isNumberString(a)
  const isNumB = isNumberString(b)

  if (isNumA && isNumB) {
    return parseInt(a) - parseInt(b)
  } else if (isNumA) {
    return -1
  } else if (isNumB) {
    return 1
  } else {
    const letterA = a.match(/[a-zA-Z-]+/)?.[0]
    const letterB = b.match(/[a-zA-Z-]+/)?.[0]

    if (letterA < letterB) {
      return -1
    } else if (letterA > letterB) {
      return 1
    } else {
      const numA = parseInt(a.match(/\d+/)?.[0])
      const numB = parseInt(b.match(/\d+/)?.[0])

      return numA - numB
    }
  }
}

export const sortTracks = (tracks: Track[]) => {
  return tracks.sort((a, b) => compareValues(a.route.name, b.route.name))
}
