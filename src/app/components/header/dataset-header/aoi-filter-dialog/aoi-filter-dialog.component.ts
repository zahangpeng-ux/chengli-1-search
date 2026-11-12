import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { AoiOptionsComponent } from '@components/shared/aoi-options/aoi-options.component';

@Component({
  selector: 'app-aoi-filter-dialog',
  templateUrl: './aoi-filter-dialog.component.html',
  styleUrls: ['./aoi-filter-dialog.component.scss'],
  imports: [
    AoiOptionsComponent,
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    TranslateModule,
  ],
})
export class AoiFilterDialogComponent {
  private dialogRef = inject<MatDialogRef<AoiFilterDialogComponent>>(MatDialogRef);

  public onClose(): void {
    this.dialogRef.close();
  }
}
