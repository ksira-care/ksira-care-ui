# Folder Structure Guidelines

This document explains the ideal, extensible folder structure starting from `src/app/`, combining architectural best practices for modern Angular (especially Angular 14+ with Standalone Components).

### The Ideal Folder Structure

```text
src/
├── app/
│   ├── core/                  # 1. CORE: App-wide Singletons (Imported ONLY in app.config.ts / app.module.ts)
│   │   ├── auth/              # Authentication & Authorization services/guards
│   │   ├── http/              # Base HTTP services, API interceptors
│   │   ├── services/          # Global singleton services (e.g., ThemeService, LoggerService)
│   │   ├── constants/         # Global app constants and enums
│   │   └── models/            # Core domain models/interfaces (e.g., User, ApiConfig)
│   │
│   ├── shared/                # 2. SHARED: Reusable UI & Utilities (No singleton services here)
│   │   ├── components/        # Dumb/Presentational components (e.g., custom-button, data-table)
│   │   ├── directives/        # Reusable DOM manipulators (e.g., has-role, click-outside)
│   │   ├── pipes/             # Data transformation pipes (e.g., phone-format, default-value)
│   │   ├── utils/             # Helper pure functions (e.g., date-formatters, validators)
│   │   └── styles/            # Optional: Shared SCSS component-level styles
│   │
│   ├── layouts/               # 3. LAYOUTS: Application Shells
│   │   ├── main-layout/       # App shell (Sidebar, Header, Footer + <router-outlet>)
│   │   ├── auth-layout/       # Blank layout for Login/Signup
│   │   └── components/        # Layout-specific components (e.g., navbar, sidebar)
│   │
│   ├── features/              # 4. FEATURES (Domain-Driven): The actual business logic
│   │   ├── patient/           # Feature: Patient Management
│   │   │   ├── components/    # Presentational components purely for the patient domain
│   │   │   ├── pages/         # Smart/Container components (tied to routes)
│   │   │   ├── services/      # Feature-specific API/logic services
│   │   │   ├── models/        # Patient-specific DTOs and interfaces
│   │   │   ├── store/         # (Optional) Feature-level state (NgRx/Signals)
│   │   │   └── patient.routes.ts # Lazy loaded routes for this feature
│   │   │
│   │   └── dashboard/         # Feature: Dashboard / Analytics
│   │
│   ├── store/                 # 5. STORE (Optional): Global State Management 
│   │   ├── actions/
│   │   ├── reducers/
│   │   └── selectors/
│   │
│   ├── app.routes.ts          # Root routing configuration (Lazy loads features/layouts)
│   ├── app.component.ts       # Root component
│   └── app.config.ts          # Root providers (if Angular 15+ standalone)
│
├── assets/                    # Static Assets (Images, Icons, i18n JSON files)
│   └── i18n/
│
└── styles/                    # Global SCSS Architecture (7-1 Pattern)
    ├── abstracts/             # Variables, mixins, functions (NO actual CSS output)
    ├── base/                  # Typography, CSS resets
    ├── themes/                # Dark/Light mode overrides
    └── styles.scss            # Main entry file
```

---

### Architectural Design Decisions (The "Why")

#### 1. Domain-Driven Features (`/features`)
Instead of grouping files by technical type (e.g., all controllers in one folder, all views in another), **group by feature**.
* **Extensibility:** When a new developer joins and needs to fix a "Patient Onboarding" bug, they purely open the `features/patient/` folder. They don't have to bounce between 5 different root folders.
* **Lazy Loading:** Each feature folder has its own routing file (`feature.routes.ts`), making it incredibly simple to lazy-load the entire module, keeping the initial bundle size tiny.

#### 2. Smart vs. Dumb Components (`pages/` vs `components/`)
Inside your features and shared folders, separate components into two distinct types:
* **Pages (Smart/Container):** These are bound to a route. They inject services, fetch data, dispatch state, and pass data *down* to dumb components.
* **Components (Dumb/Presentational):** These only depend on `@Input()` and `@Output()`. They have no idea where the data comes from. 
* **Extensibility:** This makes UI components highly resusable and incredibly easy to unit test.

#### 3. Strict Module/Dependency Boundaries
* **Core:** Should only ever be imported once in the root of the app. It manages things that should be singletons across the entire app lifecycle (Auth, HTTP Interceptors, Global Error Handling).
* **Shared:** Contains UI widgets (buttons, modals). Never put services with state in `shared/`, or you risk creating multiple instances of a service when lazy loading.

#### 4. Standalone Components (Modern Angular)
As of Angular 14+, you should strongly consider adopting a `--standalone` architecture. It deprecates the need for `SharedModule` and `CoreModule`. Instead, components import exactly what they need at the component level. This reduces boilerplate, makes tree-shaking more efficient, and flattens the learning curve.

#### 5. Abstracting CSS (`/styles/abstracts`)
Keep your SCSS variable definitions (`_variables.scss`, `_mixins.scss`) in an `abstracts` folder. Any component can import these abstracts without compiling duplicate CSS. This is critical for scaling enterprise themes and dark modes seamlessly without creating massive CSS bundles.
