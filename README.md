# Al Iman Timesheet (Skeleton)

## Structure
- `ALImanAPI/` Spring Boot 3 + JPA/Hibernate REST API.
- `ALImanUI/` React (Vite) SPA.
- `ALImanAPI/schema.sql` MySQL DDL.

## Setup (local dev)
1) MySQL: create DB & tables  
`mysql -u root -p < ALImanAPI/schema.sql`

2) Backend:  
```bash
cd ALImanAPI
mvn spring-boot:run
```  
Default port `8080`. Swagger: `/api/swagger`.

3) Frontend:  
```bash
cd ALImanUI
npm install
npm run dev
```  
Default port `5173`.

4) Logo: copy the provided file `cropped-rsz_al_iman_institute_final_logo-01.png` into `ALImanUI/public/logo.png` (create folder `public` if missing). The UI references `/logo.png`.

## Notes
- Email is stubbed; uses local SMTP (MailHog) defaults. Wire real host in `application.yml`.
- Security is HTTP Basic; use a reverse proxy/IDP in production.
- API headers: send `X-User-Id` when calling release/decision/event endpoints (until auth is wired).
- Frontend uses mock login (detects "manager" in email to set role). Replace with real auth API.
- Charts and lists use placeholder data; wire API responses as you implement backend logic.
