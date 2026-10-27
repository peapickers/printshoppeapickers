// Bestelpagina: prints samenstellen, leverdag kiezen, gegevens, QR-bon.
(function () {
  const S = window.SHOP;
  const $ = (sel, el = document) => el.querySelector(sel);
  const prints = [];
  let teller = 0;
  let gekozenDatum = "";
  let gekozenTijdvak = "";

  // ---------- Prints ----------
  function nieuwePrint() {
    const p = { uid: ++teller, papier: "mat", gsm: 310, b: S.standaardBreedte, h: 0, rand: "vol", aantal: 1, file: null, px: null };
    prints.push(p);
    const el = $("#print-tpl").content.firstElementChild.cloneNode(true);
    el.dataset.uid = p.uid;
    p.el = el;

    // Papier en dikte
    const papierBox = $(".papier", el);
    Object.entries(S.papier).forEach(([key, v]) => {
      papierBox.insertAdjacentHTML("beforeend",
        `<label><input type="radio" name="papier-${p.uid}" value="${key}"${key === p.papier ? " checked" : ""}><span>${v.label}</span></label>`);
    });
    papierBox.addEventListener("change", (e) => {
      p.papier = e.target.value;
      const gewichten = Object.keys(S.papier[p.papier].gewichten).map(Number);
      if (!gewichten.includes(p.gsm)) p.gsm = gewichten[gewichten.length - 1];
      tekenGsm(p);
      bijwerken();
    });
    $(".gsm", el).addEventListener("change", (e) => { p.gsm = Number(e.target.value); bijwerken(); });
    tekenGsm(p);

    // Formaat
    // Formaat: enkel de breedte; de hoogte volgt uit de foto.
    const formaatBox = $(".formaat", el);
    formaatBox.innerHTML = S.formaten.map((b) =>
      `<label><input type="radio" name="formaat-${p.uid}" value="${b}"${b === p.b ? " checked" : ""}><span>${b} cm${b === S.standaardBreedte ? " (standaard)" : ""}</span></label>`).join("");
    formaatBox.addEventListener("change", (e) => { p.b = Number(e.target.value); bijwerken(); });
    $(".rand", el).addEventListener("change", (e) => { p.rand = e.target.value; bijwerken(); });
    $(".aantal", el).addEventListener("input", (e) => { p.aantal = Math.max(1, parseInt(e.target.value) || 1); bijwerken(); });
    $(".weg", el).addEventListener("click", () => {
      prints.splice(prints.indexOf(p), 1);
      el.remove();
      if (!prints.length) nieuwePrint();
      bijwerken();
    });

    // Bestand
    const drop = $(".drop", el), input = $(".bestand", el);
    drop.addEventListener("click", () => input.click());
    drop.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
    drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("over"));
    drop.addEventListener("drop", (e) => {
      e.preventDefault(); drop.classList.remove("over");
      if (e.dataTransfer.files[0]) kiesBestand(p, e.dataTransfer.files[0]);
    });
    input.addEventListener("change", () => input.files[0] && kiesBestand(p, input.files[0]));

    $("#prints").appendChild(el);
    bijwerken();
  }

  function tekenGsm(p) {
    const box = $(".gsm", p.el);
    box.innerHTML = Object.keys(S.papier[p.papier].gewichten).map((g) =>
      `<label><input type="radio" name="gsm-${p.uid}" value="${g}"${Number(g) === p.gsm ? " checked" : ""}><span>${g} g/m²</span></label>`).join("");
  }

  async function kiesBestand(p, file) {
    p.file = file;
    p.px = null;
    const vb = $(".voorbeeld", p.el);
    $("strong", $(".drop", p.el)).textContent = file.name;
    vb.innerHTML = "";
    if (file.type.startsWith("image/") && !/tiff?$/i.test(file.type)) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { p.px = { w: img.naturalWidth, h: img.naturalHeight }; bijwerken(); };
      img.onerror = () => bijwerken();
      img.src = url;
      img.alt = "Voorbeeld";
      vb.appendChild(img);
    }
    bijwerken();
  }

  // Hoe scherp wordt de print? Pixels per inch op het gekozen formaat.
  function kwaliteit(p) {
    if (!p.file) return null;
    const mb = (p.file.size / 1048576).toFixed(1);
    if (!p.px) {
      return { klasse: "matig", tekst: `Bestand ontvangen (${mb} MB). Dit type kan ik hier niet nakijken; ik controleer het zelf en bel of mail je als er iets niet klopt.` };
    }
    let { w, h } = p.px;
    let pb = p.b / 2.54, ph = p.h / 2.54;
    if ((w > h) !== (pb > ph)) [pb, ph] = [ph, pb];
    // Vullen: het beeld bedekt het papier. Witte rand: het beeld past erin.
    const dpi = Math.round(p.rand === "vol" ? Math.min(w / pb, h / ph) : Math.max(w / pb, h / ph));
    const verhoudingBeeld = w / h, verhoudingPrint = pb / ph;
    const afwijking = Math.abs(1 - verhoudingBeeld / verhoudingPrint);
    let extra = "";
    if (afwijking > 0.03) {
      extra = ` Let op: je foto heeft een andere vorm dan dit formaat, dus er valt ongeveer ${Math.round(afwijking * 100)}% van een rand weg.`;
    }
    const klein = Math.max(w, h) <= 2048 ? " Is dit misschien een verkleinde foto uit WhatsApp of Messenger? Stuur dan liever het origineel." : "";
    // Kijkafstand: minstens 30 cm, of de diagonaal van de print als die groter is.
    // Het oog onderscheidt ongeveer 1 boogminuut, dus nodig ≈ 3438 / afstand in inch.
    const afstand = Math.max(30, Math.hypot(p.b, p.h));
    const scherp = Math.min(300, Math.round(3438 / (afstand / 2.54)));
    const minimum = Math.round(scherp * 0.6);
    const cm = Math.round(afstand);
    if (dpi >= scherp) return { klasse: "goed", tekst: `Scherp genoeg om te bekijken van op ${cm} cm, de normale kijkafstand voor dit formaat (${dpi} ppi, ${w}×${h} pixels).${extra}` };
    if (dpi >= minimum) return { klasse: "matig", tekst: `Bruikbaar, maar van op ${cm} cm iets minder scherp (${dpi} ppi, ideaal is ${scherp}). Een kleiner formaat wordt scherper.${klein}${extra}` };
    return { klasse: "slecht", tekst: `Te weinig pixels voor dit formaat (${dpi} ppi, minimum ${minimum}). De print wordt wazig. Kies een kleiner formaat of stuur een groter bestand. Stoort het je niet? Dan kan je gewoon bestellen.${klein}${extra}` };
  }

  // ---------- Leverkalender ----------
  let slots = {};
  let maand = null; // eerste dag van de getoonde maand
  const maandSleutel = (d) => d.getFullYear() * 12 + d.getMonth();

  async function laadBeschikbaarheid() {
    let bezet = [];
    try {
      const r = await fetch("beschikbaarheid.json", { cache: "no-store" });
      if (r.ok) bezet = (await r.json()).bezet || [];
    } catch (e) {
      $("#kal-status").textContent = "Mijn agenda kon niet geladen worden. Ik bevestig je moment nog per mail.";
    }
    slots = Shop.leverslots(bezet);
    const eerste = Object.keys(slots)[0];
    if (!eerste) { $("#kal-status").textContent = `Er zijn momenteel geen levermomenten vrij. Mail me op ${S.email}.`; return; }
    const [j, m] = eerste.split("-").map(Number);
    maand = new Date(j, m - 1, 1);
    tekenKalender();
  }

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
    const box = $("#kal-uren");
    box.classList.toggle("verborgen", !gekozenDatum);
    if (!gekozenDatum) return;
    $("#kal-uren-titel").textContent = `Hoe laat op ${Shop.datumLang(gekozenDatum)}?`;
    $("#tijdvakken").innerHTML = slots[gekozenDatum].map((t) =>
      `<label><input type="radio" name="tijdvak" value="${t}"${t === gekozenTijdvak ? " checked" : ""}><span>${t}</span></label>`).join("");
  }

  $("#kal").addEventListener("click", (e) => {
    const knop = e.target.closest("button.vrij");
    if (!knop) return;
    gekozenDatum = knop.dataset.iso;
    gekozenTijdvak = "";
    tekenKalender();
    tekenUren();
  });
  $("#tijdvakken").addEventListener("change", (e) => { gekozenTijdvak = e.target.value; });
  $("#kal-vorige").addEventListener("click", () => { maand = new Date(maand.getFullYear(), maand.getMonth() - 1, 1); tekenKalender(); });
  $("#kal-volgende").addEventListener("click", () => { maand = new Date(maand.getFullYear(), maand.getMonth() + 1, 1); tekenKalender(); });

  // ---------- Postcode ----------
  $("#postcode").addEventListener("input", (e) => {
    const pc = e.target.value.trim();
    const zone = $("#zone");
    if (pc.length < 4) { zone.textContent = ""; return; }
    if (S.postcodes[pc]) {
      zone.innerHTML = `<span class="ok">✓ ${S.postcodes[pc]} ligt in mijn leverzone (${Shop.euro(S.leverkost)} leverkost).</span>`;
      if (!$("#gemeente").value) $("#gemeente").value = S.postcodes[pc].split(" / ")[0];
    } else {
      zone.innerHTML = `<span class="fout">Deze postcode ligt waarschijnlijk buiten mijn leverzone (±16 km rond de Watersportbaan in Gent).
        Mail me gerust op <a href="mailto:${S.email}">${S.email}</a>, dan zoeken we een oplossing.</span>`;
    }
  });

  // ---------- Bijwerken ----------
  function bijwerken() {
    prints.forEach((p, i) => {
      // Hoogte volgt uit de verhouding van de foto, afgerond op een halve cm.
      const verhouding = p.px ? p.px.h / p.px.w : S.standaardVerhouding;
      p.h = Math.round(p.b * verhouding * 2) / 2;
      $(".maat-uitleg", p.el).textContent = p.px
        ? `Je print wordt ${Shop.fmtCm(p.b)} × ${Shop.fmtCm(p.h)} cm. De hoogte volgt uit je foto.`
        : `De hoogte volgt uit je foto. Bij een gewone liggende foto wordt dat ${Shop.fmtCm(p.b)} × ${Shop.fmtCm(p.h)} cm.`;
      $(".titel", p.el).textContent = `Print ${i + 1}`;
      $(".weg", p.el).classList.toggle("verborgen", prints.length === 1);
      const maatOk = Shop.zijdenOk(p.b, p.h);
      $(".maat-fout", p.el).textContent = maatOk ? "" :
        `Kies een maat tussen ${S.minZijde} cm en A2 (max. ${Shop.fmtCm(S.maxKort)} × ${Shop.fmtCm(S.maxLang)} cm).`;
      const stuk = Shop.prijsPerStuk(p);
      $(".print-prijs", p.el).textContent = maatOk
        ? `${p.aantal} × ${Shop.euro(stuk)} = ${Shop.euro(stuk * p.aantal)}`
        : "";
      const k = kwaliteit(p), meter = $(".meter", p.el);
      meter.classList.toggle("verborgen", !k);
      if (k) { meter.className = `meter ${k.klasse}`; meter.textContent = k.tekst; }
    });
    const geldig = prints.filter((p) => Shop.zijdenOk(p.b, p.h));
    const t = Shop.totalen(geldig);
    const n = geldig.reduce((s, p) => s + p.aantal, 0);
    $("#ov-tekst").textContent = `${n} ${n === 1 ? "print" : "prints"} + levering ${Shop.euro(t.levering)}`;
    $("#ov-totaal").textContent = Shop.euro(t.totaal);
  }

  // ---------- Plaatsen ----------
  function controleer() {
    const fouten = [];
    prints.forEach((p, i) => {
      if (!p.file) fouten.push(`Print ${i + 1}: voeg je foto of bestand toe.`);
      if (!Shop.zijdenOk(p.b, p.h)) fouten.push(`Print ${i + 1}: kies een geldige maat.`);
    });
    if (!gekozenDatum) fouten.push("Kies een leverdag in de kalender.");
    else if (!gekozenTijdvak) fouten.push("Kies een uur waarop je thuis bent.");
    ["naam", "tel", "email", "adres", "postcode", "gemeente"].forEach((id) => {
      if (!$("#" + id).value.trim()) fouten.push(`Vul je ${$(`label[for=${id}]`).textContent.toLowerCase()} in.`);
    });
    if ($("#email").value && !$("#email").checkValidity()) fouten.push("Je e-mailadres lijkt niet te kloppen.");
    if ($("#postcode").value && !S.postcodes[$("#postcode").value.trim()]) fouten.push("Je postcode ligt buiten de leverzone. Mail me even, dan zoeken we een oplossing.");
    return fouten;
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

  $("#plaats").addEventListener("click", async () => {
    const fouten = controleer();
    $("#fouten").innerHTML = fouten.join("<br>");
    if (fouten.length) return;

    const order = maakOrder();
    const url = Shop.bonUrl(order);
    const knop = $("#plaats");
    knop.disabled = true;

    meldJonas(order);
    toonResultaat(order, url);
  });

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

  $("#extra").addEventListener("click", nieuwePrint);
  nieuwePrint();
  laadBeschikbaarheid();
})();
