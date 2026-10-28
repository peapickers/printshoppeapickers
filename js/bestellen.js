// Bestelpagina: één vraag per scherm. Uitleg staat ingeklapt onder elke stap
// en verschijnt vanzelf alleen bij een signaal (oranje/rode foto, heen en weer gaan).
(function () {
  const S = window.SHOP;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const prints = [];
  let huidig = null;
  let stap = 1;
  let terugTeller = 0;
  let gekozenDatum = "";
  let gekozenTijdvak = "";

  const HULP = {
    1: `Tik op het vak en kies je foto uit je galerij. Kies altijd de originele foto, geen schermafbeelding en geen foto die je via WhatsApp kreeg. Meer weten? Lees het <a href="uploadgids.html">stappenplan</a>.`,
    2: `Twijfel je? Laat alles gewoon staan, dat past bij bijna elke foto. De hoogte volgt vanzelf uit je foto, dus er valt niets weg. Meer foto's laten printen? Tik op "+ Nog een foto toevoegen".`,
    3: `Kies een dag en een uur waarop je thuis bent. Ik breng je print zelf langs en je betaalt dan aan de deur. Ik heb minstens ${S.minDagenVooraf} dagen nodig om te printen en te laten drogen.`,
    4: `Ik heb je adres nodig om te leveren en je gsm-nummer om je een bericht te sturen 30 minuten voor ik kom. Ik deel je gegevens met niemand.`,
  };

  // ---------- Stappen ----------
  function gaNaar(n, scrollen = true) {
    stap = n;
    $$(".stap").forEach((el) => (el.hidden = Number(el.dataset.stap) !== n));
    $$(".voortgang i").forEach((i, k) => i.classList.toggle("af", k < n));
    $("#stapnaam").textContent = `Stap ${n} van 4`;
    if (n === 1) tekenStap1();
    if (n === 2) tekenStap2();
    bijwerkenPrijs();
    if (scrollen) $("#formulier").scrollIntoView({ block: "start" });
  }

  function openUitleg(n, open) {
    const u = $(`.hulp-plek[data-hulp="${n}"]`);
    u.classList.toggle("open", open);
    $(".hulp", u).hidden = !open;
    $(".link", u).textContent = open ? "Verberg uitleg" : "Toon uitleg";
  }
  $$(".hulp-plek").forEach((u) => {
    const n = Number(u.dataset.hulp);
    u.innerHTML = `<div class="hulp-vraag"><span>Hulp nodig?</span><button type="button" class="link">Toon uitleg</button></div>
      <div class="hulp" hidden><p>${HULP[n]}</p></div>`;
    $(".link", u).addEventListener("click", () => openUitleg(n, !u.classList.contains("open")));
  });

  $$("[data-verder]").forEach((b) => b.addEventListener("click", () => {
    if (!controleerStap(stap)) return;
    if (stap < 4) gaNaar(stap + 1); else plaats();
  }));
  $$("[data-terug]").forEach((b) => b.addEventListener("click", () => {
    if (stap === 1) {
      // Terug vanuit een extra foto die nog leeg is: die foto vervalt.
      if (!huidig.file) prints.splice(prints.indexOf(huidig), 1);
      huidig = prints[prints.length - 1];
      gaNaar(2);
    } else gaNaar(stap - 1);
    // Twee keer terug wijst op twijfel: de uitleg van deze stap gaat open.
    if (++terugTeller >= 2) openUitleg(stap, true);
  }));

  function controleerStap(n) {
    if (n === 1 && !huidig.file) {
      toonTip(1, "Kies eerst een foto. Tik op het vak hierboven.");
      return false;
    }
    if (n === 3) {
      const dagOk = !!gekozenDatum, uurOk = !!gekozenTijdvak;
      markeer($("#veld-dag"), !dagOk);
      if (dagOk) markeer($("#veld-uur"), !uurOk);
      return dagOk && uurOk;
    }
    if (n === 4) {
      let ok = true;
      ["naam", "tel", "email", "adres", "postcode", "gemeente"].forEach((id) => {
        const leeg = !$("#" + id).value.trim();
        markeer($("#" + id).closest(".veld"), leeg);
        if (leeg) ok = false;
      });
      const email = $("#email");
      if (email.value.trim() && !email.checkValidity()) {
        markeer(email.closest(".veld"), true, "Dit e-mailadres lijkt niet te kloppen.");
        ok = false;
      }
      if (!postcodeOk()) ok = false;
      return ok;
    }
    return true;
  }

  function markeer(veld, fout, tekst) {
    veld.classList.toggle("mist", fout);
    const m = $(".melding", veld);
    if (!m) return;
    if (!m.dataset.std) m.dataset.std = m.innerHTML;
    m.innerHTML = tekst || m.dataset.std;
    m.classList.toggle("verborgen", !fout);
  }

  // ---------- Prints ----------
  function nieuwePrint() {
    const p = { papier: "mat", gsm: 310, b: S.standaardBreedte, h: 0, rand: "vol", aantal: 1, file: null, px: null, url: "" };
    prints.push(p);
    huidig = p;
    return p;
  }

  const drop = $("#drop"), input = $("#bestand");
  drop.addEventListener("click", () => input.click());
  drop.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
  drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("over"));
  drop.addEventListener("drop", (e) => {
    e.preventDefault(); drop.classList.remove("over");
    if (e.dataTransfer.files[0]) kiesBestand(huidig, e.dataTransfer.files[0]);
  });
  input.addEventListener("change", () => { if (input.files[0]) kiesBestand(huidig, input.files[0]); input.value = ""; });
  $("#andere").addEventListener("click", () => input.click());
  $("#verwijder-foto").addEventListener("click", () => {
    if (huidig.url) URL.revokeObjectURL(huidig.url);
    Object.assign(huidig, { file: null, px: null, url: "" });
    tekenStap1();
  });

  function kiesBestand(p, file) {
    p.file = file;
    p.px = null;
    p.url = "";
    if (file.type.startsWith("image/") && !/tiff?$/i.test(file.type)) {
      p.url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { p.px = { w: img.naturalWidth, h: img.naturalHeight }; tekenStap1(); };
      img.onerror = () => tekenStap1();
      img.src = p.url;
    }
    tekenStap1();
  }

  /* Scherpte bij een kijkafstand van 30 cm.
     Een goed oog ziet details tot 1 boogminuut: op 30 cm is dat 300 mm × tan(1/60°) = 0,0873 mm,
     dus 25,4 / 0,0873 ≈ 291 pixels per inch. Daarboven zie je geen verschil (groen).
     Een duidelijk verschil ontstaat zodra een pixel ongeveer 1,7 boogminuut groot wordt:
     0,6 × 291 ≈ 175 ppi (grens tussen oranje en rood).
     De breedte van de print hoort bij de breedte van de foto, want de hoogte volgt de verhouding. */
  const PPI_SCHERP = 25.4 / (300 * Math.tan(Math.PI / 180 / 60));
  const PPI_DUIDELIJK = 0.6 * PPI_SCHERP;

  function kwaliteit(p) {
    if (!p.file) return null;
    if (!p.px) return { niveau: "onbekend" };
    const { w, h } = p.px;
    const ppi = w / (p.b / 2.54);
    return {
      niveau: ppi >= PPI_SCHERP ? "goed" : ppi >= PPI_DUIDELIJK ? "matig" : "slecht",
      duidelijkVanaf: Math.floor((w / PPI_DUIDELIJK) * 2.54 * 2) / 2,
      chat: Math.max(w, h) <= 2048,
    };
  }

  const LAMPJE = { goed: "Scherp genoeg", matig: "Iets minder scherp", slecht: "Niet scherp", onbekend: "Dit bestand kijk ik zelf na" };
  const PROTON = `<span class="info"><button type="button" class="info-knop" onclick="this.parentNode.classList.toggle('open')">Proton Drive</button><span class="info-tekst" role="tooltip">Deze dienst scrapet je afbeelding niet voor AI-gebruik.</span></span>`;

  function tipTekst(p, k) {
    if (!k || k.niveau === "goed" || k.niveau === "onbekend") return "";
    const zin = `Duidelijk kwaliteitsverschil als je prints groter zijn dan ${Shop.fmtCm(k.duidelijkVanaf)} cm (kijkafstand 30 cm).`;
    const stoort = `</p><p>Stoort het kwaliteitsverschil niet? Ga gerust verder met de bestelling, alle prints worden met liefde en zorg gedrukt.`;
    if (k.chat) {
      return `Deze foto lijkt via WhatsApp of Messenger gestuurd. Die maken foto's kleiner. ${zin} Vraag de zender het origineel met een downloadlink te versturen. Ik raad een dienst zoals ${PROTON} aan.${k.niveau === "slecht" ? stoort : ""}`;
    }
    if (k.niveau === "matig") {
      return `${zin} Op ${Shop.fmtCm(p.b)} cm zie je enkel van heel dichtbij een klein verschil. Je mag hem gewoon zo bestellen: kwaliteit is een richtlijn, alles kan gedrukt worden!`;
    }
    return `${zin} Heb je het origineel nog, op je telefoon of bij wie hem nam? Kies dan dat bestand.${stoort}`;
  }

  function toonTip(n, html) {
    $("#tip-" + n).innerHTML = html ? `<div class="hulp"><p>${html}</p></div>` : "";
  }

  function tekenLampje(el, k) {
    el.className = "lampje " + (k ? k.niveau : "");
    el.textContent = k ? LAMPJE[k.niveau] : "";
  }

  function tekenStap1() {
    const p = huidig, k = kwaliteit(p);
    $("#drop").classList.toggle("verborgen", !!p.file);
    $("#foto").classList.toggle("verborgen", !p.file);
    $("[data-terug]", $('.stap[data-stap="1"]')).classList.toggle("onzichtbaar", prints.length < 2);
    if (p.file) {
      $("#foto-naam").textContent = p.file.name;
      $("#foto-px").textContent = p.px ? `${p.px.w} × ${p.px.h} px` : "";
      $("#foto-beeld").innerHTML = p.url ? `<img src="${p.url}" alt="">` : "";
      tekenLampje($("#lampje-1"), k);
    }
    toonTip(1, tipTekst(p, k));
  }

  function radios(box, naam, opties, gekozen) {
    box.innerHTML = opties.map(([v, t]) =>
      `<label><input type="radio" name="${naam}" value="${v}"${String(v) === String(gekozen) ? " checked" : ""}><span>${t}</span></label>`).join("");
  }

  function tekenStap2() {
    const p = huidig;
    radios($("#papier"), "papier", Object.entries(S.papier).map(([k, v]) => [k, v.label]), p.papier);
    radios($("#gsm"), "gsm", Object.keys(S.papier[p.papier].gewichten).map((g) => [g, `${g} g/m²`]), p.gsm);
    radios($("#formaat"), "formaat", S.formaten.map((b) => [b, `${b} cm`]), p.b);
    $$('#rand input').forEach((i) => (i.checked = i.value === p.rand));
    $("#aantal").value = p.aantal;
    bijwerkenPrint();
    tekenLijst();
  }

  function bijwerkenPrint() {
    const p = huidig;
    const verhouding = p.px ? p.px.h / p.px.w : S.standaardVerhouding;
    p.h = Math.round(p.b * verhouding * 2) / 2;
    $("#maat").textContent = `Je print wordt ${Shop.fmtCm(p.b)} × ${Shop.fmtCm(p.h)} cm.`;
    const k = kwaliteit(p);
    tekenLampje($("#lampje-2"), k);
    toonTip(2, tipTekst(p, k));
    bijwerkenPrijs();
  }

  $("#papier").addEventListener("change", (e) => {
    huidig.papier = e.target.value;
    const gewichten = Object.keys(S.papier[huidig.papier].gewichten).map(Number);
    if (!gewichten.includes(huidig.gsm)) huidig.gsm = gewichten[gewichten.length - 1];
    radios($("#gsm"), "gsm", gewichten.map((g) => [g, `${g} g/m²`]), huidig.gsm);
    bijwerkenPrint(); tekenLijst();
  });
  $("#gsm").addEventListener("change", (e) => { huidig.gsm = Number(e.target.value); bijwerkenPrint(); tekenLijst(); });
  $("#formaat").addEventListener("change", (e) => { huidig.b = Number(e.target.value); bijwerkenPrint(); tekenLijst(); });
  $("#rand").addEventListener("change", (e) => { huidig.rand = e.target.value; bijwerkenPrint(); tekenLijst(); });
  $("#aantal").addEventListener("input", (e) => { huidig.aantal = Math.max(1, parseInt(e.target.value) || 1); bijwerkenPrint(); tekenLijst(); });
  $("#extra").addEventListener("click", () => { nieuwePrint(); gaNaar(1); });

  // Met meer dan één foto: korte lijst om te wisselen of te verwijderen.
  function tekenLijst() {
    const lijst = $("#lijst");
    if (prints.length < 2) { lijst.innerHTML = ""; return; }
    lijst.innerHTML = `<p class="veld-titel">Je prints</p><ul class="printlijst">${prints.map((p, i) => `
      <li${p === huidig ? ' class="actief"' : ""}><span>${i + 1}. ${p.aantal} × ${Shop.itemOmschrijving(p)}</span>
        <span>${p === huidig ? "" : `<button type="button" class="link" data-kies="${i}">Aanpassen</button> `}<button type="button" class="link" data-weg="${i}">Verwijder</button></span></li>`).join("")}</ul>`;
  }
  $("#lijst").addEventListener("click", (e) => {
    const kies = e.target.closest("[data-kies]"), weg = e.target.closest("[data-weg]");
    if (kies) { huidig = prints[Number(kies.dataset.kies)]; tekenStap2(); }
    if (weg) {
      const p = prints[Number(weg.dataset.weg)];
      prints.splice(prints.indexOf(p), 1);
      if (p === huidig) huidig = prints[prints.length - 1];
      tekenStap2();
    }
  });

  function bijwerkenPrijs() {
    const klaar = prints.filter((p) => p.file && Shop.zijdenOk(p.b, p.h));
    const stuk = huidig.h ? Shop.prijsPerStuk(huidig) : NaN;
    $("#prijs-2").textContent = isNaN(stuk) ? "" : Shop.euro(stuk * huidig.aantal);
    const t = Shop.totalen(klaar);
    ["#prijs-3", "#prijs-4"].forEach((s) => ($(s).innerHTML = `${Shop.euro(t.totaal)} <span class="klein">incl. levering</span>`));
  }

  // ---------- Leverdag ----------
  let slots = {};
  let maand = null;
  const maandSleutel = (d) => d.getFullYear() * 12 + d.getMonth();
  const kortDatum = (iso) => {
    const [j, m, d] = iso.split("-").map(Number);
    return new Date(j, m - 1, d).toLocaleDateString("nl-BE", { weekday: "short", day: "numeric", month: "short" });
  };

  async function laadBeschikbaarheid() {
    let bezet = [];
    try {
      const r = await fetch("beschikbaarheid.json", { cache: "no-store" });
      if (r.ok) bezet = (await r.json()).bezet || [];
    } catch (e) { /* zonder agenda tonen we de standaarduren */ }
    slots = Shop.leverslots(bezet);
    const eerste = Object.keys(slots)[0];
    if (!eerste) { $("#kal-status").innerHTML = `Er zijn momenteel geen levermomenten vrij. Mail me op <a href="mailto:${S.email}">${S.email}</a>.`; return; }
    const [j, m] = eerste.split("-").map(Number);
    maand = new Date(j, m - 1, 1);
    tekenDagen();
    tekenKalender();
  }

  function tekenDagen() {
    const eerste = Object.keys(slots).slice(0, 4);
    $("#dagen").innerHTML = eerste.map((iso) =>
      `<label><input type="radio" name="dag" value="${iso}"${iso === gekozenDatum ? " checked" : ""}><span>${kortDatum(iso)}</span></label>`).join("")
      + `<button type="button" class="keuze-knop" id="andere-dag">${gekozenDatum && !eerste.includes(gekozenDatum) ? kortDatum(gekozenDatum) : "Andere dag…"}</button>`;
    const andere = $("#andere-dag");
    andere.classList.toggle("gekozen", !!gekozenDatum && !eerste.includes(gekozenDatum));
    andere.addEventListener("click", () => $("#kalender").classList.toggle("verborgen"));
  }

  function kiesDag(iso) {
    gekozenDatum = iso;
    gekozenTijdvak = "";
    markeer($("#veld-dag"), false);
    tekenDagen();
    tekenKalender();
    tekenUren();
  }
  $("#dagen").addEventListener("change", (e) => { $("#kalender").classList.add("verborgen"); kiesDag(e.target.value); });

  function tekenKalender() {
    const sleutels = Object.keys(slots);
    const [eerste, laatste] = [sleutels[0], sleutels[sleutels.length - 1]].map((iso) => {
      const [j, m] = iso.split("-").map(Number); return new Date(j, m - 1, 1);
    });
    $("#kal-maand").textContent = maand.toLocaleDateString("nl-BE", { month: "long", year: "numeric" });
    $("#kal-vorige").disabled = maandSleutel(maand) <= maandSleutel(eerste);
    $("#kal-volgende").disabled = maandSleutel(maand) >= maandSleutel(laatste);
    const html = ["ma", "di", "wo", "do", "vr", "za", "zo"].map((d) => `<span class="wd">${d}</span>`);
    const leeg = (maand.getDay() + 6) % 7;
    for (let i = 0; i < leeg; i++) html.push("<span></span>");
    const dagenInMaand = new Date(maand.getFullYear(), maand.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= dagenInMaand; d++) {
      const iso = `${maand.getFullYear()}-${String(maand.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const vrij = !!slots[iso];
      html.push(`<button type="button" data-iso="${iso}" class="${vrij ? "vrij" : ""}${iso === gekozenDatum ? " gekozen" : ""}"
        ${vrij ? "" : "disabled"} aria-label="${Shop.datumLang(iso)}${vrij ? "" : ", niet beschikbaar"}">${d}</button>`);
    }
    $("#kal").innerHTML = html.join("");
  }

  function tekenUren() {
    const veld = $("#veld-uur");
    veld.classList.toggle("verborgen", !gekozenDatum);
    if (!gekozenDatum) return;
    $("#uur-titel").textContent = `Hoe laat op ${Shop.datumLang(gekozenDatum)}?`;
    radios($("#tijdvakken"), "tijdvak", slots[gekozenDatum].map((t) => [t, t.split(" – ")[0]]), gekozenTijdvak);
  }

  $("#kal").addEventListener("click", (e) => {
    const knop = e.target.closest("button.vrij");
    if (knop) kiesDag(knop.dataset.iso);
  });
  $("#tijdvakken").addEventListener("change", (e) => { gekozenTijdvak = e.target.value; markeer($("#veld-uur"), false); });
  $("#kal-vorige").addEventListener("click", () => { maand = new Date(maand.getFullYear(), maand.getMonth() - 1, 1); tekenKalender(); });
  $("#kal-volgende").addEventListener("click", () => { maand = new Date(maand.getFullYear(), maand.getMonth() + 1, 1); tekenKalender(); });

  // ---------- Postcode ----------
  function postcodeOk() {
    const pc = $("#postcode").value.trim();
    if (pc.length < 4) return !!pc;
    if (S.postcodes[pc]) {
      markeer($("#postcode").closest(".veld"), false);
      return true;
    }
    markeer($("#postcode").closest(".veld"), true,
      `Deze postcode ligt voorlopig buiten mijn leverzone (16 km rond Gent). Mail me even op <a href="mailto:${S.email}">${S.email}</a>, dan zoeken we samen een oplossing.`);
    return false;
  }
  $("#postcode").addEventListener("input", (e) => {
    const pc = e.target.value.trim();
    if (pc.length < 4) { markeer(e.target.closest(".veld"), false); return; }
    if (postcodeOk() && !$("#gemeente").value) {
      $("#gemeente").value = S.postcodes[pc].split(" / ")[0];
      markeer($("#gemeente").closest(".veld"), false);
    }
  });
  $$(".stap input").forEach((i) => i.addEventListener("input", () => {
    const v = i.closest(".veld");
    if (v && v.classList.contains("mist") && i.id !== "postcode" && i.value.trim()) markeer(v, false);
  }));

  // ---------- Plaatsen ----------
  function plaats() {
    // Lege extra foto's tellen niet mee.
    for (let i = prints.length - 1; i >= 0; i--) if (!prints[i].file) prints.splice(i, 1);
    const order = maakOrder();
    const url = Shop.bonUrl(order);
    meldJonas(order);
    toonResultaat(order, url);
  }

  function maakOrder() {
    return {
      id: Shop.nieuwOrderId(),
      datum: gekozenDatum, tijdvak: gekozenTijdvak,
      naam: $("#naam").value.trim(), tel: $("#tel").value.trim(), email: $("#email").value.trim(),
      adres: $("#adres").value.trim(), postcode: $("#postcode").value.trim(), gemeente: $("#gemeente").value.trim(),
      opmerking: $("#opmerking").value.trim(),
      items: prints.map((p) => ({ papier: p.papier, gsm: p.gsm, b: p.b, h: p.h, aantal: p.aantal, rand: p.rand, bestand: p.file ? p.file.name : "" })),
    };
  }

  function orderTekst(order, url) {
    const t = Shop.totalen(order.items);
    const regels = order.items.map((i, n) =>
      `${n + 1}. ${i.aantal} × ${Shop.itemOmschrijving(i)} (${i.bestand}) = ${Shop.euro(Shop.prijsPerStuk(i) * i.aantal)}`);
    return [
      `Bestelling ${order.id}`,
      ...regels,
      `Levering: ${Shop.euro(t.levering)}`,
      `Te betalen aan de deur: ${Shop.euro(t.totaal)}`,
      ``,
      `Leverdag: ${Shop.datumLang(order.datum)}, ${order.tijdvak}`,
      `${order.naam} · ${order.tel} · ${order.email}`,
      `${order.adres}, ${order.postcode} ${order.gemeente}`,
      order.opmerking ? `Opmerking: ${order.opmerking}` : "",
      ``,
      `Bestelbon: ${url}`,
    ].filter((r, i, a) => r !== "" || a[i - 1] !== "").join("\n");
  }

  // Het ntfy-onderwerp staat leesbaar in de broncode van de site, dus iedereen
  // kan meelezen. Daarom gaat er geen naam, adres, bedrag of bonlink mee:
  // alleen het bestelnummer. De details komen via de mail van de klant.
  async function meldJonas(order) {
    if (!S.ntfyTopic) return;
    try {
      await fetch(`https://ntfy.sh/${encodeURIComponent(S.ntfyTopic)}`, {
        method: "POST",
        body: `Bestelnummer ${order.id}. De details komen via mail.`,
        headers: { Title: "Nieuwe bestelling", Tags: "printer", Priority: "high", Click: "https://mail.proton.me" },
      });
    } catch (e) { /* melding is een extraatje; de bestelling gaat ook via mail */ }
  }

  function toonResultaat(order, url) {
    const t = Shop.totalen(order.items);
    $("#formulier").classList.add("verborgen");
    $("#resultaat").classList.remove("verborgen");
    $("#res-id").textContent = order.id;
    $("#res-totaal").textContent = `${Shop.euro(t.totaal)} te betalen aan de deur`;
    $("#res-datum").textContent = `Levering op ${Shop.datumLang(order.datum)}, tussen ${order.tijdvak}. Betalen kan met ${S.betaalwijzen}.`;
    $("#res-bon").href = url;
    Shop.tekenQr($("#res-qr"), url);

    const onderwerp = `Bestelling ${order.id}`;
    const tekst = orderTekst(order, url);
    const mailto = `mailto:${S.email}?subject=${encodeURIComponent(onderwerp)}&body=${encodeURIComponent(tekst)}`;
    const upload = S.uploadUrl
      ? `<p>Tik op de knop en sleep je foto's in het vak. Vul bij je naam of bericht je bestelnummer <strong>${order.id}</strong> in.
           Je bestanden worden versleuteld en alleen ik kan ze openen.</p>
         <p style="margin-top:.8rem"><a class="knop" href="${S.uploadUrl}" target="_blank" rel="noopener">Upload hier je foto's</a></p>`
      : `<p>Ga naar <a href="https://www.swisstransfer.com" target="_blank" rel="noopener">SwissTransfer</a>,
           voeg je originele bestanden toe en stuur ze naar <strong>${S.email}</strong> met bestelnummer <strong>${order.id}</strong> als bericht.
           <a href="uploadgids.html#versturen">Stap voor stap uitgelegd</a>.</p>`;
    $("#res-titel").textContent = "Nog twee stappen";
    $("#res-uitleg").textContent = "Je bestelling is pas definitief als ik je mail en je foto's heb ontvangen. Je krijgt meteen een bevestiging terug.";
    $("#res-stappen").innerHTML = `
      <ol class="stappen">
        <li><h3>Mail je bestelling</h3><p>Tik op de knop. Je mailprogramma opent met alles al ingevuld. Druk daar op Verzenden.</p>
          <p style="margin-top:.8rem"><a class="knop" href="${mailto}">Mail mijn bestelling</a></p>
          <details style="margin-top:.8rem"><summary class="klein">Opent er niets?</summary>
            <p class="klein">Kopieer deze tekst en mail hem zelf naar <strong>${S.email}</strong>.</p>
            <textarea rows="8" readonly id="kopie"></textarea>
            <button type="button" class="knop licht" id="kopieer">Kopieer</button></details></li>
        <li><h3>Stuur je foto's</h3>${upload}</li>
      </ol>`;
    $("#kopie").value = tekst;
    $("#kopieer").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(tekst); } catch (e) { $("#kopie").select(); document.execCommand("copy"); }
      $("#kopieer").textContent = "Gekopieerd ✓";
    });
    try { localStorage.setItem("laatsteBon", url); } catch (e) {}
    window.scrollTo(0, 0);
  }

  nieuwePrint();
  gaNaar(1, false);
  laadBeschikbaarheid();
})();
