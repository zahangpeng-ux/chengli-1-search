import { AsyncPipe } from '@angular/common';
import { Component, EventEmitter, Output, computed, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { NotificationService } from '@services';
import * as queueStore from '@store/queue';

type StatsTab = 'status' | 'satellite' | 'sensor';

@Component({
  selector: 'app-user-center',
  templateUrl: './user-center.component.html',
  styleUrls: ['./user-center.component.scss'],
  imports: [AsyncPipe, MatIcon, TranslateModule],
})
export class UserCenterComponent {
  @Output() closed = new EventEmitter<void>();

  private store$ = inject(Store);
  private notificationService = inject(NotificationService);

  private queuedProducts = this.store$.selectSignal(queueStore.getQueuedProducts);
  private queuedJobs = this.store$.selectSignal(queueStore.getQueuedJobs);
  private downloads = this.store$.selectSignal(queueStore.getDownloads);

  public unreadCount$ = this.notificationService.notifications$.pipe(
    map((notifications) => notifications.filter((item) => !item.read).length),
  );

  public queuedProductsCount = computed(
    () => ((this.queuedProducts() as unknown[]) || []).length,
  );
  public queuedJobsCount = computed(() => ((this.queuedJobs() as unknown[]) || []).length);
  public archivedCount = computed(
    () => Object.keys((this.downloads() || {}) as Record<string, unknown>).length,
  );
  public completedCount = computed(
    () =>
      Object.values((this.downloads() || {}) as Record<string, { state?: string }>).filter(
        (download) => download?.state === 'DONE',
      ).length,
  );

  public activeTab = signal<StatsTab>('status');

  public onClose(): void {
    this.closed.emit();
  }
}
