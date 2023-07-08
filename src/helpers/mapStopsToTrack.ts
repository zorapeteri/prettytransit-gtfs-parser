import * as turf from '@turf/turf'
import type { Feature, LineString } from 'geojson'
import { saveFunc } from './files.js'
import getRatios from './getRatios.js'

type StopWithLocation = {
  id: string
  name: string
  location: number[]
}

const blue = '#0000FF'
const pink = '#FF0088'

const save = saveFunc('debug')

function makePointFeature(coords: number[], color: string, properties: any) {
  return {
    type: 'Feature',
    properties: {
      'marker-color': color,
      'marker-size': 'small',
      ...properties,
    },
    geometry: {
      type: 'Point',
      coordinates: coords,
    },
  }
}

export function mapStopsToTrack(coords: number[][], stops: StopWithLocation[]) {
  const coordIndexes: number[] = []
  const stopsFarOffTrack: number[][] = []
  let firstIndexToInclude = 0
  stops.forEach((stop, index) => {
    if (index === 0) {
      coordIndexes.push(0)
      return
    }
    for (let maxDistance = 50; maxDistance < 1000; maxDistance += 50) {
      for (let i = firstIndexToInclude; i < coords.length; i++) {
        const distance = turf.distance(
          turf.point(stop.location),
          turf.point(coords[i]),
          {
            units: 'meters',
          }
        )

        if (distance <= maxDistance) {
          if (stopsFarOffTrack.length) {
            coords.splice(
              firstIndexToInclude + 1,
              i - firstIndexToInclude - 1,
              ...stopsFarOffTrack
            )

            coordIndexes.push(
              ...stopsFarOffTrack.map(
                (_, index) => firstIndexToInclude + 1 + index
              )
            )

            i = firstIndexToInclude + stopsFarOffTrack.length + 1

            stopsFarOffTrack.splice(0, stopsFarOffTrack.length)
          }

          coordIndexes.push(i)
          firstIndexToInclude = i
          return
        }
      }
    }

    // stop location is more than 1km away from line
    stopsFarOffTrack.push(stop.location)
  })

  if (stopsFarOffTrack.length) {
    coords.splice(
      firstIndexToInclude + 1,
      coords.length - firstIndexToInclude - 1,
      ...stopsFarOffTrack
    )

    coordIndexes.push(
      ...stopsFarOffTrack.map((_, index) => firstIndexToInclude + 1 + index)
    )
  }

  if (stops.length !== coordIndexes.length) {
    throw new Error('number of stops and coord indexes not equal')
  }

  const projectedPoints = stops.map((stop, index) => {
    return makePointFeature(coords[coordIndexes[index]], pink, {
      index,
      name: stop.name,
      coordIndex: coordIndexes[index],
    })
  })

  const actualStopPoints = stops.map((stop, index) => {
    return makePointFeature(stop.location, blue, {
      index,
      name: stop.name,
    })
  })

  const lineString = turf.lineString(coords)

  const featureCollection = {
    type: 'FeatureCollection',
    features: [lineString, ...projectedPoints, ...actualStopPoints],
  }

  save('', {
    featureCollection,
  })

  const trackLengthInMeters = turf.length(lineString, { units: 'meters' })

  const stopsWithCoordIndex = stops.map((stop, index) => {
    const coordIndex = coordIndexes[index]
    if (coordIndex === 0) {
      return {
        ...stop,
        coordIndex: 0,
        onTrackLocation: 0,
      }
    }

    const coordsToStop = lineString.geometry.coordinates.slice(
      0,
      coordIndex + 1
    )
    const lineToStop = turf.lineString(coordsToStop)
    const metersToStop = turf.length(lineToStop, { units: 'meters' })
    const [onTrackLocation] = getRatios([
      metersToStop,
      trackLengthInMeters - metersToStop,
    ])

    return {
      ...stop,
      coordIndex,
      onTrackLocation,
    }
  })

  return {
    stopsWithCoordIndex,
    lineString,
    length: trackLengthInMeters,
  }
}
