# PRODUCT REQUIREMENTS DOCUMENT (PRD)

# AksiBareng

**Tagline:** Every Contribution Matters.  
**Konsep:** Platform manajemen kegiatan sosial, relawan, donasi, dan distribusi bantuan berbasis Web3.  
**Kategori Hackathon:** Case 2 — Stronger Communities and Everyday Services  
**Versi Dokumen:** 1.0 (Draft untuk MVP Hackathon)  
**Tanggal:** 2 November 2026  
**Status:** Draft — dapat disesuaikan setelah validasi kebutuhan tim dan handbook lomba.

---

## 1. Ringkasan Produk

AksiBareng adalah platform digital yang membantu komunitas, organisasi kecil, dan penyelenggara kegiatan sosial mengelola kegiatan serta kontribusi masyarakat secara lebih terorganisasi dan transparan.

AksiBareng menggabungkan dua modul utama:

1. **AksiKegiatan** — mengelola kegiatan sosial, pendaftaran relawan, pembagian tugas, jadwal, presensi QR, validasi partisipasi, dan rekam jejak kontribusi.
2. **AksiPeduli** — mengelola kampanye donasi, donasi uang dan barang, pencatatan penggunaan dana, pengelolaan inventaris bantuan, distribusi bantuan, serta laporan transparansi.

Blockchain digunakan secara terarah untuk mencatat transaksi dan bukti penting yang perlu dapat diverifikasi. Aktivitas operasional yang membutuhkan perubahan cepat, seperti profil, pendaftaran, jadwal, dan data penerima bantuan, tetap dikelola melalui backend dan database biasa.

### 1.1 Pernyataan Nilai

AksiBareng membantu komunitas menjalankan kegiatan sosial dengan alur operasional yang lebih rapi dan menyediakan jejak kontribusi serta penggunaan bantuan yang dapat diperiksa.

### 1.2 Tagline

**Connect. Participate. Make an Impact.**  
**Every Contribution Matters.**

---

## 2. Latar Belakang dan Masalah

Banyak komunitas dan organisasi kecil menyelenggarakan kegiatan sosial menggunakan kombinasi grup chat, formulir daring, spreadsheet, rekening, dan dokumentasi yang tersebar. Proses tersebut dapat menimbulkan pekerjaan administrasi berulang dan menyulitkan penyelenggara maupun masyarakat untuk memantau perkembangan kegiatan.

Masalah yang ingin ditangani AksiBareng meliputi:

### 2.1 Pengelolaan Kegiatan dan Relawan

- Pendaftaran relawan tersebar di beberapa kanal.
- Penyelenggara harus menyalin data peserta secara manual.
- Kuota kegiatan sulit dipantau secara langsung.
- Pembagian tugas dan jadwal relawan tidak terpusat.
- Presensi dan rekap kehadiran masih dilakukan secara manual.
- Riwayat kontribusi relawan sulit ditelusuri.

### 2.2 Pengelolaan Donasi dan Bantuan

- Informasi tujuan dan target kampanye tidak selalu disajikan secara terstruktur.
- Donatur kesulitan mengikuti perkembangan penggunaan dana.
- Bukti pembelian dan pengeluaran tersebar.
- Pencatatan donasi barang dan stok bantuan dilakukan secara manual.
- Informasi jumlah bantuan yang sudah dan belum disalurkan sulit dipantau.
- Laporan akhir kegiatan membutuhkan rekap manual.

### 2.3 Masalah Kepercayaan dan Verifikasi

Informasi yang ditampilkan oleh satu aplikasi belum tentu cukup untuk membuktikan bahwa catatan penting tidak diubah setelah diterbitkan. AksiBareng menggunakan blockchain sebagai lapisan audit untuk transaksi dan ringkasan bukti tertentu. Namun, blockchain tidak otomatis membuktikan bahwa peristiwa di dunia nyata benar-benar terjadi. Validasi manusia, bukti pendukung, dan prosedur organisasi tetap diperlukan.

---

## 3. Tujuan Produk

### 3.1 Tujuan Utama

1. Menyediakan satu alur digital untuk mengelola kegiatan dan relawan.
2. Memudahkan masyarakat menemukan kegiatan sosial dan berpartisipasi.
3. Memudahkan komunitas mencatat donasi uang dan barang.
4. Menyediakan laporan penggunaan dana dan distribusi bantuan yang mudah dipahami.
5. Membuat catatan kontribusi, donasi on-chain, dan bukti penting dapat diverifikasi.
6. Menunjukkan peningkatan proses operasional yang dapat diukur.

### 3.2 Hasil yang Diharapkan

- Penyelenggara mengurangi pekerjaan pendataan dan rekap manual.
- Relawan mengetahui informasi kegiatan, tugas, dan status partisipasinya.
- Donatur dapat melihat informasi kampanye, perkembangan donasi, penggunaan dana, serta distribusi bantuan.
- Komunitas mempunyai riwayat kegiatan dan laporan yang lebih terstruktur.

### 3.3 Bukan Tujuan Produk

Untuk MVP hackathon, AksiBareng **tidak** bertujuan menjadi:

- Media sosial umum.
- Marketplace produk atau jasa.
- Platform pinjaman atau investasi.
- Pengganti lembaga keuangan, bank, atau penyelenggara penggalangan dana berizin.
- Sistem yang menjamin kebenaran suatu kegiatan hanya karena datanya dicatat di blockchain.
- Platform yang menyimpan identitas pribadi atau data sensitif penerima bantuan secara terbuka di blockchain.

---

## 4. Target Pengguna dan Peran

MVP menggunakan empat peran utama. Satu akun dapat memiliki lebih dari satu peran jika diperlukan.

### 4.1 Pengunjung (Public Visitor)

Pengguna yang belum login atau belum terdaftar.

Kebutuhan:
- Melihat daftar kegiatan dan kampanye publik.
- Membaca detail kegiatan dan tujuan kampanye.
- Melihat ringkasan dana, penggunaan dana, dan distribusi yang dipublikasikan.
- Memeriksa bukti transaksi atau catatan blockchain yang tersedia.

### 4.2 Relawan / Donatur (Volunteer / Donor)

Pengguna yang berpartisipasi dalam kegiatan, memberikan donasi uang atau barang, atau keduanya.

Kebutuhan:
- Membuat akun dan mengelola profil.
- Menemukan dan mendaftar kegiatan.
- Melihat tugas dan jadwal.
- Melakukan check-in kegiatan.
- Melihat riwayat kontribusi.
- Memberikan donasi uang atau mendaftarkan donasi barang.
- Melihat status donasi dan laporan kampanye.
- Menghubungkan wallet secara opsional untuk fitur Web3.

### 4.3 Organizer (Penyelenggara)

Pengurus komunitas atau organisasi yang membuat dan mengelola kegiatan maupun kampanye.

Kebutuhan:
- Mengelola profil organisasi.
- Membuat dan mengelola kegiatan.
- Mengatur kuota, pendaftaran, tugas, dan jadwal relawan.
- Membuat kampanye donasi.
- Mencatat penerimaan donasi barang.
- Mengajukan dan mencatat penggunaan dana.
- Mencatat distribusi bantuan.
- Memvalidasi kehadiran dan kontribusi relawan.
- Melihat laporan kegiatan dan transparansi.

Organizer harus melalui proses verifikasi oleh Admin sebelum dapat menerbitkan kampanye donasi publik atau melakukan fungsi sensitif.

### 4.4 Admin / Verifikator Platform

Petugas yang mengelola keamanan dan kelayakan penggunaan platform.

