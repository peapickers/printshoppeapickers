// Gedeelde functies: prijzen, levertijd, bestelling coderen, kop en voet.
(function () {
  const S = window.SHOP;

  const euro = (n) =>
    new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" }).format(n);

  // Prijs van één print, afgerond naar boven op 50 cent.
  function prijsPerStuk(item) {
    const p = S.papier[item.papier];
    const tarief = p && p.gewichten[item.gsm];
    if (!tarief) return NaN;
    const ruw = S.startprijs + ((item.b * item.h) / 100) * tarief;
    return Math.max(S.minimumPerPrint, Math.ceil(ruw * 2) / 2);
  }

  function totalen(items) {
    const prints = items.reduce((s, i) => s + prijsPerStuk(i) * i.aantal, 0);
    const levering = items.length ? S.leverkost : 0;
    return { prints, levering, totaal: prints + levering };
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
      v: 1, id: order.id, dt: order.datum, tv: order.tijdvak, n: order.naam,
      a: order.adres, pc: order.postcode, g: order.gemeente, t: order.tel, e: order.email,
      o: order.opmerking || "",
      i: order.items.map((i) => [i.papier, i.gsm, i.b, i.h, i.aantal, i.rand, i.bestand || ""]),
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
      id: c.id, datum: c.dt, tijdvak: c.tv, naam: c.n, adres: c.a, postcode: c.pc,
      gemeente: c.g, tel: c.t, email: c.e, opmerking: c.o,
      items: c.i.map(([papier, gsm, b, h, aantal, rand, bestand]) => ({ papier, gsm, b, h, aantal, rand, bestand })),
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
    const rand = i.rand === "rand" ? ", met witte rand" : "";
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
          <a class="vzw-link" href="${S.vzwUrl}">← vzw peapickers</a></span>
        <nav>
          ${link("index.html", "Home")}
          ${link("uploadgids.html", "Bestanden klaarmaken")}
          ${link("bestellen.html", "Bestellen")}
          <a class="pp-knop" href="${S.peapickersUrl}" target="_blank" rel="noopener">Posters bij peapickers ↗</a>
        </nav>`;
    }
    const voet = document.getElementById("voet");
    if (voet) {
      voet.innerHTML = `
        <section class="pp-blok">
          <div>
            <p class="eyebrow">Ook van ons</p>
            <h2>De postershop van vzw peapickers</h2>
            <p>Liever een kant-en-klare poster dan je eigen beeld? Bij vzw peapickers bestel je posters
            op dezelfde manier: je kiest, prikt een moment dat je thuis bent en betaalt aan de deur.</p>
          </div>
          <a class="knop" href="${S.peapickersUrl}" target="_blank" rel="noopener">Naar de postershop ↗</a>
        </section>
        <p class="klein">Levering binnen ±16 km rond de Watersportbaan in Gent · ${euro(S.leverkost)} per levering ·
        betalen aan de deur · <a href="mailto:${S.email}">${S.email}</a></p>`;
    }
  }

  window.Shop = {
    euro, prijsPerStuk, totalen, leverslots, datumLang, zijdenOk,
    codeer, decodeer, bonUrl, nieuwOrderId, itemOmschrijving, tekenQr, fmtCm,
  };
  document.addEventListener("DOMContentLoaded", kopEnVoet);
})();
