
# School Management APIs (Node.js + Express + MySQL)

Two endpoints:
- `POST /addSchool` – add a school (validated)
- `GET /listSchools?lat=..&lng=..` – list all schools sorted by distance from user's location (Haversine formula in SQL)

## Local Setup

1) Install Node.js LTS and Git.
2) Clone/download this repo.
3) Copy `.env.example` to `.env` and fill DB credentials.
4) Install deps and start:
```bash
npm install
npm run start
```
Server runs at `http://localhost:3000` by default.

## Environment Variables
```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=school_db
```

## Endpoints

### POST /addSchool
**Body (JSON):**
```json
{
  "name": "Springfield Elementary",
  "address": "742 Evergreen Terrace, Springfield",
  "latitude": 19.076,
  "longitude": 72.8777
}
```
**Responses:**
- `201 Created` with the created school
- `400` if validation fails
- `500` on server error

### GET /listSchools?lat=..&lng=..
**Example:**
```
/listSchools?lat=19.0760&lng=72.8777
```
**Response:**
- `200 OK` with array sorted by `distance_km`

## SQL Schema
See `sql/init.sql`. Table is auto-created on server start.

## Postman
Import the collection in `postman/School API.postman_collection.json` and the environment `postman/Local.postman_environment.json`. Set `base_url` to your local or deployed URL.