Kebutuhan:
- Meninjau dan memverifikasi organisasi.
- Meninjau kampanye sebelum dipublikasikan.
- Menangani laporan penyalahgunaan.
- Menonaktifkan kampanye yang bermasalah sesuai prosedur.
- Mengelola kategori dan konfigurasi platform.
- Melihat log aktivitas administratif.

### 4.5 Penerima Bantuan

Penerima bantuan tidak harus memiliki akun. Data penerima dikelola seminimal mungkin dan tidak ditampilkan secara publik dalam bentuk yang dapat mengidentifikasi individu.

---

## 5. Prinsip Produk

1. **Operational first:** fokus pada penyelesaian alur kerja nyata, bukan jumlah fitur.
2. **Transparency by design:** kampanye memiliki rencana, catatan transaksi, bukti pengeluaran, dan status distribusi.
3. **Privacy by design:** informasi pribadi tidak dicatat di blockchain publik.
4. **Human verification:** aktivitas dunia nyata tetap memerlukan verifikasi pihak yang berwenang.
5. **Accessible participation:** pengguna umum dapat berpartisipasi tanpa harus memahami Web3.
6. **Blockchain where useful:** blockchain hanya digunakan untuk pencatatan yang membutuhkan integritas dan verifikasi.
7. **Clear accountability:** setiap perubahan penting memiliki pelaku, waktu, dan alasan yang dapat ditelusuri.

---

## 6. Ruang Lingkup MVP

MVP difokuskan pada satu alur lengkap yang dapat didemonstrasikan dari awal hingga akhir. Fitur yang tidak diperlukan untuk membuktikan alur utama ditunda.

### 6.1 Fitur P0 — Wajib untuk MVP

#### AksiKegiatan

- Registrasi dan login.
- Role Volunteer dan Organizer.
- Profil organisasi sederhana.
- Organizer membuat, mengubah, dan menutup kegiatan.
- Pengunjung melihat katalog dan detail kegiatan.
- Relawan mendaftar dan membatalkan pendaftaran sesuai aturan.
- Sistem mengelola kuota kegiatan.
- Organizer mengatur tugas atau kelompok relawan.
- Organizer membuat QR check-in kegiatan.
- Organizer memvalidasi penyelesaian kontribusi.
- Relawan melihat riwayat partisipasi.

#### AksiPeduli

- Organizer terverifikasi membuat kampanye.
- Kampanye memiliki tujuan, target, periode, anggaran/rencana penggunaan, serta informasi penyelenggara.
- Pengguna dapat melihat kampanye dan laporan transparansinya.
- Mendukung donasi uang melalui **mode demo/testnet** untuk MVP.
- Mencatat donasi barang dan proses penerimaannya.
- Mencatat pengeluaran dan mengunggah bukti pendukung.
- Mencatat batch distribusi bantuan.
- Memverifikasi penyaluran bantuan.
- Menampilkan laporan transparansi publik.

#### Web3

- Wallet dapat dihubungkan secara opsional.
- Smart contract pada EVM-compatible testnet.
- Menerima donasi aset digital testnet melalui kontrak.
- Mencatat ringkasan bukti pengeluaran dan distribusi melalui hash.
- Mencatat kontribusi relawan yang telah diverifikasi.
- Menyediakan transaction hash dan tautan blockchain explorer.

### 6.2 Fitur P1 — Jika Waktu Memungkinkan

- Badge kontribusi digital.
- Riwayat kontribusi lintas kegiatan.
- Peringatan jadwal relawan yang bentrok.
- Notifikasi email atau in-app.
- Filter kegiatan berdasarkan kategori dan lokasi.
- Ekspor laporan kampanye.
- Halaman audit trail dengan filter tanggal dan jenis aktivitas.
- Proses persetujuan dua pihak untuk pengeluaran.

### 6.3 Fitur P2 — Pengembangan Lanjutan

- Integrasi pembayaran Rupiah melalui payment gateway yang sesuai.
- Integrasi QRIS melalui penyedia pembayaran.
- Multi-signature wallet atau mekanisme persetujuan on-chain yang lebih lengkap.
- Penerbitan Soulbound Token (SBT) atau credential non-transferable.
- Integrasi organisasi mitra dan verifikasi independen.
- Aplikasi mobile native.
- Analitik dampak lanjutan.
- DAO/community governance.
- Sistem pengadaan dan manajemen logistik yang lebih lengkap.

### 6.4 Di Luar Ruang Lingkup MVP

- Transfer dana fiat secara langsung dari smart contract ke rekening bank.
- Menyimpan data pribadi penerima bantuan di blockchain.
- Menjamin kebenaran foto atau dokumen hanya dengan menyimpan hash.
- Token ekonomi yang dapat diperjualbelikan.
- Pinjaman, investasi, atau produk keuangan lainnya.
- Sistem reputasi otomatis tanpa proses verifikasi.

---

## 7. Modul dan Kebutuhan Fungsional

Prioritas kebutuhan menggunakan:
- **P0:** wajib untuk MVP.
- **P1:** penting, tetapi dapat ditunda jika waktu terbatas.
- **P2:** pengembangan lanjutan.

### 7.1 Autentikasi dan Profil

| ID | Kebutuhan | Prioritas |
|---|---|---|
| AUTH-01 | Pengguna dapat mendaftar menggunakan email dan kata sandi. | P0 |
| AUTH-02 | Pengguna dapat login dan logout. | P0 |
| AUTH-03 | Sistem menyediakan role Volunteer, Organizer, dan Admin. | P0 |
| AUTH-04 | Pengguna dapat mengubah nama tampilan dan informasi profil non-sensitif. | P0 |
| AUTH-05 | Organizer dapat mengajukan verifikasi organisasi. | P0 |
| AUTH-06 | Admin dapat menyetujui atau menolak verifikasi organisasi. | P0 |
| AUTH-07 | Pengguna dapat menghubungkan wallet secara opsional. | P0 |

**Kriteria penerimaan:**
- Pengguna yang belum login tidak dapat mengakses halaman dashboard privat.
- Pengguna tidak dapat menaikkan role dirinya sendiri menjadi Admin atau Organizer terverifikasi.
- Alamat wallet harus diverifikasi melalui proses tanda tangan pesan atau koneksi wallet yang valid; jangan meminta private key atau seed phrase.

### 7.2 Event Management — AksiKegiatan

| ID | Kebutuhan | Prioritas |
|---|---|---|
| EVT-01 | Organizer dapat membuat kegiatan dengan judul, deskripsi, kategori, lokasi, tanggal, waktu, kuota, dan periode pendaftaran. | P0 |
| EVT-02 | Organizer dapat mengubah detail kegiatan sebelum kegiatan dimulai. | P0 |
| EVT-03 | Organizer dapat membuka dan menutup pendaftaran. | P0 |
| EVT-04 | Pengunjung dapat melihat katalog kegiatan publik. | P0 |
| EVT-05 | Pengunjung dapat melihat detail kegiatan. | P0 |
| EVT-06 | Relawan dapat mendaftar kegiatan. | P0 |
| EVT-07 | Sistem mencegah pendaftaran ganda oleh pengguna yang sama. | P0 |
| EVT-08 | Sistem mencegah jumlah pendaftar melebihi kuota. | P0 |
| EVT-09 | Relawan dapat melihat kegiatan yang diikuti. | P0 |
| EVT-10 | Organizer dapat melihat daftar pendaftar. | P0 |
| EVT-11 | Organizer dapat membatalkan kegiatan dengan alasan. | P0 |
| EVT-12 | Sistem menyediakan filter kategori, tanggal, dan status kegiatan. | P1 |

