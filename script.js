/* =========================================================
   Ateliê Lê Crochê — lógica da loja
   ========================================================= */

/* ---- CONFIGURAÇÃO: troque pelo WhatsApp da cliente (DDI+DDD+número) ---- */
const WHATSAPP = "5500000000000";
const FRETE_GRATIS = 299;

/* ---- CATÁLOGO ----
   Para usar fotos reais: salve em img/produtos/<id>.jpg (e <id>-2.jpg para a foto do hover).
   Enquanto a foto não existir, a loja mostra uma ilustração na cor da peça. */
const PRODUCTS = [
  { id: "bolsa-margarida", name: "Bolsa Margarida", cat: "bolsas", price: 289, old: 329, tag: "Mais amada",
    desc: "Bolsa estruturada em fio de algodão com aplicação de margaridas feitas à mão, forro de linho e alça de couro ecológico.",
    colors: ["#f3d7a7", "#e9b9c0", "#fdf6f2"], hours: 18, size: "28 × 22 cm", art: "bolsa" },
  { id: "cropped-brisa", name: "Cropped Brisa", cat: "roupas", price: 219, tag: "Novo",
    desc: "Cropped em ponto aberto, leve e fresquinho, com amarração nas costas. Ajusta-se ao corpo com elegância.",
    colors: ["#f6c9cf", "#ffffff", "#c9dcc3"], hours: 14, size: "P · M · G", art: "roupas" },
  { id: "coelhinha-lili", name: "Coelhinha Lili", cat: "amigurumis", price: 149,
    desc: "Amigurumi com enchimento antialérgico e olhos bordados — seguro para bebês. Um presente que vira memória.",
    colors: ["#fbe3e6", "#efe3d3"], hours: 10, size: "26 cm", art: "amigurumis" },
  { id: "manta-aconchego", name: "Manta Aconchego", cat: "casa", price: 459, tag: "Peça única", dark: true,
    desc: "Manta em fio de algodão grosso com textura de pipoca. Perfeita para o sofá, a cama ou o quarto do bebê.",
    colors: ["#f0dccb", "#e7c1c6"], hours: 32, size: "120 × 150 cm", art: "casa" },
  { id: "bucket-rose", name: "Bucket Hat Rosé", cat: "acessorios", price: 129,
    desc: "Chapéu bucket em ponto baixo firme, com aba estruturada. O toque artesanal que todo look de verão pede.",
    colors: ["#e9a8b0", "#780006", "#f3d7a7"], hours: 8, size: "Único (56–58 cm)", art: "acessorios" },
  { id: "sousplat-flor", name: "Kit Sousplat Flor", cat: "casa", price: 179, old: 210,
    desc: "Kit com 4 sousplats em barbante premium com desenho floral. Transforma qualquer mesa posta.",
    colors: ["#fdf6f2", "#f3d7a7", "#e9b9c0"], hours: 16, size: "Ø 35 cm", art: "doily" },
  { id: "tote-praia", name: "Bolsa Tote Praia", cat: "bolsas", price: 249,
    desc: "Tote espaçosa em ponto rede, ideal para praia e passeios. Leve, resistente e linda até vazia.",
    colors: ["#efe3d3", "#9b2a31"], hours: 15, size: "40 × 35 cm", art: "bolsa" },
  { id: "top-ondina", name: "Top Ondina", cat: "roupas", price: 199, tag: "Novo",
    desc: "Top com acabamento em ondas e alças finas cruzadas. Para usar com saia, alfaiataria ou jeans.",
    colors: ["#780006", "#f6c9cf"], hours: 12, size: "P · M · G", art: "roupas" },
];

/* ---------- Utilidades ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};
let uid = 0;

/* ---------- Espaço de foto: novelo da marca enquanto não há foto real ---------- */
/* Mistura a cor com branco (p = 0..1) para fundos suaves */
function tint(hex, p) {
  const n = parseInt(hex.slice(1), 16);
  const m = (v) => Math.round(v + (255 - v) * p);
  return "#" + [m(n >> 16), m((n >> 8) & 255), m(n & 255)].map((v) => v.toString(16).padStart(2, "0")).join("");
}
/* Novelo oficial da marca (assets/novelo.png) */
const NOVELO = "assets/novelo.png", NOVELO_CLARO = "assets/novelo-claro.png";

