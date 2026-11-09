import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';

import { AppState } from '@store';
import * as filterStore from '@store/filters';
import * as services from '@services';

import { ADMIN_REGIONS, AdminRegion } from './admin-regions.data';

@Component({
  selector: 'app-admin-region-dialog',
  templateUrl: './admin-region-dialog.component.html',
  styleUrls: ['./admin-region-dialog.component.scss'],
  imports: [
    FormsModule,
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatIcon,
    TranslateModule,
  ],
})
export class AdminRegionDialogComponent {
  private dialogRef = inject<MatDialogRef<AdminRegionDialogComponent>>(
    MatDialogRef,
  );
  private store$ = inject<Store<AppState>>(Store);
  private mapService = inject(services.MapService);

  public searchText = '';
  public selected: string = null;
  public drillStack: AdminRegion[] = [];

  private selectedCenter: [number, number] = null;
  private selectedZoom: number = null;

  public get currentList(): AdminRegion[] {
    const top = this.drillStack[this.drillStack.length - 1];
    return top ? (top.children ?? []) : ADMIN_REGIONS;
  }

  public get visibleItems(): AdminRegion[] {
    const q = this.searchText.trim();
    return q
      ? this.currentList.filter((it) => it.name.includes(q))
      : this.currentList;
  }

  public onSelect(item: AdminRegion): void {
    this.selected = item.name;

    const parentCenter = [...this.drillStack]
      .reverse()
      .find((p) => p.center)?.center;
    this.selectedCenter = item.center ?? parentCenter ?? null;

    const depth = this.drillStack.length;
    this.selectedZoom = item.children?.length
      ? depth === 0
        ? 6
        : 9
      : depth === 0
        ? 10
        : 11;
  }

  public onDrill(item: AdminRegion, event: Event): void {
    event.stopPropagation();
    if (item.children?.length) {
      this.drillStack = [...this.drillStack, item];
      this.searchText = '';
    }
  }

  public onBack(): void {
    this.drillStack = this.drillStack.slice(0, -1);
    this.searchText = '';
  }

  public onClose(): void {
    this.dialogRef.close();
  }

  public onConfirm(): void {
    if (this.selected) {
      this.store$.dispatch(new filterStore.SetGeocode(this.selected));
      this.store$.dispatch(new filterStore.SetGeocodeCenter(this.selectedCenter));

      if (this.selectedCenter) {
        const [lon, lat] = this.selectedCenter;
        this.mapService.setCenter({ lon, lat });
        if (this.selectedZoom) {
          this.mapService.setZoom(this.selectedZoom);
        }
      }
    }
    this.dialogRef.close(this.selected);
  }
}
