# Personal Health Dashboard

[![CI](https://github.com/mrf/personal-health-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/mrf/personal-health-dashboard/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A local-first web application for visualizing and gaining insights from your Apple Health data. **Your data never leaves your machine.**

![Dashboard Screenshot](docs/screenshot.png)

## Features

- **Privacy First** - 100% local, no data sent to external servers
- **Interactive Charts** - Steps, sleep, heart rate, weight trends
- **Smart Insights** - Trend analysis, correlations, personal records
- **Easy Import** - Drag-and-drop Apple Health export
- **Fast** - SQLite database with pre-computed summaries

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Your Apple Health export (`export.xml`)

### Installation

```bash
# Clone the repository
git clone https://github.com/mrf/personal-health-dashboard.git
cd personal-health-dashboard

# Install everything
make install
```

Or manually:

```bash
# Backend
cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt

# Frontend
cd frontend && npm install
```

### Running

```bash
# Easy way - uses Makefile
make dev
```

Or manually:

```bash
# Terminal 1 - Backend
cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Open http://localhost:5173 in your browser.

## Exporting Your Apple Health Data

### From Your iPhone

1. Open the **Health** app
2. Tap your **profile picture** (top-right)
3. Scroll down and tap **"Export All Health Data"**
4. Confirm and wait for the export (may take several minutes)
5. Transfer to your computer via:
   - **AirDrop** (Mac) - fastest
   - **iCloud Drive** - access from any device
   - **USB Transfer** - via Finder/iTunes
   - **Cloud Storage** - Dropbox, Google Drive, etc.

### Importing

1. Unzip the export: `unzip Export.zip`
2. Either:
   - **Option A**: Copy `export.xml` to the `data/` folder, then click "Import from local file"
   - **Option B**: Drag and drop `export.xml` directly into the dashboard

### File Size Warning

Apple Health exports can be **500MB - 2GB+** if you've been tracking for years. This is normal - the parser streams the XML efficiently.

## Project Structure

```
personal-health-dashboard/
├── backend/                 # Python FastAPI
│   ├── app/
│   │   ├── main.py         # API entry point
│   │   ├── database.py     # SQLite operations
│   │   ├── parser.py       # Apple Health XML parser
│   │   └── routers/        # API endpoints
│   ├── tests/              # pytest tests
│   └── requirements.txt
├── frontend/               # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # React hooks
│   │   └── services/       # API client
│   └── package.json
├── data/                   # Health data (gitignored)
└── .github/workflows/      # CI/CD
```

## Development

### Running Tests

```bash
# Run all tests
make test

# Or individually
make test-backend
make test-frontend

# With coverage
make coverage
```

### Available Make Commands

```bash
make help           # Show all commands
make install        # Install all dependencies
make dev            # Run backend + frontend
make test           # Run all tests
make coverage       # Tests with coverage reports
make build          # Build frontend for production
make typecheck      # TypeScript type checking
make clean          # Remove build artifacts
make reset-db       # Clear the database
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/status` | Import status and data range |
| `GET /api/health/summary` | Today's health summary |
| `GET /api/health/range?start=&end=` | Summaries for date range |
| `GET /api/health/metrics/{type}` | Metric history (steps, sleep, etc.) |
| `GET /api/insights/trends` | Trend analysis |
| `GET /api/insights/correlations` | Metric correlations |
| `GET /api/insights/records` | Personal bests |
| `POST /api/upload` | Upload export.xml |
| `POST /api/upload/local` | Import from data/ folder |

## Supported Metrics

- Steps & distance
- Active & resting calories
- Heart rate (resting, walking, workout)
- Sleep duration & stages
- Weight & body composition
- Workouts (type, duration, calories)
- Flights climbed
- Stand hours

## Privacy & Security

- **100% Local** - No external API calls, no telemetry
- **Your Data** - Stored in `data/` folder (gitignored)
- **No Auth** - Runs on localhost only
- **Open Source** - Audit the code yourself

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Ideas for Contributions

- [ ] Export reports as PDF
- [ ] Compare time periods
- [ ] Dark mode
- [ ] Mobile responsive design
- [ ] Additional data source support (Garmin, Fitbit)
- [ ] Custom metric tracking

## Troubleshooting

### Export takes forever on iPhone
Large exports (years of data) can take 10-15 minutes. Keep the app open.

### Parser runs out of memory
Close other applications. The streaming parser should handle most files, but very large exports on low-memory systems may struggle.

### Backend won't start
Make sure you've activated the virtual environment and installed dependencies.

### Charts not loading
Check that both backend (port 8000) and frontend (port 5173) are running.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Apple Health](https://www.apple.com/ios/health/) for the data export feature
- [FastAPI](https://fastapi.tiangolo.com/) for the excellent Python framework
- [Recharts](https://recharts.org/) for React charting
- [Tailwind CSS](https://tailwindcss.com/) for styling
