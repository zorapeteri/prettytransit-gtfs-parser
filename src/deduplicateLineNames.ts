import cities from './constants/cities.js'
import { readFunc, saveFunc } from './helpers/files.js'
import { LinesCollection, Track, TransportTypes } from './types.js'

const city = process.argv[2]

if (!cities.includes(city)) {
  throw new Error(`Please provide a valid city. (${cities.join('/')})`)
}

const read = readFunc(city)
const save = saveFunc(city)

const transportTypes: TransportTypes = read('transportTypes')

const lineNames: string[] = []
const lineNamesChanged: Record<string, string[]> = {}

Object.keys(transportTypes).forEach((transportType) => {
  const lines: LinesCollection = read(`lines/${transportType}`)
  lineNamesChanged[transportType] = []
  Object.keys(lines).forEach((line) => {
    if (!lineNames.includes(line)) {
      lineNames.push(line)
    } else {
      lineNamesChanged[transportType].push(line)
    }
  })
})

Object.keys(lineNamesChanged).forEach((transportType) => {
  const lines: LinesCollection = read(`lines/${transportType}`)
  save('lines', {
    [transportType]: Object.fromEntries(
      Object.entries(lines).map(([key, value]) => {
        if (!lineNamesChanged[transportType].includes(key)) {
          return [key, value]
        }
        return [`${key}:${transportType}`, value]
      })
    ),
  })
  const tracks: Track[] = read(`tracks/${transportType}`)
  save('tracks', {
    [transportType]: tracks.map((track) => ({
      ...track,
      route: {
        ...track.route,
        route_name: lineNamesChanged[transportType].includes(track.route.name)
          ? `${track.route.name}:${transportType}`
          : track.route.name,
      },
    })),
  })
})
