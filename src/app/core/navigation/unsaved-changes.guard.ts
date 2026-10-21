import { CanDeactivateFn } from '@angular/router';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/** Asks before leaving a page with unsaved edits, so work isn't lost by a stray click. */
export const confirmLeavingUnsavedChanges: CanDeactivateFn<HasUnsavedChanges> = (page) =>
  !page.hasUnsavedChanges() || window.confirm('You have unsaved changes. Leave without saving?');
