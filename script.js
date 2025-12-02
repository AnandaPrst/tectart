// ---------------------------
// 0. Konstanta & Util
// ---------------------------
const LS_USER_KEY = "loggedInUser";
const LS_PRODUCTS_KEY = "produkList";
const LS_TRANSACTIONS_KEY = "transactions";

// dummy users (for demo)
const DUMMY_USERS = [
  { username: "admin", password: "admin", role: "admin" },
  { username: "kasir", password: "kasir", role: "kasir" }
];

const qs = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));
const formatCurrency = n => "Rp " + Number(n).toLocaleString();
const parseNumberFromCurrency = str => Number(String(str).replace(/[^0-9]/g, "")) || 0;
const escapeHtml = str => (!str && str !== 0 ? "" : String(str).replace(/[&<>"'`=\/]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#47;','`':'&#96;','=':'&#61;'}[c])));
const escapeHtmlAttr = str => escapeHtml(str).replace(/"/g, '&quot;');

// ---------------------------
// 1. Page protection
// ---------------------------
(function protectPages() {
  const isLoginPage = window.location.href.includes("login.html") || window.location.pathname.endsWith("/");
  if (!isLoginPage) {
    const user = JSON.parse(localStorage.getItem(LS_USER_KEY));
    if (!user) window.location.href = "login.html";
  }
})();

// ---------------------------
// 2. Main init on DOMContentLoaded
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  highlightMenu();
  initProducts();
  initAddProductPage();
  initPOS();
  initReports();
});

// ---------------------------
// 3. AUTH: Login / Logout / Show user / Role
// ---------------------------
function initAuth() {
  const loginForm = qs("#loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", e => {
      e.preventDefault();
      const u = qs("#username").value.trim();
      const p = qs("#password").value.trim();
      if (!u || !p) return showError("Username dan password wajib diisi.");
      const found = DUMMY_USERS.find(x => x.username === u && x.password === p);
      if (!found) return showError("Username atau password salah.");
      localStorage.setItem(LS_USER_KEY, JSON.stringify({ username: found.username, role: found.role }));
      showSuccess("Login berhasil, mengarahkan ke dashboard...");
      setTimeout(() => window.location.href = "dashboard.html", 700);
    });
  }

  const userSpan = qs(".user-info span");
  const user = JSON.parse(localStorage.getItem(LS_USER_KEY));
  if (user && userSpan) userSpan.textContent = `Selamat datang, ${user.username}`;

  if (user && user.role === "kasir") {
    const produkMenu = qs("a[href='produk.html']");
    const laporanMenu = qs("a[href='laporan.html']");
    if (produkMenu) produkMenu.style.display = "none";
    if (laporanMenu) laporanMenu.style.display = "none";
  }

  const logoutBtn = qs("#logoutBtn") || qs("a[href='#']") || qs(".logout");
  if (logoutBtn) logoutBtn.addEventListener("click", e => {
    e.preventDefault();
    localStorage.removeItem(LS_USER_KEY);
    showSuccess("Anda telah logout.");
    window.location.href = "login.html";
  });
}

// ---------------------------
// 4. NAV HIGHLIGHT
// ---------------------------
function highlightMenu() {
  const navLinks = qsa("nav a");
  if (!navLinks.length) return;
  const current = window.location.pathname.split("/").pop();
  navLinks.forEach(a => { if (a.getAttribute("href") === current) a.classList.add("active"); });
}

// ---------------------------
// 5. PRODUCTS: CRUD
// ---------------------------
function initProducts() {
  const tbody = qs(".products-table tbody");
  const btnAdd = qs(".add-product-button");
  if (!tbody && !btnAdd) return;

  let products = JSON.parse(localStorage.getItem(LS_PRODUCTS_KEY)) || [
    { nama: "Produk A", kategori: "Kategori 1", jual: 10000, beli: 8000, stok: 50, satuan: "pcs" },
    { nama: "Produk B", kategori: "Kategori 2", jual: 15000, beli: 12000, stok: 30, satuan: "pcs" }
  ];

  const save = () => localStorage.setItem(LS_PRODUCTS_KEY, JSON.stringify(products));

  const render = () => {
    if (!tbody) return;
    tbody.innerHTML = "";
    products.forEach((p, i) => {
      tbody.insertAdjacentHTML("beforeend", `
        <tr>
          <td>${escapeHtml(p.nama)}</td>
          <td>${escapeHtml(p.kategori)}</td>
          <td>${formatCurrency(p.jual)}</td>
          <td>${formatCurrency(p.beli)}</td>
          <td>${p.stok} ${escapeHtml(p.satuan || "")}</td>
          <td>
            <button class="btn-edit" data-i="${i}">Edit</button>
            <button class="btn-del" data-i="${i}">Hapus</button>
          </td>
        </tr>
      `);
    });

    qsa(".btn-del").forEach(btn => btn.onclick = () => {
      const idx = Number(btn.dataset.i);
      if (!Number.isInteger(idx)) return;
      if (!confirm(`Hapus produk "${products[idx].nama}"?`)) return;
      products.splice(idx, 1); save(); render(); showSuccess("Produk dihapus.");
    });

    qsa(".btn-edit").forEach(btn => btn.onclick = () => openForm("edit", Number(btn.dataset.i)));
  };

  function openForm(mode="add", idx=null) {
    const p = mode==="edit" ? products[idx] : { nama:"", kategori:"", jual:"", beli:"", stok:"", satuan:"" };
    const html = `
      <div id="modalBg" class="modal-bg">
        <div class="modal card">
          <h3>${mode==="edit" ? "Edit Produk" : "Tambah Produk"}</h3>
          <label>Nama Produk</label><input id="m_nama" value="${escapeHtmlAttr(p.nama)}">
          <label>Kategori</label><input id="m_kategori" value="${escapeHtmlAttr(p.kategori)}">
          <label>Harga Jual</label><input id="m_jual" type="number" value="${p.jual||""}">
          <label>Harga Beli</label><input id="m_beli" type="number" value="${p.beli||""}">
          <label>Stok</label><input id="m_stok" type="number" value="${p.stok||0}">
          <label>Satuan</label><input id="m_satuan" value="${escapeHtmlAttr(p.satuan||"")}">
          <div style="margin-top:10px;text-align:right">
            <button id="m_save">${mode==="edit"?"Simpan Perubahan":"Tambah"}</button>
            <button id="m_cancel">Batal</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", html);

    qs("#m_cancel").onclick = () => qs("#modalBg")?.remove();
    qs("#m_save").onclick = () => {
      const newP = {
        nama: qs("#m_nama").value.trim(),
        kategori: qs("#m_kategori").value.trim(),
        jual: parseInt(qs("#m_jual").value) || 0,
        beli: parseInt(qs("#m_beli").value) || 0,
        stok: parseInt(qs("#m_stok").value) || 0,
        satuan: qs("#m_satuan").value.trim()
      };
      if (!newP.nama) return showError("Nama produk wajib diisi.");
      if (mode==="edit") products[idx]=newP; else products.push(newP);
      save(); render(); qs("#modalBg")?.remove(); showSuccess("Produk tersimpan.");
    };
  }

  if (btnAdd) btnAdd.addEventListener("click", () => openForm("add"));

  render();
}

// ---------------------------
// 6. ADD-PRODUK PAGE
// ---------------------------
function initAddProductPage() {
  const form = qs(".add-product-section form");
  const cancelBtn = qs(".cancel-button");
  if (!form) return;

  form.addEventListener("submit", e => {
    e.preventDefault();
    const nama = qs("#nama").value.trim();
    const kategori = qs("#kategori").value.trim();
    const beli = parseInt(qs("#harga-beli").value) || 0;
    const jual = parseInt(qs("#harga-jual").value) || 0;
    const stok = parseInt(qs("#stok").value) || 0;
    const satuan = qs("#satuan").value.trim();

    if (!nama || !kategori) return showError("Nama & kategori wajib diisi.");

    const products = JSON.parse(localStorage.getItem(LS_PRODUCTS_KEY)) || [];
    products.push({ nama, kategori, jual, beli, stok, satuan });
    localStorage.setItem(LS_PRODUCTS_KEY, JSON.stringify(products));
    showSuccess("Produk berhasil ditambahkan.");
    window.location.href = "produk.html";
  });

  if (cancelBtn) cancelBtn.addEventListener("click", () => window.location.href="produk.html");
}

// ---------------------------
// 7. POS / Transaksi
// ---------------------------
function initPOS() {
  const posForm = qs(".product-input form");
  const cartBody = qs(".cart-table tbody");
  const totalInput = qs("#total");
  const bayarInput = qs("#bayar");
  const kembalianInput = qs("#kembalian");
  const paymentForm = qs(".payment-form form");
  if (!posForm || !cartBody || !totalInput || !paymentForm) return;

  const productsLS = () => JSON.parse(localStorage.getItem(LS_PRODUCTS_KEY)) || [];
  const lookupByCode = code => {
    if (!code) return null;
    const pList = productsLS();
    const idx = code[0]?.toUpperCase().charCodeAt(0) - 65;
    return pList[idx] || pList.find(p => p.nama.toLowerCase() === code.toLowerCase()) || null;
  };

  let cart = JSON.parse(sessionStorage.getItem("cart")) || [];

  const saveCart = () => sessionStorage.setItem("cart", JSON.stringify(cart));
  const renderCart = () => {
    cartBody.innerHTML="";
    cart.forEach((it, idx)=>{
      cartBody.insertAdjacentHTML("beforeend", `
        <tr>
          <td>${escapeHtml(it.nama)}</td>
          <td>${it.qty}</td>
          <td>${formatCurrency(it.harga)}</td>
          <td>${formatCurrency(it.total)}</td>
          <td><button class="cart-remove" data-i="${idx}">Hapus</button></td>
        </tr>
      `);
    });
    qsa(".cart-remove").forEach(btn=>btn.onclick=()=>{cart.splice(Number(btn.dataset.i),1); saveCart(); renderCart(); updateTotal();});
    saveCart();
  };
  const updateTotal = () => { const t = cart.reduce((s,it)=>s+it.total,0); totalInput.value=formatCurrency(t); return t; };

  posForm.addEventListener("submit", e=>{
    e.preventDefault();
    const code = qs("#kode-produk").value.trim();
    const qty = parseInt(qs("#qty").value) || 1;
    if (!code || qty<=0) return showError("Isi kode produk & qty valid.");
    const prod = lookupByCode(code);
    if (!prod) return showError("Produk tidak ditemukan (cek kode atau nama).");
    cart.push({ nama: prod.nama, qty, harga: prod.jual, total: prod.jual*qty });
    renderCart(); updateTotal();
    qs("#kode-produk").value=""; qs("#qty").value=1;
  });

  if (bayarInput) bayarInput.addEventListener("input", ()=>{
    const totalNum = parseNumberFromCurrency(totalInput.value);
    const bayarNum = parseInt(bayarInput.value) || 0;
    const kembali = Math.max(0, bayarNum-totalNum);
    if (kembalianInput) kembalianInput.value=formatCurrency(kembali);
  });

  paymentForm.addEventListener("submit", e=>{
    e.preventDefault();
    const totalNum = parseNumberFromCurrency(totalInput.value);
    const bayarNum = parseInt(bayarInput.value) || 0;
    if (bayarNum<totalNum) return showError("Pembayaran kurang!");
    const transactions = JSON.parse(localStorage.getItem(LS_TRANSACTIONS_KEY)) || [];
    const user = JSON.parse(localStorage.getItem(LS_USER_KEY)) || { username: "Unknown" };
    transactions.push({
      id: "TRX"+(new Date().getTime()),
      tanggal: new Date().toISOString(),
      kasir: user.username,
      items: cart,
      total: totalNum
    });
    localStorage.setItem(LS_TRANSACTIONS_KEY, JSON.stringify(transactions));
    showSuccess("Transaksi berhasil disimpan. Terima kasih!");
    cart=[]; saveCart(); renderCart(); updateTotal();
    if (bayarInput) bayarInput.value=""; if (kembalianInput) kembalianInput.value="";
  });

  renderCart(); updateTotal();
}

// ---------------------------
// 8. REPORTS
// ---------------------------
function initReports() {
  const form = qs("#formCariLaporan");
  const tbody = qs("#reportBody");
  const reportDateEl = qs("#reportDate");
  if (!tbody && !form && !reportDateEl) return;

  if (reportDateEl) {
    const today = new Date().toLocaleDateString("id-ID", { year:"numeric", month:"long", day:"numeric" });
    reportDateEl.textContent = today;
  }

  const render = transactions => {
    if (!tbody) return;
    tbody.innerHTML="";
    transactions.forEach(trx=>{
      const date = new Date(trx.tanggal).toISOString().split("T")[0];
      tbody.insertAdjacentHTML("beforeend", `
        <tr>
          <td>${escapeHtml(trx.id)}</td>
          <td>${escapeHtml(date)}</td>
          <td>${escapeHtml(trx.kasir)}</td>
          <td>${formatCurrency(trx.total)}</td>
          <td><button class="btn-detail" data-id="${escapeHtml(trx.id)}">Detail</button></td>
        </tr>
      `);
    });
    qsa(".btn-detail").forEach(btn=>btn.onclick=()=>openDetailModal(btn.dataset.id));
  };

  const loadAll = () => render(JSON.parse(localStorage.getItem(LS_TRANSACTIONS_KEY)) || []);

  if (form) form.addEventListener("submit", e=>{
    e.preventDefault();
    const dateVal = qs("#tanggal").value;
    const transactions = JSON.parse(localStorage.getItem(LS_TRANSACTIONS_KEY)) || [];
    render(dateVal ? transactions.filter(t=>t.tanggal.split("T")[0]===dateVal) : transactions);
  });

  function openDetailModal(id) {
    const trx = (JSON.parse(localStorage.getItem(LS_TRANSACTIONS_KEY)) || []).find(t=>t.id===id);
    if (!trx) return showError("Transaksi tidak ditemukan.");
    const itemsHtml = trx.items.map(it=>`<tr><td>${escapeHtml(it.nama)}</td><td>${it.qty}</td><td>${formatCurrency(it.harga)}</td><td>${formatCurrency(it.total)}</td></tr>`).join("");
    const html = `
      <div id="modalReport" class="modal-bg">
        <div class="modal card">
          <h3>Detail Transaksi ${trx.id}</h3>
          <p>Kasir: ${escapeHtml(trx.kasir)}</p>
          <p>Tanggal: ${new Date(trx.tanggal).toLocaleString()}</p>
          <table style="width:100%;margin-top:8px;border-collapse:collapse">
            <thead><tr><th>Produk</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot><tr><td colspan="3" style="text-align:right"><strong>Total</strong></td><td>${formatCurrency(trx.total)}</td></tr></tfoot>
          </table>
          <div style="margin-top:10px;text-align:right"><button id="closeReportModal">Tutup</button></div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", html);
    qs("#closeReportModal").onclick = ()=>qs("#modalReport")?.remove();
  }

  loadAll();
}

// ---------------------------
// 9. Utilities
// ---------------------------
function showSuccess(msg){ alert("SUKSES: "+msg); }
function showError(msg){ alert("ERROR: "+msg); }