**Kriteria penerimaan:**
- Pendaftaran ditolak jika periode pendaftaran sudah ditutup.
- Pendaftaran ditolak jika kuota penuh.
- Dua permintaan pendaftaran bersamaan tidak boleh menyebabkan kuota terlampaui.
- Pembatalan kegiatan harus tercatat dan dapat dilihat oleh peserta terdaftar.

### 7.3 Scheduling dan Task Management

| ID | Kebutuhan | Prioritas |
|---|---|---|
| SCH-01 | Organizer dapat membuat kelompok atau posisi tugas. | P0 |
| SCH-02 | Organizer dapat menentukan kuota untuk setiap posisi tugas. | P0 |
| SCH-03 | Organizer dapat menempatkan relawan ke posisi tugas. | P0 |
| SCH-04 | Relawan dapat melihat tugas dan jadwal yang diberikan. | P0 |
| SCH-05 | Sistem memberi peringatan jika relawan memiliki jadwal lain yang bertabrakan. | P1 |
| SCH-06 | Organizer dapat mengubah penempatan tugas sebelum kegiatan berlangsung. | P1 |

**Kriteria penerimaan:**
- Penempatan tugas tidak boleh melebihi kuota posisi.
- Perubahan tugas harus terlihat di dashboard relawan.
- Sistem mencatat siapa yang mengubah penempatan dan kapan perubahan dilakukan.

### 7.4 QR Attendance dan Validasi Kontribusi

| ID | Kebutuhan | Prioritas |
|---|---|---|
| ATT-01 | Organizer dapat membuat sesi check-in untuk kegiatan. | P0 |
| ATT-02 | Sistem menghasilkan QR atau token check-in unik. | P0 |
| ATT-03 | Organizer dapat memindai QR relawan. | P0 |
| ATT-04 | Sistem memvalidasi registrasi, masa berlaku token, dan penggunaan token. | P0 |
| ATT-05 | Sistem mencatat waktu check-in. | P0 |
| ATT-06 | Organizer dapat memvalidasi penyelesaian kontribusi setelah kegiatan. | P0 |
| ATT-07 | Relawan dapat melihat status kontribusinya. | P0 |
| ATT-08 | Sistem dapat menerbitkan catatan kontribusi ke blockchain setelah validasi. | P0 |

Status partisipasi yang disarankan:

`REGISTERED → CHECKED_IN → VERIFIED`

Status alternatif:
- `CANCELLED`
- `NO_SHOW`
- `REJECTED`

**Kriteria penerimaan:**
- QR/token tidak dapat digunakan lebih dari sekali.
- QR/token memiliki batas waktu atau nonce yang mencegah pemakaian ulang.
- Check-in saja tidak otomatis menghasilkan kontribusi terverifikasi.
- Hanya organizer yang berwenang dapat memvalidasi kontribusi.
- Kegagalan transaksi blockchain tidak boleh menghapus catatan validasi di database; status pencatatan on-chain harus ditandai sebagai tertunda dan dapat dicoba ulang.

### 7.5 Campaign Management — AksiPeduli

| ID | Kebutuhan | Prioritas |
|---|---|---|
| CAM-01 | Organizer terverifikasi dapat membuat kampanye donasi. | P0 |
| CAM-02 | Kampanye memiliki nama, cerita kebutuhan, tujuan, kategori, periode, target, lokasi umum, dan penyelenggara. | P0 |
| CAM-03 | Organizer dapat memasukkan anggaran atau rencana penggunaan dana. | P0 |
| CAM-04 | Admin dapat meninjau kampanye sebelum dipublikasikan. | P0 |
| CAM-05 | Pengunjung dapat melihat halaman detail kampanye. | P0 |
| CAM-06 | Kampanye menampilkan jumlah donasi dan target secara jelas. | P0 |
| CAM-07 | Organizer dapat memperbarui perkembangan kampanye dengan riwayat perubahan. | P0 |
| CAM-08 | Organizer dapat menutup kampanye dengan alasan dan laporan akhir. | P0 |
| CAM-09 | Pengguna dapat melaporkan kampanye yang mencurigakan. | P1 |

Status kampanye:

`DRAFT → PENDING_REVIEW → ACTIVE → CLOSED → COMPLETED`

Status alternatif:
- `REJECTED`
- `PAUSED`
- `CANCELLED`

**Kriteria penerimaan:**
- Kampanye publik hanya dapat diterbitkan oleh organizer yang telah diverifikasi dan lolos peninjauan Admin.
- Perubahan target, anggaran, atau informasi penting tidak boleh menghapus nilai sebelumnya dari audit trail.
- Halaman kampanye harus membedakan dana terkumpul, dana yang sudah digunakan, dan sisa dana.

### 7.6 Donasi Uang

MVP menggunakan donasi aset digital di EVM-compatible testnet untuk menunjukkan fungsi smart contract. Donasi Rupiah sungguhan melalui bank atau QRIS merupakan integrasi tahap lanjutan.

| ID | Kebutuhan | Prioritas |
|---|---|---|
| DON-01 | Donatur dapat melihat tujuan dan rencana penggunaan dana sebelum berdonasi. | P0 |
| DON-02 | Donatur dapat melakukan donasi testnet melalui wallet. | P0 |
| DON-03 | Sistem menampilkan status transaksi: menunggu, berhasil, atau gagal. | P0 |
| DON-04 | Sistem menyimpan transaction hash dan jaringan yang digunakan. | P0 |
| DON-05 | Total donasi on-chain dihitung dari transaksi yang berhasil diverifikasi. | P0 |
| DON-06 | Donatur dapat melihat riwayat donasi miliknya. | P0 |
| DON-07 | Publik dapat melihat ringkasan donasi tanpa melihat data pribadi donatur. | P0 |
| DON-08 | Sistem dapat merekonsiliasi donasi fiat melalui payment provider. | P2 |

**Aturan penting:**
- Donasi testnet bukan uang sungguhan dan harus diberi label simulasi/testnet.
- Jangan menampilkan donasi fiat sebagai berhasil sebelum payment provider atau proses rekonsiliasi mengonfirmasi pembayaran.
- Jika pada tahap lanjutan menerima donasi Rupiah, dana berada di rekening atau sistem penyedia pembayaran yang sah; smart contract tidak otomatis menguasai dana fiat tersebut.
- Donatur dapat memilih donasi publik atau menggunakan nama tampilan anonim. Transaksi pada blockchain publik tetap dapat menampilkan alamat wallet.

### 7.7 Donasi Barang dan Inventaris Bantuan

| ID | Kebutuhan | Prioritas |
|---|---|---|
| GDS-01 | Donatur dapat mengajukan donasi barang. | P0 |
| GDS-02 | Data donasi barang mencakup jenis, jumlah, satuan, kondisi, dan catatan. | P0 |
| GDS-03 | Organizer dapat menerima atau menolak donasi barang. | P0 |
| GDS-04 | Barang yang diterima masuk ke inventaris kampanye. | P0 |
| GDS-05 | Organizer dapat mengalokasikan barang ke batch distribusi. | P0 |
| GDS-06 | Sistem menghitung jumlah diterima, dialokasikan, disalurkan, dan tersisa. | P0 |
| GDS-07 | Sistem dapat menyimpan tanggal kedaluwarsa untuk barang yang relevan. | P1 |

