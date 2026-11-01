---
name: Raga
colors:
  surface: '#111317'
  surface-dim: '#111317'
  surface-bright: '#37393e'
  surface-container-lowest: '#0c0e12'
  surface-container-low: '#1a1c20'
  surface-container: '#1e2024'
  surface-container-high: '#282a2e'
  surface-container-highest: '#333539'
  on-surface: '#e2e2e8'
  on-surface-variant: '#e4beb5'
  inverse-surface: '#e2e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#ab8981'
  outline-variant: '#5b403a'
  surface-tint: '#ffb5a1'
  primary: '#ffb5a1'
  on-primary: '#601300'
  primary-container: '#ff5a2c'
  on-primary-container: '#571100'
  inverse-primary: '#b22c00'
  secondary: '#41e185'
  on-secondary: '#00391b'
  secondary-container: '#00c16a'
  on-secondary-container: '#004824'
  tertiary: '#6fd2ff'
  on-tertiary: '#003547'
  tertiary-container: '#009ecd'
  on-tertiary-container: '#002f40'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbd1'
  primary-fixed-dim: '#ffb5a1'
  on-primary-fixed: '#3b0800'
  on-primary-fixed-variant: '#881f00'
  secondary-fixed: '#64fe9f'
  secondary-fixed-dim: '#41e185'
  on-secondary-fixed: '#00210d'
  on-secondary-fixed-variant: '#00522a'
  tertiary-fixed: '#c0e8ff'
  tertiary-fixed-dim: '#6fd2ff'
  on-tertiary-fixed: '#001f2b'
  on-tertiary-fixed-variant: '#004d66'
  background: '#111317'
  on-background: '#e2e2e8'
  surface-variant: '#333539'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  stat-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.03em
  stat-compact:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

Sistem desain ini dirancang khusus untuk aplikasi pelacak latihan kebugaran mobile dengan pendekatan modern, ramping, dan ramah pemula (*beginner-friendly*). Filosofi visual berakar pada estetika gelap bertenaga (*high-energy dark minimalism*): menghilangkan distraksi visual di gym atau ruang latihan rumahan agar pengguna dapat berfokus penuh pada repetisi, beban, dan ritme waktu istirahat.

### Karakter & Respons Emosional
- **Percaya Diri & Memotivasi:** Kombinasi latar belakang gelap pekat dengan aksen oranye koral membangkitkan dorongan energi kinetik tanpa terasa melelahkan mata.
- **Jelas & Tanpa Hambatan:** Setiap elemen interaktif memiliki kontras tegas, hierarki instan, serta umpan balik visual (*tactile clarity*) yang jelas ketika set terselesaikan.
- **Ramah Pemula (*Approachable*):** Menghindari jargon berat dan kerumitan data berlebih; metrik krusial (KG, Reps, Detik) disajikan dengan ukuran besar dan keterbacaan instan.

### Gaya Visual
- **Modern Dark Utility:** Latar gelap berlapis (*layered dark surfaces*) dengan aksen kontras tinggi dan lengkungan sudut lembut (16px–20px) yang ergonomis untuk pengoperasian satu tangan pada layar ponsel.

## Colors

Palet warna menggunakan mode gelap absolut (*dark mode only*) yang dioptimalkan untuk layar OLED, efisiensi konsumsi daya baterai, dan kenyamanan visual saat berolahraga dalam pencahayaan redup maupun terang benderang.

### Hierarki Palet Warna
- **Latar Belakang & Permukaan:**
  - `Surface Base`: `#0F1115` — Kanvas utama, gelap pekat mendekati hitam.
  - `Surface Elevated / Card`: `#181B22` — Latar kartu komponen, input, dan panel mengambang.
  - `Surface Interactive`: `#1E232D` — Keadaan permukaan saat disentuh (*pressed*) atau modul sekunder.
  - `Border Subtle`: `#232733` — Garis tepi pembatas struktural dengan kontras rendah.
  - `Border Focus / Active`: `#FF5A2C` — Pembatas aktif dengan pendaran halus oranye koral.

- **Aksen & Fungsional:**
  - `Primary Coral-Orange`: `#FF5A2C` — Tombol aksi utama, cincin fokus, status aktif, dan indikator progres primer.
  - `Success Green`: `#2ED47A` — Penanda set selesai, centang checklist keberhasilan, dan metrik pencapaian positif.
  - `Warning / Rest`: `#FFB800` — Indikator istirahat atau peringatan opsional.

- **Tipografi & Ikonografi:**
  - `Text Primary`: `#FFFFFF` — Teks judul, angka metrik beban (KG) dan repetisi (Reps), serta status penting.
  - `Text Secondary`: `#9AA3B2` — Label deskripsi, unit satuan, dan teks pendukung.
  - `Text Muted`: `#656E80` — Garis pemisah, placeholder input, dan elemen status non-aktif.