function artBlock(kind, color, label = "", extraClass = "") {
  const c1 = tint(color, .82), c2 = tint(color, .55);
  return `<div class="art ${extraClass}" style="--c1:${c1};--c2:${c2}"><img class="art__novelo" src="${NOVELO}" alt="" />${label ? `<span class="art__label">${label}</span>` : ""}</div>`;
}

/* Fallbacks dos <img data-fallback> fixos do HTML */
const FALLBACKS = {
  hero: ["bolsa", "#f3d7a7", "Bolsa Margarida"],
  bolsas: ["bolsa", "#e9b9c0"],
  roupas: ["roupas", "#f0b7bf"],
  amigurumis: ["amigurumis", "#fbe3e6"],
  casa: ["doily", "#f3d7a7"],
  atelie: ["novelo", "#f5d8dc", "feito à mão"],
};
function withFallback(img, html) {
  const swap = () => { img.outerHTML = html; };
  if (img.complete && img.naturalWidth === 0) swap();
  else img.addEventListener("error", swap, { once: true });
}
function imgOr(src, alt, kind, color, cls = "") {
  return `<img src="${src}" alt="${alt}" class="${cls}" loading="lazy" decoding="async" data-art="${kind}|${color}|${cls}" />`;
}
function hydrateImgs(root = document) {
  $$("img[data-fallback]", root).forEach((img) => {
    const [k, c, l] = FALLBACKS[img.dataset.fallback];
    img.removeAttribute("data-fallback");
    withFallback(img, artBlock(k, c, l));
  });
  $$("img[data-art]", root).forEach((img) => {
    const [k, c, cls] = img.dataset.art.split("|");
    img.removeAttribute("data-art");
    withFallback(img, artBlock(k, c, "", cls));
  });
}

/* Ícones de novelo (logo) */
function hydrateYarn() {
  $$("[data-yarn]").forEach((el) => {
    const onDark = el.closest(".footer, .marquee, .hero__badge");
    el.innerHTML = `<img src="${onDark ? NOVELO_CLARO : NOVELO}" alt="" />`;
  });
}

/* ---------- Produtos ---------- */
let filter = "todos", query = "";
let favs = new Set(store.get("lc-favs", []));
let cart = store.get("lc-cart", []); // [{id, color, qty}]

const heart = `<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg>`;

function renderProducts() {
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const list = PRODUCTS.filter((p) =>
    (filter === "todos" || p.cat === filter) &&
    (!query || norm(p.name + " " + p.cat + " " + p.desc).includes(norm(query))));
  $("#products").innerHTML = list.map((p, i) => `
    <article class="card" style="animation-delay:${i * 70}ms" data-id="${p.id}">
      <div class="card__media" data-open="${p.id}">
        ${p.tag ? `<span class="card__tag ${p.dark ? "card__tag--dark" : ""}">${p.tag}</span>` : ""}
        <button class="icon-btn card__fav ${favs.has(p.id) ? "on" : ""}" data-fav="${p.id}" aria-label="Favoritar">${heart}</button>
        ${imgOr(`img/produtos/${p.id}.jpg`, p.name, p.art, p.colors[0])}
        ${imgOr(`img/produtos/${p.id}-2.jpg`, p.name, p.art, p.colors[1] || p.colors[0], "alt")}
        <button class="card__add" data-add="${p.id}" aria-label="Adicionar à sacola"><span class="add-full">Adicionar à sacola</span><span class="add-short">+ Sacola</span></button>
      </div>
      <div class="card__info">
        <div><h3>${p.name}</h3><p>${p.hours}h de trabalho manual</p></div>
        <span class="price">${p.old ? `<s>${brl(p.old)}</s>` : ""}${brl(p.price)}</span>
      </div>
      <div class="swatches">${p.colors.map((c) => `<i style="background:${c}"></i>`).join("")}</div>
    </article>`).join("");
  $("#emptyMsg").hidden = list.length > 0;
  hydrateImgs($("#products"));
}

