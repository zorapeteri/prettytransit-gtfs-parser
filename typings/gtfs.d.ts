declare module 'gtfs' {
  import * as gtfs from 'gtfs'

  type SortMode = 'ASC' | 'DESC'

  type Sortable<T> = (
    t: Partial<T>,
    filter?: never[],
    sort?: [keyof T, SortMode][]
  ) => Promise<T[]>

  type Route = {
    agency_id: string
    route_id: string
    route_short_name: string
    route_type: number
    route_color?: string
    route_text_color?: string
  }

  type Trip = {
    route_id: string
    service_id: string
    trip_id: string
    trip_headsign: string
    trip_short_name: string
    direction_id: 0 | 1
    shape_id: string
    wheelchair_accessible: 0 | 1
    bikes_allowed: 0 | 1
  }

  type Stoptime = {
    trip_id: string
    arrival_time: string
    arrival_timestamp: number
    departure_time: string
    departure_timestamp: number
    stop_id: string
    stop_sequence: number
  }

  type Stop = {
    stop_id: string
    stop_name: string
    stop_desc: string
    stop_lat: number
    stop_lon: number
    zone_id: string
    parent_station?: string
    wheelchair_boarding: 0 | 1
    level_id: string
    platform_code: string
  }

  type Shape = {
    shape_id: string
    shape_pt_lat: number
    shape_pt_lon: number
    shape_pt_sequence: number
  }

  type Calendar = {
    service_id: string
    monday: 0 | 1
    tuesday: 0 | 1
    wednesday: 0 | 1
    thursday: 0 | 1
    friday: 0 | 1
    saturday: 0 | 1
    sunday: 0 | 1
    start_date: number
    end_date: number
  }

  type CalendarDates = {
    service_id: string
    date: string
    exception_type: 1 | 2
  }

  export const getRoutes: Sortable<Route>
  export const getTrips: Sortable<Trip>
  export const getStoptimes: Sortable<Stoptime>
  export const getStops: Sortable<Stop>
  export const getShapes: Sortable<Shape>
  export const getCalendars: Sortable<Calendar>
  export const getCalendarDates: Sortable<CalendarDates>

  type Db = 'db'
  export const openDb: (config: any) => Db
  export const closeDb: (db: Db) => void

  export const importGtfs: (config: any) => Promise<void>
}
