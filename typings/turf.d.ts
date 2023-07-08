declare module '@turf/turf' {
  import * as turf from '@turf/turf'
  import type { Feature, LineString, Point, Position } from 'geojson'

  export const lineString: (coords: Position[]) => Feature<LineString>
  export const length: (
    lineString: Feature<LineString>,
    options: { units: 'meters' }
  ) => number
  export const booleanContains: (a: Feature, b: Feature) => boolean
  export const point: (lonLat: Position) => Feature<Point>
  export const nearestPointOnLine: (
    lineString: Feature<LineString>,
    point: Feature<Point>
  ) => {
    properties: {
      index: number
    }
  }
  export const distance: (
    a: Feature<Point>,
    b: Feature<Point>,
    options: { units: 'meters' }
  ) => number
}
