import { Component, computed, inject } from '@angular/core';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatList, MatListItem } from '@angular/material/list';
import { TranslateModule } from '@ngx-translate/core';
import { Store } from '@ngrx/store';

import { AppState } from '@store';
import * as queueStore from '@store/queue';
import * as uiStore from '@store/ui';

interface DownloadEntry {
  id: string;
  filename: string;
  state: string;
}

@Component({
  selector: 'app-downloads-dialog',
  templateUrl: './downloads-dialog.component.html',
  styleUrls: ['./downloads-dialog.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatIcon,
    MatButton,
    MatList,
    MatListItem,
    TranslateModule,
    CdkDrag,
    CdkDragHandle,
  ],
})
export class DownloadsDialogComponent {
  private dialogRef = inject<MatDialogRef<DownloadsDialogComponent>>(
    MatDialogRef,
  );
  private store$ = inject<Store<AppState>>(Store);

  private downloadsMap = this.store$.selectSignal(queueStore.getDownloads);

  public downloadsList = computed<DownloadEntry[]>(() => {
    const map = this.downloadsMap() || {};
    return Object.entries(map).map(([id, v]) => ({
      id,
      filename: (v as any).filename || id,
      state: (v as any).state || '',
    }));
  });

  public downloadCount = computed(() => this.downloadsList().length);

  public onClose(): void {
    this.dialogRef.close();
  }

  public onOpenCart(): void {
    this.dialogRef.close();
    this.store$.dispatch(new uiStore.SetIsDownloadQueueOpen(true));
  }
}
