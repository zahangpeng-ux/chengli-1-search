import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { map } from 'rxjs/operators';

import { NotificationService } from '@services';

@Component({
  selector: 'app-notification-center',
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.scss'],
  imports: [
    AsyncPipe,
    DatePipe,
    MatIcon,
    TranslateModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    CdkDrag,
    CdkDragHandle,
  ],
})
export class NotificationCenterComponent {
  private notificationService = inject(NotificationService);
  private dialogRef = inject<MatDialogRef<NotificationCenterComponent>>(MatDialogRef);

  public notifications$ = this.notificationService.notifications$;
  public unreadCount$ = this.notifications$.pipe(
    map((notifications) => notifications.filter((n) => !n.read).length),
  );

  constructor() {
    // 打开 dialog 时全部标记已读
    this.notificationService.markAllNotificationsRead();
  }

  public onClose(): void {
    this.dialogRef.close();
  }
}