function setFilter(f) {
  filter = f;
  $$(".chip").forEach((c) => c.classList.toggle("is-active", c.dataset.filter === f));
  renderProducts();
}

/* ---------- Favoritos ---------- */
function toggleFav(id, btn) {
  favs.has(id) ? favs.delete(id) : favs.add(id);
  store.set("lc-favs", [...favs]);
  btn?.classList.toggle("on", favs.has(id));
  updateBadges(true, "fav");
  toast(favs.has(id) ? "Adicionado aos favoritos ♡" : "Removido dos favoritos");
}

/* ---------- Sacola ---------- */
function addToCart(id, color) {
  const p = PRODUCTS.find((x) => x.id === id);
  color = color || p.colors[0];
  const item = cart.find((x) => x.id === id && x.color === color);
  item ? item.qty++ : cart.push({ id, color, qty: 1 });
  saveCart();
  updateBadges(true, "cart");
  toast(`${p.name} foi para a sacola ✦`);
}
function saveCart() { store.set("lc-cart", cart); renderCart(); }
function cartTotal() { return cart.reduce((s, i) => s + PRODUCTS.find((p) => p.id === i.id).price * i.qty, 0); }

function renderCart() {
  const ul = $("#cartItems");
  if (!cart.length) {
    ul.innerHTML = `<li class="drawer__empty" style="display:block;border:0"><p class="big">Sua sacola está vazia</p><p>Que tal escolher uma peça feita com carinho?</p></li>`;
  } else {
    ul.innerHTML = cart.map((i, idx) => {
      const p = PRODUCTS.find((x) => x.id === i.id);
      return `<li>
        <div class="drawer__thumb">${imgOr(`img/produtos/${p.id}.jpg`, p.name, p.art, i.color)}</div>
        <div>
          <h4>${p.name}</h4>
          <small>Cor <i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${i.color};vertical-align:middle;box-shadow:0 0 0 1px rgba(0,0,0,.15)"></i></small><br>
          <div class="qty"><button data-dec="${idx}" aria-label="Diminuir">−</button><span>${i.qty}</span><button data-inc="${idx}" aria-label="Aumentar">+</button></div>
        </div>
        <div style="text-align:right">
          <span class="price">${brl(p.price * i.qty)}</span><br>
          <button class="remove" data-rm="${idx}">remover</button>
        </div>
      </li>`;
    }).join("");
    hydrateImgs(ul);
  }
  const total = cartTotal();
  $("#cartTotal").textContent = brl(total);
  const falta = Math.max(0, FRETE_GRATIS - total);
  $("#shipMsg").innerHTML = falta > 0 ? `Faltam <strong>${brl(falta)}</strong> para frete grátis` : `<strong>Oba! Você ganhou frete grátis</strong> ✦`;
  $("#shipProgress").style.width = Math.min(100, (total / FRETE_GRATIS) * 100) + "%";
  $("#checkoutBtn").disabled = !cart.length;
  $("#checkoutBtn").style.opacity = cart.length ? 1 : .5;
  updateBadges();
}

function updateBadges(bump, which) {
  const qty = cart.reduce((s, i) => s + i.qty, 0);
  const set = (el, n, b) => {
    el.textContent = n; el.classList.toggle("show", n > 0);
    if (b) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
  };
  set($("#cartCount"), qty, bump && which === "cart");
  set($("#favCount"), favs.size, bump && which === "fav");
}

function checkout() {
  if (!cart.length) return;
  const lines = cart.map((i) => {
    const p = PRODUCTS.find((x) => x.id === i.id);
    return `• ${i.qty}x ${p.name} (cor ${i.color}) — ${brl(p.price * i.qty)}`;
  });
  const msg = `Olá, Ateliê Lê Crochê! ✨\nQuero fazer este pedido:\n\n${lines.join("\n")}\n\nSubtotal: ${brl(cartTotal())}`;
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
}

