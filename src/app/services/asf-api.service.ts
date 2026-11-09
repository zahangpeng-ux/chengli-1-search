import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';

import GeoJSON from 'ol/format/GeoJSON';
import KML from 'ol/format/KML';
import { WKT } from 'ol/format';
import Geometry from 'ol/geom/Geometry';

import { MissionDataset } from '@models';

import { EnvironmentService } from './environment.service';

@Injectable({
  providedIn: 'root',
})
export class AsfApiService {
  private env = inject(EnvironmentService);

  public get apiUrl() {
    return this.env.currentEnv.api;
  }

  public health(): Observable<any> {
    return of({ ASFSearchAPI: { ok: true }, CMRSearchAPI: {} });
  }

  public collections(): string[] {
    return [];
  }

  public query<T>(
    stateParamsObj: Record<string, string | number | null>,
  ): Observable<T> {
    const output = stateParamsObj?.['output'];

    if (output === 'COUNT') {
      return of(0 as unknown as T);
    }

    return of({ results: [] } as unknown as T);
  }

  public miniQuery(_queryParams): Observable<any[]> {
    return of([]);
  }

  public getNisarOrbitEphemera(): Observable<any[]> {
    return of([]);
  }

  public queryUrlFrom(_stateParamsObj, _options?: { apiUrl: string }): string {
    return '';
  }

  public loadMissions$: Observable<Record<string, string[]>> = of({});

  public missionSearch(
    _dataset: MissionDataset,
  ): Observable<{ result: string[] }> {
    return of({ result: [] });
  }

  public upload(files: Set<File>): Observable<any> {
    if (!files || files.size === 0) {
      return of({});
    }

    const file = Array.from(files)[0];
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

    // shp/zip 形状文件需要后端或 shpjs 库解析，客户端暂不支持
    if (ext === 'zip' || ext === 'shp') {
      return of({
        errors: [
          {
            report:
              '成理一号本地暂不支持 .zip/.shp 导入，请使用 .geojson 或 .kml',
            type: '导入提示',
          },
        ],
      });
    }

    const reader = new FileReader();

    return new Observable((subscriber) => {
      reader.onload = () => {
        try {
          const text = reader.result as string;
          const format =
            ext === 'kml'
              ? new KML()
              : ext === 'geojson' || ext === 'json'
                ? new GeoJSON()
                : null;

          if (!format) {
            subscriber.next({
              errors: [
                {
                  report: `不支持的文件格式: ${ext}`,
                  type: '导入提示',
                },
              ],
            });
            subscriber.complete();
            return;
          }

          const features = format.readFeatures(text, {
            featureProjection: 'EPSG:4326',
            dataProjection: 'EPSG:4326',
          });

          if (!features || features.length === 0) {
            subscriber.next({
              errors: [
                {
                  report: '文件中未解析到几何要素',
                  type: '导入提示',
                },
              ],
            });
            subscriber.complete();
            return;
          }

          // 取第一个 feature 的 geometry
          const geometry: Geometry = features[0].getGeometry();
          if (!geometry) {
            subscriber.next({
              errors: [
                {
                  report: '文件要素缺少几何信息',
                  type: '导入提示',
                },
              ],
            });
            subscriber.complete();
            return;
          }

          const wktFormat = new WKT();
          const wkt = wktFormat.writeGeometry(geometry, {
            dataProjection: 'EPSG:4326',
          });
          subscriber.next({ wkt: { unwrapped: wkt } });
        } catch (err) {
          subscriber.next({
            errors: [
              {
                report: `文件解析失败: ${err.message ?? err}`,
                type: '导入提示',
              },
            ],
          });
        }
        subscriber.complete();
      };
      reader.onerror = () => {
        subscriber.next({
          errors: [
            {
              report: '读取文件失败',
              type: '导入提示',
            },
          ],
        });
        subscriber.complete();
      };
      reader.readAsText(file);
    });
  }

  public validate(_wkt: string): Observable<any> {
    return of({ valid: true });
  }
}
