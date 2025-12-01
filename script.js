// ---------------------------
// 0. Konstanta & Util
// ---------------------------
const LS_USER_KEY = "loggedInUser";
const LS_PRODUCTS_KEY = "produkList";
const LS_TRANSACTIONS_KEY = "transactions";

// dummy users (for demo) — sesuaikan nanti dengan backend
const DUMMY_USERS = [
  { username: "admin", password: "admin", role: "admin" },
  { username: "kasir", password: "kasir", role: "kasir" }
];

function qs(sel) { return document.querySelector(sel); }
function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }
function formatCurrency(n) { return "Rp " + Number(n).toLocaleString(); }
function parseNumberFromCurrency(str) { return Number(String(str).replace(/[^0-9]/g, "")) || 0; }

// ---------------------------
// 1. Page protection (redirect to login.html if not logged in)
// ---------------------------
(function protectPages() {
  const isLoginPage = window.location.href.includes("login.html") || window.location.pathname.endsWith("/"); 
  // If your login file is index.html or root, adapt above check.
  if (!isLoginPage) {
    const user = JSON.parse(localStorage.getItem(LS_USER_KEY));
    if (!user) {
      // not logged in -> force to login
      window.location.href = "login.html";
    }
  }
})();

// ---------------------------
// 2. Main init on DOMContentLoaded
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
  initAuth();           // login form, show user, logout, role menu
  highlightMenu();      // add active class based on current page
  initProducts();       // product page CRUD (if present)
  initAddProductPage(); // tambah-produk.html handler (if present)
  initPOS();            // transaksi / pos page (if present)
  initReports();        // laporan page (if present)
});

// ---------------------------
// 3. AUTH: Login / Logout / Show user / Role handling
// ---------------------------
function initAuth() {
  // --- Login form handler (on login.html) ---
  const loginForm = qs("#loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const u = qs("#username").value.trim();
      const p = qs("#password").value.trim();
      if (!u || !p) { showError("Username dan password wajib diisi."); return; }

      // check against dummy user list (replace with fetch to backend later)
      const found = DUMMY_USERS.find(x => x.username === u && x.password === p);
      if (!found) { showError("Username atau password salah."); return; }

      // save to localStorage
      localStorage.setItem(LS_USER_KEY, JSON.stringify({ username: found.username, role: found.role }));
      showSuccess("Login berhasil, mengarahkan ke dashboard...");
      setTimeout(() => window.location.href = "dashboard.html", 700);
    });
  }

  // --- Show username in topbar (if element exists) ---
  const userSpan = qs(".user-info span");
  const user = JSON.parse(localStorage.getItem(LS_USER_KEY));
  if (user && userSpan) {
    userSpan.textContent = `Selamat datang, ${user.username}`;
  }

  // --- Role-based menu visibility (hide Produk & Laporan for kasir) ---
  if (user) {
    if (user.role === "kasir") {
      const produkMenu = qs("a[href='produk.html']");
      const laporanMenu = qs("a[href='laporan.html']");
      if (produkMenu) produkMenu.style.display = "none";
      if (laporanMenu) laporanMenu.style.display = "none";
    }
  }

  // --- Logout handler (support <a href='#'> or element with id logoutBtn) ---
  const logoutBtn = qs("#logoutBtn") || qs("a[href='#']") || qs(".logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem(LS_USER_KEY);
      showSuccess("Anda telah logout.");
      window.location.href = "login.html";
    });
  }
}

// ---------------------------
// 4. NAV HIGHLIGHT
// ---------------------------
function highlightMenu() {
  const navLinks = qsa("nav a");
  if (!navLinks.length) return;
  const current = window.location.pathname.split("/").pop();
  navLinks.forEach(a => {
    const href = a.getAttribute("href");
    if (href === current) a.classList.add("active");
  });
}

