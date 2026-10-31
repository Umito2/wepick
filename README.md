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

Budget guides use Egyptian pounds for **two people**: up to **EGP 300**, up to **EGP 700**, or **any budget**. Cards show up to EGP 300, EGP 301–700, and over EGP 700. These are illustrative tiers attached to preloaded ideas, not live menu quotes or dollar conversions; actual restaurant and venue costs need to be confirmed.

## Android downloads

- [`WePick-1.1.1.apk`](docs/downloads/WePick-1.1.1.apk) is the signed Android 8.0+ phone build, configured for Firebase Authentication and the Firestore Spark backend.
- [`wepick-mvp.zip`](docs/downloads/wepick-mvp.zip) contains the native Android project and Firebase backend source.
- The [1.0.2 emulator developer archive](https://github.com/Umito2/wepick/releases/tag/v1.0.2-emulator-preview) retains the older APK and its matching source/setup files.

The **1.1.1 phone build** uses **anonymous sign-in** and an internet connection for Firebase Authentication, partner pairing, and real-time shared sessions across phones. It does not need local Firebase emulators, Cloud Functions, a billing account, or a payment card. Keep the backend project on Spark; free quotas apply and service may pause when an allowance is exhausted. Google sign-in remains hidden until a production web OAuth client is configured.

The Android tie-breaker chooses an eligible liked item on the client and stores one shared result. Firestore rules validate the candidate and completed voting; they cannot certify a modified client's randomness. No paid AI service is used. See the source README for [Firebase Spark plan](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans) setup and [Firestore quotas](https://firebase.google.com/docs/firestore/quotas).

**Installation and Play Integrity attestation on physical phones have not yet been validated for this release.** The build retains bounded loading, retry controls, and the **Try browser demo** button. The [browser demo](https://umito2.github.io/wepick/#demo) simulates both partners on one page and does not connect phones.

The **1.0.2 developer archive** still points to `10.0.2.2` and requires a computer Android emulator plus local Firebase Auth, Firestore, and Functions emulators. Follow its included `SETUP.txt` before using it. The Android source archive excludes this website.

## Publish elsewhere

For classic GitHub Pages, select **Deploy from a branch**, choose the repository's main branch, and select **`/docs`**. The included `.nojekyll` serves the static files directly. The canonical and Open Graph URLs point to `https://umito2.github.io/wepick/`.

For other hosts, use `docs/` as the static document root. Deploy all files together, including `catalog.json`, `images/`, `downloads/`, and `credits.html`. If publishing under a new domain, update the canonical and Open Graph URLs in `docs/index.html`.

## Photo credits

Photography by Tim Mossholder, Nik Owens, Georgia Vagim, and Julia Ivanina is used under the standard [Unsplash License](https://unsplash.com/license). Verified source links, download details, and attribution are retained in [ASSETS.md](ASSETS.md) and the visible [photo credits page](docs/credits.html).

Deployment credentials, runtime data, and local QA artifacts are excluded from this repository.
