# PulseBoard — Customer Review & Rating Analysis Dashboard

A 7-member hackathon project: a FastAPI + SQLite backend serving sentiment
predictions from a scikit-learn model, and a React + Tailwind dashboard to
explore, upload, and act on customer review data.

---

## 1. Project overview

PulseBoard lets a business upload raw customer reviews and instantly see:
- **Sentiment-classified reviews** (Positive / Neutral / Negative) via an
  ML model trained by the team's ML engineer.
- **A KPI dashboard** — average rating, sentiment split, rating distribution,
  sentiment trend over time, and top positive/negative keywords.
- **Auto-generated business recommendations** based on sentiment patterns.
- **Role-based auth** (ADMIN vs USER) and optional Power BI embedding.

---

## 2. Architecture

```
React (Vite + Tailwind)  ──HTTP/JSON──►  FastAPI (single backend)
                                            ├── auth (JWT + bcrypt)
                                            ├── predict / upload
                                            ├── dashboard / recommendations
                                            └── ml_service.py ──► sentiment_naive_bayes.pkl
                                                                  (TF-IDF + MultinomialNB)
                                            └── SQLite (SQLAlchemy ORM)
```

**One backend, one framework.** The ML teammate originally prototyped the
sentiment model behind a standalone Flask app (`app.py`) for quick local
testing. For the hackathon build we integrated the trained model directly
into the FastAPI service instead of running Flask as a second process:

- The model (`sentiment_naive_bayes.pkl`) is a single scikit-learn
  `Pipeline` (`TfidfVectorizer` + `MultinomialNB`) that takes raw text and
  returns a label — no separate vectorizer file, no Flask-specific glue.
- `app/services/ml_service.py` loads it once at first use and exposes
  `predict_new_review()` and `get_top_words()`, which every router
  (`predict`, `upload`, `dashboard`, `recommendations`) already depended on.
- This avoids running two backend processes, two CORS configs, and a second
  set of dependencies for a hackathon demo — one FastAPI service handles
  auth, persistence, and inference behind a single set of endpoints.
- A lightweight keyword-based fallback kicks in only if the `.pkl` file is
  ever missing, so the API never fails to boot for lack of a model.

The standalone Flask app and its `vercel.json` were removed once the model
was wired into FastAPI; `flask` was dropped from `requirements.txt`.

---

## 3. Tech stack

| Layer | Tech |
|---|---|
| Frontend | React (Vite), Tailwind CSS |
| Backend | FastAPI, Pydantic, SQLAlchemy |
| Database | SQLite (swap-in ready for Postgres) |
| ML | scikit-learn (TF-IDF + MultinomialNB), joblib |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Reporting | Power BI (embedded iframe) |

---

## 4. Project structure

```
consumer_review_analysis_system_using_ai/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app, CORS, router wiring
│   │   ├── database.py             # SQLAlchemy engine/session (SQLite)
│   │   ├── models.py               # ORM models (Customer, Product, Review, SentimentResult)
│   │   ├── schemas.py              # Pydantic request/response schemas
│   │   ├── security.py             # JWT auth + role dependencies
│   │   ├── routers/
│   │   │   ├── health.py           # GET  /health
│   │   │   ├── auth.py             # POST /auth/signup, /auth/login, /auth/me
│   │   │   ├── predict.py          # POST /predict
│   │   │   ├── upload.py           # POST /upload
│   │   │   ├── dashboard.py        # GET  /dashboard
│   │   │   └── recommendations.py  # GET  /recommendations
│   │   ├── services/
│   │   │   ├── ml_service.py             # loads sentiment_naive_bayes.pkl, predict_new_review()
│   │   │   └── recommendation_service.py # rule-based recs + executive summary
│   │   └── ml/
│   │       └── sentiment_naive_bayes.pkl # trained sentiment pipeline (ML teammate's model)
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
│   └── cleaned_customer_reviews.csv
└── README.md
```

---

## 5. Setup instructions

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # edit POWERBI_EMBED_URL / JWT_SECRET_KEY

