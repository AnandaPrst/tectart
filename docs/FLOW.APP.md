# FLOW APP - Sistem Penjualan Toko Sederhana 

## 1. User Journey

* **Login**: User masuk menggunakan username & password. Sistem cek role (admin/kasir).
* **Dashboard**: Menampilkan ringkasan (total produk, total transaksi hari ini, pendapatan hari ini, stok menipis).
* **Produk** (Admin): CRUD produk, tambah/edit/hapus.
* **POS** (Kasir/Admin): Input kode produk → masukkan ke keranjang → hitung total → pembayaran → simpan transaksi.
* **Laporan** (Admin): Filter transaksi berdasarkan tanggal, lihat detail transaksi.
* **Logout**: Menghapus sesi user.

## 2. Arsitektur Aplikasi

* **Front-end**: HTML + CSS + JavaScript murni.
* **Storage**: `localStorage` & `sessionStorage` (tanpa backend).
* **Modular Logic**: Dibagi per fitur (auth, produk, POS, laporan, dashboard).
* **State**:

  * Produk: `LS_PRODUCTS_KEY`
  * User login: `LS_USER_KEY`
  * Transaksi: `LS_TRANSACTIONS_KEY`
  * Keranjang POS: `sessionStorage('cart')`

## 3. CRUD Flow

### Produk

* **Create**: Form tambah → simpan ke `localStorage`.
* **Read**: Ditampilkan di tabel produk.
* **Update**: Modal edit → simpan perubahan ke `localStorage`.
* **Delete**: Hapus item → re-render tabel.

### Transaksi

* **Create**: Kasir menyelesaikan pembayaran → push transaksi ke `localStorage`.
* **Read**: Ditampilkan dalam tabel laporan dan dashboard.
* **Update/Delete**: Tidak tersedia (immutable history).

## 4. POS Flow

1. User input kode produk.
2. Sistem cari produk berdasarkan kode atau nama.
3. User input qty.
4. Sistem hitung subtotal dan total transaksi.
5. User input pembayaran.
6. Sistem hitung kembalian.
7. Simpan transaksi ke `localStorage`.

## 5. RBAC Flow (Role-Based Access Control)

* **Admin**:

  * Akses: Dashboard, Produk (CRUD), POS, Laporan.
* **Kasir**:

  * Akses: Dashboard, POS.
  * Tersembunyi: Menu Produk & Laporan.

## 6. Proteksi Halaman

* Jika halaman bukan login → wajib ada user di `localStorage`.
* Jika tidak ada user → redirect ke login.
* Role kasir otomatis menyembunyikan menu terlarang.
