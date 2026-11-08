# Letterform

A responsive, static English word-puzzle helper. No build step, account, API key, or backend is required.

## Run

Open `index.html` directly in a browser, or serve this directory:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

On your computer, open `http://localhost:8000`. On a phone connected to the same Wi-Fi, open `http://<your-computer-LAN-IP>:8000`. Your firewall must allow the connection. Stop the server with Ctrl+C. For access outside your local network, publish these files on any static HTTPS host.

## Features

- Enter 2–20 letters, preserving repeated-letter counts.
- Exact lengths from 2–15 letters, or Any (2–15).
- Starting/ending sequences and a full positional pattern (`_` or `?` for unknowns).
- Frequency ranking, alphabetical/length sorting, and a common-only filter.
- Eighteen suggestions per batch. Alternatives exclude all suggestions already displayed for the same letter multiset during this page visit. A normal search can show earlier matches again; alternatives will still exclude them. Reset clears history.
- Input errors, conflicting constraints, empty matches, and exhausted alternatives have explicit states.
- Optional per-word copy buttons; clipboard support depends on browser permissions and HTTPS or localhost.

## Data and privacy

`assets/words.js` bundles 168,551 ENABLE entries of 2–15 letters. Matching never generates words. FrequencyWords ranks prioritize familiar terms, but frequency is only an estimate and puzzle dictionaries may accept different words. Obscure entries remain available unless common-only is selected. See `THIRD_PARTY_NOTICES.txt` for data sources and licenses.

All matching and suggestion history stay in browser memory. Google Fonts is the only optional external request; system sans-serif fallbacks work offline. There is no analytics or persistence. The site does not require a service worker, so initial offline access requires local files or a locally running server.

## Verification

The pure solver tests cover letter multiplicity, combined constraints, validation, exclusions, ranking filters, sorting, and the real bundled dictionary. Run with a JavaScript runtime that supports `load` and `print`; on macOS:

```sh
/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc tests/solver.test.js
```

Files: `index.html` (semantic UI), `styles.css` (responsive design), `solver.js` (pure matching), `app.js` (page behavior), `dictionary-loader.js` (retryable dictionary loading), `assets/words.js` (dictionary).

### Mobile dictionary loading

The dictionary is stored as a JSON string and parsed with `JSON.parse`, avoiding a large nested JavaScript array literal. The page waits for loading, retries one failed request with a fresh URL, and allows another attempt via Find words. A 30-second timeout prevents an indefinitely pending download. The dataset remains bundled and requires no external dictionary API.

Loader regression tests simulate success, download failures, missing data, retries, and concurrent requests:

```sh
/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc tests/dictionary-loader.test.js
```
