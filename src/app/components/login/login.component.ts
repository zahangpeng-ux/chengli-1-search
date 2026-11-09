import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';

import { AccountDialogComponent } from './account-dialog/account-dialog.component';
import {
  AUTH_STORAGE_KEY,
  LOCAL_ACCOUNT,
  SESSION_DAYS,
  getLocalPassword,
} from './auth.constants';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatIcon],
})
export class LoginComponent {
  @Output() public onSuccess = new EventEmitter<string>();

  private dialog = inject(MatDialog);

  public email = '';
  public password = '';
  public showPassword = false;
  public error = signal('');
  public info = signal('');
  public submitting = signal(false);

  public togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  public onResetPassword(): void {
    this.dialog
      .open(AccountDialogComponent, {
        data: { mode: 'reset', email: this.email.trim() },
        width: '420px',
        panelClass: 'chengli-account-dialog',
        autoFocus: false,
        restoreFocus: false,
      })
      .afterClosed()
      .subscribe((reset: boolean) => {
        if (!reset) {
          return;
        }

        this.password = '';
        this.error.set('');
        this.info.set('密码已重置，请使用新密码登录');
      });
  }

  public onApplyAccount(): void {
    this.dialog.open(AccountDialogComponent, {
      data: { mode: 'apply', email: this.email.trim() },
      width: '420px',
      panelClass: 'chengli-account-dialog',
      autoFocus: false,
      restoreFocus: false,
    });
  }

  public onSubmit(): void {
    const email = this.email.trim().toLowerCase();
    const password = this.password.trim();

    if (!email || !password) {
      this.error.set('请输入账号和密码');
      return;
    }

    this.error.set('');
    this.info.set('');
    this.submitting.set(true);

    // 模拟一次校验请求，接入后端后替换为真实登录接口
    setTimeout(() => {
      this.submitting.set(false);

      if (email !== LOCAL_ACCOUNT.email || password !== getLocalPassword()) {
        this.error.set('账号或密码不正确，请重新输入');
        return;
      }

      const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ email: LOCAL_ACCOUNT.email, expiresAt }),
      );

      this.onSuccess.emit(LOCAL_ACCOUNT.email);
    }, 350);
  }
}
