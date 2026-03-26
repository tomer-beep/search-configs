# search-configs POC

Express + TypeScript POC for generating modified browser search config files. Ports the `getModifiedWebDataFile` functionality from the `installer-rules-engine` NestJS service, without the framework, middleware, or database.

## What it does

`POST /api/mf` generates a browser-specific search configuration file with a custom search URL embedded, then returns it as a file download. Supports:

- **Firefox** — produces a `search.json.mozlz4` file (lz4-compressed JSON with custom engine injected)
- **Chrome** — produces a `Web Data` SQLite file with the Keywords table updated

## Project structure

```
src/
  app.ts                          # Express app and route definitions
  index.ts                        # Server entry point
  types/
    user.ts                       # User interface
  data/
    users.ts                      # In-memory user store (replaces MongoDB)
  services/
    search-url.service.ts         # Constructs the search URL from user fields
    firefox.service.ts            # Firefox buffer generation (lz4 compression)
    chrome.service.ts             # Chrome buffer generation (SQLite patching)
    browser-service.factory.ts    # Selects the right service by browser type
  templates/
    firefoxSearchConfig.json      # Firefox search config template
    webDataTemplate.db            # Chrome Web Data SQLite template
```

## Setup

```bash
npm install
```

## Running

```bash
# Dev mode (auto-reload)
npm run dev

# One-shot
npm start
```

Server starts on `http://localhost:3000` by default. Set `PORT` env var to change.

## API

### `POST /api/mf`

Generates and downloads the modified browser search config file.

**Query params**

| Param       | Required | Values              | Description                                 |
|-------------|----------|---------------------|---------------------------------------------|
| `browser`   | yes      | `chrome`, `firefox` | Target browser                              |
| `profileId` | no       | any string          | Firefox only — used to hash the engine ID   |

**Request body**

```json
{ "uid": "user-001" }
```

**Response**

Binary file download (`Content-Disposition: attachment`).

| Browser | Filename               | Format                  |
|---------|------------------------|-------------------------|
| Firefox | `search.json.mozlz4`   | lz4-compressed JSON     |
| Chrome  | `Web Data`             | SQLite database         |

**Error responses**

```json
{ "error": "browser must be one of: chrome, firefox" }   // 400
{ "error": "uid is required in request body" }           // 400
{ "error": "User not found: <uid>" }                     // 404
{ "error": "<message>" }                                 // 500
```

## In-memory users

Two sample users are pre-loaded in `src/data/users.ts`:

| uid        | searchDomain         | brandToken   |
|------------|----------------------|--------------|
| `user-001` | `search.example.com` | `tok_abc123` |
| `user-002` | `find.demo.io`       | `tok_xyz789` |

Add more entries to the `Map` in that file as needed.

## Example requests

```bash
# Firefox (with profileId)
curl -X POST "http://localhost:3000/api/mf?browser=firefox&profileId=abc123" \
  -H "Content-Type: application/json" \
  -d '{"uid":"user-001"}' \
  --output search.json.mozlz4

# Chrome
curl -X POST "http://localhost:3000/api/mf?browser=chrome" \
  -H "Content-Type: application/json" \
  -d '{"uid":"user-001"}' \
  --output "Web Data"
```

## How the search URL is built

`constructSearchUrl` in `search-url.service.ts` composes a URL from the user record:

```
https://<searchDomain>/?utm=1&pid=<brandToken>&cid=<campaignId>&t=p&a=<dd-mm-yyyy>&u=<sha256(uid)>&q={searchTerms}
```

`{searchTerms}` is left as a literal template placeholder (required by both Chrome and Firefox search engine specs).