/* ---------- Painéis (sacola, modal, busca, menu) ---------- */
function openPanel(el) { el.classList.add("open"); $("#overlay").classList.add("show"); document.body.classList.add("lock"); }
function closePanels() {
  $$(".drawer, .modal, .search").forEach((e) => e.classList.remove("open"));
  $("#navLinks").classList.remove("open"); $("#menuToggle").classList.remove("open");
  $("#overlay").classList.remove("show"); document.body.classList.remove("lock");
}

function openQuickView(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  let color = p.colors[0];
  $("#modalBody").innerHTML = `
    <div class="modal__media" id="qvMedia">${imgOr(`img/produtos/${p.id}.jpg`, p.name, p.art, color)}</div>
    <div class="modal__info">
      <p class="eyebrow" style="margin:0">${p.cat}</p>
      <h2>${p.name}</h2>
      <span class="price">${p.old ? `<s>${brl(p.old)}</s>` : ""}${brl(p.price)}</span>
      <small style="color:var(--muted)">ou 6x de ${brl(p.price / 6)} sem juros</small>
      <p>${p.desc}</p>
      <span class="opt-label">Cor</span>
      <div class="color-opts">${p.colors.map((c, i) => `<button style="background:${c}" data-color="${c}" class="${i ? "" : "on"}" aria-label="Cor ${i + 1}"></button>`).join("")}</div>
      <ul class="modal__meta">
        <li><span>Tamanho</span>${p.size}</li>
        <li><span>Tempo de produção</span>${p.hours} horas</li>
        <li><span>Material</span>Algodão natural</li>
        <li><span>Envio</span>Em até 3 dias úteis</li>
      </ul>
      <div style="display:flex;gap:.6rem">
        <button class="btn btn--primary" style="flex:1" id="qvAdd">Adicionar à sacola</button>
        <button class="icon-btn card__fav ${favs.has(p.id) ? "on" : ""}" style="position:static;width:54px;height:54px;border:1px solid var(--line)" id="qvFav" aria-label="Favoritar">${heart}</button>
      </div>
    </div>`;
  hydrateImgs($("#modalBody"));
  $$(".color-opts button").forEach((b) => b.addEventListener("click", () => {
    color = b.dataset.color;
    $$(".color-opts button").forEach((x) => x.classList.toggle("on", x === b));
    const media = $("#qvMedia");
    media.innerHTML = imgOr(`img/produtos/${p.id}.jpg`, p.name, p.art, color);
    hydrateImgs(media);
  }));
  $("#qvAdd").addEventListener("click", () => { addToCart(p.id, color); closePanels(); setTimeout(() => openPanel($("#cart")), 350); });
  $("#qvFav").addEventListener("click", (e) => { toggleFav(p.id, e.currentTarget); renderProducts(); });
  openPanel($("#modal"));
}

/* ---------- Toast ---------- */
let toastT;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2400);
}

/* ---------- Instagram ---------- */
function renderInsta() {
  const items = [["bolsa", "#e9b9c0"], ["amigurumis", "#fbe3e6"], ["roupas", "#780006"], ["doily", "#f3d7a7"], ["acessorios", "#e9a8b0"], ["casa", "#efe3d3"]];
  $("#instaGrid").innerHTML = items.map(([k, c], i) =>
    `<a href="#" aria-label="Post do Instagram ${i + 1}">${imgOr(`img/insta-${i + 1}.jpg`, "Post do ateliê", k, c)}</a>`).join("");
  hydrateImgs($("#instaGrid"));
}

/* ---------- Depoimentos ---------- */
function initQuotes() {
  const qs = $$(".quote"), ds = $$("#quoteDots button");
  let i = 0, timer;
  const go = (n) => { i = n; qs.forEach((q, k) => q.classList.toggle("is-active", k === i)); ds.forEach((d, k) => d.classList.toggle("is-active", k === i)); };
  const play = () => { clearInterval(timer); timer = setInterval(() => go((i + 1) % qs.length), 6000); };
  ds.forEach((d, k) => d.addEventListener("click", () => { go(k); play(); }));
  play();
}

