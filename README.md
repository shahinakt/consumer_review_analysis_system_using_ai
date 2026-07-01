# PulseBoard — Customer Review & Rating Analysis Dashboard

A fully runnable MVP: FastAPI + SQLite backend serving sentiment predictions
from a scikit-learn model, and a React + Tailwind dashboard to explore,
upload, and act on customer review data.

**Status: verified end-to-end.** Backend endpoints and the production
frontend build were both tested during generation of this project — see
"What was verified" at the bottom.

---

## 1. Project structure

```
customer-review-dashboard/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app, CORS, router wiring
│   │   ├── database.py             # SQLAlchemy engine/session (SQLite)
│   │   ├── models.py               # ORM models (Customer, Product, Review, MLModel, SentimentResult)
│   │   ├── schemas.py              # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── health.py           # GET  /health
│   │   │   ├── predict.py          # POST /predict
│   │   │   ├── upload.py           # POST /upload
│   │   │   ├── dashboard.py        # GET  /dashboard
│   │   │   └── recommendations.py  # GET  /recommendations
│   │   ├── services/
│   │   │   ├── ml_service.py             # text cleaning + predict_new_review()
│   │   │   └── recommendation_service.py # rule-based recs + executive summary
│   │   ├── ml/
│   │   │   ├── model.pkl                 # trained demo model (regenerate anytime)
│   │   │   ├── vectorizer.pkl            # TF-IDF vectorizer
│   │   │   └── train_sample_model.py     # retraining script
│   │   └── data/                   # SQLite file lives here (reviews.db)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── main.jsx / App.jsx / index.css
│   │   ├── api/axios.js            # API client (VITE_API_BASE_URL)
│   │   ├── context/ThemeContext.jsx
│   │   ├── components/             # Sidebar, Navbar, KPICard, DarkModeToggle, Loader
│   │   └── pages/                  # Dashboard, PredictReview, UploadReviews, Recommendations
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env.example
├── sample_data/
│   └── sample_reviews.csv          # 30 labeled-by-rating demo reviews
└── README.md
```

---

## 2. Quick start (two terminals)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # edit POWERBI_EMBED_URL if you have a report

# Train the demo sentiment model (creates app/ml/model.pkl + vectorizer.pkl)
python -m app.ml.train_sample_model

uvicorn app.main:app --reload --port 8000
```

Backend is now live at `http://localhost:8000` (interactive docs at `/docs`).

### Frontend

```bash
cd frontend
npm install
cp .env.example .env            # VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

Frontend is now live at `http://localhost:5173`.

Open the app, go to **Upload Reviews**, and upload
`sample_data/sample_reviews.csv` to instantly populate the Dashboard and
Recommendations pages with real classified data.

---

## 3. Swapping in your own trained model

The brief says "use existing `model.pkl` and `vectorizer.pkl`, prediction
only." This project ships with a small demo model (trained on the 30-row
`sample_data/sample_reviews.csv`) so it runs out of the box. To use a real
model your ML teammate trained on a bigger dataset:

1. Drop their `model.pkl` and `vectorizer.pkl` into `backend/app/ml/`,
   overwriting the demo files.
2. Make sure the vectorizer is a scikit-learn `TfidfVectorizer` (or anything
   with `.transform()`) and the model exposes `.predict()` (and ideally
   `.predict_proba()` for confidence-based polarity scores).
3. Restart the backend — `app/services/ml_service.py` loads whatever is on
   disk, no code changes needed.

If no `.pkl` files are present at all, the backend automatically trains the
demo model from `sample_data/sample_reviews.csv` on first request — the API
can never fail to boot for lack of a model.

---

## 4. API reference

| Method | Path              | Auth required        | Purpose                                              |
|--------|-------------------|-----------------------|-------------------------------------------------------|
| GET    | `/health`         | none                   | Liveness check                                        |
| POST   | `/auth/signup`    | none                   | Register as ADMIN or USER, returns a JWT              |
| POST   | `/auth/login`     | none                   | Log in, returns a JWT                                 |
| POST   | `/auth/logout`    | any signed-in user     | Clears the client-side session                        |
| GET    | `/auth/me`        | any signed-in user     | Returns the current user's profile                    |
| POST   | `/predict`        | any signed-in user     | Classify one review, persist it, return label/score   |
| POST   | `/upload`         | ADMIN only             | Batch-classify a `.csv`/`.xlsx` of reviews            |
| GET    | `/dashboard`      | ADMIN only             | KPIs, rating distribution, sentiment trend, top words |
| GET    | `/recommendations`| ADMIN only             | Executive summary + rule-based action items           |

