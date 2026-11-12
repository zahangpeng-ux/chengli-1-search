import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';

import * as services from '@services';
import { AppState } from '@store';
import { DrawNewPolygon } from '@store/map';

export interface SavedAOI {
  id: string;
  name: string;
  wkt: string;
  createdAt: number;
}

const STORAGE_KEY = 'chengli1_saved_aoi';

@Component({
  selector: 'app-my-aoi-dialog',
  templateUrl: './my-aoi-dialog.component.html',
  styleUrls: ['./my-aoi-dialog.component.scss'],
  imports: [
    FormsModule,
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatIcon,
    MatTooltip,
    TranslateModule,
  ],
})
export class MyAoiDialogComponent implements OnInit {
  private dialogRef = inject<MatDialogRef<MyAoiDialogComponent>>(MatDialogRef);
  private mapService = inject(services.MapService);
  private wktService = inject(services.WktService);
  private store$ = inject<Store<AppState>>(Store);
  private notificationService = inject(services.NotificationService);
  private language = inject(services.AsfLanguageService);

  public items: SavedAOI[] = [];

  public ngOnInit(): void {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.items = JSON.parse(raw) as SavedAOI[];
      }
    } catch {
      this.items = [];
    }
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
  }

  public onClose(): void {
    this.dialogRef.close();
  }

  public onUse(item: SavedAOI): void {
    const ok = this.mapService.loadPolygonFrom(item.wkt);
    if (!ok) {
      this.notificationService.error(
        this.language.translate.instant('INVALID_AOI_DATA'),
      );
      return;
    }
    const feature = this.wktService.wktToFeature(item.wkt, this.mapService.epsg());
    if (feature) {
      this.mapService.zoomToFeature(feature);
    }
    this.store$.dispatch(new DrawNewPolygon());
    this.notificationService.info(
      this.language.translate.instant('AOI_APPLIED', { name: item.name }),
    );
    this.dialogRef.close(item);
  }

  public onDelete(item: SavedAOI, event: Event): void {
    event.stopPropagation();
    this.items = this.items.filter((i) => i.id !== item.id);
    this.persist();
    this.notificationService.info(
      this.language.translate.instant('AOI_DELETED'),
    );
  }

  public formatDate(ts: number): string {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
