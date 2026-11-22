# NEXO — People • Places • Experiences

Jeden ekosystém pro gay komunitu v Praze. Seznamka, e-shop, kluby, meetingy a komunita propojené jedním členstvím **NEXO+**.

![Návrh](docs/navrh.png)

## Co web umí (demo)

| Sekce | Funkce |
|---|---|
| **Domů** | Hero, karta NEXO+, 5 pilířů ekosystému, tarify |
| **Seznamka** (`#/seznamka`) | Režimy Date / Friends / Tonight, swipe karty (myš, dotyk, šipky ←/→), matche, chat, limit lajků pro Free, filtry a vrácení swipu pro Ad-Free/NEXO+, Super like pro NEXO+, reklamy jen ve Free |
| **E-shop** (`#/shop`) | Kategorie, produkty, exkluzivní merch jen pro členy, košík, sleva 5–10 % pro NEXO+, body za nákup |
| **Heaven** (`#/heaven`) | Program klubu, vstupenky, members-only noci, sleva 20 % pro NEXO+ |
| **The Pitch** (`#/pitch`) | Speed dating (kapacita), drag shows, komunitní večery, prioritní registrace |
| **Friends** (`#/friends`) | Tematické skupiny a meetupy, privátní skupina pro členy |
| **Členství** (`#/clenstvi`) | Free / Dating Ad-Free (99 Kč) / NEXO+ (299 Kč), srovnávací tabulka, FAQ |
| **Účet** (`#/ucet`) | Digitální členský průkaz s QR, NEXO Rewards (body a odměny), vstupenky, skupiny |

Vše běží v prohlížeči — stav (tarif, košík, matche, vstupenky, body) se ukládá do `localStorage`. Platby, přihlášení a QR kódy jsou zatím demo.

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
js/app.js         router a celá logika aplikace
assets/           favicon
docs/navrh.png    původní návrh
```

## Další kroky pro produkci

- Backend + přihlášení (např. Supabase: auth, profily, chat v reálném čase, objednávky)
- Platební brána (GoPay / Comgate / Stripe) pro předplatné, e-shop a vstupenky
- Skutečné fotky profilů s moderací a ověřováním
- Validovatelné QR kódy pro vstup do klubů
- Ověření věku 18+, GDPR, obchodní podmínky
