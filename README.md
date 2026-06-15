# Portfolio — Personal Developer Website

A lightweight, JSON-driven portfolio in **vanilla JavaScript**. No frameworks, no build step. All content and presentation come from `db.json`, which is validated against a schema before rendering.

## Configuration

Everything is controlled by the owner through the `Config` block in `db.json`:

```json
"Config": {
    "Theme": "cream-sienna",
    "Font": "mono",
    "Layout": "static"
}
```

- **Theme** — `cream-sienna` (default), `cream-pine`, `slate-amber`, `midnight-rose` (dark), `sand-plum`
- **Font** — `mono` (default) or `serif`
- **Layout** — `static` (single page: Skills → Experience → Projects → Education) or `dynamic` (tabbed). Mobile is always single page.

## Running

The app `fetch()`es `db.json`, so serve over HTTP rather than opening the file directly:

```bash
npx serve .        # or: python -m http.server
```

Then open `portfolio.html`.
