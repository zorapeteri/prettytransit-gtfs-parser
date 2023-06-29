export function getConfig(city: string) {
  const path = new URL(`../../input/${city}`, import.meta.url).pathname
  return {
    agencies: [
      {
        path: path + '/GTFS.zip',
      },
    ],
    ignoreDuplicates: true,
    sqlitePath: path + '/database.sqlite',
  }
}
