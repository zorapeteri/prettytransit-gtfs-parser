import type { Feature, LineString } from 'geojson'

export type TransportType = {
  name: string
  agency_id: string
  route_type: string
  colors: {
    bg: string
    fg: string
  }
}

export type TransportTypes = Record<string, TransportType>

export type Line = {
  colors: { bg: string; fg: string }
  route_ids: string[]
  transportType: string
  origin: string
  destination: string
  tracks: Pick<
    Track,
    'origin' | 'destination' | 'id' | 'stops' | 'lineString'
  >[]
}

export type LinesCollection = Record<string, Line>

export type Route = {
  id: string
  name: string
  transportType: string
  colors: {
    bg: string
    fg: string
  }
}

export type Stop = {
  id: string
  name: string
  onTrackLocation: number
  coordIndex: number
  distanceToNextStop: number
}

export const daysOfTheWeek = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const

export type DayOfTheWeek = (typeof daysOfTheWeek)[number]

export function isDayOfTheWeek(day: string): day is DayOfTheWeek {
  return (daysOfTheWeek as unknown as string[]).includes(day)
}

export type Track = {
  id: string
  route: Route
  origin: string
  destination: string
  stops: Stop[]
  timeline: number[]
  duration: number
  timetable: Partial<Record<DayOfTheWeek, number[]>>
  lineString: Feature<LineString>
  length: number
  uniquePath?: boolean
}
