import { importGtfs } from 'gtfs'
import cities from './constants/cities.js'
import { getConfig } from './helpers/getConfig.js'

const city = process.argv[2]

if (!cities.includes(city)) {
  throw new Error(`Please provide a valid city. (${cities.join('/')})`)
}
const config = getConfig(city)

try {
  await importGtfs(config)
} catch (error) {
  console.error(error)
}
