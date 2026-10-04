/* Data layer shared by the shop (index.html) and the admin (admin.html).
   Same API for both back ends:
   - Supabase, when js/config.js has a URL and key
   - demo mode otherwise: everything is kept in this browser (IndexedDB) */
(() => {
  const cfg = window.OMH_SUPABASE || {};
  const live = Boolean(cfg.url && cfg.anonKey && window.supabase);
  const sb = live ? window.supabase.createClient(cfg.url, cfg.anonKey) : null;

  const DEFAULT_SETTINGS = {
    whatsapp: "", city: "", announcement: "", hero_url: "", hero_type: "image",
    hero_title: "OMH", hero_text: "", free_delivery_from: 0, instagram: ""
  };
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const now = () => new Date().toISOString();
  const bySort = (a, b) => (a.position ?? 0) - (b.position ?? 0) || String(b.created_at).localeCompare(String(a.created_at));

  /* ---------- demo store: one object in IndexedDB ---------- */
  const IDB = {
    db: null,
    open() {
      if (this.db) return Promise.resolve(this.db);
      return new Promise((res, rej) => {
        const r = indexedDB.open("omh-demo", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("kv");
        r.onsuccess = () => { this.db = r.result; res(this.db); };
        r.onerror = () => rej(r.error);
      });
    },
    async get(k) {
      try {
        const db = await this.open();
        return await new Promise((res, rej) => { const q = db.transaction("kv").objectStore("kv").get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
      } catch { return memory[k]; }
    },
    async set(k, v) {
      memory[k] = v;
      try {
        const db = await this.open();
        await new Promise((res, rej) => { const tx = db.transaction("kv", "readwrite"); tx.objectStore("kv").put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
      } catch { /* storage blocked: data lives until the page closes */ }
    }
  };
  const memory = {};
  async function demoDb() {
    const d = (await IDB.get("db")) || {};
    return { categories: [], products: [], reviews: [], orders: [], settings: { ...DEFAULT_SETTINGS }, ...d };
  }
  async function demoWrite(fn) { const d = await demoDb(); const out = fn(d); await IDB.set("db", d); notify(); return out; }
  function upsert(list, row) {
    const i = list.findIndex((x) => x.id === row.id);
    if (i >= 0) list[i] = { ...list[i], ...row }; else list.push({ id: uid(), created_at: now(), ...row });
    return i >= 0 ? list[i] : list[list.length - 1];
  }

  /* Changes made in the admin tab show up in an open shop tab (demo mode). */
  const channel = "BroadcastChannel" in window ? new BroadcastChannel("omh") : null;
  const listeners = new Set();
  function notify() { channel?.postMessage("changed"); }
  channel?.addEventListener("message", () => listeners.forEach((f) => f()));

  function must(res) { if (res.error) throw new Error(res.error.message); return res.data; }

  /* ---------- image helpers ---------- */
  function readAsDataURL(file) {
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(file); });
  }
  /* Photos are resized to 1600 px on the long side before upload: fast pages, small storage. */
  async function shrinkImage(file, max = 1600) {
    if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      const blob = await new Promise((res) => c.toBlob(res, "image/jpeg", 0.85));
      return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
    } finally { URL.revokeObjectURL(url); }
  }

  const api = {
    live,
    onChange(fn) { listeners.add(fn); },

    /* ----- auth (admin) ----- */
    async session() {
      if (!live) return { demo: true };
      return must(await sb.auth.getSession()).session;
    },
    async signIn(email, password) { if (!live) return { demo: true }; return must(await sb.auth.signInWithPassword({ email, password })); },
    async signOut() { if (live) await sb.auth.signOut(); },

    /* ----- settings ----- */
    async getSettings() {
      if (!live) return (await demoDb()).settings;
      const row = must(await sb.from("settings").select("*").eq("id", 1).maybeSingle());
      return { ...DEFAULT_SETTINGS, ...(row || {}) };
    },
    async saveSettings(s) {
      if (!live) return demoWrite((d) => { d.settings = { ...d.settings, ...s }; return d.settings; });
      const { id, ...rest } = s;
      return must(await sb.from("settings").update(rest).eq("id", 1).select().single());
    },

    /* ----- categories ----- */
    async listCategories() {
      if (!live) return (await demoDb()).categories.sort(bySort);
      return must(await sb.from("categories").select("*").order("position").order("created_at"));
    },
    async saveCategory(c) {
      if (!live) return demoWrite((d) => upsert(d.categories, c));
      const q = c.id ? sb.from("categories").update(c).eq("id", c.id) : sb.from("categories").insert(c);
      return must(await q.select().single());
    },
    async deleteCategory(id) {
      if (!live) return demoWrite((d) => { d.categories = d.categories.filter((x) => x.id !== id); d.products.forEach((p) => { if (p.category_id === id) p.category_id = null; }); });
      must(await sb.from("categories").delete().eq("id", id));
    },

    /* ----- products ----- */
    async listProducts({ includeHidden = false } = {}) {
      if (!live) { const all = (await demoDb()).products.sort(bySort); return includeHidden ? all : all.filter((p) => p.active !== false); }
      let q = sb.from("products").select("*").order("position").order("created_at", { ascending: false });
      if (!includeHidden) q = q.eq("active", true);
      return must(await q);
    },
    async saveProduct(p) {
      if (!live) return demoWrite((d) => upsert(d.products, p));
      const q = p.id ? sb.from("products").update(p).eq("id", p.id) : sb.from("products").insert(p);
      return must(await q.select().single());
    },
    async deleteProduct(id) {
      if (!live) return demoWrite((d) => { d.products = d.products.filter((x) => x.id !== id); d.reviews = d.reviews.filter((r) => r.product_id !== id); });
      must(await sb.from("products").delete().eq("id", id));
    },

    /* ----- reviews ----- */
    async listReviews({ includeHidden = false } = {}) {
      if (!live) { const all = (await demoDb()).reviews.sort((a, b) => b.created_at.localeCompare(a.created_at)); return includeHidden ? all : all.filter((r) => r.approved !== false); }
      let q = sb.from("reviews").select("*").order("created_at", { ascending: false });
      if (!includeHidden) q = q.eq("approved", true);
      return must(await q);
    },
    async addReview(r) {
      const row = { product_id: r.product_id, author: r.author.trim().slice(0, 60), rating: r.rating, comment: (r.comment || "").trim().slice(0, 1000) || null };
      if (!live) return demoWrite((d) => upsert(d.reviews, { ...row, approved: true }));
      must(await sb.from("reviews").insert(row));
      return row;
    },
    async setReviewApproved(id, approved) {
      if (!live) return demoWrite((d) => { const r = d.reviews.find((x) => x.id === id); if (r) r.approved = approved; });
      must(await sb.from("reviews").update({ approved }).eq("id", id));
    },
    async deleteReview(id) {
      if (!live) return demoWrite((d) => { d.reviews = d.reviews.filter((x) => x.id !== id); });
      must(await sb.from("reviews").delete().eq("id", id));
    },

    /* ----- orders ----- */
    async addOrder(o) {
      const row = { items: o.items, total: o.total, customer_name: o.customer_name || null, customer_phone: o.customer_phone || null, city: o.city || null, address: o.address || null, status: "new" };
      if (!live) return demoWrite((d) => upsert(d.orders, row));
      must(await sb.from("orders").insert(row));
      return row;
    },
    async listOrders() {
      if (!live) return (await demoDb()).orders.sort((a, b) => b.created_at.localeCompare(a.created_at));
      return must(await sb.from("orders").select("*").order("created_at", { ascending: false }));
    },
    async setOrderStatus(id, status) {
      if (!live) return demoWrite((d) => { const o = d.orders.find((x) => x.id === id); if (o) o.status = status; });
      must(await sb.from("orders").update({ status }).eq("id", id));
    },
    async deleteOrder(id) {
      if (!live) return demoWrite((d) => { d.orders = d.orders.filter((x) => x.id !== id); });
      must(await sb.from("orders").delete().eq("id", id));
    },

    /* ----- files: product photos, category photos, hero image or video ----- */
    async upload(file) {
      const f = await shrinkImage(file);
      if (!live) {
        if (f.size > 8 * 1024 * 1024) throw new Error("demo-too-big");
        return readAsDataURL(f);
      }
      const ext = (f.name.split(".").pop() || "bin").toLowerCase();
      const path = `${new Date().getFullYear()}/${uid()}.${ext}`;
      must(await sb.storage.from("media").upload(path, f, { contentType: f.type, upsert: false }));
      return sb.storage.from("media").getPublicUrl(path).data.publicUrl;
    }
  };

  window.OMH_DATA = api;
})();
