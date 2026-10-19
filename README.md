# Puncak Rental

Website penyewaan alat hiking menggunakan HTML, CSS, dan JavaScript murni, tanpa proses build atau dependensi runtime.

## Menjalankan

```bash
python3 -m http.server 5500 --bind 127.0.0.1
```

Buka http://localhost:5500. Jangan membuka melalui `file://` karena aplikasi menggunakan ES modules.

## Isi proyek

- 10 produk utama dari 5 kategori, dengan gambar produk fotorealistis hasil generasi AI dalam format WebP lokal, beserta gambar hero pegunungan.
- Pencarian dan filter kategori yang dapat digabungkan.
- Halaman detail masing-masing produk, misalnya `produk.html?id=tenda-2p`, dengan gambar besar, deskripsi, spesifikasi, rekomendasi, pilihan jumlah/tanggal, dan sewa sekarang.
- Keranjang tersimpan di browser, jumlah 1–99, tanggal sewa, dan estimasi biaya.
- Formulir kontak, pemeriksaan ringkasan, dan pembentukan draf WhatsApp.
- Panduan sewa, FAQ, tampilan responsif, dan dukungan keyboard.

Nama, harga, dan spesifikasi merupakan data contoh. Stok dikonfirmasi manual. Tidak ada akun, backend, database, pembayaran, atau reservasi otomatis.

## Konfigurasi usaha

Edit `js/config.js` untuk nomor WhatsApp internasional (digit saja), alamat, dan jam buka yang asli. Alamat Kemang di footer adalah contoh yang diminta untuk demonstrasi; ganti dengan alamat usaha lalu atur `addressIsExample: false`. Nomor kosong membuat tombol WhatsApp nonaktif. Jangan memasukkan nomor contoh sebagai tujuan aktif. Perbarui katalog di `js/data.js` dan identitas merek pada HTML sebelum peluncuran.

Nama dan kontak penyewa tidak disimpan di localStorage. Membuka WhatsApp memasukkan kontak serta rincian pengajuan ke URL layanan tersebut; pengguna masih harus mengirim pesan sendiri.

## Pemeriksaan dan paket

Node.js hanya diperlukan untuk menjalankan pengujian otomatis, bukan untuk membuka website:

```bash
npm test
python3 scripts/package_site.py
```

Paket publik berada di `artifacts/puncak-rental.zip`. Dokumen, tes, konfigurasi pengembangan, dan metadata Git tidak masuk paket. Hasil verifikasi serta batasannya dicatat di `verification.md`.

SOP lengkap: [instruction.md](instruction.md). Kebutuhan: [prd.md](prd.md), teknologi: [tech_stack.md](tech_stack.md), arsitektur: [arsitektur.md](arsitektur.md), desain: [ui.ux.md](ui.ux.md).
