// Alles wat Jonas zelf wil aanpassen staat in dit bestand.
window.SHOP = {
  naam: "Peapicker's Printshop",
  email: "printshoppeapickers@proton.me",

  // Link naar de postershop van vzw peapickers (adres nog te bevestigen).
  peapickersUrl: "https://peapickers.github.io/peapickers-postershop/",

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

  // VOORBEELDPRIJZEN: startprijs per print + prijs per 100 cm² papier.
  startprijs: 4,
  minimumPerPrint: 6,
  papier: {
    mat:   { label: "Mat",         gewichten: { 180: 1.2, 310: 1.8 } },
    satin: { label: "Satin",       gewichten: { 180: 1.3, 310: 1.9 } },
    baryta:{ label: "Baryta",      gewichten: { 350: 2.6 } },
  },
  maxKort: 42,   // cm, A2
  maxLang: 59.4, // cm, A2
  minZijde: 9,
  // Formaten op breedte. De hoogte volgt uit de verhouding van de foto.
  formaten: [10, 15, 20, 30],
  standaardBreedte: 15,
  // Verhouding hoogte/breedte als de foto (nog) niet gelezen kan worden: 3:2 liggend.
  standaardVerhouding: 2 / 3,

  // Postcodes binnen ongeveer 16 km van de Watersportbaan (Gent).
  postcodes: {
    "9000": "Gent", "9030": "Mariakerke", "9031": "Drongen", "9032": "Wondelgem",
    "9040": "Sint-Amandsberg", "9041": "Oostakker", "9042": "Desteldonk / Mendonk / Sint-Kruis-Winkel",
    "9050": "Gentbrugge / Ledeberg", "9051": "Sint-Denijs-Westrem / Afsnee", "9052": "Zwijnaarde",
    "9070": "Destelbergen / Heusden", "9080": "Lochristi", "9090": "Melle / Gontrode",
    "9230": "Wetteren", "9270": "Laarne / Kalken", "9800": "Deinze", "9810": "Nazareth / Eke",
    "9820": "Merelbeke", "9830": "Sint-Martens-Latem", "9831": "Deurle", "9840": "De Pinte",
    "9850": "Nevele / Landegem / Hansbeke", "9860": "Oosterzele", "9890": "Gavere",
    "9920": "Lovendegem", "9930": "Zomergem", "9940": "Evergem / Sleidinge",
  },
};
