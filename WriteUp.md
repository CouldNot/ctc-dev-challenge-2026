# Write-up

## 1. What I built for Part B, and why

I built a visit log and add-restaurant form. The original app could display saved restaurants, but the most critical thing standing out to me was that it gave no user interface to add a restaurant. I added a form so users could add new restaurants on the fly. Now, you can track where Brennen ate, when, and how much it costed. The visit log uses the existing `visits` table to show those
entries newest first and adds a form for recording a new one. On top of this, I added a UI refresh as a reference to a certain "SpideyTracker" app in a movie I watched recently.

I kept the feature narrowly focused. A visit is tied to a restaurant, has a calendar
date, an optional amount, and optional notes. The form accepts a typed
restaurant name, suggests saved restaurants, and creates a minimal restaurant
record when the name is new. That makes the common flow quick without putting a
restaurant name directly on a visit row.

## 2. Decisions and tradeoffs

The new API is `GET /api/visits` and `POST /api/visits`. Both are route
handlers under `/api`; the page fetches through HTTP rather than talking to the
database directly. `GET` returns the restaurant name with each visit because
the UI needs it, while `POST` still accepts a `restaurantId` so the database
relationship stays explicit.

Restaurant names are unique after trimming and ignoring case. I added that as
a database index instead of relying only on the UI, since the API can be called
from more than one place. I deliberately did not add visit editing, deletion,
filters, or spending summaries. Those could be useful, but they felt like a
separate feature on top of what I added, and because Part B called for a single new feature, I chose this.

## 3. Corners I cut / next steps

Creating a typed new restaurant and creating its visit are two requests. If the
second request fails, the new restaurant can remain without a visit. With more
time, I would add a dedicated endpoint that creates both in one database
transaction. I would also add automated API tests and make the visit list more
useful with filtering and totals.

---

## Part B: routes

| Method and path | What it does | Success | Errors |
| --- | --- | --- | --- |
| `GET /api/visits` | Lists visits newest first, with restaurant names. | `200` + JSON array | `500` only for an unexpected server failure |
| `POST /api/visits` | Creates a visit for an existing restaurant. | `201` + created visit | `400` for invalid input, `404` if `restaurantId` does not exist |

**`GET /api/visits` response**

```json
[
  {
    "id": 1,
    "restaurantId": 1,
    "restaurantName": "The Rusty Spoon",
    "date": "2026-01-12",
    "amountSpent": 42.5,
    "notes": "Burger night with the crew.",
    "createdAt": "2026-01-12T00:00:00.000Z"
  }
]
```

**`POST /api/visits`**

```jsonc
// request
{
  "restaurantId": 1,
  "date": "2026-09-08",
  "amountSpent": 18.5,
  "notes": "Lunch"
}

// 201 response
{
  "id": 6,
  "restaurantId": 1,
  "restaurantName": "The Rusty Spoon",
  "date": "2026-09-08",
  "amountSpent": 18.5,
  "notes": "Lunch",
  "createdAt": "2026-09-08T00:00:00.000Z"
}
```

The typed-name UI uses the existing `POST /api/restaurants` route first when
the entered name is not already saved. Its request is simply `{ "name": "..." }`;
the optional restaurant fields are stored as `null`.

## Schema changes

`client/db/migrations/002_unique_restaurant_names.sql` adds a unique index on
`LOWER(TRIM(name))`. It prevents duplicate restaurant names that differ only by
capitalization or outer whitespace. No tables or columns were added.

## How I verified this

I used the following checks against the local Docker-backed database. The Part
A commands cover the required status codes, including invalid IDs and invalid
restaurant bodies.

```bash
# from client/
npm run lint
npx tsc --noEmit

# Part A reads and invalid IDs
curl -i http://localhost:3000/api/restaurants
curl -i http://localhost:3000/api/restaurants/1
curl -i http://localhost:3000/api/restaurants/99999
curl -i http://localhost:3000/api/restaurants/abc

# Part A create and validation
curl -i -X POST http://localhost:3000/api/restaurants \
  -H 'Content-Type: application/json' \
  -d '{"name":"Valid Spot","cuisine":"Test","address":"2 Test St","rating":4.5}'
curl -i -X POST http://localhost:3000/api/restaurants \
  -H 'Content-Type: application/json' \
  -d '{"name":"Out Of Range","rating":6}'
curl -i -X POST http://localhost:3000/api/restaurants \
  -H 'Content-Type: application/json' \
  -d '{"name":"the rusty spoon"}'                  # 409 duplicate

# Set this to the ID returned by the successful create above.
RESTAURANT_ID=6
curl -i -X PUT http://localhost:3000/api/restaurants/$RESTAURANT_ID \
  -H 'Content-Type: application/json' \
  -d '{"name":"Updated Spot","cuisine":"Test","address":"2 Test St","rating":4}'
curl -i -X PUT http://localhost:3000/api/restaurants/$RESTAURANT_ID \
  -H 'Content-Type: application/json' \
  -d '{"name":"Updated Spot","rating":6}'        # 400 invalid body
curl -i -X PUT http://localhost:3000/api/restaurants/99999 \
  -H 'Content-Type: application/json' \
  -d '{"name":"Missing","rating":4}'             # 404
curl -i -X DELETE http://localhost:3000/api/restaurants/99999 # 404
curl -i -X DELETE http://localhost:3000/api/restaurants/$RESTAURANT_ID # 204

# Part B read, create, bad input, and missing restaurant
curl -i http://localhost:3000/api/visits
curl -i -X POST http://localhost:3000/api/visits \
  -H 'Content-Type: application/json' \
  -d '{"restaurantId":1,"date":"2026-09-08","amountSpent":18.5,"notes":"Lunch"}'
curl -i -X POST http://localhost:3000/api/visits \
  -H 'Content-Type: application/json' \
  -d '{"restaurantId":1,"date":"not-a-date"}'
curl -i -X POST http://localhost:3000/api/visits \
  -H 'Content-Type: application/json' \
  -d '{"restaurantId":99999,"date":"2026-09-08"}'
```

I also checked the form in the browser with both an existing restaurant name
and a new typed name.

## Known issues / what I would do next

There is no automated test suite yet, and new-name creation plus visit creation
is not atomic. That means that if your connection drops while creating a visit,
the restaurant may not be created and the visit may not be saved. Those would be my first two follow-ups. The app also does not
yet offer a way to edit or delete a visit.