uvicorn app.main:app --reload --port 8000
```

Backend is now live at `http://localhost:8000` (interactive docs at `/docs`).
The sentiment model loads automatically from `app/ml/sentiment_naive_bayes.pkl`
on first prediction request — no separate training step needed.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env            # VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

Frontend is now live at `http://localhost:5173`.

Open the app, go to **Upload Reviews**, and upload
`sample_data/cleaned_customer_reviews.csv` to instantly populate the
Dashboard and Recommendations pages with classified data.

---

## 6. ML integration details

- **Model**: `TfidfVectorizer` + `MultinomialNB`, packaged as one
  `sklearn.pipeline.Pipeline` and serialized with `joblib` to
  `backend/app/ml/sentiment_naive_bayes.pkl`.
- **Inference**: `ml_service.predict_new_review(review_text, product_name, category)`
  reconstructs the same input format the model was trained on —
  `"Product: X. Category: Y. Review: Z"` — when product/category are
  available, falling back to raw review text otherwise. It then calls
  `model.predict([...])` and `model.predict_proba([...])` (the pipeline
  handles vectorization internally), maps the label to a signed polarity
  score, and returns `(label, polarity, cleaned_text)`.
- Both `/predict` and `/upload` accept an optional `category` field/column
  (`PredictRequest.category`, or a `category`/`Category` CSV column) and
  persist it on the `Product` record so it's available for future
  predictions of the same product.
- **To retrain / swap in an updated model**: replace
  `backend/app/ml/sentiment_naive_bayes.pkl` with a new pipeline exposing
  `.predict()` (and ideally `.predict_proba()`), keep the same filename, and
  restart the backend — no other code changes required.
- **Word clouds** (`get_top_words`, used by `/dashboard` and
  `/recommendations`) run a separate lightweight `clean_text()` step
  (lowercase, strip punctuation, remove stopwords) independent of the model.

---

## 7. API reference

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
`rating`, `product_name`, and `customer_name` columns if present.

### Authentication & roles

- Passwords are hashed with **bcrypt** (via `passlib`) before being stored.
- Auth is **JWT-based**: `/auth/signup` and `/auth/login` return a bearer
  token, attached to every request as `Authorization: Bearer <token>`.
- Two roles exist: `ADMIN` and `USER`, chosen at signup.
- Admin-only endpoints are protected server-side with a `require_admin`
  FastAPI dependency.
- Set `JWT_SECRET_KEY` to a long random string before deploying.

---

## 8. Power BI integration

`GET /dashboard` returns a `powerbi_embed_url` field, rendered as a
responsive `<iframe>` on the Dashboard page. To wire up a real report:

1. In Power BI Desktop, publish your report to the Power BI Service.
2. Use **File → Publish to web** to get a public embed URL.
3. Put that URL in `backend/.env` as `POWERBI_EMBED_URL` and restart the
   backend.

---

## 9. Team contributions (7 members)

| Member | Role | Contribution |
|---|---|---|
| Member 1 | Backend Lead | FastAPI app structure, routers, database models, JWT auth |
| Member 2 | Backend | `/upload` batch classification, CSV/XLSX parsing, error handling |
| Member 3 | ML Engineer | Trained `sentiment_naive_bayes.pkl` (TF-IDF + MultinomialNB) on the review dataset, built the original Flask prototype (`app.py`) for local testing before integration |
| Member 4 | Frontend Lead | React + Tailwind app shell, routing, theming, auth flows |
| Member 5 | Frontend | Dashboard KPI cards, charts, sentiment trend visualizations |
| Member 6 | Frontend | Upload Reviews & Predict Review pages, Recommendations page |
| Member 7 | Data / Power BI | Dataset cleaning (`cleaned_customer_reviews.csv`), Power BI report, executive summary rules |

> Replace placeholder names above with actual teammate names/GitHub handles.

---

## 10. Design notes

The UI uses a dark, glass-panelled "sentiment monitor" aesthetic: Space
Grotesk for display type, Inter for body text, JetBrains Mono for KPI
numbers, and a color-coded "pulse bar" on every KPI card (violet/emerald/
rose/amber). Toggle light mode from the top-right button on any page.
