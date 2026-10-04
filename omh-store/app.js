(() => {
  const CFG = window.OMH_CONFIG;
  const FAMILIES = window.OMH_FAMILIES;
  const CATS = window.OMH_CATEGORIES;
  const PRODUCTS = window.OMH_PRODUCTS;
  const MATS = window.OMH_MATERIALS;
  const COLORS = window.OMH_COLORS;
  const I18N = window.OMH_I18N;
  const RULER_SIZES = range(19, 47);
  const $ = (s, r = document) => r.querySelector(s);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- storage (never required for the page to work) ---------- */
  const store = {
    get(k, fallback) { try { const v = localStorage.getItem("omh:" + k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
    set(k, v) { try { localStorage.setItem("omh:" + k, JSON.stringify(v)); } catch { /* storage blocked */ } }
  };

  const state = {
    lang: I18N[store.get("lang", "")] ? store.get("lang") : guessLang(),
    size: null,
    gender: "all",
    sort: "popular",
    cart: sanitizeCart(store.get("cart", [])),
    customer: store.get("customer", { name: "", city: "" })
  };

  function guessLang() {
    const l = (navigator.language || "fr").slice(0, 2);
    return I18N[l] ? l : "fr";
  }
  function sanitizeCart(c) { return Array.isArray(c) ? c.filter((l) => l && byId(l.id) && l.qty > 0) : []; }
  function range(a, b) { const out = []; for (let i = a; i <= b; i++) out.push(i); return out; }
  function byId(id) { return PRODUCTS.find((p) => p.id === id); }
  function catOf(p) { return CATS.find((c) => c.id === p.cat); }
  const t = (k, ...args) => { const v = I18N[state.lang][k]; return typeof v === "function" ? v(...args) : v; };
  const L = (obj) => (obj ? obj[state.lang] || obj.fr : "");
  const money = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ${L(CFG.currency)}`;
  const sep = () => (state.lang === "ar" ? "، " : ", ");
  /* EU (Paris point) size to foot length: last = size × 2/3 cm, foot ≈ last − 1.5 cm */
  const footCm = (s) => (s * 2 / 3 - 1.5).toFixed(1);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const metaOf = (p) => {
    const parts = [];
    if (p.cat !== "enfants") parts.push(esc(t("gender_" + p.gender)));
    parts.push(esc(L(MATS[p.mat])));
    if (p.isNew) parts.push(`<span class="new">${esc(t("newBadge"))}</span>`);
    return parts.join(sep());
  };

  /* ---------- shoe drawings (placeholders until real photos) ---------- */
  const SOLE = (c) => `<path d="M8 54h104c3 0 4 3 3 5l-1 2c-1 2-3 3-5 3H13c-3 0-5-2-5-5z" fill="${c}"/>`;
  const SHAPES = {
    sneaker: (a, b) => `<path d="M12 55 11 40c0-6 4-10 10-10h12c6 0 10-6 16-8l9-2c8 7 18 14 32 18 12 3 20 6 20 14v3z" fill="${a}"/>${SOLE(b)}<path d="M38 47c16-1 30-5 44-6" stroke="${b}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M54 25l5 5m1-8 5 5m1-7 5 5" stroke="currentColor" stroke-width="1.6" opacity=".55"/>`,
    runner: (a, b) => `<path d="M14 52 12 38c0-5 3-9 9-9h10c7 0 12-7 18-9l8-1c9 9 22 15 36 18 10 2 18 6 19 15z" fill="${a}"/><path d="M8 50h104c4 0 6 4 4 8l-3 4c-1 2-3 2-5 2H18c-6 0-10-4-10-9z" fill="${b}"/><path d="M30 42c10 4 30 2 52-4" stroke="currentColor" stroke-width="1.6" fill="none" opacity=".5"/>`,
    hightop: (a, b) => `<path d="M14 55 13 14c0-4 3-7 7-7h24c2 10 6 19 16 23 16 6 36 10 47 15 4 2 5 6 5 10z" fill="${a}"/>${SOLE(b)}<circle cx="28" cy="28" r="9" fill="none" stroke="${b}" stroke-width="4"/><path d="M48 14l6 4m-4-10 6 4m2 10 6 4" stroke="currentColor" stroke-width="1.6" opacity=".55"/>`,
    cleat: (a, b) => `<path d="M12 52 11 38c0-5 4-9 10-9h12c6 0 10-6 16-8l9-2c8 7 18 14 32 18 12 3 20 6 20 14v1z" fill="${a}"/><path d="M8 51h104c3 0 4 3 3 5l-1 1c-1 1-2 2-4 2H12c-3 0-4-2-4-4z" fill="${b}"/><path d="M18 59h6v6h-6zm20 0h6v6h-6zm38 0h6v6h-6zm20 0h6v6h-6z" fill="${b}"/><path d="M36 44l40-6" stroke="${b}" stroke-width="4" stroke-linecap="round"/>`,
    loafer: (a, b) => `<path d="M12 55c-1-9 2-16 12-17h26c14-2 34-2 50 3 8 3 13 8 13 14z" fill="${a}"/><path d="M8 54h106v4c0 2-2 4-4 4H12c-2 0-4-2-4-4z" fill="${b}"/><path d="M58 40c6 7 18 7 26 1" stroke="currentColor" stroke-width="2" fill="none" opacity=".55"/><path d="M12 55h12v7H12z" fill="${b}"/>`,
    oxford: (a, b) => `<path d="M12 55c-1-12 1-24 10-26h16c8 3 12 10 24 12 16 2 32 3 42 8 6 3 9 6 9 9z" fill="${a}"/><path d="M8 54h106v4c0 2-2 4-4 4H8z" fill="${b}"/><path d="M12 56h14v8H12z" fill="${b}"/><path d="M44 34l10 6m-6-9 10 6m-6-9 10 6" stroke="currentColor" stroke-width="1.6" opacity=".6"/><path d="M84 46c4 1 8 4 10 8" stroke="currentColor" stroke-width="1.6" fill="none" opacity=".5"/>`,
    chelsea: (a, b) => `<path d="M16 55V10h28l2 22c14 5 36 9 52 13 8 2 14 6 14 10z" fill="${a}"/><path d="M28 10h12l2 24H30z" fill="${b}" opacity=".85"/><path d="M8 54h106v4c0 2-2 4-4 4H8z" fill="${b}"/><path d="M14 56h14v8H14z" fill="${b}"/>`,
    boot: (a, b) => `<path d="M18 55V3h28v31c14 6 34 8 50 11 9 2 16 6 16 10z" fill="${a}"/><path d="M8 54h106v4c0 2-2 4-4 4H8z" fill="${b}"/><path d="M14 56h16v8H14z" fill="${b}"/><path d="M18 9h28" stroke="${b}" stroke-width="3"/>`,
    heel: (a, b) => `<path d="M20 30c1-4 6-5 9-3 16 10 32 17 52 19 16 2 28 4 30 10l-2 2c-20 0-46-2-66-6l-14-4z" fill="${a}"/><path d="M20 30h9l-3 34h-3z" fill="${b}"/><path d="M60 55c16 2 34 3 50 3" stroke="${b}" stroke-width="2.5"/>`,
    sandal: (a, b) => `<path d="M10 55c0-5 4-7 10-7h86c6 0 9 4 8 8l-1 2H12c-1 0-2-1-2-3z" fill="${b}"/><path d="M8 58h106v2c0 2-2 4-4 4H12c-2 0-4-2-4-4z" fill="${b}" opacity=".7"/><g fill="none" stroke="${a}" stroke-width="6" stroke-linecap="round"><path d="M28 48c2-12 14-14 18 0"/><path d="M62 48c4-16 22-16 28 0"/><path d="M18 46c0-18 16-20 20-8"/></g>`,
    slide: (a, b) => `<path d="M10 55c0-5 4-7 10-7h86c6 0 9 4 8 8l-1 2H12c-1 0-2-1-2-3z" fill="${b}"/><path d="M8 58h106v2c0 2-2 4-4 4H12c-2 0-4-2-4-4z" fill="${b}" opacity=".7"/><path d="M46 49c2-18 42-20 50 0z" fill="${a}"/>`,
    babouche: (a, b) => `<path d="M12 56c0-6 6-8 16-8 22-2 50-10 72-8 10 1 16 7 18 14z" fill="${a}"/><path d="M44 46c14-14 46-16 68 4" stroke="currentColor" stroke-width="1.6" fill="none" opacity=".45"/><path d="M8 55h110l-1 3c-1 2-3 3-5 3H10c-2 0-3-2-2-4z" fill="${b}"/><path d="M70 40c6 4 14 4 20 0" stroke="${b}" stroke-width="2.5" fill="none"/>`,
    ballet: (a, b) => `<path d="M12 56c0-8 6-12 16-10 22 5 46 2 68 0 10-1 16 4 18 10z" fill="${a}"/><path d="M8 55h108v3c0 2-2 4-4 4H10c-2 0-2-2-2-4z" fill="${b}" opacity=".9"/><path d="M80 46c-6-6-6 6 0 0 6-6 6 6 0 0z" stroke="${b}" stroke-width="3" fill="none"/>`,
    espadrille: (a, b) => `<path d="M12 50c0-10 6-14 14-14h14c18 0 40 2 60 6 8 2 14 5 14 8z" fill="${a}"/><path d="M8 50h108v8c0 3-2 6-6 6H12c-2 0-4-2-4-4z" fill="${b}"/><path d="M14 54h96m-96 5h96" stroke="currentColor" stroke-width="1" stroke-dasharray="3 3" opacity=".45"/>`,
    mule: (a, b) => `<path d="M48 54c2-16 30-22 52-14 8 3 14 8 14 14z" fill="${a}"/><path d="M8 54h108v4c0 2-2 4-4 4H8z" fill="${b}"/><path d="M12 58h14v6H12z" fill="${b}"/>`,
    safety: (a, b) => `<path d="M12 56V16h34l4 14c16 4 40 4 54 10 8 3 10 9 10 16z" fill="${a}"/><path d="M84 38c12 1 22 4 26 10 2 4 2 8 2 8H82z" fill="${b}" opacity=".9"/><path d="M8 54h110v6c0 3-2 5-5 5H8z" fill="${b}"/><path d="M12 22h34" stroke="${b}" stroke-width="3"/>`,
    slipper: (a, b) => `<path d="M12 55c-4-14 10-20 26-16 22-6 52-8 68 4 7 5 8 10 6 12z" fill="${a}"/><path d="M40 39c20-6 48-6 62 2" stroke="${b}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M8 54h108v3c0 3-2 5-5 5H12c-2 0-4-2-4-4z" fill="currentColor" opacity=".25"/>`,
    kids: (a, b) => `<g transform="translate(14 10) scale(.82)"><path d="M12 55 11 36c0-6 4-10 10-10h14c6 0 10-4 16-6l9-2c8 7 18 14 32 18 12 3 20 6 20 16v3z" fill="${a}"/>${SOLE(b)}<path d="M44 34h30" stroke="${b}" stroke-width="6" stroke-linecap="round"/><circle cx="30" cy="58" r="3" fill="#F4B400"/><circle cx="60" cy="58" r="3" fill="#F4B400"/></g>`,
    care: (a, b) => `<path d="M44 4h26v32c0 5 5 9 14 11 14 3 22 7 22 13 0 5-6 8-14 8H62c-12 0-18-8-18-18z" fill="${a}"/><path d="M44 4h26v8H44z" fill="${b}"/><path d="M44 16h26" stroke="${b}" stroke-width="2"/>`
  };
  function drawing(p, extraClass = "") {
    const cat = catOf(p);
    const [a, b] = p.colorPick || p.colors;
    return `<svg viewBox="0 0 124 70" class="${extraClass}" aria-hidden="true" focusable="false"><g stroke="currentColor" stroke-opacity=".45" stroke-width="1.1" stroke-linejoin="round">${SHAPES[cat.shape](a, b || "#1B1F2A")}</g></svg>`;
  }

  /* ---------- filtering ---------- */
  function fitsSize(p, s) {
    if (s == null || !p.sizes) return true; // no size chosen, or one-size item
    return s >= p.sizes[0] && s <= p.sizes[1] && !p.soldOut.includes(s);
  }
  function fitsGender(p, g) {
    if (g === "all") return true;
    if (g === "e") return p.gender === "e";
    return p.gender === g || p.gender === "u";
  }
  function visible() {
    let list = PRODUCTS.filter((p) => fitsSize(p, state.size) && fitsGender(p, state.gender));
    if (state.sort === "up") list = [...list].sort((a, b) => a.price - b.price);
    if (state.sort === "down") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }
  const sizedCount = (s) => PRODUCTS.filter((p) => p.sizes && fitsSize(p, s) && fitsGender(p, state.gender)).length;

  /* ---------- render ---------- */
  function renderStatic() {
    document.documentElement.lang = state.lang;
    document.documentElement.dir = I18N[state.lang].dir;
    document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-label]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nLabel)));
    document.querySelectorAll(".lang__btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang)));
    $("#phone").textContent = "+" + CFG.whatsapp.replace(/^(\d{3})(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3 $4");
    $("#city").textContent = L(CFG.city);
  }

  function renderHero() {
    $("#hero-title").textContent = state.size == null ? t("heroAsk") : t("heroAnswer", state.size, sizedCount(state.size));
  }

  function renderRuler() {
    const track = $("#ruler");
    const slider = $("#slider");
    track.innerHTML = "";
    track.append(slider);
    track.insertAdjacentHTML("beforeend",
      `<button type="button" class="tick tick--all" data-size="" aria-pressed="${state.size == null}"><span class="tick__n">${esc(t("rulerAll"))}</span><span class="tick__cm" dir="ltr">19–47</span></button>` +
      RULER_SIZES.map((s) => `<button type="button" class="tick" data-size="${s}" aria-pressed="${state.size === s}" aria-label="${s}, ${footCm(s)} cm"><span class="tick__n">${s}</span><span class="tick__cm">${footCm(s)}</span></button>`).join(""));
    moveSlider(false);
  }

  /* The saffron slider travels to the chosen size: the one moving part of the page. */
  function moveSlider(animate = true) {
    const tick = $(`#ruler .tick[aria-pressed="true"]`);
    const slider = $("#slider");
    if (!tick) return;
    if (!animate) slider.style.transition = "none";
    slider.style.width = tick.offsetWidth + "px";
    slider.style.transform = `translateX(${tick.offsetLeft}px)`;
    if (!animate) { void slider.offsetWidth; slider.style.transition = ""; }
    const sc = $("#ruler-scroll");
    const target = tick.offsetLeft - (sc.clientWidth - tick.offsetWidth) / 2;
    sc.scrollTo({ left: document.dir === "rtl" ? target - (sc.scrollWidth - sc.clientWidth) : target, behavior: animate && !reduceMotion.matches ? "smooth" : "auto" });
  }

  function renderAisles() {
    const list = visible();
    $("#aisle-list").innerHTML = FAMILIES.map((f) => {
      const types = CATS.filter((c) => c.family === f.id);
      return `<div class="aisle">
        <h3><a href="#f-${f.id}">${esc(L(f))}</a></h3>
        <ul>${types.map((c) => {
          const n = list.filter((p) => p.cat === c.id).length;
          return n
            ? `<li><a href="#t-${c.id}">${esc(L(c))}</a><span class="n">${n}</span></li>`
            : `<li class="is-empty"><span>${esc(L(c))}</span><span class="n">0</span></li>`;
        }).join("")}</ul>
      </div>`;
    }).join("");
  }

  function renderFilters() {
    const chip = $("#size-chip");
    chip.hidden = state.size == null;
    if (state.size != null) {
      chip.innerHTML = `${esc(t("sizeChip", state.size))}<button type="button" id="clear-size" aria-label="${esc(t("clearSize"))}"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>`;
    }
    $("#gender").setAttribute("aria-label", t("gender"));
    $("#gender").innerHTML = ["all", "f", "h", "e"].map((g) =>
      `<button type="button" data-gender="${g}" aria-pressed="${state.gender === g}">${esc(g === "all" ? t("genderAll") : t("gender_" + g))}</button>`).join("");
    $("#sort").value = state.sort;
  }

  function itemHtml(p) {
    const sizes = p.sizes ? `<bdi dir="ltr">${p.sizes[0]}–${p.sizes[1]}</bdi>` : esc(t("oneSize"));
    return `<li class="item">
      <div class="item__img">${drawing(p)}</div>
      <h4 class="item__name"><button type="button" data-open="${p.id}">${esc(L(p.name))}</button></h4>
      <p class="item__meta">${metaOf(p)}</p>
      <p class="item__buy"><span class="price">${money(p.price)}</span><span class="item__sizes">${sizes}</span></p>
    </li>`;
  }

  function renderShelves() {
    const list = visible();
    $("#result-count").textContent = t("results", list.length);
    $("#shelves").innerHTML = FAMILIES.map((f) => {
      const types = CATS.filter((c) => c.family === f.id)
        .map((c) => ({ c, items: list.filter((p) => p.cat === c.id) }))
        .filter((x) => x.items.length);
      if (!types.length) return "";
      const single = types.length === 1 && CATS.filter((c) => c.family === f.id).length === 1;
      return `<section class="family" id="f-${f.id}" aria-labelledby="fh-${f.id}">
        <header class="family__head"><h2 id="fh-${f.id}">${esc(L(f))}</h2><p>${esc(L(f.note))}</p></header>
        ${types.map(({ c, items }) => `<section class="shelf-type" id="t-${c.id}" aria-label="${esc(L(c))}">
          ${single ? "" : `<h3>${esc(L(c))} <span class="n">${items.length}</span></h3>`}
          <ul class="shelf">${items.map(itemHtml).join("")}</ul>
        </section>`).join("")}
      </section>`;
    }).join("");
    $("#empty").hidden = list.length > 0;
  }

  function renderGuide() {
    $("#guide-rows").innerHTML = RULER_SIZES.map((s) =>
      `<tr class="${state.size === s ? "is-current" : ""}"><td>${s}</td><td>${footCm(s)} cm</td></tr>`).join("");
  }

  function renderCatalogue() { renderHero(); renderAisles(); renderFilters(); renderShelves(); renderGuide(); }
  function renderAll() {
    renderStatic(); renderRuler(); renderCatalogue(); renderCartCount();
    if ($("#cart").open) renderCart();
    if ($("#product").open && current) renderProduct();
  }

  /* ---------- product sheet ---------- */
  let current = null; // { p, size, color, qty, error }
  function openProduct(id) {
    const p = byId(id);
    const size = p.sizes && state.size != null && fitsSize(p, state.size) ? state.size : null;
    current = { p, size, color: 0, qty: 1, error: "" };
    renderProduct();
    $("#product").showModal();
  }
  function renderProduct() {
    const { p, size, color, qty, error } = current;
    const pick = [p.colors[color], p.colors[(color + 1) % p.colors.length]];
    const sizesHtml = p.sizes
      ? `<fieldset><legend>${esc(t("chooseSize"))}</legend><div class="sizes">${range(p.sizes[0], p.sizes[1]).map((s) => {
          const out = p.soldOut.includes(s);
          return `<button type="button" class="size" data-pick-size="${s}" aria-pressed="${size === s}" ${out ? `disabled aria-label="${s}, ${esc(t("soldOutSize"))}"` : `aria-label="${s}, ${footCm(s)} cm"`}><b>${s}</b><small>${footCm(s)}</small></button>`;
        }).join("")}</div><p class="form-error" id="size-error" role="alert">${esc(error)}</p></fieldset>`
      : `<p class="sheet__meta">${esc(t("oneSize"))}</p>`;
    $("#product-body").innerHTML = `
      <div class="sheet__img">${drawing({ ...p, colorPick: pick })}</div>
      <div class="sheet__info">
        <div>
          <p class="sheet__meta">${esc(L(catOf(p)))}</p>
          <h3 id="p-name">${esc(L(p.name))}</h3>
          <p class="sheet__meta">${metaOf(p)}</p>
        </div>
        <p class="sheet__price price">${money(p.price)}</p>
        <fieldset><legend>${esc(t("colour"))}</legend><div class="swatches">${p.colors.map((c, i) =>
          `<button type="button" class="swatch" data-pick-color="${i}" aria-pressed="${color === i}"><i style="background:${c}"></i>${esc(L(COLORS[c]) || c)}</button>`).join("")}</div></fieldset>
        ${sizesHtml}
        <div class="sheet__actions">
          <div class="stepper" role="group" aria-label="${esc(t("qty"))}">
            <button type="button" data-qty="-1" aria-label="−">−</button><output aria-live="polite">${qty}</output><button type="button" data-qty="1" aria-label="+">+</button>
          </div>
          <button type="button" class="btn btn--primary" id="add">${esc(t("addToCart"))}</button>
        </div>
      </div>`;
  }

  $("#product").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) return e.currentTarget.close(); // backdrop
    const s = e.target.closest("[data-pick-size]");
    if (s && !s.disabled) { current.size = +s.dataset.pickSize; current.error = ""; renderProduct(); $(`[data-pick-size="${current.size}"]`).focus(); return; }
    const c = e.target.closest("[data-pick-color]");
    if (c) { current.color = +c.dataset.pickColor; renderProduct(); $(`[data-pick-color="${current.color}"]`).focus(); return; }
    const q = e.target.closest("[data-qty]");
    if (q) { current.qty = Math.max(1, Math.min(9, current.qty + +q.dataset.qty)); $("#product output").textContent = current.qty; return; }
    if (e.target.closest("#add")) {
      const { p, size, color, qty } = current;
      if (p.sizes && size == null) { current.error = t("pickSizeFirst"); renderProduct(); $(".sizes .size:not(:disabled)").focus(); return; }
      addToCart(p.id, size, p.colors[color], qty);
      $("#product").close();
      toast(t("added"));
    }
  });

  /* ---------- cart ---------- */
  function addToCart(id, size, color, qty) {
    const line = state.cart.find((l) => l.id === id && l.size === size && l.color === color);
    if (line) line.qty = Math.min(9, line.qty + qty); else state.cart.push({ id, size, color, qty });
    saveCart();
    
  }
  function saveCart() { store.set("cart", state.cart); renderCartCount(); if ($("#cart").open) renderCart(); }
  function renderCartCount() { $("#cart-count").textContent = state.cart.reduce((n, l) => n + l.qty, 0); }
  const subtotal = () => state.cart.reduce((s, l) => s + byId(l.id).price * l.qty, 0);

  function waLink() {
    const lines = state.cart.map((l) => {
      const p = byId(l.id);
      const parts = [`${l.qty} × ${L(p.name)} (${L(catOf(p))})`];
      if (l.size != null) parts.push(`${t("size")} ${l.size}`);
      parts.push(L(COLORS[l.color]) || l.color);
      parts.push(money(p.price * l.qty));
      return "- " + parts.join(sep());
    });
    const msg = [t("waHello"), ...lines, "", `${t("waTotal")}: ${money(subtotal())}`];
    if (state.customer.name.trim()) msg.push(`${t("waName")}: ${state.customer.name.trim()}`);
    if (state.customer.city.trim()) msg.push(`${t("waCity")}: ${state.customer.city.trim()}`);
    return `https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(msg.join("\n"))}`;
  }

  function renderCart() {
    const body = $("#cart-body");
    if (!state.cart.length) {
      body.innerHTML = `<p>${esc(t("cartEmpty"))}</p><button type="button" class="btn btn--ghost" data-browse>${esc(t("cartBrowse"))}</button>`;
      return;
    }
    const sub = subtotal();
    const free = sub >= CFG.freeDeliveryFrom;
    body.innerHTML = `
      <ul class="lines">${state.cart.map((l, i) => {
        const p = byId(l.id);
        return `<li class="line">
          <div class="line__img">${drawing({ ...p, colorPick: [l.color, p.colors.find((c) => c !== l.color) || l.color] })}</div>
          <div class="line__info">
            <span class="line__name">${esc(L(p.name))}</span>
            <span class="line__meta">${l.size != null ? `${esc(t("size"))} ${l.size}${sep()}` : ""}${esc(L(COLORS[l.color]) || "")}</span>
            <div class="line__row">
              <div class="stepper" role="group" aria-label="${esc(t("qty"))}"><button type="button" data-line="${i}" data-d="-1" aria-label="−">−</button><output>${l.qty}</output><button type="button" data-line="${i}" data-d="1" aria-label="+">+</button></div>
              <span class="price">${money(p.price * l.qty)}</span>
            </div>
            <button type="button" class="line__remove" data-remove="${i}">${esc(t("remove"))}</button>
          </div>
        </li>`;
      }).join("")}</ul>
      <div class="totals">
        <div><span>${esc(t("subtotal"))}</span><span>${money(sub)}</span></div>
        <div><span>${esc(t("delivery"))}</span><span>${free ? esc(t("deliveryFree")) : "—"}</span></div>
        ${free ? "" : `<small>${esc(t("deliveryFrom", CFG.freeDeliveryFrom, L(CFG.currency)))}</small>`}
        <div class="grand"><span>${esc(t("total"))}</span><span>${money(sub)}</span></div>
      </div>
      <div class="fields">
        <label class="field" for="c-name"><span>${esc(t("yourName"))} <small>(${esc(t("optional"))})</small></span><input id="c-name" autocomplete="name" value="${esc(state.customer.name)}"></label>
        <label class="field" for="c-city"><span>${esc(t("yourCity"))} <small>(${esc(t("optional"))})</small></span><input id="c-city" autocomplete="address-level2" value="${esc(state.customer.city)}"></label>
      </div>
      <a class="btn btn--wa" id="wa" href="${esc(waLink())}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3Z"/></svg>
        ${esc(t("orderWa"))}
      </a>
      <p class="note">${esc(t("orderNote"))}</p>`;
  }

  $("#cart").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) return e.currentTarget.close();
    const d = e.target.closest("[data-d]");
    if (d) {
      const i = +d.dataset.line; const l = state.cart[i];
      l.qty = Math.max(1, Math.min(9, l.qty + +d.dataset.d));
      saveCart(); $(`[data-line="${i}"][data-d="${d.dataset.d}"]`)?.focus(); return;
    }
    const r = e.target.closest("[data-remove]");
    if (r) { state.cart.splice(+r.dataset.remove, 1); saveCart(); ($(".line__remove") || $("#cart .icon-btn")).focus(); return; }
    if (e.target.closest("[data-browse]")) { $("#cart").close(); $("#aisles").focus(); $("#aisles").scrollIntoView(); }
  });
  $("#cart").addEventListener("input", (e) => {
    if (e.target.id === "c-name") state.customer.name = e.target.value;
    else if (e.target.id === "c-city") state.customer.city = e.target.value;
    else return;
    store.set("customer", state.customer);
    $("#wa").href = waLink();
  });

  /* ---------- page events ---------- */
  $("#open-cart").addEventListener("click", () => { renderCart(); $("#cart").showModal(); });
  function setSize(s) {
    state.size = s;
    document.querySelectorAll("#ruler .tick").forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.size ? +b.dataset.size : null) === s)));
    moveSlider(true);
    renderCatalogue();
  }
  $("#ruler").addEventListener("click", (e) => {
    const b = e.target.closest("[data-size]"); if (!b) return;
    setSize(b.dataset.size ? +b.dataset.size : null);
  });
  $("#filters").addEventListener("click", (e) => {
    if (e.target.closest("#clear-size")) { setSize(null); $("#ruler .tick--all").focus({ preventScroll: true }); return; }
    const g = e.target.closest("[data-gender]"); if (!g) return;
    state.gender = g.dataset.gender; renderCatalogue();
    $(`#gender [data-gender="${state.gender}"]`).focus();
  });
  $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; renderShelves(); });
  $("#shelves").addEventListener("click", (e) => { const b = e.target.closest("[data-open]"); if (b) openProduct(b.dataset.open); });
  $("#reset").addEventListener("click", () => { state.gender = "all"; setSize(null); });
  document.querySelectorAll(".lang__btn").forEach((b) => b.addEventListener("click", () => {
    state.lang = b.dataset.lang; store.set("lang", state.lang); renderAll();
  }));
  $("#copy-phone").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText("+" + CFG.whatsapp); toast(t("copied")); }
    catch { const r = document.createRange(); r.selectNodeContents($("#phone")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  });
  addEventListener("resize", () => moveSlider(false));
  document.fonts?.ready.then(() => moveSlider(false));

  let toastTimer;
  function toast(msg) {
    const el = $("#toast"); el.textContent = msg; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 3000);
  }

  renderAll();
  // Deep links such as index.html#t-babouches or #f-sport land on the shelf once it exists.
  if (location.hash.length > 1) document.getElementById(location.hash.slice(1))?.scrollIntoView();
})();
