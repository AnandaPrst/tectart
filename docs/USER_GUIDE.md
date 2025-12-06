# 📘 USER GUIDE - Sistem Penjualan Toko Sederhana 
Panduan ini menjelaskan cara menggunakan seluruh fitur pada aplikasi seperti: login, dashboard, manajemen produk, kasir/POS, dan laporan.

---

### 1. Login 

## Cara Login
1. Buka halaman login.html
2. Masukkan username dan password yang tersedia:
- admin / admin
- kasir / kasir
3. Klik **Login**
4. Jika data benar, sistem mengarahkan ke halaman **Dashboard**.

## Hak Akses User
|    Role    |            Akses Menu                             |
|------------|---------------------------------------------------|
| Admin      | Dashboard, Produk, Tambah Produk, POS, Laporan    |
| Kasir      | Dashboard, POS, Logout                            |
|            | (menu Produk & Laporan disembunyikan)             |

---

### 2. Dashboard
Dashboard menampilkan ringkasan:
- Total Produk tersedia
- Total Transaksi Hari Ini
- Total Pendapatan Hari Ini
- Produk Hampir Habis (stok ≤ 5)

Semua data berasal dari localStorage.

---

### 3. Manajemen Produk (CRUD) - Role Admin

## A. Melihat Daftar Produk
Tabel berisi:
- Nama Produk
- Kategori
- Harga Jual
- Harga Beli
- Stok
- Satuan
- Aksi (Edit & Hapus)

## B. Menambahkan Produk
1. Masuk menu **Tambah Produk**
2. Isi form: nama, kategori, harga jual, harga beli, stok, satuan
3. Klik **Tambah Produk**
4. Data disimpan ke localStorage → key: produkList

## C. Edit Produk
1. Klik **Edit** pada baris produk
2. Ubah data yang diperlukan
3. Klik **Simpan Perubahan**

## D. Hapus Produk
1. Klik **Hapus**
2. Konfirmasi
3. Produk akan dihapus dari localStorage

---

### 4. POS (Point of Sale/Kasir)

## A. Menambahkan Item ke Keranjang
1. Masukkan kode atau nama produk
2. Masukkan jumlah pembelian (Qty)
3. Klik **Tambah ke Keranjang**
4. Item masuk ke tabel keranjang & total diperbarui otomatis

Keranjang disimpan sementara di:
sessionStorage -> "cart"

## B. Menghapus Item
- Klik tombol **Hapus** pada item di keranjang

## C. Pembayaran
1. Lihat nilai **Total**
2. Masukkan nominal **Bayar**
3. Sistem otomatis menghitung **Kembalian**

## D. Menyelesaikan Transaksi
1. Klik tombol **Bayar**
2. Sistem akan:
   - Validasi pembayaran
   - Simpan transaksi ke:
localStorage -> "transactions"
- Menghapus cart
- Menampilkan pop-up sukses

---

### 5.  Laporan Transaksi – Role Admin

## A. Menampilkan Semua Transaksi
- Kosongkan input tanggal
- Klik **Tampilkan Laporan**

## B. Filter Berdasarkan Tanggal
1. Pilih tanggal transaksi
2. Klik **Tampilkan Laporan**

## C. Detail Transaksi
1. Klik tombol **Detail**
2. Tampil modal berisi:
   - Produk
   - Qty
   - Harga
   - Total per item
   - Total transaksi

---

### 6. Logout

- Tersedia pada navbar
- Setelah logout:

  - loggedInUser dihapus dari localStorage
  - User kembali ke halaman login

---

### 7.  Penyimpanan Data (Storage)

Sistem menggunakan browser storage:

## localStorage
loggedInUser   → data user yang login
produkList     → daftar produk
transactions   → daftar transaksi


## sessionStorage
cart → keranjang sementara (untuk halaman POS)

---

### 8. Notifikasi

Sistem menggunakan dua pop-up:
showSuccess("pesan");
showError("pesan");

- **showSuccess** → notifikasi hijau
- **showError** → notifikasi merah

---

### 9. Struktur Folder

frontend/
├── login.html
├── dashboard.html
├── produk.html
├── tambah_produk.html
├── pos.html
├── laporan.html