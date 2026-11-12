import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';

import * as services from '@services';
import { AppState } from '@store';
import { DrawNewPolygon } from '@store/map';

type InputMode = 'bbox' | 'wkt' | 'center';

@Component({
  selector: 'app-coordinate-input-dialog',
  templateUrl: './coordinate-input-dialog.component.html',
  styleUrls: ['./coordinate-input-dialog.component.scss'],
  imports: [
    FormsModule,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatIcon,
    TranslateModule,
  ],
})
export class CoordinateInputDialogComponent {
  private dialogRef = inject<MatDialogRef<CoordinateInputDialogComponent>>(
    MatDialogRef,
  );
  private mapService = inject(services.MapService);
  private wktService = inject(services.WktService);
  private store$ = inject<Store<AppState>>(Store);
  private notificationService = inject(services.NotificationService);
  private language = inject(services.AsfLanguageService);

  public mode: InputMode = 'bbox';

  public wktText = '';

  public minLon: number | null = null;
  public maxLon: number | null = null;
  public minLat: number | null = null;
  public maxLat: number | null = null;

  public centerLon: number | null = null;
  public centerLat: number | null = null;
  public centerWidth: number | null = 5;
  public centerHeight: number | null = 5;

  public errorMessage = '';

  public setMode(mode: InputMode): void {
    this.mode = mode;
    this.errorMessage = '';
  }

  public onClose(): void {
    this.dialogRef.close();
  }

  public onConfirm(): void {
    this.errorMessage = '';
    if (this.mode === 'bbox') {
      this.applyBoundingBox();
    } else if (this.mode === 'wkt') {
      this.applyWkt();
    } else {
      this.applyCenterPoint();
    }
  }

  private applyBoundingBox(): void {
    const values = [this.minLon, this.maxLon, this.minLat, this.maxLat];
    if (values.some((v) => v === null || v === undefined || isNaN(Number(v)))) {
      this.errorMessage = this.language.translate.instant('BOUNDS_REQUIRED');
      return;
    }

    const minX = Number(this.minLon);
    const maxX = Number(this.maxLon);
    const minY = Number(this.minLat);
    const maxY = Number(this.maxLat);

    if (minX >= maxX || minY >= maxY) {
      this.errorMessage = this.language.translate.instant('INVALID_BOUNDS');
      return;
    }

    const wkt = `POLYGON((${minX} ${minY}, ${maxX} ${minY}, ${maxX} ${maxY}, ${minX} ${maxY}, ${minX} ${minY}))`;
    this.loadPolygonAndClose(wkt);
  }

  private applyWkt(): void {
    const wkt = this.wktText.trim();
    if (!wkt) {
      this.errorMessage =
        'WKT ' + this.language.translate.instant('IS_REQUIRED');
      return;
    }
    this.loadPolygonAndClose(wkt);
  }

  private applyCenterPoint(): void {
    const lon = Number(this.centerLon);
    const lat = Number(this.centerLat);
    const width = Number(this.centerWidth);
    const height = Number(this.centerHeight);

    if (
      this.centerLon === null ||
      this.centerLon === undefined ||
      isNaN(lon) ||
      this.centerLat === null ||
      this.centerLat === undefined ||
      isNaN(lat)
    ) {
      this.errorMessage = this.language.translate.instant('CENTER_REQUIRED');
      return;
    }

    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
      this.errorMessage = this.language.translate.instant('INVALID_BOX_SIZE');
      return;
    }

    // 以中心点 + 宽高（km）构造范围框
    const dLat = height / 2 / 111.32;
    const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 1e-6);
    const dLon = width / 2 / (111.32 * cosLat);

    const minX = lon - dLon;
    const maxX = lon + dLon;
    const minY = lat - dLat;
    const maxY = lat + dLat;

    const wkt = `POLYGON((${minX} ${minY}, ${maxX} ${minY}, ${maxX} ${maxY}, ${minX} ${maxY}, ${minX} ${minY}))`;
    this.loadPolygonAndClose(wkt);
  }

  private loadPolygonAndClose(wkt: string): void {
    const ok = this.mapService.loadPolygonFrom(wkt);
    if (!ok) {
      this.errorMessage = this.language.translate.instant('INVALID_WKT');
      return;
    }

    const feature = this.wktService.wktToFeature(wkt, this.mapService.epsg());
    if (feature) {
      this.mapService.zoomToFeature(feature);
    }

    this.store$.dispatch(new DrawNewPolygon());
    this.notificationService.info(
      this.language.translate.instant('COORDINATE_IMPORTED'),
    );
    this.dialogRef.close();
  }
}
