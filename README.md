# KsiraWellnessApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.0.0.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Deployment

The site is a **Render static site** (`ksira-care-ui`) serving `ksiracare.com`; it redeploys on
every push to `main`. Its settings live in the Render dashboard:

| Setting | Value |
|---------|-------|
| Build command | `npm ci && npm run build` |
| Publish directory | `dist/ksira-wellness-app/browser` |
| Environment | `NODE_VERSION=22` |

Redirects/Rewrites, in this order (the first match wins):

| Source | Destination | Action |
|--------|-------------|--------|
| `/api/*` | `https://ksira-care-backend.onrender.com/api/*` | Rewrite |
| `/*` | `/index.html` | Rewrite |

The first rule keeps the therapist portal's API on the site's own domain, so the session cookie
is first-party (Safari blocks third-party cookies) and no CORS is needed. The second serves the
app for every client-side route (e.g. refreshing `/therapist/login`).

DNS is at GoDaddy: `A @ → 216.24.57.1`, `CNAME www → ksira-care-ui.onrender.com`.
Backend and database setup: see the `ksira-care-backend` README.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
