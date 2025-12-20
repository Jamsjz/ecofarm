# Deployment — EcoFarm 🚀

## Backend (FastAPI)
Example quick start using `uvicorn` (development):

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Example `Dockerfile` (FastAPI):

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/pyproject.toml ./
COPY backend/ ./
RUN pip install --upgrade pip && pip install "uvicorn[standard]" && pip install -r <(python -m pipenv lock --requirements)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

(Replace the above lines with your preferred build tool: poetry/requirements and pin exact versions.)

## Frontend
- Build: `npm run build` from `frontend/`
- Host `dist/` on static hosting (Netlify, Vercel, S3 + CloudFront) or serve behind an Nginx.

## docker-compose (example)
- `backend` service: builds FastAPI container, exposes 8000
- `frontend` service: builds static files and serves via `nginx`

## Environment & runtime
- Ensure `data/data.csv` is present in the backend container image or is mounted.
- Expose ports and configure CORS origins for production.

**Notes**
- This repo currently uses an in-memory game state; for production consider adding a database and state persistence.
- Create an automated pipeline (GitHub Actions) to build, test, and deploy both services.