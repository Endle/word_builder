# Letterform

A responsive, static English word-puzzle helper. No build step, account, API key, or backend is required.

## Run

Serve this directory (dictionary JSON downloads require HTTP or HTTPS):

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

On your computer, open `http://localhost:8000`. On a phone connected to the same Wi-Fi, open `http://<your-computer-LAN-IP>:8000`. Your firewall must allow the connection. Stop the server with Ctrl+C. For access outside your local network, publish these files on any static HTTPS host.

## Features

- Enter 2–20 letters, preserving repeated-letter counts.
- Exact lengths from 2–15 letters, or Any (2–15). Quick buttons include 3–7 letters. Changing length refreshes results automatically; rapid changes use the latest selection.
- On phones, fixed Puzzle / Results buttons switch between the two views. Find words opens Results; desktop keeps both panels visible.
- Starting/ending sequences and a full positional pattern (`_` or `?` for unknowns).
- Frequency ranking, alphabetical/length sorting, and a common-only filter.
- Eighteen suggestions per batch. Alternatives exclude all suggestions already displayed for the same letter multiset during this page visit. A normal search can show earlier matches again; alternatives will still exclude them. Reset clears history.
- Input errors, conflicting constraints, empty matches, and exhausted alternatives have explicit states.
- Optional per-word copy buttons; clipboard support depends on browser permissions and HTTPS or localhost.

## Data and privacy

`assets/words-2.json` through `assets/words-15.json` bundle 168,551 ENABLE entries of 2–15 letters. Matching never generates words. FrequencyWords ranks prioritize familiar terms, but frequency is only an estimate and puzzle dictionaries may accept different words. Obscure entries remain available unless common-only is selected. See `THIRD_PARTY_NOTICES.txt` for data sources and licenses.

All matching and suggestion history stay in browser memory. Google Fonts is the only optional external request; system sans-serif fallbacks work offline. There is no analytics or persistence. The site does not require a service worker, so offline access requires a locally running server.

## Verification

The pure solver tests cover letter multiplicity, combined constraints, validation, exclusions, ranking filters, sorting, and the real bundled dictionary. Run with a JavaScript runtime that supports `load` and `print`; on macOS:

```sh
/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc tests/solver.test.js
```

Files: `index.html` (semantic UI), `styles.css` (responsive design), `solver.js` (pure matching), `app.js` (page behavior), `dictionary-loader.js` (retryable dictionary loading), `assets/words-*.json` (dictionary by length).

### Mobile dictionary loading

The dictionary is split into JSON files by word length, downloaded with `fetch` only when needed. The default five-letter search transfers about 117 KB instead of loading a multi-megabyte JavaScript program. Any-length searches load only lengths possible with the supplied letters; a full pattern narrows this further. Successful downloads are cached in memory and concurrent requests share a download.

Each file gets a 20-second timeout and one automatic retry with cache bypass. Errors distinguish network failures, HTTP statuses, timeouts, malformed JSON, and invalid entries. Find words can retry after failure. There is no external dictionary API.

Loader regression tests cover actual JSON files, caching, HTTP errors, malformed data, retries, timeouts, and concurrent requests:

```sh
/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc tests/dictionary-loader.test.js
```

Page interaction tests cover automatic length changes, changes during pending downloads, the three-letter PIT/POT example, and mobile view switching:

```sh
/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc tests/app.test.js
```
These tests use DOM stand-ins; visual/device testing is still manual.
