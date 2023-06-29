import fs from 'fs'
import cities from './constants/cities.js'
import { readFunc } from './helpers/files.js'
import { Track, TransportTypes } from './types.js'

const allColors = Array.from(
  new Set(
    cities
      .map((city) => {
        const read = readFunc(city)

        const transportTypes: TransportTypes = read('transportTypes')
        return Object.keys(transportTypes).reduce((acc, transportType) => {
          const tracks: Track[] = read(`tracks/${transportType}`)
          return [
            ...acc,
            ...tracks
              .map((track) => [track.route.colors.bg, track.route.colors.fg])
              .flat(),
          ]
        }, [])
      })
      .flat()
  )
)

fs.writeFileSync(
  'data/allColors.json',
  JSON.stringify(allColors, null, 2),
  'utf-8'
)
