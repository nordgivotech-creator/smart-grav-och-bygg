# Smart Gräv och Bygg – hemsida + personalpanel

Inga beroenden (Node 18+). Start: `node server.js` eller `start.bat`.

- Sidan: `/`  ·  Personalpanel: `/admin`
- Första starten skapar ett lösenord som visas EN gång i konsolen (eller sätt `ADMIN_PASSWORD` före första start).
- Glömt lösenord: ta bort `data/admin.json` och starta om (ny skapas). Förfrågningar ligger kvar i `data/inquiries.json`.
- **Säkerhetskopiera mappen `data/`** – där ligger alla förfrågningar.

## Miljövariabler
| Variabel | Syfte |
|---|---|
| `PORT` | Port (standard 3000) |
| `DATA_DIR` | Var data lagras (peka på persistent disk i produktion) |
| `TRUST_PROXY=1` | Bakom proxy/hosting – ger rätt IP för spärr mot spam |
| `ADMIN_PASSWORD` | Startlösenord vid första start |
| `NOTIFY_WEBHOOK_URL` | Valfritt: Discord/Slack/ntfy-URL som pingas vid ny förfrågan |

## Publicera
Kräver en server med **persistent disk** (data sparas i en fil), HTTPS och en domän.
- **Fly.io / Render / Railway:** deploya med `Dockerfile`, montera en volym på `/data`, sätt `TRUST_PROXY=1` och `ADMIN_PASSWORD`. Hälsokontroll: `/healthz`.
- **Egen VPS:** `node server.js` bakom Nginx/Caddy (HTTPS), kör med pm2 eller systemd.
- Efter publicering: lägg till `sitemap.xml` och domänen i `og:`-taggar.
