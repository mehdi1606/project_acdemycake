<!--
Sync Impact Report
- Version change: (template) → 1.0.0
- Principles defined: I. Server Is the Source of Truth; II. One Access Check, Explicit Public Surface;
  III. Migrations Only; IV. Layered Backend Conventions; V. Bilingual by Default (EN/AR, RTL);
  VI. Production Safety
- Added sections: Technology Constraints; Development Workflow
- Removed sections: none
- Deferred TODOs: none
-->

# Saralöwe Academy Constitution

## Core Principles

### I. Server Is the Source of Truth
Prices, payment outcomes, course access, quiz grades and certificate eligibility MUST be decided
by the backend. The React client MAY display, pre-validate or hide UI, but no client-side check is
ever trusted for money, access or certification.
Rationale: the browser is user-controlled; every rule that matters must hold against a direct API call.

### II. One Access Check, Explicit Public Surface
Student-facing content (lessons, quizzes, assignments, reviews, certificates) MUST be authorised
through `EnrollmentService.hasAccess`; `existsByUserAndCourse` MUST NOT be used as an access check.
Every endpoint reachable without authentication MUST be listed explicitly in `SecurityConfig`
(ordering respected); the default is authenticated.

### III. Migrations Only
The database schema changes only through a new Flyway migration (`V<n>__description.sql`). Applied
migrations MUST NOT be edited. Hibernate runs with `ddl-auto: validate`, so a migration MUST also
create every index the entity declares.

### IV. Layered Backend Conventions
Backend code follows controller → service interface → `service/impl` → repository → entity.
Responses use the `ApiResponse<T>` envelope with static `fromEntity` mappers; failures are domain
exceptions mapped by `GlobalExceptionHandler` with an `ErrorCode`. Business rules live in services,
never in controllers or DTOs.

### V. Bilingual by Default (EN/AR, RTL)
Every user-visible string MUST be added to both `en.json` and `ar.json` and rendered via
`t('ns.key', 'English default')`. Layouts MUST work right-to-left (use logical CSS properties).
Backend messages shown to students MUST be meaningful in both languages or mapped on the client.

### VI. Production Safety
Work lands on a feature branch and is merged into the production branch
`feature/masterclass-booking-and-fixes`. Deploying MUST have explicit approval from the owner each
time. A rule change MUST NOT delete existing user data (certificates, purchases, enrollments,
submissions); new rules apply going forward unless the owner decides otherwise.

## Technology Constraints

- Backend: Java 17, Spring Boot 3.2, PostgreSQL 16, Flyway. Frontend: React 19 + TypeScript (CRA),
  Redux Toolkit, react-router 7, i18next.
- Live payment gateway is CMI; PayZone and Mux paths are legacy and MUST NOT be extended.
- Video is self-hosted and streamed with short-lived tokens; protected files use `FileUrlSigner`.

## Development Workflow

- Significant features follow Spec Kit: specify → clarify → plan → tasks → implement.
- Before a change is offered for deploy: backend compiles (`./mvnw -DskipTests package`), relevant
  tests pass, frontend builds (`npm run build`), and the diff is reviewed.
- Commit messages are a short sentence describing the user-visible change.

## Governance

This constitution overrides conflicting habits in the codebase. Amendments are made by editing this
file with a version bump: MAJOR for removing or redefining a principle, MINOR for a new principle or
section, PATCH for wording. Every plan produced under Spec Kit MUST include a Constitution Check
against the principles above; violations require a written justification in the plan.

**Version**: 1.0.0 | **Ratified**: 2026-11-24 | **Last Amended**: 2026-11-24
