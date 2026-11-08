// Alles wat Jonas zelf wil aanpassen staat in dit bestand.
window.SHOP = {
  naam: "peapickers printshop",
  email: "printshoppeapickers@proton.me",

  // Link naar de postershop van peapickers.
  peapickersUrl: "https://peapickers.github.io/postershoppeapickers/",
  // Landingspagina van peapickers met alle merken.
  vzwUrl: "https://peapickers.github.io/printshoppeapickers/vzw/",

  // Pushmelding naar je gsm via de gratis app ntfy (https://ntfy.sh).
  // Abonneer je in de app op dit woord. Het staat leesbaar in de site, dus de
  // melding bevat bewust alleen het bestelnummer. Leeg = geen melding.
  ntfyTopic: "printshop-lp6kbdq0lpaaz0vk",

  // Link waarlangs klanten hun bestanden uploaden (bestandsaanvraag van je
  // versleutelde opslag). Leeg = uitleg via SwissTransfer naar je e-mailadres.
  uploadUrl: "",

  // Levering (beslissing 8-11-2026, samen met de postershop). Geen bestelminimum.
  // De stand van de gedeelde leverronde komt uit de postershop, zodat beide shops dezelfde ronde vullen.
  leverwijzen: {
    leverronde: { label: "Gedeelde leverronde in Gent", kost: 1, gebied: "gent",
      uitleg: "Samen met bestellingen van de postershop. De ronde vertrekt bij 10 deelnemers, of na 14 dagen met wie er dan is. Je levering kan dus laat komen." },
    moment: { label: "Levering in Gent op een moment naar keuze", kost: 3, gebied: "gent",
      uitleg: "Zo snel mogelijk. Je kiest zelf de dag en het uur waarop je thuis bent." },
    bpost: { label: "bpost buiten Gent", kost: null, gebied: "buiten",
      uitleg: "Buiten Gent en deelgemeenten, zonder leverronde. Aan kostprijs: het tarief ligt nog niet vast en zit nog niet in het totaal." },
  },
  leverrondeUrl: "https://peapickers.github.io/postershoppeapickers/leverronde.json",

  // Betalen gebeurt altijd vooraf, zoals in de postershop. Later Bancontact via Mollie in de mand van
  // Snipcart, zodra de vzw bestaat. Nu een voorbeeld: overschrijving met QR-code naar een ongeldige rekening.
  // Nooit cash, nooit aan de deur.
  snipcartSleutel: "",
  voorbeeldRekening: { naam: "VOORBEELD, NIET BETALEN", iban: "BE00000000000000", tonen: "BE00 0000 0000 0000 (ongeldig voorbeeld)" },

  // Maatwerk: geen wettelijk herroepingsrecht (vraag ligt bij het Cultuurloket).
  herroepingTooltip: "Je print wordt speciaal voor jou gemaakt met jouw foto. Voor op maat gemaakte goederen geldt het wettelijke herroepingsrecht van 14 dagen niet.",

  // Leverkalender. Momenten die bezet staan in je Proton-agenda verdwijnen
  // automatisch (zie beschikbaarheid.json en .github/workflows).
  minDagenVooraf: 3,
  dagenVooruit: 42,
  // 0 = zondag, 1 = maandag, ... 6 = zaterdag
  leverdagen: [0, 1, 2, 3, 4, 5, 6],
  leveruren: { van: "10:00", tot: "21:00" },
  slotMinuten: 60,

  // Prijs = 3 × M. M is de materiaalkost van één print: papier en inkt,
  // plus 20% voor misdrukken en fouten. Zelfde redenering als de 7M van de
  // postershop, maar zonder auteursrechten. Alles gaat naar vzw peapickers.
  prijsFactor: 3,
  misdrukMarge: 0.2,
  // VOORBEELDBEDRAGEN: materiaalkost (papier + inkt) zonder marge.
  // Vast per print (bv. beschermhoes) en per 100 cm² papier per papiersoort en dikte.
  materiaalVast: 0.3,
  papier: {
    mat:   { label: "Mat",         gewichten: { 180: 0.25, 310: 0.35 } },
    satin: { label: "Satin",       gewichten: { 180: 0.28, 310: 0.38 } },
    baryta:{ label: "Baryta",      gewichten: { 350: 0.6 } },
  },
  maxKort: 42,   // cm, A2
  maxLang: 59.4, // cm, A2
  minZijde: 9,
  // Formaten op breedte. De hoogte volgt uit de verhouding van de foto.
  formaten: [10, 15, 20, 30],
  standaardBreedte: 15,
  // Verhouding hoogte/breedte als de foto (nog) niet gelezen kan worden: 3:2 liggend.
  standaardVerhouding: 2 / 3,

  // Voorlopig alleen Gent en deelgemeenten.
  postcodes: {
    "9000": "Gent", "9030": "Mariakerke", "9031": "Drongen", "9032": "Wondelgem",
    "9040": "Sint-Amandsberg", "9041": "Oostakker", "9042": "Desteldonk / Mendonk / Sint-Kruis-Winkel",
    "9050": "Gentbrugge / Ledeberg", "9051": "Sint-Denijs-Westrem / Afsnee", "9052": "Zwijnaarde",
  },
};
