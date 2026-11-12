import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';

import { AdminRegionDialogComponent } from '@components/header/dataset-header/admin-region-dialog/admin-region-dialog.component';
import { AoiFilterDialogComponent } from '@components/header/dataset-header/aoi-filter-dialog/aoi-filter-dialog.component';
import { CoordinateInputDialogComponent } from '@components/header/dataset-header/coordinate-input-dialog/coordinate-input-dialog.component';
import { InfoBarComponent } from '@components/header/info-bar/info-bar.component';
import { MyAoiDialogComponent } from '@components/header/dataset-header/my-aoi-dialog/my-aoi-dialog.component';
import { SearchButtonComponent } from '@components/shared/search-button/search-button.component';
import { DatasetSelectorComponent } from '@components/shared/selectors/dataset-selector/dataset-selector.component';
import { DateSelectorComponent } from '@components/shared/selectors/date-selector/date-selector.component';
import * as models from '@models';
import * as services from '@services';
import { AppState } from '@store';
import * as filterStore from '@store/filters';
import * as mapStore from '@store/map';
import * as uiStore from '@store/ui';

@Component({
  selector: 'app-dataset-header',
  templateUrl: './dataset-header.component.html',
  styleUrls: ['./dataset-header.component.scss', '../header.component.scss'],
  imports: [
    AsyncPipe,
    TranslateModule,
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatSlider,
    MatSliderThumb,
    DatasetSelectorComponent,
    DateSelectorComponent,
    SearchButtonComponent,
    InfoBarComponent,
  ],
})
export class DatasetHeaderComponent {
  private store$ = inject<Store<AppState>>(Store);
  private screenSize = inject(services.ScreenSizeService);
  private mapService = inject(services.MapService);
  private dialog = inject(MatDialog);

  public datasets = models.datasetList;
  public breakpoint$ = this.screenSize.breakpoint$;
  public breakpoints = models.Breakpoints;
  public dataset = this.store$.selectSignal(filterStore.getSelectedDataset);
  public drawModes = models.MapDrawModeType;
  public sceneIds = this.store$.selectSignal(filterStore.getSearchList);

  public activeTab: 'condition' | 'precise' = 'condition';
  public activeQuickRange: number = null;
  public cloudCover = 20;
  public sideLookAngle = 30;
  public resolution = 1;

  public quickRanges = [
    { days: 7, key: 'PAST_WEEK' },
    { days: 30, key: 'PAST_MONTH' },
    { days: 90, key: 'PAST_3_MONTHS' },
    { days: 182, key: 'PAST_6_MONTHS' },
    { days: 365, key: 'PAST_YEAR' },
  ];

  public onDatasetChange(dataset: string): void {
    this.store$.dispatch(new filterStore.SetSelectedDataset(dataset));
  }

  public onToggleAoiOptions(): void {
    // 旧入口保留给 aoi-filter 内部的下箭头
    this.store$.dispatch(new uiStore.ToggleAOIOptions());
  }

  public onDrawMode(mode: models.MapDrawModeType): void {
    this.store$.dispatch(new mapStore.SetMapDrawMode(mode));
    this.store$.dispatch(
      new mapStore.SetMapInteractionMode(models.MapInteractionModeType.DRAW),
    );
    this.store$.dispatch(new uiStore.CloseAOIOptions());
  }

  public onCoordinateInput(): void {
    this.dialog.open(CoordinateInputDialogComponent, {
      width: '520px',
      maxWidth: '92vw',
      maxHeight: '90vh',
      panelClass: 'coordinate-dialog',
    });
  }

  public onUploadFile(): void {
    this.dialog.open(AoiFilterDialogComponent, {
      width: '560px',
      maxWidth: '92vw',
      height: 'auto',
      maxHeight: '90vh',
      panelClass: 'aoi-filter-dialog',
    });
  }

  public onMyAOI(): void {
    this.dialog.open(MyAoiDialogComponent, {
      width: '520px',
      maxWidth: '92vw',
    });
  }

  public onOpenAdminRegion(): void {
    this.dialog.open(AdminRegionDialogComponent, {
      width: '520px',
      maxWidth: '92vw',
    });
  }

  public onQuickRange(days: number): void {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - days);

    this.store$.dispatch(new filterStore.SetEndDate(end));
    this.store$.dispatch(new filterStore.SetStartDate(start));
    this.activeQuickRange = days;
  }

  public onReset(): void {
    this.store$.dispatch(new filterStore.ClearDatasetFilters());
    this.store$.dispatch(new uiStore.CloseAOIOptions());
    this.store$.dispatch(new filterStore.SetGeocode(''));
    this.store$.dispatch(new filterStore.SetGeocodeCenter(null));
    this.store$.dispatch(new filterStore.SetSearchList([]));
    this.mapService.clearDrawLayer();
    this.activeQuickRange = null;
  }

  public onTabChange(tab: 'condition' | 'precise'): void {
    this.activeTab = tab;
  }

  public onSceneIdsChange(event: Event): void {
    const raw = (event.target as HTMLInputElement).value ?? '';
    const list = raw
      .split(/[,，\s\n;；]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    this.store$.dispatch(new filterStore.SetSearchList(list));
  }

  public onCloudCoverChange(event: Event): void {
    this.cloudCover = Number((event.target as HTMLInputElement).value);
  }

  public onSideLookAngleChange(event: Event): void {
    this.sideLookAngle = Number((event.target as HTMLInputElement).value);
  }

  public onResolutionChange(event: Event): void {
    this.resolution = Number((event.target as HTMLInputElement).value);
  }
}
