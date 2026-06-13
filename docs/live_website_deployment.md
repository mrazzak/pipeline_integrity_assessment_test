# Live Website Deployment Instructions

This application is currently a lightweight Python web server that serves static HTML, CSS, and JavaScript and exposes local API endpoints for calculation, reports, and user administration. It now stores passwords as salted PBKDF2 hashes, supports account expiration dates, and forces password rotation after 120 days.

## 1. Prepare The Project

Confirm the project runs locally:

```powershell
$env:PYTHONPATH='src'
python -m cepa_crossing.gui_server
```

Open:

```text
http://127.0.0.1:8765/
```

For a network or hosted environment, set host and port with environment variables:

```bash
export PIPELINE_ASSESSMENT_HOST=0.0.0.0
export PIPELINE_ASSESSMENT_PORT=8765
export PIPELINE_ASSESSMENT_DATA_DIR=/var/data/pipeline-crossing
python -m cepa_crossing.gui_server
```

Run tests before deployment:

```powershell
$env:PYTHONPATH='src'
python -m unittest discover -s tests
node --check web/app.js
node tests/gui_smoke.mjs
```

## 2. Security Features In This Build

The current build includes:

- Login-first access to the assessment page
- Salted PBKDF2 password hashes in `data/users.json`
- Admin user creation, update, deletion, and account expiration dates
- User full name and email address storage
- User password change workflow
- Forced password change after 120 days
- Per-user browser-side saved assessments
- Basic security headers: content type protection, same-origin framing, referrer policy, permissions policy, and a content security policy

Important limits:

- JSON files are still used for users and reports. This is acceptable for an internal prototype, not for a public multi-user production system.
- On Render, attach a persistent disk and set `PIPELINE_ASSESSMENT_DATA_DIR` to a path on that disk. Without a persistent disk, user/password changes can be lost when the service is rebuilt or moved.
- Sessions are held client-side by the current browser state. A production site should use server-side sessions or signed secure cookies.
- HTTPS must be provided by the deployment platform or reverse proxy.

## 3. Recommended Production Architecture

For a live website, use:

- A Python backend API using Flask, FastAPI, or Django
- A production WSGI/ASGI server such as Gunicorn or Uvicorn
- Nginx or another reverse proxy
- HTTPS with a certificate from Let's Encrypt or the hosting provider
- Server-side authenticated sessions with secure, HTTP-only, same-site cookies
- Server-side database storage for assessments

The current login is improved for internal use, but a public website should move identity, sessions, assessments, and reports into a database-backed application.

## 4. Convert The Local Server For Production

The current `http.server` implementation is useful for local desktop operation. For production, move the calculation endpoint into FastAPI or Flask.

Example FastAPI structure:

```text
src/
  cepa_crossing/
    calculator.py
    models.py
    api.py
web/
  index.html
  app.js
  styles.css
```

The API should expose:

```text
POST /api/calculate
POST /api/report-link
POST /api/login
POST /api/change-password
POST /api/admin/user
POST /api/admin/delete-user
POST /api/admin/method
```

with the same JSON payload currently used by the GUI.

## 5. Add Production User Accounts

For live multi-user access, replace the JSON user file with:

- User registration and login
- Password hashing with Argon2 or bcrypt
- Session cookies with secure and HTTP-only flags
- CSRF protection for form actions
- A database table for saved assessments by user id
- Account expiration date and disabled status
- Password changed date and enforced password expiry
- Audit logging for admin user changes

Suggested database tables:

```text
users
  id
  username
  full_name
  email
  password_hash
  role
  account_expires_at
  password_changed_at
  password_expires_at
  disabled_at
  created_at

assessments
  id
  user_id
  name
  payload_json
  result_json
  created_at
  updated_at
```

## 6. Host The Frontend

The `web` folder can be served as static files by:

- Nginx
- Apache
- FastAPI static file mounting
- A static host such as Azure Static Web Apps, Netlify, or Cloudflare Pages

If the frontend and API are on different domains, configure CORS on the backend.

## 7. Deploy On A Virtual Machine

Typical Linux server steps:

```bash
sudo apt update
sudo apt install python3 python3-venv nginx
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run the app with Gunicorn or Uvicorn, then configure Nginx to proxy:

```text
/api/* -> backend application
/*      -> static web files
```

## 8. HTTPS

Use Certbot or a managed hosting certificate:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx
```

## 9. Production Checklist

- Replace browser-state login with server sessions
- Replace JSON user storage with a database-backed identity system
- Save assessments in a database
- Add input validation on the backend
- Add audit logging for saved and exported assessments
- Enable HTTPS
- Use secure, HTTP-only, same-site cookies
- Add CSRF protection for mutating endpoints
- Restrict admin endpoints to authenticated admin sessions
- Back up user, assessment, and report data
- Add regular backups
- Add version number and calculation methodology document link
- Add terms, limitations, and engineering review disclaimer

## 10. PDF Report On A Live Site

Modern browsers may allow direct save-location selection through the File System Access API. When unsupported, the PDF will download to the user's browser download location. For stricter server-side PDF generation, add a backend endpoint that renders the report using WeasyPrint, Playwright, or ReportLab and returns a PDF response.
