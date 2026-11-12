import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ActiveToast, IndividualConfig, ToastrService } from 'ngx-toastr';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

import { SearchRedirect } from '@models';
import { AppState } from '@store';
import * as uiStore from '@store/ui';

import { SearchService } from './search.service';

export interface AppNotification {
  id: number;
  title: string;
  content: string;
  date: Date;
  read: boolean;
}

/** 平台公告（后续可替换为后端接口数据源） */
const PLATFORM_ANNOUNCEMENTS: AppNotification[] = [
  {
    id: 3,
    title: '平台维护公告',
    content:
      '平台将于近期进行系统升级维护，届时数据检索与下载服务可能出现短暂中断，请提前安排相关工作。',
    date: new Date('2026-11-10T09:00:00'),
    read: false,
  },
  {
    id: 2,
    title: '数据更新公告',
    content:
      '成理一号卫星最新一期 SAR 数据已完成入库，覆盖区域与成像模式有所扩展，欢迎检索使用。',
    date: new Date('2026-11-05T14:30:00'),
    read: false,
  },
  {
    id: 1,
    title: '平台上线公告',
    content:
      '成理一号卫星数据搜索平台正式上线，支持按区域、时间等条件检索 SAR 数据，欢迎体验并反馈意见。',
    date: new Date('2026-10-28T10:00:00'),
    read: true,
  },
];

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private toastr = inject(ToastrService);
  private store$ = inject<Store<AppState>>(Store);
  private translateService = inject(TranslateService);
  private searchService = inject(SearchService);
  private shownSignupMessage = false;

  // Custom toastr config example, toastClass styling in styles.scss
  private toastOptions: Partial<IndividualConfig> = {
    // toastClass: 'pinkToast',
    // toastComponent: ToastrMessageComponent
  };

  public demandQueue(
    added = true,
    count = 0,
    job_type: string,
    duplicates = 0,
    application_status = '',
  ) {
    let headerText: string;
    let infoText = '';
    count -= duplicates;
    if (count <= 0) {
      if (duplicates > 1) {
        this.error(
          this.translateService.instant('JOBS_WERE_DUPLICATES'),
          this.translateService.instant('DUPLICATE_JOBS'),
        );
      } else {
        this.error(
          this.translateService.instant('JOB_WAS_DUPLICATE'),
          this.translateService.instant('DUPLICATE_JOB'),
        );
      }
      return;
    }
    if (count > 1) {
      headerText = added
        ? this.translateService.instant('JOBS_ADDED_TO_QUEUE')
        : this.translateService.instant('JOBS_REMOVED_FROM_QUEUE');
      infoText = this.translateService.instant(
        'JOBS_ADDED_TO_ON_DEMAND_QUEUE',
        {
          count,
          jobType: job_type === '' ? '' : job_type + ' ',
        },
      );
      if (duplicates && added) {
        infoText +=
          ' ' +
          this.translateService.instant('DUPLICATE_JOBS_NOT_ADDED', {
            count: duplicates,
            jobWord:
              duplicates > 1
                ? this.translateService.instant('JOBS').toLowerCase()
                : this.translateService.instant('JOB'),
          });
      }

      this.info(infoText, headerText);
    } else {
      infoText = this.translateService.instant('JOB_ADDED_TO_ON_DEMAND_QUEUE', {
        jobType: job_type === '' ? '' : job_type + ' ',
      });

      this.info(
        infoText,
        added
          ? this.translateService.instant('JOB_ADDED_TO_QUEUE')
          : this.translateService.instant('JOB_REMOVED_FROM_QUEUE'),
      );
    }
    if (application_status === 'NOT_STARTED' && !this.shownSignupMessage) {
      this.shownSignupMessage = true;
      this.error(
        this.translateService.instant('CLICK_TO_OPEN_REGISTRATION'),
        this.translateService.instant('NOT_REGISTERED_WITH_ON_DEMAND'),
        {
          disableTimeOut: true,
          closeButton: true,
        },
      ).onTap.subscribe(() => {
        this.store$.dispatch(new uiStore.SetIsOnDemandQueueOpen(true));
      });
    }
  }

  public downloadQueue(added = true, count = 0) {
    let headerText: string;
    let infoText = '';

    if (count > 1) {
      headerText = this.translateService.instant('SCENES_ADDED');
      infoText = added
        ? this.translateService.instant('SCENES_ADDED_TO_DOWNLOAD_QUEUE', {
            count,
          })
        : this.translateService.instant('SCENES_REMOVED_FROM_DOWNLOAD_QUEUE', {
            count,
          });
      this.info(infoText, headerText);
    } else {
      infoText = added
        ? this.translateService.instant('SCENE_ADDED_TO_DOWNLOAD_QUEUE')
        : this.translateService.instant('SCENE_REMOVED_FROM_DOWNLOAD_QUEUE');
      this.info(infoText);
    }
  }

  public clipboardSearchLink() {
    this.info(this.translateService.instant('SEARCH_LINK_COPIED'));
  }

  public clipboardAPIURL() {
    this.info(this.translateService.instant('API_URL_COPIED'));
  }

  public clipboardCopyQueue(lineCount: number, isFileIDs: boolean) {
    const contentType = isFileIDs
      ? this.translateService.instant('FILE_ID')
      : this.translateService.instant('URL');
    const copied = this.translateService.instant('COPIED');

    this.info(
      `${lineCount} ${contentType}${lineCount > 1 ? 's' : ''} ${copied}`,
      this.translateService.instant('CLIPBOARD_UPDATED'),
    );
  }

  public clipboardCopyIcon(prompt: string, count: number) {
    let contentType = prompt.includes('ID')
      ? this.translateService.instant('FILE_ID')
      : this.translateService.instant('SCENE_NAME');
    if (prompt.toLocaleLowerCase().includes('event')) {
      contentType = contentType.replace(
        this.translateService.instant('FILE'),
        this.translateService.instant('EVENT'),
      );
    }
    const copied = this.translateService.instant('COPIED');

    let headerText: string;
    let infoText: string;

    if (count > 1) {
      headerText = `${contentType}s ${copied}`;
      infoText = `${count} ${contentType}s ${copied.toLowerCase()}`;

      this.info(infoText, headerText);
    } else {
      infoText = `${contentType} ${copied}`;

      this.info(infoText);
    }
  }

  public linkCopyIcon(prompt: string, count: number) {
    const contentType = prompt.includes('S3')
      ? this.translateService.instant('S3_URL')
      : this.translateService.instant('DOWNLOAD_URL');
    const copied = this.translateService.instant('COPIED');

    let headerText: string;
    let infoText: string;

    if (count > 1) {
      headerText = `${contentType}s ${copied}`;
      infoText = `${count} ${contentType}s ${copied.toLowerCase()}`;

      this.info(infoText, headerText);
    } else {
      infoText = `${contentType} ${copied}`;

      this.info(infoText);
    }
  }

  public closeFiltersPanel() {
    this.info(this.translateService.instant('FILTERS_DISMISSED_NOT_APPLIED'));
  }

  public rawDataHidden() {
    const title = this.translateService.instant('HIDING_RAW_RESULTS');
    const message = this.translateService.instant('CLICK_TO_SHOW_RAW_RESULTS');

    const toast = this.info(message, title);
    toast.onTap
      .pipe(take(1))
      .subscribe((_) => this.store$.dispatch(new uiStore.ShowS1RawData()));
  }

  public listImportFailed(fileExtension: string) {
    const title = this.translateService.instant('LIST_IMPORT_FAILED', {
      extension: fileExtension,
    });
    const message = this.translateService.instant('CHENGLI_1_DOCS_BUILDING');
    this.error(message, title);
  }

  public redirectTo(message_key: string, searchRedirectInfo: SearchRedirect) {
    const title = this.translateService.instant('SEARCH_TYPE_NOTICE');
    const message = this.translateService.instant(message_key);
    const errorToast = this.error(message, title, {
      disableTimeOut: true,
      closeButton: true,
    });
    errorToast.onTap.pipe(take(1)).subscribe((_) => {
      this.searchService.redirectSearch(searchRedirectInfo);
    });
  }

  public info(
    message: string,
    title = '',
    options: Partial<IndividualConfig> = {},
  ): ActiveToast<any> {
    return this.toastr.info(message, title, {
      ...options,
      ...this.toastOptions,
    });
  }

  public error(
    message: string,
    title = '',
    options: Partial<IndividualConfig> = {},
  ): ActiveToast<any> {
    // Intentionally uses warning() instead of error() to avoid bright red toast
    // which was deemed too visually jarring for the UX
    return this.toastr.warning(message, title, {
      ...options,
      ...this.toastOptions,
    });
  }

  /** 消息中心：平台公告（来自运营方发布，非系统运行提示） */
  private notifications = new BehaviorSubject<AppNotification[]>(
    PLATFORM_ANNOUNCEMENTS,
  );
  public notifications$ = this.notifications.asObservable();

  public markAllNotificationsRead(): void {
    this.notifications.next(
      this.notifications.getValue().map((n) => ({ ...n, read: true })),
    );
  }
}
