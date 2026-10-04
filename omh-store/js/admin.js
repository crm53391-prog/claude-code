(() => {
  const DB = window.OMH_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => `${String(Math.round(Number(n) * 100) / 100).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} DH`;
  const date = (s) => new Date(s).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
  const STATUS = { new: "Nouvelle", confirmed: "Confirmée", shipped: "Expédiée", delivered: "Livrée", cancelled: "Annulée" };

  const state = { tab: "products", settings: {}, categories: [], products: [], orders: [], reviews: [] };
  let toastTimer;
  function toast(msg) { const el = $("#toast"); el.textContent = msg; el.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 3000); }
  function fail(err) {
    const m = err?.message === "demo-too-big" ? "Fichier trop lourd pour le mode démo (8 Mo maximum). En ligne avec Supabase, il passera." : (err?.message || String(err));
    toast(m);
  }

  /* Delete buttons ask once more in place: first click arms, second click deletes. */
  function confirmClick(btn) {
    if (btn.dataset.armed) return true;
    btn.dataset.armed = "1"; btn.dataset.label = btn.textContent;
    btn.textContent = "Confirmer la suppression"; btn.classList.add("sbtn--confirm");
    setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.textContent = btn.dataset.label; btn.classList.remove("sbtn--confirm"); } }, 4000);
    return false;
  }

  async function load() {
    const [settings, categories, products, orders, reviews] = await Promise.all([
      DB.getSettings(), DB.listCategories(), DB.listProducts({ includeHidden: true }), DB.listOrders(), DB.listReviews({ includeHidden: true })
    ]);
    Object.assign(state, { settings, categories, products, orders, reviews });
    const n = orders.filter((o) => o.status === "new").length;
    $("#new-orders").textContent = n; $("#new-orders").hidden = !n;
  }

  const catName = (id) => state.categories.find((c) => c.id === id)?.name || "Sans rayon";
  const stockOf = (p) => (p.sizes || []).reduce((s, x) => s + (Number(x.stock) || 0), 0);

  /* ---------- views ---------- */
  function render() {
    $$("#tabs [data-tab]").forEach((b) => { if (b.dataset.tab === state.tab) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    const v = { products: viewProducts, categories: viewCategories, orders: viewOrders, reviews: viewReviews, settings: viewSettings }[state.tab];
    $("#view").innerHTML = v();
  }

  function viewProducts() {
    const head = `<div class="a-head"><div><h1>Produits</h1><p>${state.products.length} produit(s). Les produits masqués n'apparaissent pas dans la boutique.</p></div><button type="button" class="btn" data-new-product>Ajouter un produit</button></div>`;
    if (!state.products.length) return head + `<div class="a-empty"><h2>Aucun produit pour l'instant.</h2><p>Ajoutez votre premier modèle : nom, prix, photos, pointures et stock. Vous pouvez créer les rayons au même moment.</p><button type="button" class="btn" data-new-product>Ajouter un produit</button></div>`;
    return head + `<ul class="a-list">${state.products.map((p) => {
      const promo = p.old_price && Number(p.old_price) > Number(p.price);
      const stock = stockOf(p);
      return `<li class="a-row${p.active === false ? " a-row--hidden" : ""}">
        <div class="a-row__img">${p.images?.[0] ? `<img src="${esc(p.images[0])}" alt="">` : ""}</div>
        <div class="a-row__main">
          <span class="a-row__title">${esc(p.name)} ${p.is_new ? '<span class="pill">Nouveau</span>' : ""} ${promo ? '<span class="pill pill--red">Promo</span>' : ""} ${p.active === false ? '<span class="pill">Masqué</span>' : ""}</span>
          <span class="a-row__meta">${esc(catName(p.category_id))}, ${money(p.price)}${promo ? ` au lieu de ${money(p.old_price)}` : ""}${(p.sizes || []).length ? `, ${stock} paire(s) en stock` : ""}</span>
        </div>
        <div class="a-row__actions">
          <button type="button" class="sbtn" data-edit-product="${p.id}">Modifier</button>
          <button type="button" class="sbtn" data-toggle-product="${p.id}">${p.active === false ? "Afficher" : "Masquer"}</button>
          <button type="button" class="sbtn sbtn--danger" data-del-product="${p.id}">Supprimer</button>
        </div>
      </li>`;
    }).join("")}</ul>`;
  }

  function viewCategories() {
    const head = `<div class="a-head"><div><h1>Rayons</h1><p>Les rayons regroupent vos produits dans la boutique (par exemple Baskets, Sandales, Enfants). Ils s'affichent dans cet ordre.</p></div><button type="button" class="btn" data-new-cat>Ajouter un rayon</button></div>`;
    if (!state.categories.length) return head + `<div class="a-empty"><h2>Aucun rayon pour l'instant.</h2><p>Créez vos rayons avec le nom de votre choix. Une photo est facultative : sans photo, la boutique utilise celle du premier produit du rayon.</p><button type="button" class="btn" data-new-cat>Ajouter un rayon</button></div>`;
    return head + `<ul class="a-list">${state.categories.map((c, i) => {
      const n = state.products.filter((p) => p.category_id === c.id).length;
      return `<li class="a-row">
        <div class="a-row__img">${c.image_url ? `<img src="${esc(c.image_url)}" alt="">` : ""}</div>
        <div class="a-row__main"><span class="a-row__title">${esc(c.name)}</span><span class="a-row__meta">${n} produit(s)</span></div>
        <div class="a-row__actions">
          <button type="button" class="sbtn" data-move-cat="${c.id}" data-dir="-1" ${i === 0 ? "disabled" : ""} aria-label="Monter ${esc(c.name)}">Monter</button>
          <button type="button" class="sbtn" data-move-cat="${c.id}" data-dir="1" ${i === state.categories.length - 1 ? "disabled" : ""} aria-label="Descendre ${esc(c.name)}">Descendre</button>
          <button type="button" class="sbtn" data-edit-cat="${c.id}">Modifier</button>
          <button type="button" class="sbtn sbtn--danger" data-del-cat="${c.id}">Supprimer</button>
        </div>
      </li>`;
    }).join("")}</ul>`;
  }

  function viewOrders() {
    const head = `<div class="a-head"><div><h1>Commandes</h1><p>Chaque client qui touche « Commander sur WhatsApp » est enregistré ici. Mettez le statut à jour après l'appel.</p></div></div>`;
    if (!state.orders.length) return head + `<div class="a-empty"><h2>Aucune commande pour l'instant.</h2><p>Les commandes apparaîtront ici dès qu'un client enverra son panier sur WhatsApp.</p></div>`;
    return head + state.orders.map((o) => `<article class="order${o.status === "new" ? " order--new" : ""}">
      <div class="order__head">
        <span class="order__who">${esc(o.customer_name || "Client")}${o.customer_phone ? `, <a href="tel:${esc(o.customer_phone)}">${esc(o.customer_phone)}</a>` : ""}${o.city ? `, ${esc(o.city)}` : ""}</span>
        <span class="a-row__meta">${date(o.created_at)}</span>
      </div>
      ${o.address ? `<p class="a-row__meta">${esc(o.address)}</p>` : ""}
      <ul class="order__items">${(o.items || []).map((i) => `<li>${i.qty} × ${esc(i.name)}${i.size ? `, pointure ${esc(i.size)}` : ""}${i.color ? `, ${esc(i.color)}` : ""}, ${money(i.price * i.qty)}</li>`).join("")}</ul>
      <div class="order__head">
        <span class="order__total">${money(o.total)}</span>
        <span class="inline">
          <label class="visually-hidden" for="st-${o.id}">Statut</label>
          <select id="st-${o.id}" data-status="${o.id}">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${o.status === k ? "selected" : ""}>${v}</option>`).join("")}</select>
          <button type="button" class="sbtn sbtn--danger" data-del-order="${o.id}">Supprimer</button>
        </span>
      </div>
    </article>`).join("");
  }

  function viewReviews() {
    const head = `<div class="a-head"><div><h1>Avis clients</h1><p>Les avis sont publiés tout de suite. Masquez ceux qui ne doivent pas apparaître.</p></div></div>`;
    if (!state.reviews.length) return head + `<div class="a-empty"><h2>Aucun avis pour l'instant.</h2><p>Les clients peuvent noter chaque produit de 1 à 5 étoiles depuis sa fiche.</p></div>`;
    return head + `<ul class="a-list">${state.reviews.map((r) => {
      const p = state.products.find((x) => x.id === r.product_id);
      return `<li class="a-row${r.approved === false ? " a-row--hidden" : ""}">
        <div class="a-row__img">${p?.images?.[0] ? `<img src="${esc(p.images[0])}" alt="">` : ""}</div>
        <div class="a-row__main">
          <span class="a-row__title">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)} ${esc(r.author)} ${r.approved === false ? '<span class="pill">Masqué</span>' : ""}</span>
          ${r.comment ? `<span>${esc(r.comment)}</span>` : ""}
          <span class="a-row__meta">${esc(p?.name || "Produit supprimé")}, ${date(r.created_at)}</span>
        </div>
        <div class="a-row__actions">
          <button type="button" class="sbtn" data-toggle-review="${r.id}">${r.approved === false ? "Publier" : "Masquer"}</button>
          <button type="button" class="sbtn sbtn--danger" data-del-review="${r.id}">Supprimer</button>
        </div>
      </li>`;
    }).join("")}</ul>`;
  }

  function heroPreview(s) {
    if (!s.hero_url) return `<div class="hero-preview">${esc(s.hero_title || "OMH")}</div>`;
    return `<div class="hero-preview">${s.hero_type === "video" ? `<video src="${esc(s.hero_url)}" muted autoplay loop playsinline></video>` : `<img src="${esc(s.hero_url)}" alt="">`}</div>`;
  }
  function viewSettings() {
    const s = state.settings;
    return `<div class="a-head"><div><h1>Réglages</h1><p>Coordonnées de la boutique et grande image d'accueil.</p></div></div>
    <form class="a-form" id="settings-form" novalidate style="max-width:760px">
      <fieldset class="a-box"><legend>Contact</legend>
        <div class="a-grid2">
          <label class="field" for="s-wa">Numéro WhatsApp <span class="a-help">Format international, ex. 212612345678</span><input id="s-wa" inputmode="tel" value="${esc(s.whatsapp)}"></label>
          <label class="field" for="s-city">Ville<input id="s-city" value="${esc(s.city)}"></label>
          <label class="field" for="s-insta">Instagram <span class="a-help">facultatif, ex. @omh.shoes</span><input id="s-insta" value="${esc(s.instagram)}"></label>
          <label class="field" for="s-free">Livraison offerte dès (DH) <span class="a-help">0 pour ne rien afficher</span><input id="s-free" type="number" min="0" step="1" value="${esc(s.free_delivery_from || 0)}"></label>
        </div>
        <label class="field" for="s-ann">Bandeau en haut du site <span class="a-help">facultatif, ex. « Soldes : −20 % sur les sandales »</span><input id="s-ann" value="${esc(s.announcement)}"></label>
      </fieldset>
      <fieldset class="a-box"><legend>Image ou vidéo d'accueil</legend>
        <p class="a-help">S'affiche en grand en haut de la boutique et s'agrandit quand on fait défiler la page. Photo en largeur conseillée (1600 px ou plus), ou vidéo MP4 courte sans son.</p>
        <div id="hero-preview">${heroPreview(s)}</div>
        <div class="inline">
          <label class="sbtn upload-btn" style="display:inline-flex;align-items:center;cursor:pointer">Choisir une photo ou une vidéo<input id="s-hero-file" type="file" accept="image/*,video/mp4,video/webm" class="visually-hidden"></label>
          ${s.hero_url ? `<button type="button" class="sbtn sbtn--danger" data-clear-hero>Retirer</button>` : ""}
        </div>
        <div class="a-grid2">
          <label class="field" for="s-title">Grand titre<input id="s-title" value="${esc(s.hero_title || "OMH")}"></label>
          <label class="field" for="s-text">Phrase sous le titre <span class="a-help">facultatif</span><input id="s-text" value="${esc(s.hero_text)}"></label>
        </div>
      </fieldset>
      <div class="a-actions"><button type="submit" class="btn">Enregistrer les réglages</button></div>
    </form>`;
  }

  /* ---------- product editor ---------- */
  let draft = null;
  function openProduct(p) {
    draft = p ? JSON.parse(JSON.stringify(p)) : { name: "", category_id: state.categories[0]?.id || null, price: "", old_price: "", description: "", images: [], sizes: [], colors: [], is_new: true, active: true };
    draft.sizes ||= []; draft.colors ||= []; draft.images ||= [];
    renderProductEditor();
    $("#editor").showModal();
  }
  function renderProductEditor(msg = "") {
    const d = draft;
    $("#editor-body").innerHTML = `<h2 id="editor-title">${d.id ? "Modifier le produit" : "Nouveau produit"}</h2>
    <form class="a-form" id="product-form" novalidate>
      <label class="field" for="p-name">Nom du produit *<input id="p-name" value="${esc(d.name)}" required></label>
      <div class="a-grid2">
        <label class="field" for="p-cat">Rayon
          <select id="p-cat"><option value="">Sans rayon</option>${state.categories.map((c) => `<option value="${c.id}" ${!d._newCat && d.category_id === c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}<option value="__new" ${d._newCat ? "selected" : ""}>+ Créer un nouveau rayon…</option></select>
        </label>
        <label class="field" for="p-newcat" ${d._newCat ? "" : "hidden"}>Nom du nouveau rayon<input id="p-newcat" value="${esc(d._newCatName || "")}"></label>
      </div>
      <div class="a-grid2">
        <label class="field" for="p-price">Prix (DH) *<input id="p-price" type="number" min="0" step="1" inputmode="decimal" value="${esc(d.price)}" required></label>
        <label class="field" for="p-old">Ancien prix (DH) <span class="a-help">à remplir seulement pour une promo</span><input id="p-old" type="number" min="0" step="1" inputmode="decimal" value="${esc(d.old_price ?? "")}"></label>
      </div>
      <label class="field" for="p-desc">Description <span class="a-help">matière, semelle, conseils de taille…</span><textarea id="p-desc">${esc(d.description || "")}</textarea></label>

      <fieldset class="a-box"><legend>Photos</legend>
        <p class="a-help">La première photo est celle de la boutique. La deuxième s'affiche au survol.</p>
        <div class="photos">${d.images.map((u, i) => `<div class="photo"><img src="${esc(u)}" alt="Photo ${i + 1}">${i === 0 ? '<span class="photo__first">Principale</span>' : ""}
          <div class="photo__tools"><button type="button" data-img-first="${i}" aria-label="Mettre en premier" ${i === 0 ? "disabled" : ""}>★</button><button type="button" data-img-del="${i}" aria-label="Retirer la photo ${i + 1}">✕</button></div></div>`).join("")}
          <label class="upload" for="p-files">Ajouter des photos<input id="p-files" type="file" accept="image/*" multiple></label>
        </div>
      </fieldset>

      <fieldset class="a-box"><legend>Pointures et stock</legend>
        <p class="a-help">Pour chaque pointure : la pointure, puis le nombre de paires. Une pointure à 0 apparaît « épuisé ». Laissez vide pour un article sans pointure.</p>
        <div class="inline">
          <label class="field" for="p-from">De<input id="p-from" type="number" min="15" max="50" placeholder="36"></label>
          <label class="field" for="p-to">À<input id="p-to" type="number" min="15" max="50" placeholder="45"></label>
          <label class="field" for="p-qty">Paires par pointure<input id="p-qty" type="number" min="0" placeholder="3"></label>
          <button type="button" class="sbtn" data-gen-sizes style="height:48px">Générer</button>
        </div>
        <div class="sizes-edit">${d.sizes.map((s, i) => `<div class="size-cell${Number(s.stock) > 0 ? "" : " size-cell--out"}">
          <input aria-label="Pointure" data-size-name="${i}" value="${esc(s.size)}"><input aria-label="Stock pointure ${esc(s.size)}" type="number" min="0" data-size-stock="${i}" value="${esc(s.stock)}"><button type="button" data-size-del="${i}" aria-label="Retirer la pointure ${esc(s.size)}">✕</button></div>`).join("")}
          <button type="button" class="sbtn" data-size-add style="height:44px">+ Pointure</button>
        </div>
      </fieldset>

      <fieldset class="a-box"><legend>Couleurs <span class="a-help">facultatif</span></legend>
        <div class="colors-edit">${d.colors.map((c, i) => `<div class="color-row"><input type="color" aria-label="Couleur ${i + 1}" data-color-hex="${i}" value="${esc(c.hex || "#000000")}"><input type="text" aria-label="Nom de la couleur ${i + 1}" placeholder="ex. Noir" data-color-name="${i}" value="${esc(c.name)}"><button type="button" class="icon-btn" data-color-del="${i}" aria-label="Retirer la couleur ${i + 1}">✕</button></div>`).join("")}</div>
        <button type="button" class="sbtn" data-color-add style="justify-self:start">+ Couleur</button>
      </fieldset>

      <div class="a-grid2">
        <label class="check" for="p-new"><input id="p-new" type="checkbox" ${d.is_new ? "checked" : ""}> Marquer « Nouveau »</label>
        <label class="check" for="p-active"><input id="p-active" type="checkbox" ${d.active !== false ? "checked" : ""}> Visible dans la boutique</label>
      </div>
      <p class="hint hint--error" role="alert" id="p-msg">${esc(msg)}</p>
      <div class="a-actions">
        <button type="button" class="btn btn--line" data-close>Annuler</button>
        <button type="submit" class="btn">${d.id ? "Enregistrer" : "Ajouter le produit"}</button>
      </div>
    </form>`;
  }
  function readProductForm() {
    const d = draft;
    if (!$("#p-name")) return;
    d.name = $("#p-name").value;
    const cat = $("#p-cat").value;
    d._newCat = cat === "__new";
    if (!d._newCat) d.category_id = cat || null;
    d._newCatName = $("#p-newcat")?.value || "";
    d.price = $("#p-price").value;
    d.old_price = $("#p-old").value;
    d.description = $("#p-desc").value;
    $$("[data-size-name]").forEach((el) => { d.sizes[+el.dataset.sizeName].size = el.value.trim(); });
    $$("[data-size-stock]").forEach((el) => { d.sizes[+el.dataset.sizeStock].stock = Math.max(0, parseInt(el.value, 10) || 0); });
    $$("[data-color-hex]").forEach((el) => { d.colors[+el.dataset.colorHex].hex = el.value; });
    $$("[data-color-name]").forEach((el) => { d.colors[+el.dataset.colorName].name = el.value; });
    d.is_new = $("#p-new").checked;
    d.active = $("#p-active").checked;
  }

  /* ---------- category editor ---------- */
  let catDraft = null;
  function openCategory(c) {
    catDraft = c ? { ...c } : { name: "", image_url: "" };
    renderCategoryEditor();
    $("#editor").showModal();
  }
  function renderCategoryEditor(msg = "") {
    const c = catDraft;
    $("#editor-body").innerHTML = `<h2 id="editor-title">${c.id ? "Modifier le rayon" : "Nouveau rayon"}</h2>
    <form class="a-form" id="cat-form" novalidate>
      <label class="field" for="c-name">Nom du rayon *<input id="c-name" value="${esc(c.name)}" required placeholder="ex. Baskets"></label>
      <fieldset class="a-box"><legend>Photo <span class="a-help">facultatif</span></legend>
        <div class="photos">${c.image_url ? `<div class="photo"><img src="${esc(c.image_url)}" alt=""><div class="photo__tools"><span></span><button type="button" data-cat-img-del aria-label="Retirer la photo">✕</button></div></div>` : ""}
          <label class="upload" for="c-file">${c.image_url ? "Changer la photo" : "Ajouter une photo"}<input id="c-file" type="file" accept="image/*"></label></div>
      </fieldset>
      <p class="hint hint--error" role="alert">${esc(msg)}</p>
      <div class="a-actions"><button type="button" class="btn btn--line" data-close>Annuler</button><button type="submit" class="btn">${c.id ? "Enregistrer" : "Ajouter le rayon"}</button></div>
    </form>`;
  }

  /* ---------- events ---------- */
  const editor = $("#editor");
  editor.addEventListener("click", async (e) => {
    if (e.target === editor || e.target.closest("[data-close]")) return editor.close();
    if (!$("#product-form")) {
      if (e.target.closest("[data-cat-img-del]")) { catDraft.name = $("#c-name").value; catDraft.image_url = ""; renderCategoryEditor(); }
      return;
    }
    const keep = () => { readProductForm(); };
    let b;
    if ((b = e.target.closest("[data-img-first]"))) { keep(); const i = +b.dataset.imgFirst; draft.images.unshift(...draft.images.splice(i, 1)); renderProductEditor(); return; }
    if ((b = e.target.closest("[data-img-del]"))) { keep(); draft.images.splice(+b.dataset.imgDel, 1); renderProductEditor(); return; }
    if ((b = e.target.closest("[data-size-del]"))) { keep(); draft.sizes.splice(+b.dataset.sizeDel, 1); renderProductEditor(); return; }
    if (e.target.closest("[data-size-add]")) { keep(); const last = Number(draft.sizes.at(-1)?.size); draft.sizes.push({ size: Number.isFinite(last) && last ? String(last + 1) : "", stock: 1 }); renderProductEditor(); $$("[data-size-name]").at(-1)?.focus(); return; }
    if (e.target.closest("[data-gen-sizes]")) {
      const from = parseInt($("#p-from").value, 10), to = parseInt($("#p-to").value, 10), q = Math.max(0, parseInt($("#p-qty").value, 10) || 0);
      keep();
      if (!from || !to || to < from || to - from > 40) { renderProductEditor("Indiquez une pointure de départ et d'arrivée, par exemple 36 à 45."); return; }
      for (let s = from; s <= to; s++) { const ex = draft.sizes.find((x) => x.size === String(s)); if (ex) ex.stock = q; else draft.sizes.push({ size: String(s), stock: q }); }
      draft.sizes.sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
      renderProductEditor(); return;
    }
    if ((b = e.target.closest("[data-color-del]"))) { keep(); draft.colors.splice(+b.dataset.colorDel, 1); renderProductEditor(); return; }
    if (e.target.closest("[data-color-add]")) { keep(); draft.colors.push({ name: "", hex: "#000000" }); renderProductEditor(); $$("[data-color-name]").at(-1)?.focus(); return; }
  });
  editor.addEventListener("change", async (e) => {
    if (e.target.id === "p-cat") { readProductForm(); renderProductEditor(); if (draft._newCat) $("#p-newcat").focus(); return; }
    if (e.target.id === "p-files") {
      readProductForm();
      const files = [...e.target.files];
      $("#p-msg").textContent = `Envoi de ${files.length} photo(s)…`;
      try { for (const f of files) draft.images.push(await DB.upload(f)); renderProductEditor(); }
      catch (err) { renderProductEditor(); fail(err); }
      return;
    }
    if (e.target.id === "c-file") {
      catDraft.name = $("#c-name").value;
      try { catDraft.image_url = await DB.upload(e.target.files[0]); renderCategoryEditor(); } catch (err) { fail(err); }
    }
  });
  editor.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('[type="submit"]');
    if (e.target.id === "product-form") {
      readProductForm();
      const d = draft;
      if (!d.name.trim()) return renderProductEditor("Donnez un nom au produit.");
      if (d.price === "" || Number(d.price) < 0) return renderProductEditor("Indiquez le prix en DH.");
      if (d.old_price !== "" && Number(d.old_price) <= Number(d.price)) return renderProductEditor("L'ancien prix doit être plus élevé que le prix actuel. Laissez-le vide s'il n'y a pas de promo.");
      if (d._newCat && !d._newCatName.trim()) return renderProductEditor("Écrivez le nom du nouveau rayon.");
      btn.disabled = true;
      try {
        if (d._newCat) {
          const c = await DB.saveCategory({ name: d._newCatName.trim(), position: state.categories.length });
          d.category_id = c.id;
        }
        const row = {
          name: d.name.trim(), category_id: d.category_id || null, price: Number(d.price),
          old_price: d.old_price === "" ? null : Number(d.old_price), description: d.description.trim() || null,
          images: d.images, sizes: d.sizes.filter((s) => s.size), colors: d.colors.filter((c) => c.name.trim()),
          is_new: d.is_new, active: d.active
        };
        if (d.id) row.id = d.id; else row.position = 0;
        await DB.saveProduct(row);
        editor.close();
        toast(d.id ? "Produit enregistré" : "Produit ajouté");
        await refresh();
      } catch (err) { btn.disabled = false; fail(err); }
    }
    if (e.target.id === "cat-form") {
      catDraft.name = $("#c-name").value.trim();
      if (!catDraft.name) return renderCategoryEditor("Donnez un nom au rayon.");
      btn.disabled = true;
      try {
        const row = { name: catDraft.name, image_url: catDraft.image_url || null };
        if (catDraft.id) row.id = catDraft.id; else row.position = state.categories.length;
        await DB.saveCategory(row);
        editor.close();
        toast(catDraft.id ? "Rayon enregistré" : "Rayon ajouté");
        await refresh();
      } catch (err) { btn.disabled = false; fail(err); }
    }
  });

  $("#view").addEventListener("click", async (e) => {
    let b;
    try {
      if (e.target.closest("[data-new-product]")) return openProduct(null);
      if ((b = e.target.closest("[data-edit-product]"))) return openProduct(state.products.find((p) => p.id === b.dataset.editProduct));
      if ((b = e.target.closest("[data-toggle-product]"))) { const p = state.products.find((x) => x.id === b.dataset.toggleProduct); await DB.saveProduct({ id: p.id, active: p.active === false }); toast(p.active === false ? "Produit affiché" : "Produit masqué"); return refresh(); }
      if ((b = e.target.closest("[data-del-product]"))) { if (!confirmClick(b)) return; await DB.deleteProduct(b.dataset.delProduct); toast("Produit supprimé"); return refresh(); }
      if (e.target.closest("[data-new-cat]")) return openCategory(null);
      if ((b = e.target.closest("[data-edit-cat]"))) return openCategory(state.categories.find((c) => c.id === b.dataset.editCat));
      if ((b = e.target.closest("[data-del-cat]"))) { if (!confirmClick(b)) return; await DB.deleteCategory(b.dataset.delCat); toast("Rayon supprimé. Ses produits sont maintenant sans rayon."); return refresh(); }
      if ((b = e.target.closest("[data-move-cat]"))) {
        const list = [...state.categories]; const i = list.findIndex((c) => c.id === b.dataset.moveCat); const j = i + +b.dataset.dir;
        [list[i], list[j]] = [list[j], list[i]];
        await Promise.all(list.map((c, k) => (c.position !== k ? DB.saveCategory({ id: c.id, position: k }) : null)));
        return refresh();
      }
      if ((b = e.target.closest("[data-del-order]"))) { if (!confirmClick(b)) return; await DB.deleteOrder(b.dataset.delOrder); toast("Commande supprimée"); return refresh(); }
      if ((b = e.target.closest("[data-toggle-review]"))) { const r = state.reviews.find((x) => x.id === b.dataset.toggleReview); await DB.setReviewApproved(r.id, r.approved === false); toast(r.approved === false ? "Avis publié" : "Avis masqué"); return refresh(); }
      if ((b = e.target.closest("[data-del-review]"))) { if (!confirmClick(b)) return; await DB.deleteReview(b.dataset.delReview); toast("Avis supprimé"); return refresh(); }
      if (e.target.closest("[data-clear-hero]")) { await DB.saveSettings({ hero_url: "", hero_type: "image" }); toast("Image d'accueil retirée"); return refresh(); }
    } catch (err) { fail(err); }
  });
  $("#view").addEventListener("change", async (e) => {
    try {
      if (e.target.dataset.status) { await DB.setOrderStatus(e.target.dataset.status, e.target.value); toast(`Commande : ${STATUS[e.target.value]}`); return refresh(); }
      if (e.target.id === "s-hero-file") {
        const f = e.target.files[0]; if (!f) return;
        toast("Envoi en cours…");
        const url = await DB.upload(f);
        await DB.saveSettings({ hero_url: url, hero_type: f.type.startsWith("video/") ? "video" : "image" });
        toast("Image d'accueil enregistrée");
        return refresh();
      }
    } catch (err) { fail(err); }
  });
  $("#view").addEventListener("submit", async (e) => {
    if (e.target.id !== "settings-form") return;
    e.preventDefault();
    try {
      await DB.saveSettings({
        whatsapp: $("#s-wa").value.replace(/\D/g, ""), city: $("#s-city").value.trim(), instagram: $("#s-insta").value.trim(),
        free_delivery_from: Math.max(0, Number($("#s-free").value) || 0), announcement: $("#s-ann").value.trim(),
        hero_title: $("#s-title").value.trim() || "OMH", hero_text: $("#s-text").value.trim()
      });
      toast("Réglages enregistrés");
      await refresh();
    } catch (err) { fail(err); }
  });
  $("#tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]"); if (!b) return;
    state.tab = b.dataset.tab; render();
  });

  /* ---------- sign-in ---------- */
  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("#login-error").textContent = "";
    try { await DB.signIn($("#l-email").value.trim(), $("#l-pass").value); await start(); }
    catch { $("#login-error").textContent = "E-mail ou mot de passe incorrect. Vérifiez et réessayez."; }
  });
  $("#logout").addEventListener("click", async () => { await DB.signOut(); location.reload(); });

  async function refresh() { await load(); render(); }
  async function start() {
    $("#demo").hidden = DB.live;
    const session = await DB.session();
    const signedIn = Boolean(session);
    $("#login").hidden = signedIn;
    $("#tabs").hidden = !signedIn;
    $("#view").hidden = !signedIn;
    $("#logout").hidden = !(signedIn && DB.live);
    if (signedIn) await refresh();
    else $("#l-email").focus();
  }
  start().catch(fail);
})();
