import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { LOCAL_ACCOUNT, setLocalPassword } from '../auth.constants';

export type AccountDialogMode = 'reset' | 'apply';

export interface AccountDialogData {
  mode: AccountDialogMode;
  email?: string;
}

@Component({
  selector: 'app-account-dialog',
  templateUrl: './account-dialog.component.html',
  styleUrls: ['./account-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatIcon],
})
export class AccountDialogComponent {
  public readonly data = inject<AccountDialogData>(MAT_DIALOG_DATA, {
    optional: true,
  });
  private readonly dialogRef = inject(MatDialogRef<AccountDialogComponent>);

  public email = this.data?.email ?? '';
  public newPassword = '';
  public confirmPassword = '';
  public name = '';
  public organization = '';
  public purpose = '';
  public error = signal('');
  public done = signal(false);

  public get isReset(): boolean {
    return this.data?.mode === 'reset';
  }

  public close(): void {
    this.dialogRef.close();
  }

  public onSubmit(): void {
    if (this.isReset) {
      this.submitReset();
      return;
    }

    this.submitApply();
  }

  public submitReset(): void {
    const email = this.email.trim().toLowerCase();
    const newPassword = this.newPassword.trim();

    if (!email || !newPassword) {
      this.error.set('请填写账号和新密码');
      return;
    }

    if (email !== LOCAL_ACCOUNT.email) {
      this.error.set('该账号未注册，请核对后重试');
      return;
    }

    if (newPassword.length < 6) {
      this.error.set('新密码至少 6 位');
      return;
    }

    if (newPassword !== this.confirmPassword.trim()) {
      this.error.set('两次输入的密码不一致');
      return;
    }

    setLocalPassword(newPassword);
    this.error.set('');
    this.done.set(true);
  }

  public submitApply(): void {
    const name = this.name.trim();
    const organization = this.organization.trim();
    const email = this.email.trim();

    if (!name || !organization || !email) {
      this.error.set('请填写姓名、单位和联系邮箱');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.error.set('请输入有效的联系邮箱');
      return;
    }

    this.error.set('');
    this.done.set(true);
  }

  public finish(): void {
    this.dialogRef.close(this.isReset);
  }
}