/* ---------- Eventos ---------- */
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-add],[data-fav],[data-open],[data-inc],[data-dec],[data-rm],[data-filter],[data-filter-link]");
  if (!t) return;
  const d = t.dataset;
  if (d.add) { e.stopPropagation(); addToCart(d.add); }
  else if (d.fav) { e.stopPropagation(); toggleFav(d.fav, t); }
  else if (d.open) openQuickView(d.open);
  else if (d.inc) { cart[d.inc].qty++; saveCart(); }
  else if (d.dec) { cart[d.dec].qty > 1 ? cart[d.dec].qty-- : cart.splice(d.dec, 1); saveCart(); }
  else if (d.rm) { cart.splice(d.rm, 1); saveCart(); }
  else if (d.filter) setFilter(d.filter);
  else if (d.filterLink) setFilter(d.filterLink);
});

$("#cartBtn").addEventListener("click", () => openPanel($("#cart")));
$("#cartClose").addEventListener("click", closePanels);
$("#modalClose").addEventListener("click", closePanels);
$("#overlay").addEventListener("click", closePanels);
$("#checkoutBtn").addEventListener("click", checkout);
$("#favBtn").addEventListener("click", () => {
  if (!favs.size) return toast("Toque no ♡ das peças para salvar favoritos");
  query = ""; filter = "todos";
  $$(".chip").forEach((c) => c.classList.remove("is-active"));
  const norm = [...favs];
  $("#products").innerHTML = "";
  PRODUCTS.sort((a, b) => norm.includes(b.id) - norm.includes(a.id));
  renderProducts();
  $("#colecao").scrollIntoView();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePanels(); });

$("#searchBtn").addEventListener("click", () => { $("#search").classList.add("open"); setTimeout(() => $("#searchInput").focus(), 300); });
$("#searchClose").addEventListener("click", () => { $("#search").classList.remove("open"); });
$("#searchInput").addEventListener("input", (e) => {
  query = e.target.value.trim();
  if (query) { filter = "todos"; $$(".chip").forEach((c) => c.classList.toggle("is-active", c.dataset.filter === "todos")); }
  renderProducts();
});
$("#searchInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") { $("#search").classList.remove("open"); $("#colecao").scrollIntoView(); }
});

$("#menuToggle").addEventListener("click", (e) => {
  const open = !$("#navLinks").classList.contains("open");
  closePanels();
  if (open) { $("#navLinks").classList.add("open"); e.currentTarget.classList.add("open"); $("#overlay").classList.add("show"); }
});
$$("#navLinks a").forEach((a) => a.addEventListener("click", closePanels));

$("#customForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const msg = `Olá, Ateliê Lê Crochê! Sou ${f.get("nome")} e gostaria de uma encomenda personalizada.\n\nTipo: ${f.get("tipo")}\nIdeia: ${f.get("ideia")}`;
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");
});
$("#newsletter").addEventListener("submit", (e) => { e.preventDefault(); e.target.reset(); toast("Prontinho! Você está na lista ✦"); });
$$("[data-whats]").forEach((a) => (a.href = `https://wa.me/${WHATSAPP}`));

/* Header ao rolar */
const header = $("#header");
addEventListener("scroll", () => header.classList.toggle("scrolled", scrollY > 40), { passive: true });

/* Reveal on scroll */
const io = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
}), { threshold: .12, rootMargin: "0px 0px -40px 0px" });
$$(".reveal").forEach((el, i) => { el.style.transitionDelay = (i % 4) * 90 + "ms"; io.observe(el); });

/* ---------- Início ---------- */
$("#year").textContent = new Date().getFullYear();
hydrateYarn();
hydrateImgs();
renderProducts();
renderCart();
renderInsta();
initQuotes();
