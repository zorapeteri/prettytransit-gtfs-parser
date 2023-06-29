import { TransportTypes } from '../types.js'

export default function checkTransportType(
  transportType: string | undefined,
  transportTypes: TransportTypes
) {
  if (!transportType) {
    throw new Error(
      `Please provide a transport type as a command line parameter. (${Object.keys(
        transportTypes
      ).join('/')})`
    )
  }

  if (!transportTypes[transportType]) {
    throw new Error(
      `Please provide a valid transport type. (${Object.keys(
        transportTypes
      ).join('/')})`
    )
  }

  return true
}
