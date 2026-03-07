# Architecture Overview

This directory contains architectural decisions, guidelines, and context for the `ksira-care-ui` project. 
It serves as living documentation for developers to understand *why* things were structured the way they are.

## Core Principles
The project follows Domain-Driven Design and the LIFT principle (Locate easily, Identify at a glance, Flat structure as possible, Try to stay DRY).

## Folder Structure

```text
src/
├── app/
│   ├── core/                  # App-wide Singletons (Imported ONLY in app.config.ts / app.module.ts)
│   ├── shared/                # Reusable UI & Utilities (No singleton services here)
│   ├── layouts/               # Application Shells
│   ├── features/              # (Domain-Driven): The actual business logic
│   ├── store/                 # (Optional): Global State Management 
│   ├── app.routes.ts          # Root routing configuration (Lazy loads features/layouts)
│   ├── app.component.ts       # Root component
│   └── app.config.ts          # Root providers (if Angular 15+ standalone)
│
├── assets/                    # Static Assets (Images, Icons, i18n JSON files)
│   └── i18n/
│
└── styles/                    # Global SCSS Architecture (7-1 Pattern)
```

## Documentation Files
- `folder-structure.md` - Detailed explanation of the folder structure and rules for each layer.
