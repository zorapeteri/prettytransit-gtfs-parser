import {
  closeDb,
  openDb,
  getRoutes,
  getStops,
  getTrips,
  getShapes,
  getStoptimes,
  getCalendars,
  Stoptime,
  getCalendarDates,
  Calendar,
} from 'gtfs'
import pick from './helpers/pick.js'
import omit from './helpers/omit.js'
import _ from 'lodash'
import { readFunc, saveFunc } from './helpers/files.js'
import * as turf from '@turf/turf'
import getRatios from './helpers/getRatios.js'
import checkTransportType from './helpers/checkTransportType.js'
import {
  DayOfTheWeek,
  Line,
  Track,
  TransportTypes,
  daysOfTheWeek,
  isDayOfTheWeek,
} from './types.js'
import cleanseName from './helpers/cleanseName.js'
import { sortTracks } from './helpers/sortTracks.js'
import cities from './constants/cities.js'
import { getConfig } from './helpers/getConfig.js'
import { Day, isBefore, isSameDay, nextDay, parse } from 'date-fns'
import { getForegroundColor } from './helpers/getForegroundColor.js'
import { mapStopsToTrack } from './helpers/mapStopsToTrack.js'

const [city, transportType] = process.argv.slice(2)

if (!cities.includes(city)) {
  throw new Error(`Please provide a valid city. (${cities.join('/')})`)
}

const read = readFunc(city)
const save = saveFunc(city)

const transportTypes: TransportTypes = read('transportTypes')
const routeTypeMap = read('routeTypeMap')

if (!checkTransportType(transportType, transportTypes)) process.exit(0)

const config = getConfig(city)

const getStop = async (stop_id: string) => {
  const stops = await getStops({ stop_id })
  const stop = stops[0]
  return stop
}

const db = openDb(config)

const colors = read('colors')[transportType]

const agency_id = transportTypes[transportType].agency_id

let allRoutes = (await getRoutes(agency_id ? { agency_id } : {}))
  .map((route) => ({
    ...route,
    route_type:
      routeTypeMap[route.route_type.toString()] || route.route_type.toString(),
  }))
  .filter((route) => {
    if (transportTypes.nightbus) {
      if (transportType === 'bus') {
        return (
          route.route_type === '3' && route.route_color.toString() !== '000000'
        )
      }
      if (transportType === 'nightbus') {
        return (
          route.route_type === '3' && route.route_color.toString() === '000000'
        )
      }
    }
    return route.route_type === transportTypes[transportType].route_type
  })

console.log(`${allRoutes.length} ${transportType} routes`)

let allTrips = (
  await Promise.all(
    allRoutes.map(async (route) => {
      const trips = await getTrips(pick(route, 'route_id'))
      return trips.map((trip) => ({
        ...omit(trip, 'route_id'),
        route: {
          id: route.route_id,
          name: route.route_short_name,
          colors:
            colors?.[route.route_short_name] ||
            (route.route_color
              ? {
                  bg: '#' + route.route_color.toUpperCase(),
                  fg: route.route_text_color
                    ? '#' + route.route_text_color?.toUpperCase()
                    : getForegroundColor(route.route_color),
                }
              : transportTypes[transportType].colors),
          transportType,
        },
      }))
    })
  )
).flat()

console.log(`${allTrips.length} trips`)

const allTripsWithStopSequences = (
  await Promise.all(
    allTrips.map(async (trip) => {
      const stopsOnTrip = await getStoptimes(
        pick(trip, 'trip_id'),
        [],
        [['stop_sequence', 'ASC']]
      )
      return {
        ...trip,
        stopSequence: stopsOnTrip.map((stop) => stop.stop_id),
      }
    })
  )
).filter((trip) => trip.stopSequence.length)

const uniqueStopSequenceTracks = _.uniqBy(allTripsWithStopSequences, (trip) =>
  trip.stopSequence.join(',')
)

console.log(`${uniqueStopSequenceTracks.length} unique tracks`)