**Kriteria penerimaan:**
- Jumlah barang yang dialokasikan tidak boleh melebihi jumlah stok yang tersedia.
- Donasi yang belum diverifikasi tidak boleh dihitung sebagai barang diterima.
- Perubahan stok memiliki catatan pelaku, waktu, dan alasan.

### 7.8 Penggunaan Dana dan Bukti Pengeluaran

| ID | Kebutuhan | Prioritas |
|---|---|---|
| EXP-01 | Organizer dapat membuat pengajuan pengeluaran dana. | P0 |
| EXP-02 | Pengajuan mencakup kategori, nominal, deskripsi, penerima pembayaran, dan bukti pendukung. | P0 |
| EXP-03 | Pengeluaran memiliki status: diajukan, disetujui, ditolak, atau dibayarkan/dicatat. | P0 |
| EXP-04 | Sistem menyimpan hash bukti pengeluaran untuk verifikasi integritas. | P0 |
| EXP-05 | Dashboard memperbarui ringkasan dana digunakan dan sisa dana. | P0 |
| EXP-06 | Pengeluaran dapat membutuhkan persetujuan dua pihak. | P1 |

**Kriteria penerimaan:**
- Pengeluaran tidak boleh membuat total dana yang dilaporkan digunakan melebihi dana yang telah diterima tanpa penjelasan sumber dana tambahan.
- Bukti pengeluaran disimpan secara privat atau dengan akses terkontrol.
- Hash bukti dapat diperiksa tanpa mempublikasikan dokumen sensitif.
- Sistem membedakan antara pengajuan pengeluaran, persetujuan pengeluaran, dan bukti pembayaran aktual.

### 7.9 Distribusi Bantuan

| ID | Kebutuhan | Prioritas |
|---|---|---|
| DST-01 | Organizer dapat membuat batch distribusi. | P0 |
| DST-02 | Batch mencakup jenis bantuan, jumlah, lokasi umum, tanggal, dan penanggung jawab. | P0 |
| DST-03 | Organizer dapat mencatat barang atau dana yang dialokasikan untuk batch. | P0 |
| DST-04 | Relawan/petugas dapat mengunggah bukti distribusi. | P0 |
| DST-05 | Koordinator berwenang dapat memverifikasi distribusi. | P0 |
| DST-06 | Sistem mencatat jumlah bantuan yang disiapkan, dikirim, diterima, dan tersisa. | P0 |
| DST-07 | Sistem menyimpan hash ringkasan bukti distribusi di blockchain. | P0 |
| DST-08 | Penerima dapat memberikan konfirmasi dengan metode yang menjaga privasi. | P1 |

Status distribusi:

`PLANNED → PREPARED → DISPATCHED → DELIVERED → VERIFIED`

Status alternatif:
- `PARTIALLY_DELIVERED`
- `CANCELLED`
- `NEEDS_REVIEW`

**Kriteria penerimaan:**
- Jumlah distribusi tidak boleh melebihi jumlah bantuan yang tersedia.
- Status `VERIFIED` hanya dapat diberikan oleh petugas atau verifikator yang berwenang.
- Dokumentasi publik tidak boleh mengungkap alamat rumah, wajah, identitas, atau kondisi pribadi penerima tanpa persetujuan yang sesuai.
- Hash bukti tidak boleh diperlakukan sebagai bukti tunggal bahwa bantuan benar-benar diterima.

### 7.10 Public Transparency Dashboard

| ID | Kebutuhan | Prioritas |
|---|---|---|
| TRN-01 | Publik dapat melihat target dan total donasi kampanye. | P0 |
| TRN-02 | Publik dapat melihat ringkasan dana diterima, digunakan, dan tersisa. | P0 |
| TRN-03 | Publik dapat melihat daftar kategori pengeluaran. | P0 |
| TRN-04 | Publik dapat melihat status dan jumlah distribusi bantuan. | P0 |
| TRN-05 | Publik dapat melihat riwayat aktivitas penting. | P0 |
| TRN-06 | Publik dapat membuka transaction hash atau blockchain explorer. | P0 |
| TRN-07 | Publik dapat mengunduh laporan akhir kampanye. | P1 |
| TRN-08 | Sistem menyediakan filter berdasarkan tanggal dan jenis aktivitas. | P1 |

Dashboard harus membedakan data yang berasal dari blockchain, data operasional database, dan pernyataan yang telah diverifikasi organizer. Label sumber data harus jelas.

---

## 8. User Flow Utama

### 8.1 Flow A — Organizer Membuat Kegiatan dan Mengelola Relawan

1. Organizer login.
2. Organizer membuka dashboard kegiatan.
3. Organizer membuat kegiatan dan mengisi detail.
4. Organizer menentukan kuota serta periode pendaftaran.
5. Kegiatan dipublikasikan.
6. Relawan melihat detail kegiatan dan mendaftar.
7. Organizer melihat daftar peserta.
8. Organizer membagi peserta ke posisi tugas.
9. Saat kegiatan berlangsung, relawan melakukan check-in dengan QR.
10. Organizer memvalidasi penyelesaian kontribusi.
11. Sistem menerbitkan catatan kontribusi ke smart contract.
12. Relawan melihat riwayat kontribusi dan transaction hash.

### 8.2 Flow B — Membuat Kampanye Donasi

1. Organizer terverifikasi login.
2. Organizer membuat kampanye.
3. Organizer menjelaskan kebutuhan, target, periode, lokasi umum, dan rencana penggunaan dana.
4. Organizer mengirim kampanye untuk ditinjau.
5. Admin meninjau dan menyetujui atau menolak kampanye.
6. Kampanye yang disetujui tampil secara publik.
7. Donatur membaca detail dan laporan transparansi.
8. Donatur mengirim donasi testnet melalui wallet.
9. Smart contract menerima donasi dan menerbitkan event transaksi.
10. Backend membaca atau mengindeks event blockchain.
11. Dashboard memperbarui total donasi setelah transaksi terkonfirmasi.

### 8.3 Flow C — Donasi Barang

1. Donatur membuka kampanye dan memilih donasi barang.
2. Donatur mengisi jenis barang, jumlah, kondisi, dan informasi penyerahan.
3. Organizer menerima pengajuan.
4. Barang diserahkan kepada organizer atau titik pengumpulan.
5. Organizer memeriksa kondisi dan jumlah barang.
6. Organizer mengonfirmasi penerimaan.
7. Inventaris kampanye bertambah.
8. Sistem mencatat ringkasan penerimaan dan hash bukti jika relevan.

### 8.4 Flow D — Pengeluaran Dana dan Distribusi Bantuan

1. Organizer membuat pengajuan pengeluaran.
2. Organizer mengunggah nota/invoice atau dokumen pendukung.
3. Pihak berwenang memeriksa dan menyetujui pengeluaran.
4. Pembayaran dilakukan melalui mekanisme yang sesuai dengan sumber dana.
5. Organizer mencatat status pembayaran dan bukti aktual.
6. Sistem menghitung ulang ringkasan dana.
7. Organizer membuat batch distribusi bantuan.
8. Relawan/petugas mengonfirmasi pengiriman atau penerimaan.
9. Verifikator memeriksa dokumentasi.
10. Sistem menyimpan hash bukti dan ringkasan distribusi ke blockchain.
11. Dashboard publik memperbarui progres penyaluran.
12. Setelah kampanye selesai, organizer menerbitkan laporan akhir.

---

## 9. Aturan Bisnis

### 9.1 Organisasi dan Kampanye

