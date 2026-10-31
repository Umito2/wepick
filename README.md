# WePick website

A responsive, buildless website for **WePick — The Zero-Argument Decision Engine**. It includes an interactive two-partner browser demo, Android/source downloads, and locally served photography.

**[Open the live WePick website →](https://umito2.github.io/wepick/)**

The website is hosted publicly on GitHub Pages from this repository's `docs/` directory. Anyone can open the link without a ChatGPT account.

## Preview locally

Serve `docs/` with a static HTTP server. For example, from this repository:

```sh
python -m http.server 4173 --directory docs
```

Open <http://localhost:4173>. The demo loads `catalog.json`, so opening `index.html` directly from the filesystem is insufficient. There is no build step or package installation for the website.

## Check the source

With Node.js installed:

```sh
node --check docs/app.js
node --test tests/demo-model.test.cjs
```

The browser demo simulates both partners on one page. It supports independent votes, mutual matches, limited vetoes, and a roulette choice from the union of liked items after both partners finish. It does not authenticate visitors or connect separate devices.

## Android downloads

- [`wepick-android-preview.zip`](docs/downloads/wepick-android-preview.zip) contains the debug-signed Android emulator APK and `SETUP.txt`.
- [`wepick-mvp.zip`](docs/downloads/wepick-mvp.zip) contains the native Android project and Firebase backend source.

The supplied APK uses **anonymous sign-in only** and requires local Firebase Authentication, Firestore, and Cloud Functions emulators. Google sign-in is hidden in this preview; production Android builds require a real Firebase project and Google OAuth configuration. Follow `SETUP.txt` and the Android source README before testing. The Android source archive excludes this website.

## Publish elsewhere

For classic GitHub Pages, select **Deploy from a branch**, choose the repository's main branch, and select **`/docs`**. The included `.nojekyll` serves the static files directly. The canonical and Open Graph URLs point to `https://umito2.github.io/wepick/`.

For other hosts, use `docs/` as the static document root. Deploy all files together, including `catalog.json`, `images/`, `downloads/`, and `credits.html`. If publishing under a new domain, update the canonical and Open Graph URLs in `docs/index.html`.

## Photo credits

Photography by Tim Mossholder, Nik Owens, Georgia Vagim, and Julia Ivanina is used under the standard [Unsplash License](https://unsplash.com/license). Verified source links, download details, and attribution are retained in [ASSETS.md](ASSETS.md) and the visible [photo credits page](docs/credits.html).

Deployment credentials, runtime data, and local QA artifacts are excluded from this repository.
