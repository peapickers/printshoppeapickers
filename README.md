# Fine Art Printshop – webshop

Een statische webshop: geen server, geen betaalprovider, geen kosten voor hosting.
De klant stelt prints samen, kiest een levermoment in de kalender en krijgt een
QR-code met de bestelbon. Er wordt betaald aan de deur.

## Hoe een bestelling bij je binnenkomt

1. De klant drukt op **Bestelling plaatsen**.
2. Je gsm krijgt meteen een **pushmelding** via ntfy, met naam, aantal prints, bedrag en levermoment. Tik erop om de bestelbon te openen.
3. De klant tikt op **Mail mijn bestelling**. Er komt een ingevulde mail van de klant naar `printshoppeapickers@proton.me`.
4. Proton stuurt automatisch je **bevestiging** terug.
5. De klant uploadt de foto's via de **uploadlink** (versleutelde bestandsaanvraag).
6. Jij zet het levermoment in je Proton-agenda. Binnen een paar uur verdwijnt het uit de kalender op de site.

## Eenmalig instellen

### 1. Pushmeldingen (ntfy, gratis, zonder account)
- Installeer de app **ntfy** (Android: Play Store of F-Droid, iPhone: App Store).
- Tik op **+** en abonneer je op het onderwerp dat in `js/config.js` staat bij `ntfyTopic`.
- Zet de meldingen van die app op "hoge prioriteit", zodat ze ook in stille modus binnenkomen.
- Hou het woord geheim. Wie het kent, kan je meldingen sturen. Gebeurt dat toch, kies dan een nieuw woord in `config.js`.

### 2. Automatische bevestiging (Proton Mail Plus)
Ga in Proton Mail naar **Instellingen → Alle instellingen → Automatisch antwoord**. Zet het aan op **Permanent** en plak deze tekst:

> Dag,
>
> Dank je voor je bestelling! Ik heb ze goed ontvangen en begin er weldra aan.
>
> Heb je je foto's nog niet doorgestuurd? Gebruik dan de knop "Upload hier je foto's" op de bestelpagina. Vergeet je bestelnummer niet.
>
> Ik lever op het moment dat je gekozen hebt. Je betaalt bij de levering, aan de deur. Moet het moment toch veranderen? Antwoord gewoon op deze mail.
>
> Tot binnenkort,
> Jonas

Dit antwoord gaat naar iedereen die je mailt, dus de tekst is zo geschreven dat hij ook bij gewone vragen klopt.

### 3. Leverkalender koppelen aan je Proton-agenda
De kalender op de site toont elke dag van 10:00 tot 21:00, minstens 3 dagen na vandaag.
Alles wat bezet staat in je agenda verdwijnt automatisch.

1. Proton Calendar (web) → **Instellingen → Agenda's → je agenda → Delen met iedereen → Link maken**.
2. Kies **Beperkte weergave** (alleen bezet/vrij, geen titels of details).
3. Kopieer de link.
4. GitHub → deze repo → **Settings → Secrets and variables → Actions → New repository secret**.
   Naam: `AGENDA_ICS_URL`, waarde: de link.
5. **Actions → Leverkalender bijwerken → Run workflow**. Daarna loopt het vanzelf elk uur.

De site ziet alleen begin- en einduren van bezette blokken (`beschikbaarheid.json`), nooit wat er in je agenda staat.
Proton werkt een gedeelde link tot 8 uur later bij. Twee klanten kunnen dus kort na elkaar hetzelfde uur kiezen.
Zet een bevestigde levering daarom meteen in je agenda.

### 4. Uploadlink voor bestanden
Maak een bestandsaanvraag (file request) aan in je versleutelde opslag en plak de link in `js/config.js` bij `uploadUrl`.
Zolang dat veld leeg is, verwijst de site naar SwissTransfer.

### 5. Prijzen, uren en andere instellingen
Alles staat in **`js/config.js`**: prijzen per papiersoort, leverkost, leveruren, duur van een levermoment,
minimum aantal dagen vooraf, leverzone (postcodes) en de link naar de postershop van vzw peapickers.

## Bestanden

| Bestand | Wat |
|---|---|
| `index.html` | Startpagina |
| `bestellen.html`, `js/bestellen.js` | Bestelformulier, scherptecontrole, kalender, QR |
| `bon.html` | Bestelbon die de QR-code opent. Rekent het bedrag zelf opnieuw uit. |
| `uploadgids.html` | Stappenplan voor klanten |
| `js/config.js` | Alle instellingen |
| `beschikbaarheid.json` | Bezette blokken, automatisch bijgewerkt |
| `scripts/beschikbaarheid.mjs`, `.github/workflows/` | Agenda → `beschikbaarheid.json` |

Lokaal bekijken: `python3 -m http.server` in deze map en open http://localhost:8000.
