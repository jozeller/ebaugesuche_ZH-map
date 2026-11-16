# Address geocoding

The municipality catalog in `data/gemeinden.json` is copied from the supplied
eAuflage portal export and is the shared source for the scraper and both map
pages. That export contains 65 municipalities.

Published addresses are geocoded with the official geo.admin.ch SearchServer.
The importer accepts a result only when the street and house number match and
the result belongs to the requested municipality. It tries individual house
numbers for multi-building records. Gemeinde-center coordinates are never used
as substitutes for missing address coordinates.

If no exact address result is available, the record remains in the GeoJSON with
`geometry: null`. The map does not place a misleading marker; the record is
shown in the unlocated-address list instead. GeoJSON point coordinates are
stored in `[longitude, latitude]` order. Open the orange exclamation mark in
the map header to view the list; it is closed by default.
The icon is hidden when there are no unlocated records.

Rebuild all portal data with:

```bash
npm run update
```

This refreshes the portal data, performs exact address matching, and writes the
per-municipality files in `data/`. The build logs any addresses that could not
be located exactly.

`data/baugesuche.json` is also written as the initial Stäfa dataset; its
records duplicate those in `data/baugesuche_stäfa.json` and must not be added
to municipality totals.

On 2026-11-16 the supplied 65-municipality export returned 249 records. The
official address service matched 237 exactly; the remaining 12 were retained
without map coordinates rather than assigned approximate Gemeinde centers.