- Hanya organizer terverifikasi yang dapat menerbitkan kampanye publik.
- Kampanye harus melewati peninjauan Admin sebelum aktif.
- Organizer wajib menyampaikan rencana penggunaan dana.
- Perubahan anggaran atau tujuan kampanye harus dicatat dalam audit trail.
- Admin dapat menahan atau menonaktifkan kampanye yang dilaporkan bermasalah sesuai prosedur.

### 9.2 Pendaftaran Relawan

- Satu akun hanya dapat mendaftar satu kali untuk satu kegiatan.
- Pendaftaran hanya dapat dilakukan saat status dan periode pendaftaran mengizinkan.
- Kapasitas kegiatan tidak boleh terlampaui.
- Pembatalan pendaftaran mengikuti batas waktu yang ditetapkan organizer.

### 9.3 Check-in dan Kontribusi

- Check-in tidak sama dengan validasi penyelesaian kegiatan.
- QR check-in harus unik, memiliki masa berlaku, dan tidak dapat digunakan ulang.
- Hanya organizer atau petugas yang mendapat izin yang dapat memvalidasi kontribusi.
- Catatan kontribusi yang sudah diterbitkan di blockchain tidak dihapus. Jika terjadi kesalahan, sistem membuat catatan koreksi atau pencabutan status (revocation) yang dapat ditelusuri.

### 9.4 Donasi Uang

- Donasi on-chain hanya dihitung setelah transaksi berhasil dan memenuhi jumlah konfirmasi jaringan yang ditentukan.
- Transaksi gagal atau dibatalkan tidak dihitung sebagai donasi berhasil.
- Transaksi testnet harus dilabeli dengan jelas sebagai simulasi.
- Donasi fiat di masa depan baru dianggap berhasil setelah dikonfirmasi oleh payment provider atau proses rekonsiliasi yang valid.
- Dana donasi tidak boleh dicampur dengan dana pribadi organizer.
- Pengembalian dana mengikuti aturan kampanye dan mekanisme pembayaran yang digunakan.

### 9.5 Pengeluaran dan Distribusi

- Pengeluaran harus memiliki kategori, nominal, tujuan, dan bukti pendukung.
- Pengajuan pengeluaran dan pembayaran aktual harus dibedakan.
- Pengeluaran yang memerlukan persetujuan tidak dapat dicatat sebagai disetujui oleh pengaju yang sama jika aturan kampanye mensyaratkan pemisahan peran.
- Jumlah barang yang dialokasikan dan disalurkan tidak boleh melebihi stok yang diterima, kecuali ada sumber tambahan yang dicatat.
- Status distribusi final harus diverifikasi oleh pihak yang berwenang.
- Informasi penerima bantuan ditampilkan secara agregat atau anonim.

---

## 10. Rancangan Web3 dan Smart Contract

### 10.1 Prinsip Arsitektur Web3

AksiBareng menerapkan pendekatan hybrid:

- **Database/backend:** autentikasi, profil, daftar kegiatan, pendaftaran, jadwal, tugas, inventaris operasional, dokumen privat, dan data pribadi.
- **Blockchain:** transaksi donasi aset digital, pencatatan kontribusi terverifikasi, serta hash atau ringkasan bukti tertentu.
- **Storage:** foto, nota, invoice, dan dokumen disimpan off-chain dengan kontrol akses.

Blockchain bukan pengganti database aplikasi.

### 10.2 Smart Contract yang Disarankan

Untuk MVP, desain dapat dipisah secara logis menjadi dua kontrak. Jika waktu sangat terbatas, implementasi awal dapat menggabungkan fungsi registry ke dalam satu kontrak dengan modul yang terpisah.

#### A. `DonationTransparency.sol`

Tanggung jawab:
- Mendaftarkan kampanye yang telah disetujui.
- Menerima donasi aset digital testnet.
- Menyimpan total donasi on-chain.
- Mencatat pengajuan dan persetujuan pengeluaran jika dana dikelola oleh kontrak.
- Mencatat hash bukti pengeluaran.
- Mencatat hash ringkasan distribusi.

Fungsi konseptual:

| Fungsi | Deskripsi |
|---|---|
| `createCampaign()` | Mendaftarkan kampanye dan parameter dasarnya. |
| `donate()` | Menerima aset digital testnet untuk kampanye. |
| `proposeExpense()` | Mengajukan penggunaan dana on-chain. |
| `approveExpense()` | Menyetujui pengeluaran sesuai role dan aturan. |
| `releaseFunds()` | Mencairkan dana on-chain yang telah disetujui. |
| `recordExpenseProof()` | Mencatat hash bukti pengeluaran. |
| `recordDistribution()` | Mencatat hash ringkasan distribusi bantuan. |
| `closeCampaign()` | Menutup kampanye sesuai aturan. |

Event konseptual:

- `CampaignCreated`
- `DonationReceived`
- `ExpenseProposed`
- `ExpenseApproved`
- `FundsReleased`
- `ExpenseProofRecorded`
- `DistributionRecorded`
- `CampaignClosed`

**Catatan implementasi:** fungsi `releaseFunds()` hanya dapat mengendalikan aset digital yang benar-benar berada di smart contract. Fungsi tersebut tidak dapat mengirim atau mengendalikan Rupiah di rekening bank.

#### B. `ContributionRegistry.sol`

Tanggung jawab:
- Mendaftarkan organizer yang berwenang menerbitkan kontribusi.
- Mencatat kontribusi relawan yang telah divalidasi.
- Mencegah penerbitan ganda untuk kombinasi kegiatan dan relawan yang sama.
- Menyediakan data atau event untuk verifikasi publik.
- Mencatat koreksi atau pencabutan status jika ditemukan kesalahan.

Fungsi konseptual:

| Fungsi | Deskripsi |
|---|---|
| `authorizeOrganizer()` | Memberikan izin penerbitan kepada organizer. |
| `revokeOrganizer()` | Mencabut izin organizer. |
| `issueContribution()` | Menerbitkan catatan kontribusi setelah validasi. |
| `verifyContribution()` | Memeriksa keberadaan catatan kontribusi. |
| `revokeContribution()` | Mencatat pencabutan atau koreksi status. |

Event konseptual:

- `OrganizerAuthorized`
- `OrganizerRevoked`
- `ContributionIssued`
- `ContributionRevoked`

### 10.3 Hak Akses Smart Contract

- Admin platform atau multisig yang ditetapkan dapat mengelola role awal.
- Organizer yang terverifikasi dapat membuat atau memperbarui catatan sesuai kewenangannya.
- Donatur dapat memanggil fungsi donasi.
- Relawan tidak dapat menerbitkan kontribusi untuk dirinya sendiri.
- Tidak ada fungsi publik untuk mengubah nominal donasi atau menghapus histori transaksi.

### 10.4 Data yang Boleh dan Tidak Boleh Disimpan On-chain

**Dapat disimpan on-chain:**
- ID kampanye acak/non-identifying.
- Alamat wallet untuk transaksi yang memang dilakukan melalui wallet.
- Nominal aset digital dan timestamp transaksi.
- ID kegiatan yang tidak memuat data pribadi.
- Hash dokumen atau bukti.
- Status atau ringkasan kontribusi.

**Tidak boleh disimpan on-chain:**
- Nama lengkap penerima bantuan.
- Nomor telepon atau email.
- Alamat rumah atau koordinat lokasi penerima.
- Nomor identitas.
- Data kesehatan, kondisi ekonomi rinci, atau informasi sensitif lainnya.
- Foto wajah penerima bantuan tanpa dasar dan persetujuan yang sesuai.
- Dokumen asli yang memuat data pribadi.

