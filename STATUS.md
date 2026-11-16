# Daten- und Kartenstatus

## Aktueller Stand (2026-11-16)

- `data/gemeinden.json` enthält die 65 Einträge aus dem bereitgestellten
  Portal-Export. Die Gemeindeliste wird nicht mehr anhand vorhandener Dateien
  gefiltert.
- Der Neuaufbau hat 249 Portal-Einträge aus diesen 65 Gemeinden geladen.
- 237 Adressen wurden mit Strasse, Hausnummer und Gemeinde exakt über den
  offiziellen geo.admin.ch SearchServer abgeglichen.
- 12 Fälle ohne eindeutigen Adress-Treffer bleiben in den Daten, erhalten aber
  keinen erfundenen Kartenpunkt. Sie werden im Frontend separat angezeigt.
- Das Luftbild verwendet den getesteten SwissTopo-WMS-Layer
  `ch.swisstopo.swissimage`.
- Stäfa ist die Startgemeinde; verortete Fälle bestimmen den Kartenausschnitt.

## Aktualisieren und prüfen

```bash
npm run update
npm test
```

Die aktuelle Portal-Liste enthält 65 Einträge, nicht 66. Rüschlikon ist in
diesem Export nicht enthalten; der aktuelle Abruf für diesen Slug liefert
keine aktiven Veröffentlichungen. Deshalb wird Rüschlikon nicht als
Portal-Gemeinde ausgegeben.
