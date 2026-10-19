export const CATEGORIES = Object.freeze([
  { id: 'all', name: 'Semua alat' },
  { id: 'tenda', name: 'Tenda' },
  { id: 'carrier', name: 'Carrier' },
  { id: 'tidur', name: 'Perlengkapan tidur' },
  { id: 'memasak', name: 'Memasak' },
  { id: 'aksesori', name: 'Aksesori' },
]);

// Katalog dan tarif contoh; ganti dengan inventaris usaha sebelum peluncuran.
export const PRODUCTS = Object.freeze([
  { id: 'tenda-2p', name: 'Tenda Dome 2 Orang', category: 'tenda', description: 'Ruang istirahat ringkas untuk petualangan berdua.', specification: '2 orang · double layer', dailyPrice: 50000, image: 'assets/images/tenda-2p.webp', imageAlt: 'Gambar AI tenda dome hijau untuk dua orang', tag: 'Ringkas & praktis' },
  { id: 'tenda-4p', name: 'Tenda Dome 4 Orang', category: 'tenda', description: 'Ruang lebih lega untuk bermalam bersama teman.', specification: '4 orang · double layer', dailyPrice: 75000, image: 'assets/images/tenda-4p.webp', imageAlt: 'Gambar AI tenda dome jingga untuk empat orang', tag: 'Untuk rombongan' },
  { id: 'carrier-60l', name: 'Carrier 60 Liter', category: 'carrier', description: 'Bawa kebutuhan perjalanan dalam satu ransel.', specification: '60 L · rain cover', dailyPrice: 35000, image: 'assets/images/carrier-60l.webp', imageAlt: 'Gambar AI ransel carrier hijau berkapasitas 60 liter', tag: 'Perjalanan panjang' },
  { id: 'carrier-40l', name: 'Carrier 40 Liter', category: 'carrier', description: 'Pilihan lebih ringkas untuk perjalanan singkat.', specification: '40 L · rain cover', dailyPrice: 30000, image: 'assets/images/carrier-40l.webp', imageAlt: 'Gambar AI ransel carrier krem berkapasitas 40 liter', tag: 'Bawa seperlunya' },
  { id: 'sleeping-bag', name: 'Sleeping Bag', category: 'tidur', description: 'Teman beristirahat setelah seharian berjalan.', specification: '1 orang · model mummy', dailyPrice: 20000, image: 'assets/images/sleeping-bag.webp', imageAlt: 'Gambar AI kantong tidur model mummy berwarna hijau', tag: 'Waktu istirahat' },
  { id: 'matras', name: 'Matras Camping', category: 'tidur', description: 'Lapisan alas tambahan untuk area tidur di tenda.', specification: '1 orang · busa gulung', dailyPrice: 10000, image: 'assets/images/matras.webp', imageAlt: 'Gambar AI matras camping gulung berwarna hijau', tag: 'Alas bermalam' },
  { id: 'kompor', name: 'Kompor Portable', category: 'memasak', description: 'Kompor lipat untuk memasak di area camping.', specification: '1 tungku · gas terpisah', dailyPrice: 20000, image: 'assets/images/kompor.webp', imageAlt: 'Gambar AI kompor camping portable dengan kaki lipat', tag: 'Dapur di alam' },
  { id: 'nesting', name: 'Nesting Cookset', category: 'memasak', description: 'Peralatan masak bertumpuk yang hemat ruang.', specification: 'Panci & wajan · 2–3 orang', dailyPrice: 15000, image: 'assets/images/nesting.webp', imageAlt: 'Gambar AI panci dan wajan nesting camping', tag: 'Masak bersama' },
  { id: 'headlamp', name: 'Headlamp LED', category: 'aksesori', description: 'Penerangan di kepala agar tangan tetap leluasa.', specification: 'Tali adjustable · baterai terpisah', dailyPrice: 10000, image: 'assets/images/headlamp.webp', imageAlt: 'Gambar AI headlamp LED dengan tali hijau', tag: 'Teman malam' },
  { id: 'trekking-pole', name: 'Trekking Pole', category: 'aksesori', description: 'Tongkat bantu untuk menemani langkah di jalur.', specification: '1 batang · tinggi adjustable', dailyPrice: 15000, image: 'assets/images/trekking-pole.webp', imageAlt: 'Gambar AI tongkat trekking dengan pegangan dan tali', tag: 'Langkah berikutnya' },
]);

export const findProduct = (id) => PRODUCTS.find((product) => product.id === id);
export const filterProducts = (query, category) => {
  const keyword = query.trim().toLocaleLowerCase('id-ID');
  return PRODUCTS.filter((product) =>
    (category === 'all' || product.category === category) &&
    product.name.toLocaleLowerCase('id-ID').includes(keyword));
};
