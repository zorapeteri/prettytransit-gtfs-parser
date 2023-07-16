import colorPalette from '../constants/colorPalette.js'
import type { LinesCollection, Track, TransportTypes } from '../types.js'
import _ from 'lodash'
import { getForegroundColor } from './getForegroundColor.js'

function colorIsRelativelyUnique(lines: LinesCollection, lineName: string) {
  const color = lines[lineName].colors.bg
  const linesWithThisColor = Object.values(lines).filter(
    (line) => line.colors.bg === color
  )
  return linesWithThisColor.length <= Object.keys(lines).length * 0.1
}

export default function diversifyColors(
  lines: LinesCollection,
  tracks: Track[],
  transportTypes: TransportTypes
) {
  const colors = Object.values(lines).map((line) => line.colors.bg)
  const uniqueColors = _.uniq(colors)
  if (uniqueColors.length >= colors.length * 0.4) {
    return
  }

  // less than 40% of lines have unique color -> applying own color palette

  const shuffledPalette = _.shuffle(colorPalette)

  Object.keys(lines).forEach((lineName, index) => {
    if (colorIsRelativelyUnique(lines, lineName)) {
      return
    }

    const bg = shuffledPalette[index % (shuffledPalette.length - 1)]
    const fg = getForegroundColor(bg)
    lines[lineName].colors = { bg, fg }
    tracks.forEach((track) => {
      if (track.route.name === lineName) {
        track.route.colors = { bg, fg }
      }
    })
  })
}