### 10.5 Batasan Transparansi Blockchain

- Blockchain dapat menunjukkan bahwa transaksi atau hash tertentu tercatat dan tidak mudah diubah.
- Blockchain tidak dapat memastikan bahwa barang benar-benar sampai kepada penerima.
- Hash dokumen hanya membantu membuktikan integritas file, bukan kebenaran isi file.
- Bukti dunia nyata tetap membutuhkan verifikasi organizer, petugas, penerima, atau pihak independen.
- Alamat wallet publik dapat dianalisis dan tidak boleh dianggap sebagai identitas anonim yang sempurna.

### 10.6 Fiat dan Crypto

**MVP Hackathon:**
- Donasi on-chain menggunakan aset digital testnet.
- Donasi Rupiah dapat ditampilkan sebagai rencana pengembangan atau simulasi yang diberi label jelas.
- Tidak boleh mengklaim bahwa transaksi QRIS/bank telah terjadi jika belum ada payment provider sungguhan.

**Produksi:**
- Donasi Rupiah diproses oleh payment provider atau rekening organisasi yang sesuai.
- Backend melakukan rekonsiliasi pembayaran.
- Ringkasan transaksi fiat dan hash bukti dapat dicatat di blockchain sebagai audit anchor.
- Smart contract tidak menguasai dana fiat yang berada di rekening bank.
- Kegiatan penggalangan dana publik perlu ditinjau terhadap persyaratan hukum, perizinan, perpajakan, dan kebijakan payment provider yang berlaku.

---

## 11. Model Data Konseptual

Berikut entitas utama yang disarankan. Detail kolom dan tipe data ditentukan saat desain database.

| Entitas | Fungsi | Relasi penting |
|---|---|---|
| `users` | Akun pengguna | Memiliki profil dan role |
| `organizations` | Profil organisasi/komunitas | Dimiliki/dikelola organizer |
| `organization_verifications` | Status dan bukti verifikasi organisasi | Terhubung ke organizations dan admin |
| `events` | Data kegiatan sosial | Dimiliki organization |
| `event_registrations` | Pendaftaran relawan | Terhubung ke event dan user |
| `event_tasks` | Posisi atau tugas kegiatan | Terhubung ke event |
| `task_assignments` | Penempatan relawan pada tugas | Terhubung ke task dan registration |
| `attendance_sessions` | Sesi check-in | Terhubung ke event |
| `attendance_records` | Catatan check-in | Terhubung ke user dan event |
| `contributions` | Validasi kontribusi relawan | Terhubung ke event, user, dan tx hash |
| `campaigns` | Kampanye donasi | Dimiliki organization |
| `campaign_budgets` | Rencana penggunaan dana | Terhubung ke campaign |
| `donations` | Catatan donasi uang | Terhubung ke campaign dan donor opsional |
| `goods_donations` | Pengajuan donasi barang | Terhubung ke campaign dan donor opsional |
| `inventory_items` | Inventaris bantuan | Terhubung ke campaign |
| `expenses` | Pengajuan/pencatatan pengeluaran | Terhubung ke campaign |
| `expense_evidence` | File bukti dan hash | Terhubung ke expense |
| `distribution_batches` | Batch penyaluran bantuan | Terhubung ke campaign |
| `distribution_items` | Barang/jumlah dalam batch | Terhubung ke batch dan inventory |
| `distribution_evidence` | Bukti distribusi dan hash | Terhubung ke batch |
| `audit_logs` | Riwayat tindakan penting | Menyimpan actor, action, entity, timestamp |
| `wallet_links` | Hubungan akun dan alamat wallet | Terhubung ke user |
| `blockchain_transactions` | Status transaksi on-chain | Menyimpan chain, tx hash, contract, status |

### 11.1 Aturan Data

- Gunakan ID internal yang tidak mengandung informasi pribadi.
- Simpan nominal fiat dengan tipe decimal yang tepat dan mata uang eksplisit.
- Simpan nominal token sesuai precision aset, jangan menggunakan floating point untuk perhitungan nilai transaksi.
- Simpan waktu dalam format standar dan tampilkan berdasarkan zona waktu pengguna/kegiatan.
- Simpan file di object storage atau penyimpanan privat, bukan langsung di database sebagai blob jika tidak diperlukan.
- Setiap perubahan dana, inventaris, distribusi, dan status kampanye harus menghasilkan audit log.

---

## 12. Rancangan Halaman / Navigasi

### 12.1 Halaman Publik

- Landing Page
- Explore Events
- Event Detail
- Explore Campaigns
- Campaign Detail
- Transparency Report
- Verify Blockchain Record
- About / How It Works

### 12.2 Dashboard Volunteer / Donor

- Overview
- My Events
- My Contributions
- My Donations
- My Goods Donations
- Wallet Settings
- Profile Settings

### 12.3 Dashboard Organizer

- Overview
- My Events
- Create Event
- Volunteer Registrations
- Task & Scheduling
- Attendance & QR Scanner
- Contribution Verification
- My Campaigns
- Create Campaign
- Donations
- Goods & Inventory
- Expenses
- Aid Distribution
- Transparency Reports
- Organization Settings

### 12.4 Dashboard Admin

- Overview
- Organization Verification
- Campaign Review
- Reports / Complaints
- User Management
- Audit Logs
- Platform Settings

---

## 13. Arsitektur Teknis yang Disarankan

Arsitektur bersifat konseptual dan dapat disesuaikan dengan kemampuan tim.

### 13.1 Komponen

| Lapisan | Rekomendasi | Tanggung jawab |
|---|---|---|
| Frontend | Next.js/React + Tailwind CSS | Antarmuka publik, dashboard, formulir, QR scanner |
| Backend | Laravel atau Node.js | API, autentikasi, role, workflow, validasi bisnis |
| Database | PostgreSQL atau MySQL | Data operasional dan relasi aplikasi |
| Smart Contract | Solidity | Donasi testnet, contribution registry, audit anchor |
| Contract Tooling | Hardhat | Compile, test, deploy kontrak |
| Wallet | MetaMask / WalletConnect | Koneksi wallet dan tanda tangan transaksi |
| Web3 Library | ethers.js atau wagmi/viem | Interaksi frontend dengan kontrak |
| File Storage | Object storage / IPFS sesuai kebutuhan | Foto dan dokumen off-chain |
| Blockchain Explorer | Explorer jaringan testnet | Pemeriksaan transaction hash |

### 13.2 Integrasi Blockchain

1. Frontend meminta wallet untuk terhubung.
2. Pengguna menyetujui koneksi wallet.
3. Backend atau frontend memeriksa relasi wallet sesuai kebutuhan.
4. Pengguna melakukan transaksi atau organizer memanggil fungsi kontrak.
5. Smart contract menerbitkan event.
6. Backend/indexer membaca event dan memperbarui status transaksi.
7. Dashboard menampilkan status setelah transaksi memenuhi konfirmasi jaringan.

Untuk aksi yang diprakarsai pengguna, wallet pengguna menandatangani transaksi. Jangan pernah meminta atau menyimpan private key maupun seed phrase.

### 13.3 Kegagalan Blockchain

- Status transaksi: `PENDING`, `CONFIRMED`, `FAILED`, `RETRY_REQUIRED`.
- Catatan operasional database tetap tersimpan jika transaksi blockchain gagal.
- Sistem tidak boleh menampilkan status on-chain `CONFIRMED` sebelum transaksi benar-benar terkonfirmasi.
- Pengiriman transaksi ulang harus memiliki idempotency key atau aturan pencegah duplikasi.
- Admin dapat melihat transaksi yang gagal dan melakukan tindakan sesuai prosedur.

