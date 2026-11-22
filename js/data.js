/* Ukázková data. V produkci nahradí API / databáze. */
window.NEXO_DATA = {
  plans: [
    {
      id: 'free', name: 'Free', price: 0,
      lead: 'Základ pro každého.',
      features: ['Základní funkce seznamky', 'Omezené lajky (15 denně)', 'Chat po matchi', 'Přístup k eventům', 'Základní nabídka e-shopu'],
      missing: ['Reklamy v aplikaci', 'Bez členských slev'],
    },
    {
      id: 'adfree', name: 'Dating Ad-Free', price: 99,
      lead: 'Seznamka naplno, bez rušení.',
      features: ['Vše z Free', 'Bez reklam v seznamce', 'Neomezené lajky', 'Pokročilé filtry', 'Více fotek a možností profilu'],
      missing: ['Bez extra slev v e-shopu', 'Bez výhod na akce a kluby'],
    },
    {
      id: 'plus', name: 'NEXO+ Membership', price: 299, popular: true,
      lead: 'Celý ekosystém v jednom členství.',
      features: ['Vše z Dating Ad-Free', '5–10% sleva v e-shopu', 'Sleva na vstupy do Heaven a The Pitch', 'Members-only eventy', 'Prioritní registrace na akce', 'Exkluzivní nabídky a merch', 'NEXO Rewards (kredity / body)', 'Speciální funkce v seznamce'],
      missing: [],
    },
  ],

  profiles: [
    { id: 'p1', name: 'Tomáš', age: 29, km: 2, area: 'Vinohrady', hue: 265, verified: true, modes: ['date', 'friends'], bio: 'Architekt, kafe na Jiřáku a víkendy na kole. Hledám někoho na dlouhé procházky i dlouhé rozhovory.', tags: ['Architektura', 'Cyklistika', 'Káva'] },
    { id: 'p2', name: 'Jakub', age: 26, km: 4, area: 'Karlín', hue: 320, verified: true, modes: ['date', 'tonight'], bio: 'Barista přes den, DJ v noci. V sobotu mě najdeš v Heaven.', tags: ['Hudba', 'Heaven', 'Noční život'] },
    { id: 'p3', name: 'Martin', age: 34, km: 1, area: 'Žižkov', hue: 210, verified: false, modes: ['friends'], bio: 'Nový v Praze, hledám partu na běhání a pivo po něm. 🏃‍♂️', tags: ['Běh', 'Pivo', 'Nový v Praze'] },
    { id: 'p4', name: 'Lukáš', age: 31, km: 6, area: 'Smíchov', hue: 285, verified: true, modes: ['date', 'friends', 'tonight'], bio: 'Kuchař, fotograf a milovník drag shows. Uvařím, když vybereš víno.', tags: ['Vaření', 'Drag', 'Foto'] },
    { id: 'p5', name: 'Ondřej', age: 27, km: 3, area: 'Letná', hue: 190, verified: true, modes: ['date'], bio: 'Doktorand fyziky. Dokážu vysvětlit černé díry, ne svůj vkus na filmy.', tags: ['Věda', 'Film', 'Lezení'] },
    { id: 'p6', name: 'Filip', age: 24, km: 8, area: 'Holešovice', hue: 340, verified: false, modes: ['friends', 'tonight'], bio: 'Student designu. Speed dating v The Pitch? Jdu do toho.', tags: ['Design', 'The Pitch', 'Umění'] },
    { id: 'p7', name: 'David', age: 38, km: 5, area: 'Nusle', hue: 240, verified: true, modes: ['date', 'friends'], bio: 'Učitel angličtiny, cestovatel. Plánuju výlet do Lisabonu — přidáš se?', tags: ['Cestování', 'Jazyky', 'Jóga'] },
    { id: 'p8', name: 'Adam', age: 30, km: 2, area: 'Staré Město', hue: 300, verified: true, modes: ['tonight', 'date'], bio: 'Produkťák v tech firmě. Rád tančím, ještě radši vybírám hudbu.', tags: ['Tanec', 'Tech', 'Vinyly'] },
  ],

  replies: [
    'Ahoj! 😊 Rád tě poznávám.',
    'To zní dobře. Kdy máš čas?',
    'Haha, souhlas. Jdeš v sobotu do Heaven?',
    'Co třeba kafe tenhle týden?',
    'Viděl jsem tě na The Pitch akci, ne?',
  ],

  productCats: [
    { id: 'all', name: 'Vše' },
    { id: 'wellness', name: 'Wellness & péče' },
    { id: 'intimate', name: 'Intimní pomůcky' },
    { id: 'fragrance', name: 'Parfémy' },
    { id: 'merch', name: 'NEXO merch' },
  ],

  products: [
    { id: 's1', name: 'NEXO Noir parfém', cat: 'fragrance', price: 1490, hue: 270, badge: 'Bestseller', desc: 'Kouřová vanilka, cedr a černý pepř. 50 ml.', exclusive: false },
    { id: 's2', name: 'Masážní olej Amber', cat: 'wellness', price: 449, hue: 30, desc: 'Hřejivý olej s jantarem a sladkým mandlovým olejem. 150 ml.', exclusive: false },
    { id: 's3', name: 'Lubrikační gel Aqua', cat: 'intimate', price: 299, hue: 200, desc: 'Na vodní bázi, bez parfemace, dermatologicky testováno. 100 ml.', exclusive: false },
    { id: 's4', name: 'Sada péče o vousy', cat: 'wellness', price: 690, hue: 45, desc: 'Olej, balzám a kartáč z kančích štětin.', exclusive: false },
    { id: 's5', name: 'NEXO Heaven tričko', cat: 'merch', price: 590, hue: 300, badge: 'Jen pro členy', desc: 'Oversize, 100% organická bavlna, reflexní potisk.', exclusive: true },
    { id: 's6', name: 'Intimní set Velvet', cat: 'intimate', price: 1190, hue: 330, desc: 'Prémiová sada v diskrétním balení. Medical-grade silikon.', exclusive: false },
    { id: 's7', name: 'Body lotion Night', cat: 'wellness', price: 390, hue: 250, desc: 'Lehké tělové mléko s pižmem a santalem. 200 ml.', exclusive: false },
    { id: 's8', name: 'NEXO+ kšiltovka', cat: 'merch', price: 490, hue: 280, badge: 'Jen pro členy', desc: 'Černá s vyšívaným logem NEXO.', exclusive: true },
    { id: 's9', name: 'Kondomy Ultra Thin 12 ks', cat: 'intimate', price: 249, hue: 190, desc: 'Tenké, spolehlivé, certifikované dle EN ISO 4074.', exclusive: false },
    { id: 's10', name: 'Svíčka Velvet Room', cat: 'wellness', price: 540, hue: 15, badge: 'Novinka', desc: 'Sójový vosk, tabák a fíkový list. 40 hodin hoření.', exclusive: false },
  ],

  events: [
    { id: 'e1', venue: 'heaven', title: 'NEXO Night', date: '2026-11-28', time: '22:00', price: 250, desc: 'Hlavní sobotní noc s rezidentními DJs a světelnou show.', cat: 'Party' },
    { id: 'e2', venue: 'pitch', title: 'Speed Dating 25–35', date: '2026-11-26', time: '19:00', price: 190, desc: '8 minut, 10 rande, jeden večer. Moderuje tým NEXO.', cat: 'Speed dating', capacity: 30, taken: 22 },
    { id: 'e3', venue: 'pitch', title: 'Drag Bingo s Lady Vltava', date: '2026-11-29', time: '20:00', price: 150, desc: 'Bingo, glitter a nejlepší hlášky v Praze.', cat: 'Drag show' },
    { id: 'e4', venue: 'heaven', title: 'Members Only: Black Room', date: '2026-12-05', time: '23:00', price: 300, desc: 'Uzavřená noc jen pro členy NEXO+. Dress code: černá.', cat: 'Members-only', membersOnly: true },
    { id: 'e5', venue: 'pitch', title: 'Komunitní večer: Coming out stories', date: '2026-12-02', time: '18:30', price: 0, desc: 'Bezpečný prostor pro sdílení příběhů. Vstup zdarma.', cat: 'Komunita' },
    { id: 'e6', venue: 'heaven', title: 'Pop Divas Night', date: '2026-12-12', time: '22:00', price: 250, desc: 'Celou noc největší popové hity. Karaoke stage od půlnoci.', cat: 'Party' },
    { id: 'e7', venue: 'pitch', title: 'Speed Dating 35+', date: '2026-12-10', time: '19:00', price: 190, desc: 'Seznamovací večer pro zralejší ročníky.', cat: 'Speed dating', capacity: 24, taken: 9 },
    { id: 'e8', venue: 'nexo', title: 'NEXO Christmas Gala', date: '2026-12-19', time: '20:00', price: 590, desc: 'Vánoční večírek celé komunity. Prioritní registrace pro NEXO+.', cat: 'Speciální NEXO event', priority: true },
  ],

  groups: [
    { id: 'g1', name: 'Běžci Stromovka', icon: 'run', members: 84, next: 'Čt 26. 11. • 18:00', desc: 'Pohodové 5–8 km kolem Stromovky, pak pivo.', cat: 'Sport' },
    { id: 'g2', name: 'NEXO Travel', icon: 'plane', members: 142, next: 'Výlet: Vídeň 5. 12.', desc: 'Společné výlety, city breaky a vánoční trhy.', cat: 'Cestování' },
    { id: 'g3', name: 'Kino & kultura', icon: 'sparkle', members: 97, next: 'Ne 29. 11. • 17:00 Bio Oko', desc: 'Filmy, divadla, výstavy a debaty po nich.', cat: 'Kultura' },
    { id: 'g4', name: 'Deskovky na Žižkově', icon: 'users', members: 56, next: 'Út 1. 12. • 19:00', desc: 'Každé úterý deskové hry. Začátečníci vítáni.', cat: 'Meetup' },
    { id: 'g5', name: 'Noví v Praze', icon: 'pin', members: 211, next: 'So 28. 11. • 15:00 Náplavka', desc: 'Pro ty, kdo se přistěhovali a hledají kamarády.', cat: 'Komunita' },
    { id: 'g6', name: 'Members Lounge', icon: 'lock', members: 64, next: 'Pá 4. 12. • 19:00', desc: 'Privátní večery a ochutnávky pro členy NEXO+.', cat: 'Privátní', membersOnly: true },
  ],

  rewards: [
    { id: 'r1', name: 'Drink voucher v Heaven', cost: 150, icon: 'cocktail' },
    { id: 'r2', name: 'Vstup zdarma do The Pitch', cost: 300, icon: 'ticket' },
    { id: 'r3', name: 'Sleva 200 Kč v e-shopu', cost: 400, icon: 'bag' },
    { id: 'r4', name: 'Super Like balíček (5×)', cost: 120, icon: 'star' },
  ],
};
