# Saralöwe Academy — project instructions

Online pastry academy (saralowe.ma / saralowe.com). Subscription courses (PLAN), paid
masterclasses (RECORDED or LIVE with seats), ebooks, quizzes, assignments, certificates,
community. UI in English and Arabic (RTL).

## Stack
- **Backend** `academy-backend/`: Java 17, Spring Boot 3.2.3, JPA/Hibernate, PostgreSQL 16,
  Flyway (`src/main/resources/db/migration`, V1..V37), JWT (15 min access, 7 day refresh),
  iText certificates, LibreTranslate for AR↔EN, Caffeine cache, Bucket4j rate limiting.
- **Frontend** `template/`: React 19 + TypeScript on Create React App (react-scripts 5),
  Redux Toolkit, react-router 7, axios, i18next, video.js, pdf.js, three.js (home heroes).
- **Payments**: CMI Chaabi is the live gateway. PayZone and Mux code is legacy — don't build on it.
- **Video**: self-hosted, `/api/v1/videos/{lessonId}/stream?token=` with HTTP Range, not Mux.

## Layout
- `academy-backend/src/main/java/com/academy/`: `controller` → `service` (interface) →
  `service/impl` → `repository` → `entity`; `dto/request`, `dto/response`, `security`,
  `config`, `integration/cmi`, `exception`.
- `template/src/`: `feature-module/router` (all routes + guards), `feature-module/*` (pages by
  audience: HomePages, Courses, student, Instructor, admin, Ebooks, community, Pages, auth),
  `services/api` (one service per backend area), `core/redux`, `components`, `i18n/locales`.
- `template/nginx/nginx.conf`: production Nginx (TLS, `/api` `/files` `/ws` → backend:8080).
- `docs/SARALOWE_TECHNICAL_MAP.md` is the most accurate older doc. `project_analysis.md`,
  `case_analysis_*.md.resolved`, `DEPLOY.md` and `generate_cahier_charges.js` are stale.

## Backend conventions
- Every endpoint returns `ApiResponse<T>` (`PageResponse<T>` for pages); map with static
  `XxxResponse.fromEntity(...)`. Errors: throw domain exceptions, `GlobalExceptionHandler` maps them,
  codes in `ErrorCode`.
- Lombok: `@RequiredArgsConstructor`, `@Slf4j`, `@Builder`. Services are
  `@Transactional(readOnly = true)` at class level, `@Transactional` on writes.
- New public endpoints must be listed in `SecurityConfig` (order matters). Default is authenticated.
- Content access: always use `EnrollmentService.hasAccess(...)`, never `existsByUserAndCourse`.
- Admin-editable values go in `app_settings` via `SettingsService`.
- Money operations: copy the lock + re-read pattern in `PaymentServiceImpl.processPaymentCallback`.
  In `CmiPaymentService.handleCmiCallback`, `ACTION=POSTAUTH` charges the card; `APPROVED` does not.
- Schema: `ddl-auto: validate`. Every schema change needs a new `V38__...sql` migration and must
  include the indexes the entity declares. Never edit an applied migration.

## Frontend conventions
- Routes only through `all_routes` + `lazy()`; protect with `RoleGuard`.
  `SubscriptionGuard` only checks login — it is not access control.
- Dashboard pages wrap themselves in `LuxuryDashboardLayout`.
- Every string as `t('ns.key', 'English default')`, added to both `en.json` and `ar.json`.
  Use logical CSS properties for RTL.
- Reuse `getFileUrl`, `sanitizeHtml` (DOMPurify) for any HTML, `formatMAD`, `extractApiError`.
- Prices are always decided by the server; the client only displays them.

## Commands
- Backend: `cd academy-backend && ./mvnw spring-boot:run` (needs Postgres + env vars, see
  `.env.example`); tests `./mvnw test` (only `VideoStreamingSecurityTest` is self-contained).
- Frontend: `cd template && npm start` (port 3000), `npm run build`.
- Local stack: `docker-compose.local.yml`.

## Deployment (production)
- Server: `root@95.216.241.97` via SSH key (never a password). Checkout `/root/project_acdemycake`.
- Production branch: `feature/masterclass-booking-and-fixes` (not `main`).
- Deploy: push the branch, then on the server `git pull` and
  `docker compose --env-file .env.docker up -d --build` (the env file is required).
- Containers: academy-frontend (80/443), academy-backend, academy-db, academy-translate.
  `/opt/saralowe` on the same server is another project — never touch it.
- Always ask before deploying; it changes the live site.

## Git
- Commit messages: short imperative sentence describing the user-visible change
  (e.g. "Black Friday offer: themed home page, countdown, 899 DH for 24 hours").