## Typography

Sistem tipografi berbasis **Plus Jakarta Sans** dengan penekanan pada legibilitas instan. Saat pengguna mengangkat beban atau kelelahan, angka dan label harus dapat terbaca dalam sepersekian detik dari jarak satu lengan.

### Penerapan Tipografi
- **Metrik Numerik (`stat-display`, `stat-compact`):** Digunakan murni untuk angka bobot (KG), jumlah repetisi (Reps), dan penghitung waktu istirahat (*timer countdown*). Angka menggunakan gaya ketebalan `Bold` hingga `ExtraBold`.
- **Judul Utama (`headline-xl`, `headline-lg`):** Digunakan pada nama latihan, ringkasan akhir sesi latihan, dan tajuk beranda.
- **Teks Pendukung (`body-md`):** Dibatasi minimal ukuran 14px agar tidak menyulitkan pengguna dalam membaca instruksi gerakan.
- **Label Unit & Tag (`label-sm`):** Digunakan untuk label pelengkap seperti "KG", "REPS", "SET 1", dan "REST" dengan ketebalan semi-bold/medium.

## Layout & Spacing

Sistem tata letak dioptimalkan untuk konteks genggam mobile (kanvas acuan: 390px x 844px) dengan mempertimbangkan zona jangkauan ibu jari (*thumb zone*) dan area aman (*safe area bottom*).

### Prinsip Tata Letak
- **Margin Layar:** Margin horizontal konsisten sebesar 20px (`margin: 1.25rem`) menjamin kartu dan tombol tidak terpotong lengkungan fisik perangkat.
- **Struktur Kolom:** Menggunakan tata letak vertikal berbasis tumpukan (*vertical stacked flow*) dengan celah antar kartu (`gutter: 1rem`).
- **Zona Aksi Bawah (*Bottom Sticky Zone*):** Tombol aksi utama (CTA) ditempatkan tetap pada bagian dasar layar di atas batas *home indicator* (jarak minimal 24px–34px dari dasar fisik layar) untuk mempermudah penekanan dengan satu tangan.
- **Target Sentuh Ergonomis:** Semua elemen interaktif (tombol plus/minus, centang, beralih tab) memiliki area sentuh minimum 48px x 48px.

## Elevation & Depth

Kedalaman antarmuka dibangun secara halus melalui stratifikasi tonal (*tonal layering*) dan garis batas bergradasi kontras rendah, alih-alih bayangan gelap tebal yang membuat antarmuka kotor.

### Tingkatan Kedalaman (Layering Hierarchy)
1. **Lapis Dasar (Elevation 0 - Canvas):** `#0F1115` — Dasar halaman aplikasi.
2. **Lapis Kartu (Elevation 1 - Surface):** `#181B22` dengan batas tipis `1px solid #232733`. Tanpa bayangan (*shadowless*), mengutamakan ketegasan batas geometris.
3. **Lapis Kartu Aktif/Terpilih (Elevation 2 - Active State):** `#181B22` dengan batas `1.5px solid #FF5A2C` serta pancaran lembut (*subtle ambient glow*) `box-shadow: 0px 4px 20px rgba(255, 90, 44, 0.15)`.
4. **Lapis Mengambang (Elevation 3 - Floating / Overlays):** Panel penghitung istirahat (*floating rest bar*) dan bar notifikasi (*toast*) menggunakan latar `#181B22` dengan intensitas bayangan `0px 12px 32px rgba(0, 0, 0, 0.5)` dan batas halus `#232733`.

## Shapes

Bahasa bentuk menggunakan tingkat kelengkungan modern ramah sentuhan dengan radius antara 16px hingga 20px untuk wadah penampung, menciptakan rasa fleksibel dan atletis.

### Penerapan Radius
- **Kartu Utama, Kartu Latihan, & Day Card:** Radius 18px–20px (`rounded-2xl`).
- **Tombol Utama & Sekunder:** Radius 16px (`rounded-2xl`) dengan tinggi baku 56px (`h-14`).
- **Komponen Stepper (- / +) & Centang Set:** Radius 12px–14px untuk kontrol tombol kecil, dan lingkaran penuh (`rounded-full`) untuk tombol status centang.
- **Segmented Toggle & Chip:** Radius 9999px (*pill-shaped*) atau 14px untuk kenyamanan geser.

## Components

Semua komponen dirancang dengan label dan terminologi bahasa Indonesia yang ringkas dan komunikatif.

### 1. Tombol Utama (Primary CTA Button)
- **Tampilan:** Latar oranye koral `#FF5A2C`, teks putih `#FFFFFF` tebal (`label-md` / 16px Bold), tinggi 56px (`h-14`), radius 16px (`rounded-2xl`).
- **Perilaku:** Lebar penuh (*full-width*), berada mengambang di atas safe area bawah. Efek tekan (*active*): transformasi skala 0.98 dengan saturasi oranye sedikit meredup.

