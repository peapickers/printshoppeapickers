// Leest de gedeelde Proton-agenda (ICS-link) en schrijft enkel de bezette
// tijdblokken naar beschikbaarheid.json. Titels, plaatsen en notities van
// afspraken komen nooit op de website.
//
// Gebruik: AGENDA_ICS_URL=... node scripts/beschikbaarheid.mjs [bestand.ics]
import { readFile, writeFile } from "node:fs/promises";
import ical from "node-ical";

const DAGEN_VOORUIT = 60;
const doel = new URL("../beschikbaarheid.json", import.meta.url);

const bron = process.argv[2]
  ? await readFile(process.argv[2], "utf8")
  : await fetch(process.env.AGENDA_ICS_URL).then((r) => {
      if (!r.ok) throw new Error(`Agenda ophalen mislukt: HTTP ${r.status}`);
      return r.text();
    });

const van = new Date();
const tot = new Date(van.getTime() + DAGEN_VOORUIT * 864e5);
const blokken = [];

for (const ev of Object.values(ical.parseICS(bron))) {
  if (ev.type !== "VEVENT" || ev.transparency === "TRANSPARENT" || ev.status === "CANCELLED") continue;
  for (const inst of ical.expandRecurringEvent(ev, { from: van, to: tot })) {
    const start = new Date(inst.start), einde = new Date(inst.end ?? inst.start);
    if (einde > van && start < tot) blokken.push([start.getTime(), einde.getTime()]);
  }
}

// Overlappende blokken samenvoegen.
blokken.sort((a, b) => a[0] - b[0]);
const bezet = [];
for (const [a, b] of blokken) {
  const laatste = bezet[bezet.length - 1];
  if (laatste && a <= laatste[1]) laatste[1] = Math.max(laatste[1], b);
  else bezet.push([a, b]);
}

const uit = {
  bijgewerkt: new Date().toISOString().slice(0, 10),
  bezet: bezet.map(([a, b]) => [new Date(a).toISOString(), new Date(b).toISOString()]),
};
await writeFile(doel, JSON.stringify(uit, null, 1) + "\n");
console.log(`${uit.bezet.length} bezette blokken geschreven.`);
