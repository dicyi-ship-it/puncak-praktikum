# Aset gambar Puncak Rental

Sebelas gambar fotorealistis dibuat khusus melalui fitur bawaan `image_gen`: sepuluh gambar produk dan satu gambar hero pegunungan. Tidak menggunakan foto internet atau merek pihak ketiga. Gambar ini bersifat representatif untuk katalog contoh, bukan dokumentasi inventaris toko atau jaminan spesifikasi fisik.

## Berkas yang dipakai website

- `tenda-2p.webp`, `tenda-4p.webp`
- `carrier-60l.webp`, `carrier-40l.webp`
- `sleeping-bag.webp`, `matras.webp`
- `kompor.webp`, `nesting.webp`
- `headlamp.webp`, `trekking-pole.webp`
- `hero-mountain.webp`
- `fallback.svg`: ikon gunung buatan proyek, digunakan sebagai favicon serta fallback gambar.

Gambar produk berukuran 800 × 533 px. Hero berukuran 960 × 1200 px. Gambar dioptimalkan ke WebP tanpa mengubah isi adegan. Prompt lengkap setiap gambar tersedia di [generation-prompts.json](generation-prompts.json).

Salinan PNG asli disimpan di `artifacts/imagegen-originals/`. Ilustrasi SVG lama dipindahkan ke `artifacts/previous-illustrations/`. Keduanya tidak masuk paket publik. File asli hasil generasi di direktori Codex tetap dipertahankan.
