# frontend

## install

use --force if necessary. There are no conflicts, but some of the libraries haven't been updated recently.

```sh
npm install react-leaflet leaflet
npm install leaflet@latest
npm install leaflet-routing-machine
npm install @turf/turf
npm install react-leaflet-draw
```


## March 7:

- Corrected Leaflet Routing Machine appearance
- Adjusted layout and appearance of items on sidebar
  -  Mostly adding styles like rounding displayed lat/long value.
  -  Also adjusted appearance of most items
- Added options to overlay current fires and all fires from 2025
  - Default setting is for all fires from 2025
- Added click to see name of fire
  - Can do on hover instead -> will have to confer with group.
  - Can also add more information, like date started, etc. Could have hover for name, click for more info.
- Set up web hosting with netlify: [blazepath.netlify.app] (blazepath.netlify.app)
  - Currently based on this branch, but should adjust to main later. 


## March 6:

- Branch created from merging other branches

## TODO:

- Add 2 input boxes to search for addresses and use that instead of the lat/long boxes (from routing machine )
