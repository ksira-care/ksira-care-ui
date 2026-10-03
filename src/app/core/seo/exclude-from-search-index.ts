import { DestroyRef, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';

/**
 * Adds `<meta name="robots" content="noindex">` while the calling component
 * is alive. Call from a component's injection context.
 */
export function excludeFromSearchIndex(): void {
  const meta = inject(Meta);
  const tag = meta.addTag({ name: 'robots', content: 'noindex, nofollow' });
  inject(DestroyRef).onDestroy(() => {
    if (tag) meta.removeTagElement(tag);
  });
}