const tracks: Track[] = (
  await Promise.all(
    uniqueStopSequenceTracks.map(async (track, index) => {
      process.stdout.clearLine(0)
      process.stdout.cursorTo(0)
      process.stdout.write(
        `processing tracks: ${Math.round(
          (index / (uniqueStopSequenceTracks.length - 1)) * 100
        )} %`
      )
      const tripsWithSameStopSequence = allTripsWithStopSequences
        .filter((nonUniqueTrip) => {
          return (
            nonUniqueTrip.trip_id !== track.trip_id &&
            track.stopSequence.join(',') ===
              nonUniqueTrip.stopSequence.join(',')
          )
        })
        .map((nonUniqueTrip) => nonUniqueTrip.trip_id)
      const origin = (await getStop(track.stopSequence.at(0))).stop_name
      const destination = (await getStop(track.stopSequence.at(-1))).stop_name

      const firstStop = track.stopSequence.at(0)
      const allTripsOnTrack = [track.trip_id, ...tripsWithSameStopSequence]
      const stopTimesAndCalendars = await Promise.all(
        allTripsOnTrack.map(async (trip_id) => {
          const trip = (await getTrips({ trip_id }))[0]
          const stopTimes = await getStoptimes({
            stop_id: firstStop,
            trip_id,
          })
          let calendar = (await getCalendars(pick(trip, 'service_id')))?.[0]
          if (!calendar) {
            const dates = (await getCalendarDates(pick(trip, 'service_id')))
              .map(({ date }) => parse(date, 'yyyyMMdd', new Date()))
              .sort((a, b) => a.getTime() - b.getTime())

            if (!dates.length) {
              calendar = {} as Calendar
            } else {
              const firstDay = dates[0]
              const lastDay = dates[dates.length - 1]
              calendar = {} as Calendar
              daysOfTheWeek.forEach((day, index) => {
                const weekdaysInPeriod: Date[] = []
                let currentDate =
                  firstDay.getDay() === index
                    ? firstDay
                    : nextDay(firstDay, index as Day)
                while (isBefore(currentDate, lastDay)) {
                  weekdaysInPeriod.push(currentDate)
                  currentDate = nextDay(currentDate, index as Day)
                }

                const weekdaysThatHaveService = dates.filter((date) =>
                  weekdaysInPeriod.find((weekday) => isSameDay(date, weekday))
                )

                calendar[day] =
                  weekdaysThatHaveService.length / weekdaysInPeriod.length > 0.5
                    ? 1
                    : 0
              })
            }
          }
          return { stopTimes, calendar, trip }
        })
      )
      const stopTimeTables: Partial<Record<DayOfTheWeek, Stoptime[]>> = {}
      stopTimesAndCalendars.forEach(({ stopTimes, calendar }) => {
        Object.entries(calendar).forEach(([key, value]) => {
          if (value !== 1 || !isDayOfTheWeek(key)) return
          if (isDayOfTheWeek(key) && !stopTimeTables[key]) {
            stopTimeTables[key] = []
          }
          stopTimeTables[key].push(...stopTimes)
        })
      })

      const timetable: Partial<Record<DayOfTheWeek, number[]>> = {}

      Object.keys(stopTimeTables).forEach((day: DayOfTheWeek) => {
        timetable[day] = Array.from(
          new Set(
            stopTimeTables[day]
              .map((stopTime) => {
                const [hours, minutes, seconds] = stopTime.departure_time
                  .split(':')
                  .map(Number)
                return (seconds + minutes * 60 + hours * 3600) * 1000
              })
              .sort((a, b) => a - b)
          )
        )
      })

      if (Object.keys(timetable).length < 1) {
        return false as unknown as Track
      }

      const timestamps = (
        await getStoptimes(
          pick(track, 'trip_id'),
          [],
          [['stop_sequence', 'ASC']]
        )
      ).map((stopTime) => stopTime.departure_timestamp)
      const departureTimestamp = timestamps[0]
      const timeline = timestamps.map(
        (stamp) => (stamp - departureTimestamp) * 1000
      )

      const duration = timeline.at(-1)

      const coords: [number, number][] = (
        await getShapes(pick(track, 'shape_id'))
      )
        .sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence)
        .map(({ shape_pt_lon, shape_pt_lat }) => [shape_pt_lon, shape_pt_lat])

      if (!coords.length) {
        return false as unknown as Track
      }

      const stopsWithLocation = await Promise.all(
        track.stopSequence.map(async (stop_id) => {
          const stop = await getStop(stop_id)
          return {
            id: stop.stop_id,
            name: stop.stop_name,
            location: [stop.stop_lon, stop.stop_lat] as [number, number],
          }
        })
      )

      const { stopsWithCoordIndex, lineString, length } = mapStopsToTrack(
        coords,
        stopsWithLocation
      )

      const stops = stopsWithCoordIndex.map((stop, index) => {
        return {
          ...stop,
          distanceToNextStop:
            index === stopsWithCoordIndex.length - 1
              ? 0
              : stopsWithCoordIndex[index + 1].onTrackLocation -
                stop.onTrackLocation,
        }
      })

      return {
        id: '',
        route: track.route,
        origin,
        destination,
        stops,
        timeline,
        duration,
        timetable,
        lineString,
        length,
      }
    })
  )
).filter(Boolean)

