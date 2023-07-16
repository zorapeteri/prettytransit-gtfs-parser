# <img src="https://github.com/zorapeteri/prettytransit-gtfs-parser/assets/52820291/2676a740-6ed3-4fe3-841b-5dced6e68cb6" width="30px"> <img src="https://prettytransit.com/icon.png" width="30px"> prettytransit-gtfs-parser

Prettytransit GTFS parser takes GTFS feeds along with manually input resources and compiles them into simplified city bundles that [prettytransit](https://github.com/zorapeteri/prettytransit) can use.

## structure of input

In the root directory, an `input` directory should exist with the content pattern of `input/[city]/GTFS.zip` where `city` is one of the values in [`cities.ts`](https://github.com/zorapeteri/prettytransit-gtfs-parser/blob/main/src/constants/cities.ts).

Running `npm run import [city]` will generate a `database.sqlite` file in `input/[city]` that the parser can then use for processing GTFS with [`node-gtfs`](https://github.com/blinktaginc/node-gtfs)

## structure of output

Once the code has finished running, the `data` folder should be populated with this file structure:

```
/data
    /[city]
        /icons
            /[transportType].png
        /lines
            /[transportType].json
        /tracks
            /[transportType].json
        /cityFeatureCollection.geojson
        /citySvgPath.txt
        /colors.json
        /info.md
        /routeTypeMap.json
        /transportTypes.json
    /allColors.json

```

where

- `cityFeatureCollection.geojson` is a GeoJSON FeatureCollection of a single Feature of type LineString, that draws the administrative bounds of the given city
- `citySvgPath.txt` is an SVG path definition for a simplified version of the city's polygon in OpenStreetMap
- `colors.json` is a list of color-overrides for transit routes where the GTFS data is either insufficient or inaccurate
- `info.md` is just a markdown file for the info panel
- `routeTypeMap.json` maps the `route_type`-s in the city's GTFS feed to types defined in [the GTFS Reference](https://gtfs.org/schedule/reference/#routestxt) extended with `109 Suburban Railway` from [Google's Extended GTFS Route Types](https://developers.google.com/transit/gtfs/reference/extended-route-types)

The types for `tracks`, `lines` and `transportTypes` are [here](https://github.com/zorapeteri/prettytransit-gtfs-parser/blob/main/src/types.ts).

## scripts

### `npm run start [city] [transportType]`

Produces `data/[city]/tracks/[transportType].json` and `data/[city]/lines/[transportType].json`.

- A track is a group of trips that share the same route and the same list of stops.
- A line is a group of routes that share the same name and transport type.

### `npm run dedup [city]`

Deduplicates line names in `city`.

Routes with the same name can exist across transport types, this script makes sure they don't have the same key in `lines/[city].json`

The order of keys in `[city]/transportTypes.json` is honored here, so for example in Berlin `ubahn` comes before `bus` in `transportTypes`: so the `ubahn` line `U6` gets to keep its name, but `bus` line `U6` (a replacement service) becomes `U6:bus`.

### `npm run colors`

Produces `data/allColors.json`, which contains a single array of HEX color codes, the list of unique colors used by all of the lines in all of the cities. This list is used to generate [`prettytransit/textures`](https://github.com/zorapeteri/prettytransit/tree/main/public/textures), which are loaded into the vehicle [sprites](<https://en.wikipedia.org/wiki/Sprite_(computer_graphics)>) in the frontend.

### `npm run express`

Spins up a simple static file server so that you can look at the large JSON files <small>with tools better fit for that than your IDE that won't try to format it and will tell you how many items there are in an array (insomnia <3)</small>
