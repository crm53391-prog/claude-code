(() => {
  const DB = window.OMH_DATA;
  const I18N = window.OMH_I18N;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- per-visitor storage (optional: the page works without it) ---------- */
  const local = {
    get(k, d) { try { const v = localStorage.getItem("omh:" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem("omh:" + k, JSON.stringify(v)); } catch { /* blocked */ } }
  };

  const state = {
    lang: I18N[local.get("lang", "")] ? local.get("lang") : (I18N[(navigator.language || "fr").slice(0, 2)] ? navigator.language.slice(0, 2) : "fr"),
    q: "", cat: null, view: "all", sort: "new",
    favs: new Set(local.get("favs", [])),
    cart: local.get("cart", []),
    customer: local.get("customer", { name: "", phone: "", city: "", address: "" }),
    settings: {}, categories: [], products: [], reviews: [], ratings: new Map()
  };

  /* ---------- helpers ---------- */
  const t = (k, ...a) => { const v = I18N[state.lang][k]; return typeof v === "function" ? v(...a) : v; };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const currency = () => (state.lang === "ar" ? "درهم" : state.lang === "en" ? "MAD" : "DH");
  const money = (n) => `${String(Math.round(Number(n) * 100) / 100).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ${currency()}`;
  const fold = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const byId = (id) => state.products.find((p) => p.id === id);
  const catName = (id) => state.categories.find((c) => c.id === id)?.name || "";
  const isPromo = (p) => p.old_price && Number(p.old_price) > Number(p.price);
  const promoPct = (p) => Math.round((1 - p.price / p.old_price) * 100);
  const sep = () => (state.lang === "ar" ? "، " : ", ");

  const STAR = "M10 1.2l2.6 5.6 6.1.7-4.5 4.2 1.2 6.1L10 14.8l-5.4 3 1.2-6.1L1.3 7.5l6.1-.7z";
  const starRow = (fill) => [0, 20, 40, 60, 80].map((x) => `<path transform="translate(${x} 0)" d="${STAR}"/>`).join("");
  function stars(avg) {
    const pct = Math.max(0, Math.min(100, (avg / 5) * 100));
    return `<svg viewBox="0 0 100 20" aria-hidden="true"><g fill="none" stroke="var(--star)" stroke-width="1.3">${starRow()}</g><svg width="${pct}" height="20" viewBox="0 0 ${pct} 20"><g fill="var(--star)">${starRow()}</g></svg></svg>`;
  }
  function ratingOf(id) { return state.ratings.get(id) || { avg: 0, n: 0 }; }
  function ratingHtml(id) {
    const { avg, n } = ratingOf(id);
    if (!n) return "";
    const r = avg.toFixed(1);
    return `<span class="stars" role="img" aria-label="${esc(t("ratingLabel", r, n))}">${stars(avg)}<span aria-hidden="true">${r} (${n})</span></span>`;
  }

  /* ---------- loading ---------- */
  async function load() {
    const [settings, categories, products, reviews] = await Promise.all([
      DB.getSettings(), DB.listCategories(), DB.listProducts(), DB.listReviews()
    ]);
    Object.assign(state, { settings, categories, products, reviews });
    state.ratings = new Map();
    for (const r of reviews) {
      const m = state.ratings.get(r.product_id) || { sum: 0, n: 0 };
      m.sum += r.rating; m.n += 1; m.avg = m.sum / m.n;
      state.ratings.set(r.product_id, m);
    }
    state.cart = state.cart.filter((l) => byId(l.id));
    for (const id of [...state.favs]) if (!byId(id)) state.favs.delete(id);
  }

  /* ---------- static text ---------- */
  function renderStatic() {
    document.documentElement.lang = state.lang;
    document.documentElement.dir = I18N[state.lang].dir;
    $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$("[data-i18n-label]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nLabel)));
    $$("[data-i18n-ph]").forEach((el) => el.setAttribute("placeholder", t(el.dataset.i18nPh)));
    $$(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang)));
    $("#sort").value = state.sort;
    $("#demo-note").hidden = DB.live;
  }

  /* ---------- hero: owner's photo or video, revealed on scroll ---------- */
  let heroKey = "";
  function renderHero() {
    const s = state.settings;
    $("#announce").textContent = s.announcement || (Number(s.free_delivery_from) > 0 ? t("freeFrom", money(s.free_delivery_from)) : "");
    $("#announce").hidden = !$("#announce").textContent;
    $("#hero-title").textContent = s.hero_title || "OMH";
    $("#hero-text").textContent = s.hero_text || "";
    $("#hero-text").hidden = !s.hero_text;
    const key = (s.hero_type || "") + (s.hero_url || "");
    if (key === heroKey) return;
    heroKey = key;
    const media = $("#hero-media");
    $("#hero").classList.toggle("hero--plain", !s.hero_url);
    if (!s.hero_url) { media.innerHTML = ""; return; }
    media.innerHTML = s.hero_type === "video"
      ? `<video src="${esc(s.hero_url)}" autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>`
      : `<img src="${esc(s.hero_url)}" alt="" fetchpriority="high">`;
    if (reduceMotion.matches) media.querySelector("video")?.pause();
  }
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const hero = $("#hero");
      if (reduceMotion.matches) { hero.style.setProperty("--p", 1); return; }
      const travel = Math.max(1, hero.offsetHeight - $("#hero-frame").offsetHeight);
      const p = Math.min(1, Math.max(0, (scrollY - hero.offsetTop + 80) / travel));
      hero.style.setProperty("--p", p.toFixed(3));
    });
  }

  /* ---------- sections ---------- */
  function renderRayons() {
    const cats = state.categories.filter((c) => state.products.some((p) => p.category_id === c.id));
    $("#rayons").hidden = !cats.length;
    $("#rayons-list").innerHTML = cats.map((c) => {
      const n = state.products.filter((p) => p.category_id === c.id).length;
      const cover = c.image_url || state.products.find((p) => p.category_id === c.id && p.images?.length)?.images[0];
      return `<li class="rayon"><button type="button" data-cat="${c.id}" aria-pressed="${state.cat === c.id}">
        <span class="rayon__img">${cover ? `<img src="${esc(cover)}" alt="" loading="lazy">` : `<span>${esc(c.name)}</span>`}</span>
        <span class="rayon__name"><span>${esc(c.name)}</span><span class="n">${n}</span></span>
      </button></li>`;
    }).join("");
  }

  /* ---------- products ---------- */
  function filtered() {
    const q = fold(state.q.trim());
    let list = state.products.filter((p) => {
      if (state.cat && p.category_id !== state.cat) return false;
      if (state.view === "new" && !p.is_new) return false;
      if (state.view === "promo" && !isPromo(p)) return false;
      if (state.view === "fav" && !state.favs.has(p.id)) return false;
      if (q && !fold(`${p.name} ${p.description || ""} ${catName(p.category_id)}`).includes(q)) return false;
      return true;
    });
    const s = state.sort;
    if (s === "up") list.sort((a, b) => a.price - b.price);
    else if (s === "down") list.sort((a, b) => b.price - a.price);
    else if (s === "rated") list.sort((a, b) => ratingOf(b.id).avg - ratingOf(a.id).avg || ratingOf(b.id).n - ratingOf(a.id).n);
    return list;
  }

  function renderViews() {
    const opts = [["all", t("all")], ["new", t("newIn")]];
    if (state.products.some(isPromo)) opts.push(["promo", t("promos")]);
    opts.push(["fav", `${t("favourites")}${state.favs.size ? ` (${state.favs.size})` : ""}`]);
    if (!opts.some(([v]) => v === state.view)) state.view = "all";
    $("#views").setAttribute("aria-label", t("sort"));
    $("#views").innerHTML = opts.map(([v, label]) => `<button type="button" data-view="${v}" aria-pressed="${state.view === v && !state.cat}">${esc(label)}</button>`).join("")
      + (state.cat ? `<button type="button" data-clear-cat aria-pressed="true">${esc(catName(state.cat))} ✕</button>` : "");
  }

  function itemHtml(p, big) {
    const imgs = p.images || [];
    const tags = [];
    if (isPromo(p)) tags.push(`<span class="tag tag--promo">${esc(t("promoTag", promoPct(p)))}</span>`);
    if (p.is_new) tags.push(`<span class="tag">${esc(t("newTag"))}</span>`);
    const fav = state.favs.has(p.id);
    return `<li class="item${big ? " item--hero" : ""}">
      <div class="item__img">
        ${imgs.length ? `<img src="${esc(imgs[0])}" alt="" loading="lazy">${imgs[1] ? `<img src="${esc(imgs[1])}" alt="" loading="lazy">` : ""}` : `<span class="item__noimg">${esc(p.name)}</span>`}
        ${tags.length ? `<span class="tags">${tags.join("")}</span>` : ""}
      </div>
      <button type="button" class="icon-btn fav" data-fav="${p.id}" aria-pressed="${fav}" aria-label="${esc(fav ? t("removeFav") : t("addFav"))}">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
      </button>
      <div class="item__info">
        ${catName(p.category_id) ? `<span class="item__cat">${esc(catName(p.category_id))}</span>` : ""}
        <h3 class="item__name"><button type="button" data-open="${p.id}">${esc(p.name)}</button></h3>
        ${ratingHtml(p.id)}
        <p class="price${isPromo(p) ? " price--promo" : ""}"><span class="now">${money(p.price)}</span>${isPromo(p) ? `<s>${money(p.old_price)}</s>` : ""}</p>
      </div>
    </li>`;
  }

  function renderGrid() {
    const list = filtered();
    $("#count").textContent = t("results", list.length);
    $("#grid").innerHTML = list.map((p, i) => itemHtml(p, i === 0 && list.length >= 5)).join("");
    const empty = $("#empty");
    empty.hidden = list.length > 0;
    $("#toolbar").hidden = state.products.length === 0;
    if (list.length) return;
    if (!state.products.length) {
      empty.innerHTML = `<h3>${esc(t("emptyShopTitle"))}</h3><p>${esc(t("emptyShopText"))}</p>${DB.live ? "" : `<a class="btn" href="admin.html">${esc(t("emptyAdmin"))}</a>`}`;
    } else if (state.view === "fav") {
      empty.innerHTML = `<h3>${esc(t("emptyFavTitle"))}</h3><p>${esc(t("emptyFavText"))}</p><button type="button" class="btn btn--line" data-reset>${esc(t("showAll"))}</button>`;
    } else {
      empty.innerHTML = `<h3>${esc(t("emptyFilterTitle"))}</h3><p>${esc(t("emptyFilterText"))}</p><button type="button" class="btn btn--line" data-reset>${esc(t("showAll"))}</button>`;
    }
  }

  function renderVoices() {
    const list = state.reviews.filter((r) => r.comment && byId(r.product_id)).slice(0, 12);
    $("#voices").hidden = !list.length;
    $("#voices-list").innerHTML = list.map((r) => `<li class="voice">
      <span class="stars" role="img" aria-label="${esc(t("star", r.rating))}">${stars(r.rating)}</span>
      <q>${esc(r.comment)}</q>
      <footer><b>${esc(r.author)}</b>${sep()}${esc(byId(r.product_id).name)}</footer>
    </li>`).join("");
  }

  function renderFooter() {
    const s = state.settings;
    $("#perks").innerHTML = t("perks").map((x) => `<li>${esc(x)}</li>`).join("");
    $("#foot-phone").textContent = s.whatsapp ? "+" + s.whatsapp.replace(/\D/g, "") : "";
    $("#foot-city").textContent = s.city || "";
    $("#foot-insta").innerHTML = s.instagram ? `<a href="https://instagram.com/${esc(s.instagram.replace(/^@/, ""))}" target="_blank" rel="noopener">@${esc(s.instagram.replace(/^@/, ""))}</a>` : "";
  }

  function renderCounts() {
    $("#cart-count").textContent = state.cart.reduce((n, l) => n + l.qty, 0);
    $("#fav-count").textContent = state.favs.size;
    $("#fav-count").hidden = !state.favs.size;
  }

  function renderShop() { renderRayons(); renderViews(); renderGrid(); }
  function renderAll() {
    renderStatic(); renderHero(); renderShop(); renderVoices(); renderFooter(); renderCounts();
    if ($("#product").open && current) renderProduct();
    if ($("#cart").open) renderCart();
  }

  /* ---------- favourites ---------- */
  function toggleFav(id) {
    if (state.favs.has(id)) state.favs.delete(id); else state.favs.add(id);
    local.set("favs", [...state.favs]);
    renderCounts();
  }

  /* ---------- product sheet ---------- */
  let current = null; // { p, img, size, color, qty, error, review: { rating, author, comment, msg, ok } }
  function openProduct(id) {
    const p = byId(id);
    if (!p) return;
    current = { p, img: 0, size: null, color: 0, qty: 1, error: "", review: { rating: 0, author: state.customer.name || "", comment: "", msg: "", ok: false, open: false } };
    renderProduct();
    $("#product").showModal();
    $("#product .sheet__info")?.scrollTo(0, 0);
  }

  function renderProduct() {
    const { p, img, size, color, qty, error, review } = current;
    const imgs = p.images || [];
    const sizes = Array.isArray(p.sizes) ? p.sizes : [];
    const colors = Array.isArray(p.colors) ? p.colors : [];
    const { avg, n } = ratingOf(p.id);
    const list = state.reviews.filter((r) => r.product_id === p.id);
    const sel = sizes.find((s) => s.size === size);
    const fav = state.favs.has(p.id);
    let hint = "";
    if (error) hint = `<p class="hint hint--error" role="alert">${esc(error)}</p>`;
    else if (sel && sel.stock > 0 && sel.stock <= 2) hint = `<p class="hint">${esc(t("lowStock", sel.stock))}</p>`;

    $("#product-body").innerHTML = `
      <div class="gallery">
        <div class="gallery__main">${imgs.length ? `<img src="${esc(imgs[img])}" alt="${esc(p.name)}">` : `<span class="item__noimg">${esc(p.name)}</span>`}</div>
        ${imgs.length > 1 ? `<div class="gallery__thumbs">${imgs.map((u, i) => `<button type="button" data-img="${i}" aria-current="${i === img}" aria-label="${esc(t("photo", i + 1, imgs.length))}"><img src="${esc(u)}" alt=""></button>`).join("")}</div>` : ""}
      </div>
      <div class="sheet__info">
        <div>
          ${catName(p.category_id) ? `<p class="item__cat">${esc(catName(p.category_id))}</p>` : ""}
          <h3 id="p-name">${esc(p.name)}</h3>
        </div>
        ${n ? `<a href="#p-reviews" class="stars" data-goto-reviews>${stars(avg)}<span>${avg.toFixed(1)}${sep()}${esc(t("reviewsCount", n))}</span></a>` : ""}
        <p class="price sheet__price${isPromo(p) ? " price--promo" : ""}"><span class="now">${money(p.price)}</span>${isPromo(p) ? `<s>${money(p.old_price)}</s>` : ""}</p>
        ${colors.length ? `<fieldset><legend>${esc(t("chooseColour"))}</legend><div class="swatches">${colors.map((c, i) =>
          `<button type="button" class="swatch" data-color="${i}" aria-pressed="${color === i}"><i style="background:${esc(c.hex || "#ccc")}"></i>${esc(c.name || "")}</button>`).join("")}</div></fieldset>` : ""}
        ${sizes.length ? `<fieldset><legend>${esc(t("chooseSize"))}</legend><div class="sizes">${sizes.map((s) => {
          const out = !(s.stock > 0);
          return `<button type="button" class="size" data-size="${esc(s.size)}" aria-pressed="${size === s.size}" ${out ? `disabled aria-label="${esc(s.size)}, ${esc(t("soldOut"))}"` : ""}>${esc(s.size)}</button>`;
        }).join("")}</div>${hint}</fieldset>` : ""}
        <div class="buy">
          <div class="stepper" role="group" aria-label="${esc(t("qty"))}"><button type="button" data-qty="-1" aria-label="−">−</button><output>${qty}</output><button type="button" data-qty="1" aria-label="+">+</button></div>
          <button type="button" class="btn" id="add">${esc(t("addToCart"))}</button>
          <button type="button" class="icon-btn" data-fav="${p.id}" aria-pressed="${fav}" aria-label="${esc(fav ? t("removeFav") : t("addFav"))}">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
          </button>
        </div>
        ${p.description ? `<div><h4 class="visually-hidden">${esc(t("description"))}</h4><p class="sheet__desc">${esc(p.description)}</p></div>` : ""}
        <section class="reviews" id="p-reviews" aria-labelledby="p-reviews-title">
          <div class="reviews__head">
            <h4 id="p-reviews-title">${esc(t("reviews"))}</h4>
            ${n ? `<span class="reviews__avg"><b>${avg.toFixed(1)}</b>${stars(avg).replace("<svg ", '<svg width="96" height="18" ')}<span class="item__cat">${esc(t("reviewsCount", n))}</span></span>` : ""}
          </div>
          ${list.length ? list.slice(0, 20).map((r) => `<article class="review">
              <span class="stars" role="img" aria-label="${esc(t("star", r.rating))}">${stars(r.rating)}</span>
              ${r.comment ? `<p>${esc(r.comment)}</p>` : ""}
              <p class="review__by"><b>${esc(r.author)}</b>${sep()}<time datetime="${esc(r.created_at)}">${new Date(r.created_at).toLocaleDateString(state.lang === "ar" ? "ar-MA" : state.lang === "en" ? "en-GB" : "fr-FR")}</time></p>
            </article>`).join("") : `<p class="item__cat">${esc(t("noReviews"))}</p>`}
          <details class="review-form" ${review.open ? "open" : ""}>
            <summary>${esc(t("writeReview"))}</summary>
            <form id="review-form" novalidate>
              <div class="fields" style="display:grid;gap:12px;margin-top:12px">
                <fieldset><legend>${esc(t("yourRating"))}</legend>
                  <div class="rate">${[1, 2, 3, 4, 5].map((k) => `<button type="button" data-rate="${k}" class="${k <= review.rating ? "on" : ""}" aria-pressed="${k === review.rating}" aria-label="${esc(t("star", k))}"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="${STAR}"/></svg></button>`).join("")}</div>
                </fieldset>
                <label class="field" for="r-author">${esc(t("yourName"))}<input id="r-author" maxlength="60" autocomplete="given-name" value="${esc(review.author)}"></label>
                <label class="field" for="r-comment"><span>${esc(t("yourComment"))} <small>(${esc(t("optional"))})</small></span><textarea id="r-comment" maxlength="1000">${esc(review.comment)}</textarea></label>
                <p class="hint${review.ok ? "" : " hint--error"}" role="status">${esc(review.msg)}</p>
                <button type="submit" class="btn btn--line">${esc(t("sendReview"))}</button>
              </div>
            </form>
          </details>
        </section>
      </div>`;
  }

  const sheet = $("#product");
  sheet.addEventListener("click", (e) => {
    if (e.target === sheet) return sheet.close();
    const im = e.target.closest("[data-img]");
    if (im) { current.img = +im.dataset.img; renderProduct(); $(`[data-img="${current.img}"]`).focus(); return; }
    const sz = e.target.closest("[data-size]");
    if (sz && !sz.disabled) { current.size = sz.dataset.size; current.error = ""; renderProduct(); $(`#product [data-size="${CSS.escape(current.size)}"]`).focus(); return; }
    const co = e.target.closest("[data-color]");
    if (co) { current.color = +co.dataset.color; renderProduct(); $(`[data-color="${current.color}"]`).focus(); return; }
    const q = e.target.closest("[data-qty]");
    if (q) { current.qty = Math.max(1, Math.min(9, current.qty + +q.dataset.qty)); $("#product output").textContent = current.qty; return; }
    const f = e.target.closest("[data-fav]");
    if (f) { toggleFav(current.p.id); renderProduct(); renderShop(); $("#product [data-fav]").focus(); return; }
    const r = e.target.closest("[data-rate]");
    if (r) { syncReviewDraft(); current.review.rating = +r.dataset.rate; current.review.open = true; renderProduct(); $(`[data-rate="${r.dataset.rate}"]`).focus(); return; }
    if (e.target.closest("[data-goto-reviews]")) { e.preventDefault(); $("#p-reviews").scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth" }); return; }
    if (e.target.closest("#add")) addCurrent();
  });
  sheet.addEventListener("toggle", (e) => { if (e.target.matches?.(".review-form")) current.review.open = e.target.open; }, true);
  sheet.addEventListener("submit", async (e) => {
    if (e.target.id !== "review-form") return;
    e.preventDefault();
    syncReviewDraft();
    const rv = current.review;
    rv.ok = false;
    if (!rv.rating) rv.msg = t("reviewNeedStars");
    else if (!rv.author.trim()) rv.msg = t("reviewNeedName");
    else {
      try {
        await DB.addReview({ product_id: current.p.id, author: rv.author, rating: rv.rating, comment: rv.comment });
        state.customer.name ||= rv.author.trim(); local.set("customer", state.customer);
        await load();
        current.review = { rating: 0, author: rv.author, comment: "", msg: t("reviewSent"), ok: true, open: true };
        renderShop(); renderVoices();
      } catch (err) { rv.msg = err.message; }
    }
    renderProduct();
    $("#review-form .hint")?.scrollIntoView({ block: "nearest" });
  });
  function syncReviewDraft() {
    if (!$("#r-author")) return;
    current.review.author = $("#r-author").value;
    current.review.comment = $("#r-comment").value;
  }
  function addCurrent() {
    const { p, size, color, qty } = current;
    const sizes = Array.isArray(p.sizes) ? p.sizes : [];
    if (sizes.length && !size) { current.error = t("pickSize"); renderProduct(); $("#product .size:not(:disabled)")?.focus(); return; }
    const c = (p.colors || [])[color];
    const key = (l) => l.id === p.id && l.size === (size || null) && l.color === (c?.name || null);
    const line = state.cart.find(key);
    if (line) line.qty = Math.min(9, line.qty + qty);
    else state.cart.push({ id: p.id, size: size || null, color: c?.name || null, qty });
    saveCart();
    sheet.close();
    toast(t("added"));
  }

  /* ---------- cart ---------- */
  function saveCart() { local.set("cart", state.cart); renderCounts(); if ($("#cart").open) renderCart(); }
  const subtotal = () => state.cart.reduce((s, l) => s + Number(byId(l.id).price) * l.qty, 0);
  function orderItems() {
    return state.cart.map((l) => { const p = byId(l.id); return { id: p.id, name: p.name, size: l.size, color: l.color, qty: l.qty, price: Number(p.price) }; });
  }
  function waLink() {
    const num = (state.settings.whatsapp || "").replace(/\D/g, "");
    if (!num) return "";
    const c = state.customer;
    const lines = orderItems().map((i) => "- " + [`${i.qty} × ${i.name}`, i.size && `${t("size")} ${i.size}`, i.color, money(i.price * i.qty)].filter(Boolean).join(sep()));
    const msg = [t("waHello"), ...lines, "", `${t("waTotal")}: ${money(subtotal())}`];
    for (const [k, v] of [["name", c.name], ["phone", c.phone], ["city", c.city], ["address", c.address]]) if (v?.trim()) msg.push(`${t(k)}: ${v.trim()}`);
    return `https://wa.me/${num}?text=${encodeURIComponent(msg.join("\n"))}`;
  }
  function renderCart() {
    const body = $("#cart-body");
    if (!state.cart.length) {
      body.innerHTML = `<p>${esc(t("cartEmpty"))}</p><button type="button" class="btn btn--line" data-keep>${esc(t("keepShopping"))}</button>`;
      return;
    }
    const sub = subtotal();
    const freeFrom = Number(state.settings.free_delivery_from) || 0;
    const wa = waLink();
    const c = state.customer;
    body.innerHTML = `
      <ul class="lines">${state.cart.map((l, i) => {
        const p = byId(l.id);
        return `<li class="line">
          <div class="line__img">${p.images?.[0] ? `<img src="${esc(p.images[0])}" alt="">` : ""}</div>
          <div class="line__info">
            <span class="line__name">${esc(p.name)}</span>
            <span class="line__meta">${[l.size && `${esc(t("size"))} ${esc(l.size)}`, l.color && esc(l.color)].filter(Boolean).join(sep())}</span>
            <div class="line__row">
              <div class="stepper" role="group" aria-label="${esc(t("qty"))}"><button type="button" data-line="${i}" data-d="-1" aria-label="−">−</button><output>${l.qty}</output><button type="button" data-line="${i}" data-d="1" aria-label="+">+</button></div>
              <span class="price">${money(p.price * l.qty)}</span>
            </div>
            <button type="button" class="link-btn" data-remove="${i}">${esc(t("remove"))}</button>
          </div>
        </li>`;
      }).join("")}</ul>
      <div class="totals">
        <div><span>${esc(t("subtotal"))}</span><span>${money(sub)}</span></div>
        <div><span>${esc(t("delivery"))}</span><span>${freeFrom && sub >= freeFrom ? esc(t("deliveryFree")) : esc(t("deliveryLater"))}</span></div>
        <div class="grand"><span>${esc(t("total"))}</span><span>${money(sub)}</span></div>
      </div>
      <form class="details" id="details" novalidate>
        <h3>${esc(t("yourDetails"))}</h3>
        <label class="field" for="c-name">${esc(t("name"))}<input id="c-name" autocomplete="name" value="${esc(c.name)}"></label>
        <label class="field" for="c-phone">${esc(t("phone"))}<input id="c-phone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(c.phone)}"></label>
        <label class="field" for="c-city">${esc(t("city"))}<input id="c-city" autocomplete="address-level2" value="${esc(c.city)}"></label>
        <label class="field" for="c-address"><span>${esc(t("address"))} <small>(${esc(t("optional"))})</small></span><input id="c-address" autocomplete="street-address" value="${esc(c.address)}"></label>
      </form>
      ${wa ? `<a class="btn btn--wa" id="wa" href="${esc(wa)}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3Z"/></svg>
        ${esc(t("orderWa"))}</a>
        <p class="note">${esc(t("orderNote"))}</p>` : `<p class="note">${esc(t("noWhatsapp"))}</p>`}`;
  }
  const cart = $("#cart");
  cart.addEventListener("click", (e) => {
    if (e.target === cart) return cart.close();
    const d = e.target.closest("[data-d]");
    if (d) { const i = +d.dataset.line; state.cart[i].qty = Math.max(1, Math.min(9, state.cart[i].qty + +d.dataset.d)); saveCart(); $(`[data-line="${i}"][data-d="${d.dataset.d}"]`)?.focus(); return; }
    const r = e.target.closest("[data-remove]");
    if (r) { state.cart.splice(+r.dataset.remove, 1); saveCart(); ($("#cart [data-remove]") || $("#cart [data-keep]"))?.focus(); return; }
    if (e.target.closest("[data-keep]")) { cart.close(); $("#products").focus({ preventScroll: true }); $("#products").scrollIntoView(); return; }
    if (e.target.closest("#wa")) {
      // Record the order for the admin, then let the link open WhatsApp.
      DB.addOrder({ items: orderItems(), total: subtotal(), customer_name: state.customer.name, customer_phone: state.customer.phone, city: state.customer.city, address: state.customer.address }).catch(() => {});
    }
  });
  cart.addEventListener("input", (e) => {
    const k = { "c-name": "name", "c-phone": "phone", "c-city": "city", "c-address": "address" }[e.target.id];
    if (!k) return;
    state.customer[k] = e.target.value;
    local.set("customer", state.customer);
    const a = $("#wa"); if (a) a.href = waLink();
  });

  /* ---------- page events ---------- */
  $("#open-cart").addEventListener("click", () => { renderCart(); cart.showModal(); });
  $("#open-favs").addEventListener("click", () => {
    state.view = "fav"; state.cat = null; renderShop();
    $("#products").scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth" });
  });
  $("#q").addEventListener("input", (e) => {
    state.q = e.target.value; renderGrid();
  });
  $("#q").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#products").scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth" }); });
  $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; renderGrid(); });
  $("#rayons-list").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]"); if (!b) return;
    state.cat = state.cat === b.dataset.cat ? null : b.dataset.cat;
    state.view = "all";
    renderShop();
    $("#products").scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth" });
  });
  $("#views").addEventListener("click", (e) => {
    if (e.target.closest("[data-clear-cat]")) { state.cat = null; renderShop(); $('#views [data-view="all"]').focus(); return; }
    const b = e.target.closest("[data-view]"); if (!b) return;
    state.view = b.dataset.view; state.cat = null; renderShop();
    $(`#views [data-view="${state.view}"]`).focus();
  });
  $("#products").addEventListener("click", (e) => {
    const f = e.target.closest("[data-fav]");
    if (f) { toggleFav(f.dataset.fav); const id = f.dataset.fav; renderShop(); $(`#grid [data-fav="${id}"]`)?.focus(); return; }
    const o = e.target.closest("[data-open]");
    if (o) { openProduct(o.dataset.open); return; }
    if (e.target.closest("[data-reset]")) { Object.assign(state, { q: "", cat: null, view: "all" }); $("#q").value = ""; renderShop(); }
  });
  $$(".lang button").forEach((b) => b.addEventListener("click", () => { state.lang = b.dataset.lang; local.set("lang", state.lang); renderAll(); }));
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  reduceMotion.addEventListener?.("change", onScroll);

  let toastTimer;
  function toast(msg) { const el = $("#toast"); el.textContent = msg; el.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 3000); }

  async function refresh() { await load(); renderAll(); onScroll(); }
  DB.onChange(refresh); // admin edits in another tab (demo mode)
  renderStatic();
  refresh().catch((err) => {
    $("#empty").hidden = false;
    $("#empty").innerHTML = `<h3>${esc(t("emptyShopTitle"))}</h3><p>${esc(err.message)}</p>`;
  });
})();