console.log('')

Object.values(_.groupBy(tracks, (track) => track.route.id)).forEach(
  (group: any[]) => {
    group.forEach((track, index) => {
      track.id = `${track.route.id}__${index}`
    })
  }
)

const lines = _.groupBy(sortTracks(tracks), (track) => track.route.name)

console.log(`${Object.keys(lines).length} lines`)

Object.entries(lines).forEach(([line, tracks]) => {
  const containedTracks: Track[] = []

  tracks.forEach((track, index) => {
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
    process.stdout.write(
      `checking for unique paths in ${line}: ${Math.round(
        (index / (tracks.length - 1)) * 100
      )} %`
    )
    if (containedTracks.includes(track)) return
    const tracksThatAreInsideThisOne = tracks.filter(
      (_track) =>
        track !== _track &&
        turf.booleanContains(track.lineString, _track.lineString)
    )
    tracksThatAreInsideThisOne.forEach((_track) => {
      if (!containedTracks.includes(_track)) {
        containedTracks.push(_track)
      }
    })
  })

  tracks.forEach((track) => {
    if (!containedTracks.includes(track)) {
      track.uniquePath = true
    }
  })
})

process.stdout.clearLine(0)
process.stdout.cursorTo(0)
process.stdout.write(`checking for unique paths: 100%`)

save('tracks', { [transportType]: tracks })

const stopsCombined = (track: Track) =>
  track.stops.map((stop) => stop.name).join(',')
const stopsCombinedReverse = (track: Track) =>
  track.stops
    .reverse()
    .map((stop) => stop.name)
    .join(',')

Object.keys(lines).forEach((key) => {
  const _containedTracks: Track[] = []
  lines[key].forEach((track) => {
    if (_containedTracks.includes(track)) return
    const tracksThatAreInsideThisOne = lines[key].filter(
      (_track) =>
        track !== _track &&
        (stopsCombined(track).includes(stopsCombined(_track)) ||
          stopsCombined(track).includes(stopsCombinedReverse(_track)))
    )
    tracksThatAreInsideThisOne.forEach((_track) => {
      if (!_containedTracks.includes(_track)) {
        _containedTracks.push(_track)
      }
    })
  })

  lines[key].forEach((track) => {
    if (!_containedTracks.includes(track)) {
      ;(track as any).uniquePathOnLine = true
    }
  })
  const tracksForLine = lines[key]
    .filter((track) => (track as any).uniquePathOnLine)
    .sort((a, b) => b.length - a.length)
    .map((track) =>
      _.pick(track, ['origin', 'destination', 'stops', 'lineString', 'id'])
    )
  ;(lines as unknown as Record<string, Line>)[key] = {
    colors: lines[key][0].route.colors,
    route_ids: _.uniq(lines[key].map((track) => track.route.id)),
    transportType: lines[key][0].route.transportType,
    tracks: tracksForLine,
    origin: cleanseName(tracksForLine[0].origin),
    destination: cleanseName(tracksForLine[0].destination),
  } as Line
})

console.log('')
save('lines', { [transportType]: lines })

closeDb(db)