---

## 14. Kebutuhan Non-Fungsional

### 14.1 Keamanan

- Password disimpan menggunakan hashing yang aman.
- Otorisasi diperiksa di backend, bukan hanya dengan menyembunyikan tombol frontend.
- Terapkan validasi input dan proteksi terhadap serangan umum seperti SQL injection, XSS, CSRF, dan akses langsung tanpa izin.
- Terapkan rate limiting pada login, pendaftaran, pelaporan, dan endpoint sensitif.
- QR check-in harus memiliki token yang sulit ditebak, masa berlaku, dan proteksi replay.
- Unggahan file harus membatasi ukuran, tipe, dan pemindaian file berbahaya bila tersedia.
- Secret dan private key milik server tidak boleh disimpan di source code atau repository.
- Smart contract harus diuji untuk kontrol akses, reentrancy, overflow/underflow yang relevan, validasi input, dan duplikasi penerbitan.
- Untuk deployment produksi, lakukan review keamanan smart contract oleh pihak kompeten.

### 14.2 Privasi

- Kumpulkan data pribadi seminimal mungkin.
- Jangan publikasikan identitas atau alamat penerima bantuan.
- Sediakan pilihan nama tampilan anonim untuk tampilan publik, dengan penjelasan bahwa transaksi wallet di blockchain publik tetap dapat dilacak.
- Foto atau dokumentasi penerima bantuan memerlukan persetujuan yang sesuai.
- Terapkan kontrol akses untuk nota, invoice, dan dokumen internal.
- Tetapkan masa simpan dan prosedur penghapusan data off-chain.
- Jangan menaruh data pribadi di metadata NFT atau storage publik.

### 14.3 Kinerja dan Ketersediaan

- Halaman katalog dan detail kampanye harus dapat dimuat dengan waktu respons yang wajar pada koneksi umum.
- Pendaftaran dan pengelolaan kuota harus aman terhadap permintaan bersamaan.
- Operasi blockchain tidak boleh memblokir seluruh dashboard.
- Tampilkan status loading, pending, berhasil, dan gagal secara jelas.
- Siapkan retry atau penanganan transaksi yang tertunda.

### 14.4 Aksesibilitas dan Kemudahan Penggunaan

- Antarmuka responsif untuk desktop dan ponsel.
- Bahasa antarmuka utama adalah Bahasa Indonesia.
- Formulir menjelaskan data yang diminta dan alasan pengumpulannya.
- Status kegiatan, kampanye, donasi, dan distribusi menggunakan label yang mudah dipahami.
- Fitur Web3 tidak boleh menjadi syarat untuk melihat informasi publik atau menjadi relawan.

---

## 15. Metrik Keberhasilan

Metrik berikut digunakan untuk menguji dampak MVP. Target angka harus ditetapkan setelah pengukuran baseline; jangan mengklaim peningkatan tanpa pengujian.

### 15.1 Metrik Operasional

| Metrik | Definisi |
|---|---|
| Waktu pembuatan kegiatan | Waktu dari mulai mengisi form hingga kegiatan dipublikasikan |
| Waktu rekap relawan | Waktu yang dibutuhkan untuk memperoleh daftar dan status peserta |
| Waktu pembagian tugas | Waktu untuk menetapkan relawan ke tugas |
| Waktu rekap presensi | Waktu untuk menghasilkan rekap kehadiran |
| Kesalahan pendataan | Jumlah data ganda, hilang, atau tidak sesuai |
| Tingkat kehadiran | Jumlah relawan check-in dibandingkan relawan terdaftar |

### 15.2 Metrik Transparansi

| Metrik | Definisi |
|---|---|
| Kampanye dengan rencana anggaran | Persentase kampanye yang menampilkan anggaran |
| Pengeluaran dengan bukti | Persentase pengeluaran yang memiliki bukti pendukung |
| Distribusi terverifikasi | Persentase batch distribusi dengan verifikasi dan bukti |
| Donasi on-chain terkonfirmasi | Jumlah dan nilai donasi testnet yang berhasil terkonfirmasi |
| Kelengkapan laporan akhir | Persentase kampanye selesai dengan laporan lengkap |

### 15.3 Metode Uji Sebelum dan Sesudah

1. Pilih satu skenario kegiatan dengan jumlah relawan tertentu, misalnya 20 orang.
2. Jalankan proses pengelolaan menggunakan metode manual.
3. Catat waktu pendaftaran, pembagian tugas, dan rekap presensi.
4. Jalankan skenario yang sama menggunakan AksiBareng.
5. Bandingkan waktu, jumlah kesalahan, dan kelengkapan data.
6. Dokumentasikan hasil pengujian sebagai bagian presentasi.

Gunakan data simulasi dengan label yang jelas jika tidak tersedia komunitas mitra untuk pengujian langsung.

---

## 16. Skenario Demo Hackathon

Demo disarankan berlangsung sekitar 5–7 menit dan memperlihatkan alur end-to-end.

### Skenario 1 — Kegiatan dan Relawan

1. Organizer login.
2. Organizer membuat kegiatan `Beach Cleanup Day`.
3. Relawan membuka katalog dan mendaftar.
4. Organizer menempatkan relawan pada tugas kebersihan, logistik, atau dokumentasi.
5. Relawan melakukan check-in dengan QR.
6. Organizer memvalidasi kontribusi.
7. Tampilkan catatan kontribusi dan transaction hash di testnet.

### Skenario 2 — Donasi dan Transparansi

1. Organizer terverifikasi membuat kampanye `100 Meals for Cilacap`.
2. Admin menyetujui kampanye.
3. Donatur membuka halaman kampanye.
4. Donatur melakukan donasi menggunakan aset testnet.
5. Tampilkan transaksi dan total donasi yang terkonfirmasi.
6. Organizer mencatat bukti penggunaan dana.
7. Organizer mencatat batch distribusi makanan.
8. Verifikator mengonfirmasi distribusi.
9. Tampilkan transparency dashboard beserta hash bukti dan transaksi yang dapat diperiksa.

### Data Demo

Gunakan data fiktif, wallet testnet, dan label simulasi. Jangan menampilkan data pribadi nyata atau mengklaim bantuan telah disalurkan jika hanya merupakan simulasi.

---

## 17. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Scope terlalu luas | Fitur utama tidak selesai | Prioritaskan satu alur end-to-end dan tunda fitur P1/P2 |
| Organizer palsu | Penyalahgunaan kampanye | Verifikasi organisasi dan review kampanye |
| Bukti palsu | Laporan tidak dapat dipercaya | Verifikasi manusia, audit trail, pemeriksaan sampel, dan kanal pengaduan |
| Data penerima bocor | Risiko keselamatan dan privasi | Minimalkan data, batasi akses, anonimisasi, jangan simpan data pribadi on-chain |
| Transaksi blockchain gagal | Dashboard tidak sinkron | Status pending/failure, retry idempotent, dan pemantauan transaksi |
| Biaya gas tinggi | Pengalaman pengguna buruk | Gunakan testnet untuk MVP dan batasi transaksi on-chain ke peristiwa penting |
| Pengguna tidak memiliki wallet | Hambatan partisipasi | Wallet opsional; layanan publik dan pendaftaran kegiatan tetap tersedia tanpa wallet |
| Donasi fiat tidak terintegrasi | Angka donasi tidak dapat diverifikasi otomatis | Jangan mengklaim pembayaran berhasil; gunakan testnet/simulasi untuk demo dan integrasi provider pada tahap lanjut |
| Smart contract memiliki bug | Dana testnet/produksi berisiko | Unit test, role restriction, review, dan hindari dana sungguhan untuk MVP |
| Klaim dampak tidak terukur | Presentasi kurang meyakinkan | Uji baseline dan proses baru dengan skenario yang sama |