Full interactive schema: `http://localhost:8000/docs`.

`POST /upload` expects a review-text column named one of `review_text`,
`review`, `text`, `Review`, or `ReviewText`; it also picks up optional
`rating`, `product_name`, and `customer_name` columns if present (see
`sample_data/sample_reviews.csv` for the expected shape).

### Authentication & roles

- Passwords are hashed with **bcrypt** (via `passlib`) before being stored —
  plaintext passwords are never persisted.
- Auth is **JWT-based**: `/auth/signup` and `/auth/login` return a bearer
  token, which the frontend stores in `localStorage` and attaches to every
  request as `Authorization: Bearer <token>`.
- Two roles exist: `ADMIN` and `USER`, chosen at signup. There's no
  promotion flow — an account's role is fixed once created.
- Admin-only endpoints are protected server-side with a `require_admin`
  FastAPI dependency, so an ordinary `USER` calling `/dashboard` directly
  (e.g. via curl) gets a `403`, not just a hidden UI element.
- On the frontend, `/`, `/predict`, `/upload`, and `/recommendations` are
  wrapped in an `AdminRoute` guard that redirects non-admins to
  `/access-denied`; `/login` and `/signup` are public; everything else
  requires *some* authenticated user via `ProtectedRoute`.
- Set `JWT_SECRET_KEY` to a long random string before deploying — the
  default in `.env.example` is for local development only.

---

## 5. Power BI integration

`GET /dashboard` returns a `powerbi_embed_url` field, rendered as a
responsive `<iframe>` on the Dashboard page. To wire up a real report:

1. In Power BI Desktop, publish your report to the Power BI Service.
2. Use **File → Publish to web** (or an embed-enabled workspace) to get a
   public embed URL of the form `https://app.powerbi.com/view?r=...`.
3. Put that URL in `backend/.env` as `POWERBI_EMBED_URL` and restart the
   backend.

Until you do this, the iframe points at a placeholder URL and will show
Power BI's "report not found" page — everything else on the dashboard
works independently of this step.

---

## 6. AI Executive Summary & recommendations — how it works

`app/services/recommendation_service.py` contains:
- `generate_executive_summary()` — a deterministic, template-based summary
  driven by the real aggregate stats (total reviews, average rating,
  sentiment split). It's dependency-free so the MVP needs zero API keys.
- `suggest_recommendations()` — rule-based business suggestions keyed off
  sentiment thresholds and keyword hits in negative reviews (e.g.
  "delivery", "quality", "support", "refund").

Both functions are isolated on purpose: if you want a live LLM-generated
summary later, replace the body of `generate_executive_summary()` with a
call to the Anthropic Messages API — no other file needs to change.

---

## 7. Suggested 4-hour team split (4 people)

| Person | Hour 1 | Hour 2 | Hour 3 | Hour 4 |
|---|---|---|---|---|
| **Backend/API** | Verify `/predict`, `/upload` against real data | Wire in the real `model.pkl`/`vectorizer.pkl` | Tune `recommendation_service.py` rules | End-to-end test with frontend |
| **Frontend/UI** | Style pass on Dashboard | Build out Upload preview polish | Wire Recommendations page copy | Responsive/mobile pass |
| **ML** | Clean & label the real dataset | Train + evaluate model, export .pkl | Hand off model to backend teammate | Help debug edge cases in `/upload` |
| **PM/Data/Power BI** | Build Power BI report from the same dataset | Publish to web, get embed URL | Populate `.env`, verify iframe | Write demo script, rehearse |

---

## 8. Design notes

The UI uses a dark, glass-panelled "sentiment monitor" aesthetic: Space
Grotesk for display type, Inter for body text, JetBrains Mono for KPI
numbers, and a color-coded "pulse bar" on every KPI card (violet/emerald/
rose/amber) as the one recurring signature element. Toggle light mode from
the top-right button on any page.

---

## 9. What was verified during generation

- `pip install -r backend/requirements.txt` succeeds.
- `python -m app.ml.train_sample_model` trains and saves a working model.
- Backend boots with `uvicorn` and all five endpoints
  (`/health`, `/predict`, `/upload`, `/dashboard`, `/recommendations`)
  were exercised with real HTTP requests and returned correct JSON.
- `npm install && npm run build` succeeds for the frontend (production
  build, no errors).
- Frontend dev server boots and successfully calls the backend across
  origins with the configured CORS settings.

Not covered by automated verification here: visually confirming every page
renders pixel-perfect in a real browser, and Power BI embedding (which
needs a real published report you provide).
