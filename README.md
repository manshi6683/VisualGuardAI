# VisualGuard AI – Visual Regression Testing Platform

A web-based visual testing platform designed to capture website screenshots, compare UI changes, detect visual differences, and perform cross-browser layout analysis.

VisualGuard AI helps QA engineers identify unexpected UI changes and review website consistency across different browsers and screen sizes.

---

## Overview

VisualGuard AI is a visual regression testing platform that combines automated browser screenshot capture, pixel-level image comparison, DOM-based analysis, and cross-browser testing.

The platform provides a centralized dashboard to manage scans, review comparison results, track testing history, and export reports.

## Key Features

### 1. Automated Screenshot Capture
- Capture website screenshots using Playwright.
- Support for Desktop, Tablet, and Mobile viewports.
- Support for Chromium, Firefox, and WebKit.
- Save screenshot records in a local SQLite database.

### 2. Visual Regression Testing
- Save baseline screenshots.
- Compare current screenshots against saved baselines.
- Detect pixel-level visual differences.
- Generate difference images to highlight changed areas.
- Calculate similarity and difference percentages.
- Handle screenshot dimension mismatches.

### 3. Cross-Browser Testing
- Run screenshot comparisons across Chromium, Firefox, and WebKit.
- Use Chromium as the reference browser.
- Compare browser layouts and content.
- Identify missing, extra, and modified elements.

### 4. DOM Comparison
- Compare important HTML elements.
- Analyze visible elements and their positions.
- Detect layout and content differences.
- Categorize results as PASSED, WARNING, or FAILED.

### 5. Scan History
- Store previous scan records.
- View individual scan details.
- Search and review testing history.
- Delete unwanted scan records.

### 6. Dashboard and Analytics
- View total scans.
- Track passed tests and visual issues.
- Monitor overall pass rate.
- Review recent testing activity.

### 7. Reports
- Export testing reports in CSV/Excel-compatible format.
- Generate PDF reports.
- Filter reports by date.
- View detailed report information.

---

## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React 19, Vite 8 |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| Backend | Node.js, Express 5 |
| Browser Automation | Playwright |
| Image Comparison | Pixelmatch, PNG.js |
| Database | SQLite, better-sqlite3 |
| PDF Reports | jsPDF, jsPDF-AutoTable |
| Version Control | Git, GitHub |

---

## Project Structure

```text
VisualGuardAI/
│
├── backend/
│   ├── database/
│   │   └── db.js
│   │
│   ├── screenshots/
│   │   ├── baseline/
│   │   ├── current/
│   │   ├── differences/
│   │   └── cross-browser/
│   │
│   ├── utils/
│   │   ├── compareDOM.js
│   │   └── compareScreenshots.js
│   │
│   ├── server.js
│   ├── package.json
│   └── .gitignore
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Comparison.jsx
│   │   │   ├── CrossBrowser.jsx
│   │   │   ├── CrossBrowserHistory.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── TestRuns.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## Installation and Setup

### Prerequisites

Install the following before running the project:

- Node.js
- npm
- Git
- Visual Studio Code

### 1. Clone the Repository

```bash
git clone https://github.com/manshi6683/VisualGuardAI.git
```

Navigate to the project directory:

```bash
cd VisualGuardAI
```

### 2. Backend Setup

Open a terminal:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Install Playwright browser binaries:

```bash
npx playwright install chromium firefox webkit
```

Start the backend development server:

```bash
npm run dev
```

Backend runs at:

```text
http://localhost:5000
```

### 3. Frontend Setup

Open another terminal from the project root:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at the Vite development URL, normally:

```text
http://localhost:5173
```

Keep both backend and frontend terminals running while using the application.

---

## API Endpoints

Base URL:

```text
http://localhost:5000/api
```

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check backend health |
| POST | `/capture` | Capture website screenshot |
| POST | `/baseline` | Save a baseline screenshot |
| POST | `/compare` | Compare baseline and current screenshots |
| POST | `/cross-browser-compare` | Run cross-browser comparison |
| GET | `/history` | Retrieve scan history |
| GET | `/history/:id` | Retrieve scan details |
| DELETE | `/history/:id` | Delete a scan record |
| GET | `/cross-browser-history` | Retrieve cross-browser history |
| GET | `/cross-browser-history/:id` | Retrieve cross-browser scan details |
| DELETE | `/cross-browser-history/:id` | Delete cross-browser scan |
| GET | `/stats` | Retrieve dashboard statistics |
| GET | `/analytics` | Retrieve dashboard analytics |

---

## Visual Comparison Logic

VisualGuard AI uses Pixelmatch to compare baseline and current screenshots.

The comparison process:

1. Capture the current website screenshot.
2. Select or save a baseline screenshot.
3. Compare both images pixel by pixel.
4. Generate a difference image.
5. Calculate the percentage of changed pixels.
6. Display similarity and pass/fail results.

**Current comparison threshold:** 0.5% difference.

- PASSED: Difference percentage is less than or equal to 0.5%.
- FAILED: Difference percentage is greater than 0.5%.
- Dimension mismatch: Screenshots have different widths or heights and cannot be compared using the normal pixel comparison.

### DOM Comparison Status

- PASSED: No detected DOM differences.
- WARNING: Layout or content differences detected.
- FAILED: Important elements are missing or extra.

---

## Running the Project

Start the backend and frontend in separate terminals.

Check backend health:

```text
http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "VisualGuard AI backend is running"
}
```

Build the frontend:

```bash
cd frontend
npm run build
```

Run frontend lint checks:

```bash
npm run lint
```

---

## Data and Generated Files

- SQLite stores scan history locally.
- Screenshots are generated locally during testing.
- Baseline, current, difference, and cross-browser screenshots are stored under `backend/screenshots/`.
- Generated screenshots, local database files, dependencies, and build outputs are excluded from Git using `.gitignore`.

These files are generated locally and are not included in the GitHub repository.

---

## Current Scope and Limitations

- The backend and frontend are configured to communicate through `localhost`.
- The database is local SQLite storage.
- Browser binaries must be installed through Playwright.
- The project currently uses rule-based pixel and DOM comparison; no external AI model integration is configured.
- The backend `npm test` script is currently a placeholder.

---

## Future Enhancements

- AI-assisted visual issue classification.
- Cloud-based screenshot and baseline storage.
- CI/CD pipeline integration.
- Scheduled regression testing.
- Team collaboration and role-based access.
- Advanced test execution analytics.
- Configurable visual comparison thresholds.

---

## Author

**Manshi**

B.Tech – Computer Science and Engineering

GitHub: https://github.com/manshi6683

---

## Repository

[VisualGuard AI – GitHub Repository](https://github.com/manshi6683/VisualGuardAI)

---

*VisualGuard AI – Making Visual Regression Testing Easier, Smarter, and More Reliable.*