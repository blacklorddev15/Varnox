# Varnox Verification Notes

The live website is `https://varnox-delta.vercel.app/`. Its deployed frontend currently calls `/api`, while the tracked Vercel function is `api/pair.js`, so `/api` and `/api?stats=1` return HTTP 404. The live `/api/pair?stats=1` endpoint returns status metadata but still reports the default allocation `139.59.111.210:25572`.

The Varnox backend archive already contains the complete command/plugin tree, visible `.env` templates, dotenv loading, and an existing `/pair?phone=...` HTTP bridge inside `index.js` on `PORT`/`SERVER_PORT` (defaulting to 3001). It also exposes an unrelated `/api/create-panel` endpoint on port 3002. The Pterodactyl allocation at `139.59.111.210:25572` accepted a `/pair` request but closed the connection without a response, indicating the running Varnox process currently needs console inspection for a pairing-route crash.

The website needs its default bridge URL changed from `/api` to `/api/pair`, plus honest online/offline status and no simulated admin/key success responses. The backend route should be tested after the website bridge is corrected.

The authenticated Pterodactyl server list identifies Varnox MD as server UUID `5574df2c-405e-4d0b-aaee-42c217a5b1db` on node `SanzShop`, allocation `139.59.111.210:25572`, with status Active. Source: `https://pterodactyl.mzazi.shop/admin/servers`.

The Varnox Pterodactyl console is server UUID prefix `5574df2c`, allocation `139.59.111.210:25572`, and currently shows `Offline` with only the prior `Server marked as offline...` console line. A start operation is required before capturing runtime logs.

Varnox server startup is active on Pterodactyl, but its startup command unpacks the legacy root archive `Varnox_MD_backend.zip` into `.varnox` before running `npm start`. The console is still in dependency installation (`npm install --omit=dev`); no Varnox bridge-ready line is visible yet. This explains why the live port was previously unstable and why the installed archive must be replaced or its startup source updated with the website-enabled package.
