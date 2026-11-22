# NEXO — People • Places • Experiences

Jeden ekosystém pro gay komunitu v Praze. Seznamka, e-shop, kluby, meetingy a komunita propojené jedním členstvím **NEXO+**.

![Návrh](docs/navrh.png)

## Co web umí (demo)

| Sekce | Funkce |
|---|---|
| **Domů** | Hero, karta NEXO+, 5 pilířů ekosystému, tarify |
| **Seznamka** (`#seznamka`) | **Skutečná, nad Supabase.** Registrace e-mailem (18+), profil s až 6 fotkami (EXIF/GPS se odstraní), **Okolí** = mřížka podle vzdálenosti s online stavem a filtry (Grindr), **Swipe** s matchem při vzájemném lajku (Tinder), **tapy** 👋🔥😉, **chat v reálném čase** s fotkami a „Přečteno“, blokování, nahlášení, skrytí vzdálenosti, smazání účtu |
| **E-shop** (`#/shop`) | Kategorie, produkty, exkluzivní merch jen pro členy, košík, sleva 5–10 % pro NEXO+, body za nákup |
| **Heaven** (`#/heaven`) | Program klubu, vstupenky, members-only noci, sleva 20 % pro NEXO+ |
| **The Pitch** (`#/pitch`) | Speed dating (kapacita), drag shows, komunitní večery, prioritní registrace |
| **Friends** (`#/friends`) | Tematické skupiny a meetupy, privátní skupina pro členy |
| **Členství** (`#/clenstvi`) | Free / Dating Ad-Free (99 Kč) / NEXO+ (299 Kč), srovnávací tabulka, FAQ |
| **Účet** (`#/ucet`) | Digitální členský průkaz s QR, NEXO Rewards (body a odměny), vstupenky, skupiny |

Seznamka běží naostro na Supabase (projekt `nexo`, Frankfurt). Ostatní části (e-shop, akce, členství) jsou zatím demo se stavem v `localStorage`.

### Backend (Supabase)
- Tabulky `profiles`, `locations`, `swipes`, `matches`, `taps`, `messages`, `blocks`, `reports` — vše s RLS.
- Poloha je v tabulce `locations`, kterou nikdo kromě vlastníka nepřečte; ostatní dostanou jen vypočtenou vzdálenost z funkce `nearby()`.
- RPC: `nearby`, `swipe`, `conversations`, `mark_read`, `mark_taps_seen`, `heartbeat`, `delete_account`.
- Realtime na `messages`, `taps`, `matches`. Fotky v bucketu `photos` (zápis jen do vlastní složky).
- 8 ukázkových profilů (`is_demo = true`) — lajkují zpět a v chatu automaticky odpoví. Smazání: `delete from auth.users where email like 'demo.%@nexo.invalid';`
- Schéma je v migracích projektu (Supabase Dashboard → Database → Migrations).

## Spuštění

Žádný build. Stačí statický server:

```bash
python3 -m http.server 8000
# otevři http://localhost:8000
```

Web je nasazený přes GitHub Pages.

## Struktura

```
index.html        kostra stránky
css/styles.css    design (tmavý, fialovo-růžový gradient)
js/icons.js       SVG ikony
js/data.js        ukázková data: profily, produkty, akce, skupiny, tarify, odměny
js/app.js         router a logika webu
js/dating.js      seznamka (Supabase klient)
js/config.js      URL a publishable klíč Supabase
css/dating.css    vzhled seznamky
assets/           favicon
docs/navrh.png    původní návrh
```

## Další kroky pro produkci

- Backend + přihlášení (např. Supabase: auth, profily, chat v reálném čase, objednávky)
- Platební brána (GoPay / Comgate / Stripe) pro předplatné, e-shop a vstupenky
- Skutečné fotky profilů s moderací a ověřováním
- Validovatelné QR kódy pro vstup do klubů
- Ověření věku 18+, GDPR, obchodní podmínky
