import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section not-found" aria-labelledby="not-found-heading">
      <div class="container">
        <span class="not-found__code" aria-hidden="true">404</span>
        <h1 id="not-found-heading" class="not-found__title">
          Page not found.
        </h1>
        <p class="not-found__body">
          The page you're looking for doesn't exist or has moved.
        </p>
        <a routerLink="/" class="btn btn-primary" style="margin-top: 2rem">
          Back to home
        </a>
      </div>
    </section>
  `,
  styles: `
    .not-found {
      text-align: center;
      padding-block: 6rem;
    }

    .not-found__code {
      display: block;
      font-family: var(--font-serif);
      font-size: 6rem;
      color: var(--color-border);
      line-height: 1;
      margin-bottom: var(--space-md);
    }

    .not-found__title {
      font-size: 2rem;
      color: var(--color-text);
      margin-bottom: var(--space-md);
    }

    .not-found__body {
      font-size: 1.0625rem;
      color: var(--color-text-muted);
    }
  `,
})
export class NotFoundComponent {}
