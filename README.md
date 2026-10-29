# ShareBite

A neighbourhood table for Jaipur: share surplus food with verified community organisations.

## Development

Requires Node.js 20.19+ (Node 22 LTS recommended) and npm 10+.

```sh
npm install
npm run dev
```

The client uses http://localhost:5173 and proxies API requests to port 4000. Run `npm run lint` and `npm run build` to check the workspace. Environment settings are documented in `.env.example`; never commit your `.env`.

## Design and implementation

The [design brief](docs/design-brief.md) defines the neighbourhood-table identity. [Architecture contracts](docs/architecture.md) describe authorization, data privacy, seed behaviour and runtime assumptions. Existing feature branches were merged through pull requests; descriptions are retained under `docs/pull-requests/`. The current continuation uses direct, focused commits to main with owner authorization.

Current milestone: repository and development tooling. Application features and the three-minute demo guide will be documented as their branches land.

thats all.