// ---------------------------
// 5. PRODUCTS: CRUD (produk.html)
// - Uses localStorage LS_PRODUCTS_KEY
// - Renders table .products-table tbody
// - Popup modal for add/edit
// ---------------------------
function initProducts() {
  const tbody = qs(".products-table tbody");
const btnAdd = qs(".add-product-button");
  if (!tbody && !btnAdd) return; // not products page

  // load products from localStorage or seed defaults
  let products = JSON.parse(localStorage.getItem(LS_PRODUCTS_KEY)) || [
    { nama: "Produk A", kategori: "Kategori 1", jual: 10000, beli: 8000, stok: 50, satuan: "pcs" },
    { nama: "Produk B", kategori: "Kategori 2", jual: 15000, beli: 12000, stok: 30, satuan: "pcs" }
  ];

  function save() { localStorage.setItem(LS_PRODUCTS_KEY, JSON.stringify(products)); }

  function render() {
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

    // attach events
    qsa(".btn-del").forEach(btn => btn.onclick = () => {
      const idx = Number(btn.dataset.i);
      if (!Number.isInteger(idx)) return;
      if (!confirm(`Hapus produk "${products[idx].nama}"?`)) return;
      products.splice(idx, 1);
      save(); render();
      showSuccess("Produk dihapus.");
    });

    qsa(".btn-edit").forEach(btn => btn.onclick = () => openForm("edit", Number(btn.dataset.i)));
  }

  // open add/edit form modal
  function openForm(mode = "add", idx = null) {
    const p = mode === "edit" ? products[idx] : { nama: "", kategori: "", jual: "", beli: "", stok: "", satuan: "" };
    const html = `
      <div id="modalBg" class="modal-bg">
        <div class="modal card">
          <h3>${mode === "edit" ? "Edit Produk" : "Tambah Produk"}</h3>
          <label>Nama Produk</label><input id="m_nama" value="${escapeHtmlAttr(p.nama)}">
          <label>Kategori</label><input id="m_kategori" value="${escapeHtmlAttr(p.kategori)}">
          <label>Harga Jual</label><input id="m_jual" type="number" value="${p.jual || ""}">
          <label>Harga Beli</label><input id="m_beli" type="number" value="${p.beli || ""}">
          <label>Stok</label><input id="m_stok" type="number" value="${p.stok || 0}">
          <label>Satuan</label><input id="m_satuan" value="${escapeHtmlAttr(p.satuan || "")}">
          <div style="margin-top:10px;text-align:right">
            <button id="m_save">${mode === "edit" ? "Simpan Perubahan" : "Tambah"}</button>
            <button id="m_cancel">Batal</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", html);

    qs("#m_cancel").onclick = () => qs("#modalBg").remove();
    qs("#m_save").onclick = () => {
      const newP = {
        nama: qs("#m_nama").value.trim(),
        kategori: qs("#m_kategori").value.trim(),
        jual: parseInt(qs("#m_jual").value) || 0,
        beli: parseInt(qs("#m_beli").value) || 0,
        stok: parseInt(qs("#m_stok").value) || 0,
        satuan: qs("#m_satuan").value.trim()
      };
      if (!newP.nama) { showError("Nama produk wajib diisi."); return; }
      if (mode === "edit") products[idx] = newP; else products.push(newP);
      save(); render(); qs("#modalBg").remove(); showSuccess("Produk tersimpan.");
    };
  }

  // button add opens modal
  if (btnAdd) btnAdd.addEventListener("click", () => openForm("add"));

  // initial render
  render();
}

// ---------------------------
// 6. ADD-PRODUK PAGE handler (tambah-produk.html)
// - If user uses separate page to add product, syncs to same LS_PRODUCTS_KEY
// ---------------------------
function initAddProductPage() {
  const form = qs(".add-product-section form");
  const cancelBtn = qs(".cancel-button");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = qs("#nama").value.trim();
    const kategori = qs("#kategori").value.trim();
    const beli = parseInt(qs("#harga-beli").value) || 0;
    const jual = parseInt(qs("#harga-jual").value) || 0;
    const stok = parseInt(qs("#stok").value) || 0;
    const satuan = qs("#satuan").value.trim();

    if (!nama || !kategori) { showError("Nama & kategori wajib diisi."); return; }

    const products = JSON.parse(localStorage.getItem(LS_PRODUCTS_KEY)) || [];
    products.push({ nama, kategori, jual, beli, stok, satuan });
    localStorage.setItem(LS_PRODUCTS_KEY, JSON.stringify(products));

    showSuccess("Produk berhasil ditambahkan.");
    window.location.href = "produk.html";
  });

  if (cancelBtn) cancelBtn.addEventListener("click", () => window.location.href = "produk.html");
}

// ---------------------------
// 7. POS (transaksi.html / pos.html)
// - uses products from LS_PRODUCTS_KEY for lookup by code or name (simple code fallback)
// - stores transactions to LS_TRANSACTIONS_KEY for report demo
// ---------------------------
function initPOS() {
  const posForm = qs(".product-input form");
  const cartBody = qs(".cart-table tbody");
  const totalInput = qs("#total");
  const bayarInput = qs("#bayar");
  const kembalianInput = qs("#kembalian");
  const paymentForm = qs(".payment-form form");
  if (!posForm || !cartBody || !totalInput) return; // not pos page

  // helper product lookup:
  // if product code entered matches A001/B002... use that, else try match by name
  const productsLS = () => JSON.parse(localStorage.getItem(LS_PRODUCTS_KEY)) || [];
  const lookupByCode = (code) => {
    // simple mapping: code A001 -> first product, B002 -> second, etc.
    // prefer to search by name if code not present.
    const pList = productsLS();
    if (!code) return null;
    // if code like A001 map to index: 'A'->0, 'B'->1 etc (very simple)
    const letter = code[0];
    if (letter) {
      const idx = letter.toUpperCase().charCodeAt(0) - 65; // A->0
      if (pList[idx]) return pList[idx];
    }
    // fallback: search by name match
    return pList.find(p => p.nama.toLowerCase() === code.toLowerCase()) || null;
  };

  let cart = JSON.parse(sessionStorage.getItem("cart")) || [];

  function renderCart() {
    cartBody.innerHTML = "";
    cart.forEach((it, idx) => {
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
    qsa(".cart-remove").forEach(btn => btn.onclick = () => {
      const i = Number(btn.dataset.i); cart.splice(i,1); saveCart(); renderCart(); updateTotal();
    });
    saveCart();
  }

  function saveCart() { sessionStorage.setItem("cart", JSON.stringify(cart)); }

  function updateTotal() {
    const total = cart.reduce((s, it) => s + it.total, 0);
    totalInput.value = formatCurrency(total);
    return total;
  }

  posForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = qs("#kode-produk").value.trim();
    const qty = parseInt(qs("#qty").value) || 0;
    if (!code || qty <= 0) { showError("Isi kode produk & qty valid."); return; }
    const prod = lookupByCode(code);
    if (!prod) { showError("Produk tidak ditemukan (cek kode atau nama)."); return; }
    const item = { nama: prod.nama, qty, harga: prod.jual, total: prod.jual * qty };
    cart.push(item);
    renderCart(); updateTotal();
    // clear inputs
    qs("#kode-produk").value = ""; qs("#qty").value = 1;
  });

  // bayar input -> kembalian
  if (bayarInput) {
    bayarInput.addEventListener("input", () => {
      const totalNum = parseNumberFromCurrency(totalInput.value);
      const bayarNum = parseInt(bayarInput.value) || 0;
      const kembali = Math.max(0, bayarNum - totalNum);
      if (kembalianInput) kembalianInput.value = formatCurrency(kembali);
    });
  }

  // finish payment
  paymentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const totalNum = parseNumberFromCurrency(totalInput.value);
    const bayarNum = parseInt(bayarInput.value) || 0;
    if (bayarNum < totalNum) { showError("Pembayaran kurang!"); return; }

    // save transaction to LS_TRANSACTIONS_KEY
    const transactions = JSON.parse(localStorage.getItem(LS_TRANSACTIONS_KEY)) || [];
    const user = JSON.parse(localStorage.getItem(LS_USER_KEY)) || { username: "Unknown" };
    const trx = {
      id: "TRX" + (new Date().getTime()),
      tanggal: new Date().toISOString(),
      kasir: user.username,
      items: cart,
      total: totalNum
    };
    transactions.push(trx);
    localStorage.setItem(LS_TRANSACTIONS_KEY, JSON.stringify(transactions));

    showSuccess("Transaksi berhasil disimpan. Terima kasih!");
    // reset cart
    cart = []; saveCart(); renderCart(); updateTotal();
    if (bayarInput) bayarInput.value = "";
    if (kembalianInput) kembalianInput.value = "";
  });

  // initial render
  renderCart(); updateTotal();
}

// ---------------------------
// 8. REPORTS: laporan.html
// - loads transactions from LS_TRANSACTIONS_KEY and renders to table #reportBody
// - supports date filter in form #formCariLaporan and detail buttons
// ---------------------------
function initReports() {
  const form = qs("#formCariLaporan");
  const tbody = qs("#reportBody");
  const reportDateEl = qs("#reportDate"); // optional element to display today's date

  if (!tbody && !form && !reportDateEl) return;

  // show today's date for convenience
  if (reportDateEl) {
    const today = new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
    reportDateEl.textContent = today;
  }

  function render(transactions) {
    if (!tbody) return;
    tbody.innerHTML = "";
    transactions.forEach(trx => {
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

    // detail handler (delegated)
    tbody.querySelectorAll(".btn-detail").forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        openDetailModal(id);
      };
    });
  }

  function loadAll() {
    const transactions = JSON.parse(localStorage.getItem(LS_TRANSACTIONS_KEY)) || [];
    render(transactions);
  }

  // filter by date (input#tanggal)
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const dateVal = qs("#tanggal").value; // format YYYY-MM-DD
      const transactions = JSON.parse(localStorage.getItem(LS_TRANSACTIONS_KEY)) || [];
      if (!dateVal) { render(transactions); return; }
      const filtered = transactions.filter(t => t.tanggal.split("T")[0] === dateVal);
      render(filtered);
    });
  }

  function openDetailModal(id) {
    const transactions = JSON.parse(localStorage.getItem(LS_TRANSACTIONS_KEY)) || [];
    const trx = transactions.find(t => t.id === id);
    if (!trx) { showError("Transaksi tidak ditemukan."); return; }

    let itemsHtml = trx.items.map(it => `<tr><td>${escapeHtml(it.nama)}</td><td>${it.qty}</td><td>${formatCurrency(it.harga)}</td><td>${formatCurrency(it.total)}</td></tr>`).join("");
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
    qs("#closeReportModal").onclick = () => qs("#modalReport").remove();
  }

  // initial load
  loadAll();
}

// ---------------------------
// 9. Utilities: notifications & escape
// ---------------------------
function showSuccess(msg) {
  // simple success, replace with nicer UI later
  alert("SUKSES: " + msg);
}
function showError(msg) {
  alert("ERROR: " + msg);
}
function escapeHtml(str) {
  if (!str && str !== 0) return "";
  return String(str).replace(/[&<>"'`=\/]/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#47;','`':'&#96;','=':'&#61;'
  }[c]));
}
function escapeHtmlAttr(str) { return escapeHtml(str).replace(/"/g, '&quot;'); }