### 2. Tombol Sekunder (Secondary Button)
- **Tampilan:** Latar permukaan gelap `#181B22`, garis batas tipis `1px solid #232733`, teks abu-abu lembut `#9AA3B2`, tinggi 56px (`h-14`), radius 16px.
- **Interaksi:** Hover/tekan mengubah teks menjadi `#FFFFFF` dan batas menjadi `#656E80`.

### 3. Kartu Pilihan (Selectable Card)
- **Contoh:** Pilihan "Lokasi Latihan" (Rumah vs Gym) atau "Fokus Otot" (Dada, Kaki, Punggung).
- **Kondisi Standar:** Latar `#181B22`, border `#232733`, ikon dan teks judul `#FFFFFF`, subteks `#9AA3B2`.
- **Kondisi Aktif/Terpilih:** Garis batas menjadi `#FF5A2C` (1.5px), latar sedikit terangkat, pendaran oranye lembut 15% di sekitar kartu, ikon beralih warna menjadi `#FF5A2C`.

### 4. Tombol Geser Tersegmentasi (Segmented Toggle)
- **Struktur:** Wadah berbentuk kapsul/pill dengan tinggi 48px (`h-12`), latar `#181B22`, padding internal 4px.
- **Tab Aktif:** Kartu pill latar `#232733` atau `#FF5A2C`, teks `#FFFFFF` tebal, transisi geser mulus (*smooth sliding spring animation*). Tab tidak aktif menggunakan teks `#656E80`.

### 5. Pengatur Angka Beban & Reps (Stepper Input)
- **Struktur:** Terdiri dari tombol minus `[-]`, tampilan angka tengah, dan tombol plus `[+]`.
- **Kontrol:** Tombol minus dan plus berukuran minimal 48px x 48px dengan latar `#1E232D` dan ikon tebal. Angka nilai metrik ditampilkan besar (`stat-compact` / 24px–28px Bold) berwarna putih, dengan label satuan kecil di bawahnya (misal: "KG" atau "REPS").

### 6. Kartu Hari Mingguan (Day Card)
- **Struktur:** Blok hari vertikal (Senin hingga Minggu) yang ringkas.
- **Format:** Inisial hari (Sen, Sel, Rab, Kam, Jum, Sab, Min) di atas dengan ukuran teks 12px, diikuti indikator status di bawah: titik/lingkaran oranye untuk "Latihan", abu-abu gelap untuk "Istirahat", dan tanda centang hijau `#2ED47A` untuk "Selesai". Hari aktif/hari ini diberi bingkai oranye tipis.

### 7. Bilah Progres Latihan (Progress Bar)
- **Tampilan:** Ketinggian garis ramping 6px–8px dengan latar jalur kosong `#1E232D`, sudut membulat penuh (*pill*).
- **Status Isi:** Warna oranye `#FF5A2C` untuk progres sesi berjalan, bertransisi menjadi hijau cerah `#2ED47A` ketika progres mencapai 100%.

### 8. Baris Set Latihan (Set Row Component)
- **Anatomi Horizontal:**
  - Urutan Nomor Set: Teks kecil tebal `#9AA3B2` (misal: "1", "2", "3").
  - Kolom KG: Nilai angka stepper beban dengan label "KG".
  - Kolom Repetisi: Nilai angka stepper pengulangan dengan label "REPS".
  - Tombol Centang Set: Lingkaran diameter 44px–48px. Status belum selesai berupa lingkaran abu-abu kosong dengan batas `#232733`; status selesai berubah menjadi latar hijau sukses `#2ED47A` dengan ikon centang putih tegas. Saat selesai, baris set meredupkan teks angka menjadi 60% opacity untuk visualisasi penyelesaian instan.

### 9. Bilah Mengambang Pengatur Waktu Istirahat (Floating Rest Timer Bar)
- **Penempatan:** Menempel mengambang tepat di atas tombol CTA bawah saat waktu jeda set dimulai.
- **Tampilan:** Wadah kartu ramping `#181B22` dengan batas atas oranye halus, menampilkan angka waktu hitung mundur besar (`stat-compact` 24px: contoh "01:30"), label teks "WAKTU ISTIRAHAT", serta tombol aksi cepat: tombol jeda/lanjutkan dan tombol lewati (`Lewati`).

### 10. Notifikasi Toast (Toast Notification)
- **Format:** Muncul melayang dari atas layar (*top banner pill*) berlatar `#181B22` dengan batas aksen hijau sukses `#2ED47A` atau oranye `#FF5A2C`.
- **Konten:** Ikon centang hijau sukses dengan pesan ringkas, seperti: "Set 1 Selesai!" atau "Sesi Latihan Berhasil Disimpan". Teks judul putih tebal dan subteks abu-abu informatif.