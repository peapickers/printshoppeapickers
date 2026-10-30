// Alles wat Jonas zelf wil aanpassen staat in dit bestand.
window.SHOP = {
  naam: "Peapickers Printshop",
  email: "printshoppeapickers@proton.me",

  // Link naar de postershop van vzw peapickers.
  peapickersUrl: "https://peapickers.github.io/postershoppeapickers/",
  // Landingspagina van vzw peapickers met alle merken.
  vzwUrl: "https://peapickers.github.io/printshoppeapickers/vzw/",

  // Pushmelding naar je gsm via de gratis app ntfy (https://ntfy.sh).
  // Abonneer je in de app op dit woord. Het staat leesbaar in de site, dus de
  // melding bevat bewust alleen het bestelnummer. Leeg = geen melding.
  ntfyTopic: "printshop-lp6kbdq0lpaaz0vk",

  // Link waarlangs klanten hun bestanden uploaden (bestandsaanvraag van je
  // versleutelde opslag). Leeg = uitleg via SwissTransfer naar je e-mailadres.
  uploadUrl: "",

  leverkost: 3,
  betaalwijzen: "cash of Payconiq/overschrijving ter plaatse",

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
  // postershop, maar zonder auteursrechten of voorschotten.
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
