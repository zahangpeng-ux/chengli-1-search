import { View } from 'ol';
import { Graticule as GraticuleLayer } from 'ol/layer';
import TileLayer from 'ol/layer/WebGLTile.js';
import * as proj from 'ol/proj';
import { ImageTile } from 'ol/source';
import { Stroke, Text } from 'ol/style';

import * as models from '@models';
import { tiandituKey } from '@models/tianditu.model';

import { MapView, Projection } from './map-view';

type Basemap = 'img' | 'vec';

function tiandituUrl(layer: Basemap | 'cia' | 'cva'): string {
  return (
    `https://t{0-7}.tianditu.gov.cn/${layer}_w/wmts?` +
    `SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}` +
    '&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles' +
    `&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tiandituKey}`
  );
}

function equatorialView(basemap: Basemap): MapView {
  const projection = new Projection('EPSG:3857');
  const createSource = (layer: Basemap | 'cia' | 'cva') =>
    new ImageTile({
      url: tiandituUrl(layer),
      projection: projection.epsg,
      wrapX: models.mapOptions.wrapX,
      tileSize: [256, 256],
      minZoom: 1,
      maxZoom: 18,
      crossOrigin: 'anonymous',
      attributions:
        '<a href="https://www.tianditu.gov.cn/" target="_blank">天地图</a>',
    });
  const source = createSource(basemap);
  const labels = createSource(basemap === 'img' ? 'cia' : 'cva');
  // Retain the base source for the overview map; draw labels above it in the main map.
  const layer = new TileLayer({ source, sources: [source, labels] });

  const lonFormatter = function (lon: number) {
    let formattedLon =
      Math.abs(Math.round(lon * 100) / 100).toString() +
      String.fromCharCode(176) +
      ' ';
    formattedLon += lon < 0 ? 'W' : lon > 0 ? 'E' : '';
    return formattedLon;
  };

  const latFormatter = function (lat: number) {
    let formattedLat =
      Math.abs(Math.round(lat * 100) / 100).toString() +
      String.fromCharCode(176) +
      ' ';
    formattedLat += lat < 0 ? 'S' : lat > 0 ? 'N' : '';
    return formattedLat;
  };

  const latLonLabelStyle = new Text({
    font: '16px Roboto,sans-serif',
    textBaseline: 'bottom',
    stroke: new Stroke({
      color: 'rgba(255,255,255,1)',
      width: 3,
    }),
  });

  const strokeStyle =
    basemap === 'vec'
      ? new Stroke({
          color: 'rgba(0, 0, 0,0.5)',
          width: 1.5,
        })
      : new Stroke({
          color: 'rgba(255,255,255,0.5)',
          width: 1.5,
        });

  const graticule = new GraticuleLayer({
    strokeStyle,
    latLabelStyle: latLonLabelStyle,
    lonLabelStyle: latLonLabelStyle,
    intervals: [90, 45, 30, 20, 10, 5, 2],
    targetSize: 200,
    showLabels: true,
    wrapX: models.mapOptions.wrapX,
    lonLabelPosition: 0.9,
    latLabelPosition: 0.95,
    lonLabelFormatter: lonFormatter,
    latLabelFormatter: latFormatter,
    extent: proj.transformExtent(
      [-Number.MAX_VALUE, -90, Number.MAX_VALUE, 90],
      'EPSG:4326',
      projection.epsg,
    ),
    maxLines: 10,
  });

  graticule.set('ol_uid', '100');

  const view = new View({
    // Default camera: China
    center: proj.fromLonLat([104, 36]),
    projection: projection.epsg,
    zoom: 4,
    minZoom: 3,
    maxZoom: 19,
    extent: proj.transformExtent(
      [-Number.MAX_VALUE, -90, Number.MAX_VALUE, 90],
      'EPSG:4326',
      projection.epsg,
    ),
  });

  return new MapView(projection, view, layer, graticule);
}

export function equatorial(): MapView {
  return equatorialView('img');
}

export function equatorialStreet(): MapView {
  return equatorialView('vec');
}
