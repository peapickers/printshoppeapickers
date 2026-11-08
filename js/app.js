// Gedeelde functies: prijzen, levertijd, bestelling coderen, kop en voet.
(function () {
  const S = window.SHOP;

  const euro = (n) =>
    new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" }).format(n);

  // M: materiaalkost van één print (papier en inkt), met 20% voor misdrukken.
  function materiaalkost(item) {
    const p = S.papier[item.papier];
    const tarief = p && p.gewichten[item.gsm];
    if (!tarief) return NaN;
    return (S.materiaalVast + ((item.b * item.h) / 100) * tarief) * (1 + S.misdrukMarge);
  }

  // Prijs van één print: 3 × M, afgerond naar boven op 50 cent.
  function prijsPerStuk(item) {
    return Math.ceil(S.prijsFactor * materiaalkost(item) * 2) / 2;
  }

  // lw = leverwijze (leverronde, moment of bpost). bpost is aan kostprijs en zit nog niet in het totaal.
  function totalen(items, lw = "moment") {
    const prints = items.reduce((s, i) => s + prijsPerStuk(i) * i.aantal, 0);
    const w = S.leverwijzen[lw] || S.leverwijzen.moment;
    const onbekend = w.kost === null;
    const levering = items.length && !onbekend ? w.kost : 0;
    return { prints, levering, onbekend, totaal: prints + levering, leverwijze: w };
  }
  function leverTekst(t) { return t.onbekend ? "aan kostprijs, nog te bepalen" : euro(t.levering); }

  // Melding bij maatwerk, boven de bestelknop en op de bon. Geen vinkje, wel een tooltip.
  function herroepMelding() {
    return `<p class="herroep-melding"><strong>Geen herroepingsrecht</strong>
      <span class="tip" tabindex="0" role="button" aria-label="Waarom niet?" data-tip="${S.herroepingTooltip}">?</span>
      <span class="tip-tekst" role="tooltip">${S.herroepingTooltip}</span></p>`;
  }

  // Belgische gestructureerde mededeling (mod 97), zoals in de postershop.
  function ogm(id) {
    const basis = (String(id).replace(/\D/g, "") + String(Math.floor(Math.random() * 1e10))).slice(0, 10).padEnd(10, "0");
    const c = Number(BigInt(basis) % 97n) || 97, t = basis + String(c).padStart(2, "0");
    return `+++${t.slice(0, 3)}/${t.slice(3, 7)}/${t.slice(7)}+++`;
  }
  // EPC-QR (versie 002) voor de voorbeeldoverschrijving. De rekening is ongeldig: er wordt niets betaald.
  function epc(bedrag, mededeling) {
    const r = S.voorbeeldRekening;
    return ["BCD", "002", "1", "SCT", "", r.naam, r.iban, "EUR" + bedrag.toFixed(2), "", "", mededeling].join("\n");
  }
  // Velden zoals Snipcart ze later leest (data-item-*). Nu alleen klaargezet, niet gebruikt.
  function snipcartAttrs(i, id) {
    const attrs = {
      "data-item-id": `PRINT-${i.papier}-${i.gsm}-${i.b}x${i.h}${i.rand === "rand" ? "-rand" + (i.randCm || 0) : ""}`,
      "data-item-name": `Print ${itemOmschrijving(i)}`,
      "data-item-price": prijsPerStuk(i).toFixed(2),
      "data-item-quantity": i.aantal,
      "data-item-url": "/printshoppeapickers/bestellen.html",
      "data-item-taxable": "false",
      "data-item-shippable": "true",
      "data-item-custom1-name": "Bestelnummer", "data-item-custom1-type": "readonly", "data-item-custom1-value": id,
      "data-item-custom2-name": "Bestand", "data-item-custom2-type": "readonly", "data-item-custom2-value": i.bestand || "",
    };
    return Object.entries(attrs).map(([k, v]) => `${k}="${String(v).replace(/"/g, "&quot;")}"`).join(" ");
  }

  const isoDatum = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const uurMin = (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  // Vrije levermomenten per dag: leveruren min wat bezet staat in de agenda.
  // bezet = [[startISO, eindISO], ...] uit beschikbaarheid.json.
  function leverslots(bezet = [], nu = new Date()) {
    const blokken = bezet.map(([a, b]) => [new Date(a).getTime(), new Date(b).getTime()]);
    const [vu, vm] = S.leveruren.van.split(":").map(Number);
    const [tu, tm] = S.leveruren.tot.split(":").map(Number);
    const dagen = {};
    for (let i = S.minDagenVooraf; i < S.minDagenVooraf + S.dagenVooruit; i++) {
      const dag = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate() + i);
      if (!S.leverdagen.includes(dag.getDay())) continue;
      const einde = new Date(dag); einde.setHours(tu, tm, 0, 0);
      const slots = [];
      for (let s = new Date(dag.setHours(vu, vm, 0, 0)); ; ) {
        const e = new Date(s.getTime() + S.slotMinuten * 60000);
        if (e > einde) break;
        const vrij = !blokken.some(([a, b]) => a < e.getTime() && b > s.getTime());
        if (vrij) slots.push(`${uurMin(s)} – ${uurMin(e)}`);
        s = e;
      }
      if (slots.length) dagen[isoDatum(dag)] = slots;
    }
    return dagen;
  }

  function datumLang(iso) {
    const [j, m, d] = iso.split("-").map(Number);
    return new Date(j, m - 1, d).toLocaleDateString("nl-BE", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  }

  function zijdenOk(b, h) {
    const kort = Math.min(b, h), lang = Math.max(b, h);
    return kort >= S.minZijde && kort <= S.maxKort && lang <= S.maxLang;
  }

  // Bestelling <-> korte tekst in de link (base64url van JSON).
  function codeer(order) {
    const compact = {
      v: 2, id: order.id, lw: order.leverwijze, dt: order.datum, tv: order.tijdvak, n: order.naam,
      a: order.adres, pc: order.postcode, g: order.gemeente, t: order.tel, e: order.email,
      o: order.opmerking || "",
      i: order.items.map((i) => [i.papier, i.gsm, i.b, i.h, i.aantal, i.rand, i.bestand || "", i.randCm || 0]),
    };
    const bytes = new TextEncoder().encode(JSON.stringify(compact));
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function decodeer(tekst) {
    const b64 = tekst.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const c = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0))));
    return {
      id: c.id, leverwijze: c.lw || "moment", datum: c.dt, tijdvak: c.tv, naam: c.n, adres: c.a, postcode: c.pc,
      gemeente: c.g, tel: c.t, email: c.e, opmerking: c.o,
      items: c.i.map(([papier, gsm, b, h, aantal, rand, bestand, randCm]) => ({ papier, gsm, b, h, aantal, rand, bestand, randCm })),
    };
  }

  function bonUrl(order) {
    const basis = new URL("bon.html", location.href);
    basis.hash = codeer(order);
    return basis.toString();
  }

  function nieuwOrderId() {
    const d = new Date();
    const r = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${r}`;
  }

  function itemOmschrijving(i) {
    const p = S.papier[i.papier];
    const rand = i.rand === "rand" ? `, met witte rand${i.randCm ? ` van ${fmtCm(i.randCm)} cm` : ""}` : "";
    return `${p ? p.label : i.papier} ${i.gsm} g/m², ${fmtCm(i.b)} × ${fmtCm(i.h)} cm${rand}`;
  }
  const fmtCm = (n) => String(n).replace(".", ",");

  function tekenQr(el, tekst) {
    const qr = qrcode(0, "M");
    qr.addData(tekst);
    qr.make();
    el.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  }

  // Kop en voet met de peapickers-koppeling op elke pagina.
  function kopEnVoet() {
    const huidig = location.pathname.split("/").pop() || "index.html";
    const link = (href, tekst) =>
      `<a href="${href}"${huidig === href ? ' aria-current="page"' : ""}>${tekst}</a>`;
    const kop = document.getElementById("kop");
    if (kop) {
      kop.innerHTML = `
        <span class="logo-groep"><a class="logo" href="index.html">${S.naam}</a>
          <a class="vzw-link" href="${S.vzwUrl}">← peapickers</a></span>
        <nav>
          ${link("index.html", "Home")}
          ${link("uploadgids.html", "Bestanden klaarmaken")}
          ${link("bestellen.html", "Bestellen")}
          ${link("prijzen.html", "Prijsopbouw")}
          <a href="${S.peapickersUrl}vzw.html">Over</a>
          <a href="${S.peapickersUrl}register.html">Public Ledger</a>
          <a class="pp-knop" href="${S.peapickersUrl}" target="_blank" rel="noopener">peapickers postershop ↗</a>
        </nav>`;
    }
    const voet = document.getElementById("voet");
    if (voet) {
      voet.innerHTML = `
        <section class="pp-blok">
          <div>
            <p class="eyebrow">Ook van ons</p>
            <h2>De postershop van peapickers</h2>
            <p>Liever een poster van een onafhankelijke kunstenaar dan je eigen beeld? Bij de postershop
            bestel je op dezelfde manier: je kiest, betaalt vooraf en krijgt alles persoonlijk geleverd, ook via dezelfde gedeelde leverronde.</p>
          </div>
          <a class="knop" href="${S.peapickersUrl}" target="_blank" rel="noopener">Naar de postershop ↗</a>
        </section>
        <p class="klein">Voorbeeldsite: vzw peapickers is in oprichting en verkoopt nog niets. ·
        Gedeelde leverronde ${euro(S.leverwijzen.leverronde.kost)} of een moment naar keuze ${euro(S.leverwijzen.moment.kost)} in Gent, bpost daarbuiten ·
        altijd vooraf betalen · <a href="mailto:${S.email}">${S.email}</a></p>`;
    }
  }

  window.Shop = {
    euro, materiaalkost, prijsPerStuk, totalen, leverTekst, herroepMelding, ogm, epc, snipcartAttrs, leverslots, datumLang, zijdenOk,
    codeer, decodeer, bonUrl, nieuwOrderId, itemOmschrijving, tekenQr, fmtCm,
  };
  document.addEventListener("DOMContentLoaded", kopEnVoet);
})();