---

## 18. Roadmap Implementasi MVP

Roadmap berikut merupakan urutan kerja, bukan estimasi durasi tetap. Tim dapat mengatur ulang berdasarkan jumlah anggota dan waktu hackathon.

### Fase 1 — Fondasi

- Finalisasi user flow dan desain UI.
- Setup repository dan environment.
- Setup database dan autentikasi.
- Implementasi role pengguna.
- Implementasi profil organisasi dan verifikasi dasar.

### Fase 2 — AksiKegiatan

- Event CRUD.
- Katalog dan detail kegiatan.
- Pendaftaran dan kuota.
- Task assignment.
- QR check-in.
- Validasi kontribusi.

### Fase 3 — AksiPeduli

- Campaign CRUD dan review Admin.
- Halaman transparansi kampanye.
- Donasi barang dan inventaris.
- Pencatatan pengeluaran dan bukti.
- Batch distribusi bantuan dan verifikasi.

### Fase 4 — Web3

- Setup wallet connection.
- Implementasi dan pengujian smart contract.
- Deploy ke EVM testnet.
- Integrasi donasi testnet.
- Integrasi contribution registry.
- Pencatatan hash bukti pengeluaran dan distribusi.
- Tampilkan transaction hash dan status konfirmasi.

### Fase 5 — Validasi dan Demo

- Pengujian end-to-end.
- Pengujian role dan akses.
- Pengujian kuota dan duplikasi pendaftaran.
- Pengujian QR replay.
- Pengujian transaksi blockchain berhasil/gagal.
- Uji skenario transparansi kampanye.
- Siapkan data demo dan presentasi.

---

## 19. Kriteria Selesai (Definition of Done)

MVP dianggap siap didemonstrasikan jika:

### AksiKegiatan

- [ ] Pengguna dapat mendaftar dan login.
- [ ] Organizer dapat membuat dan memublikasikan kegiatan.
- [ ] Relawan dapat melihat dan mendaftar kegiatan.
- [ ] Sistem menegakkan kuota dan mencegah pendaftaran ganda.
- [ ] Organizer dapat membagi tugas relawan.
- [ ] QR check-in dapat dipakai dan tidak dapat digunakan ulang.
- [ ] Organizer dapat memvalidasi kontribusi.
- [ ] Catatan kontribusi dapat diterbitkan dan diperiksa di testnet.

### AksiPeduli

- [ ] Organizer terverifikasi dapat membuat kampanye.
- [ ] Admin dapat meninjau kampanye.
- [ ] Publik dapat melihat informasi kampanye dan rencana penggunaan dana.
- [ ] Donasi testnet dapat dilakukan dan terkonfirmasi.
- [ ] Donasi barang dapat dicatat dan diverifikasi.
- [ ] Pengeluaran dapat dicatat dengan bukti pendukung.
- [ ] Batch distribusi dapat dibuat dan diperbarui.
- [ ] Distribusi dapat diverifikasi oleh pihak berwenang.
- [ ] Hash bukti dan ringkasan transaksi ditampilkan.
- [ ] Dashboard memisahkan dana diterima, digunakan, dan tersisa.

### Keamanan dan Kualitas

- [ ] Data pribadi tidak ditulis ke blockchain.
- [ ] Role dan permission diperiksa di backend.
- [ ] Smart contract memiliki unit test dasar.
- [ ] Status transaksi pending, confirmed, dan failed ditangani.
- [ ] Aplikasi responsif untuk desktop dan ponsel.
- [ ] Semua data simulasi diberi label simulasi/testnet.
- [ ] Skenario demo dapat dijalankan dari awal hingga akhir.

---

## 20. Pertanyaan Terbuka untuk Keputusan Tim

Keputusan berikut sebaiknya ditetapkan sebelum implementasi final:

1. **Jaringan blockchain:** EVM testnet mana yang akan digunakan berdasarkan ketersediaan faucet, explorer, dan kompatibilitas tooling?
2. **Aset testnet:** Apakah demo donasi menggunakan native testnet coin atau token ERC-20 testnet?
3. **Pengelola kampanye:** Apakah organizer individu diperbolehkan, atau wajib mewakili organisasi terverifikasi?
4. **Validasi distribusi:** Siapa yang berhak mengonfirmasi bantuan telah diterima — organizer, koordinator lapangan, relawan, atau penerima melalui kode konfirmasi?
5. **Pengeluaran dana:** Apakah MVP hanya mencatat pengeluaran dan bukti, atau benar-benar mengunci serta mencairkan aset testnet melalui smart contract?
6. **Fiat donation:** Apakah integrasi pembayaran Rupiah hanya menjadi roadmap atau tersedia payment provider untuk demo?
7. **Identitas publik:** Apakah nama organizer, identitas donatur, dan alamat wallet ditampilkan penuh, sebagian, atau disamarkan?
8. **Verifikasi organisasi:** Dokumen atau prosedur apa yang dapat digunakan dalam konteks hackathon untuk membedakan organisasi demo dan organisasi sungguhan?

Rekomendasi awal: gunakan satu EVM testnet yang mudah diakses, donasi native/test token untuk demo, organizer yang diverifikasi Admin platform, pencatatan bukti distribusi secara off-chain dengan hash on-chain, dan jangan mengintegrasikan pembayaran Rupiah sungguhan sebelum alur inti selesai.

---

## 21. Ringkasan Akhir

AksiBareng adalah platform yang memperkuat komunitas melalui pengelolaan kegiatan sosial dan transparansi kontribusi. AksiKegiatan menyelesaikan masalah koordinasi relawan, sedangkan AksiPeduli menyelesaikan masalah pengelolaan donasi dan distribusi bantuan.

Web3 tidak digunakan untuk menggantikan seluruh sistem operasional. Blockchain difokuskan pada catatan yang perlu dapat diverifikasi, seperti donasi aset digital, bukti kontribusi relawan, dan hash dokumen penting. Proses sehari-hari tetap menggunakan backend dan database agar sistem mudah digunakan, cepat, serta menjaga privasi.

**Alur utama produk:**

`Create Event → Join Event → Assign Task → QR Check-in → Verify Contribution → On-chain Record`

**Alur donasi dan bantuan:**

`Create Campaign → Review → Receive Donation → Record Expense → Prepare Aid → Distribute Aid → Verify Distribution → Publish Transparency Report`

Dengan ruang lingkup tersebut, AksiBareng dapat menunjukkan tiga hal yang diminta Case 2:

1. **Working service flow:** alur kegiatan, relawan, donasi, dan distribusi berjalan dari awal hingga akhir.
2. **Appropriate user data handling:** data pribadi disimpan off-chain dengan kontrol akses dan pembatasan publikasi.
3. **Achievable improvement:** pengurangan waktu administrasi, kesalahan pendataan, dan peningkatan kelengkapan pelaporan dapat diuji serta diukur.

---

**Dokumen ini merupakan PRD draft untuk kebutuhan perencanaan dan seleksi hackathon.** Detail teknis, kepatuhan penggalangan dana, dan kebutuhan keamanan perlu divalidasi sebelum digunakan untuk layanan publik atau pengelolaan dana sungguhan.
