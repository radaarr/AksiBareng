# Metrik & Uji Sebelum/Sesudah — AksiBareng

Dasar untuk klaim "achievable improvement" (Case 2, PRD §15). Aturan utama: **jangan mengklaim angka sebelum diukur**, dan sebut ukuran sampel serta batasannya.

## 1. Desain uji

| Aspek | Nilai |
|---|---|
| Skenario | 1 kegiatan, 20 relawan, 3 posisi tugas (Kebersihan, Logistik, Dokumentasi) |
| Perbandingan | Metode manual (spreadsheet + grup chat + rekap foto) vs AksiBareng |
| Peserta | 20 relawan uji (boleh rekan tim; sebutkan bahwa ini simulasi terkontrol) |
| Pengulangan | Minimal 3 kali per metode, ambil median |
| Pengukur | 2 orang: 1 fasilitator, 1 pencatat waktu (stopwatch) |
| Data | Fiktif, diberi label simulasi |

## 2. Definisi operasional metrik

| Kode | Metrik | Mulai | Berhenti | Satuan |
|---|---|---|---|---|
| M-01 | Waktu pembuatan kegiatan | Fasilitator membuka alat | Kegiatan dinyatakan siap dibagikan | detik |
| M-02 | Waktu rekap pendaftar | Pendaftaran relawan pertama dibuka | Daftar 20 relawan lengkap & terverifikasi | detik |
| M-03 | Waktu pembagian tugas | Daftar relawan siap | Semua relawan punya posisi | detik |
| M-04 | Waktu rekap presensi | Check-in pertama | Rekap 20 status kehadiran siap | detik |
| M-05 | Kesalahan pendataan | — | Jumlah baris ganda/hilang/tidak sesuai setelah rekap | jumlah |
| M-06 | Kelengkapan data | — | Persentase relawan dengan nama, kontak, posisi, kehadiran lengkap | % |
| M-07 | Tingkat kehadiran | — | `check-in / terdaftar` | % |
| M-08 | Kelengkapan bukti pengeluaran | — | Pengeluaran dengan bukti valid / total pengeluaran | % |
| M-09 | Distribusi terverifikasi | — | Batch `VERIFIED` / total batch | % |
| M-10 | Persentase kampanye dengan anggaran | — | Kampanye dengan `campaign_budgets` / total kampanye aktif | % |

M-01…M-07 diukur langsung; M-08…M-10 dihitung dari database demo setelah alur dijalankan.

## 3. Langkah pelaksanaan

1. Siapkan 20 akun relawan uji + 1 organizer + 1 admin.
2. **Baseline manual:** jalankan skenario memakai spreadsheet + grup chat. Catat M-01…M-07. Simpan artefak pendataan manual.
3. Reset data aplikasi (`prisma migrate reset && db seed`).
4. **Aplikasi:** jalankan skenario yang sama lewat AksiBareng (Flow A: buat → publish → daftar → tugas → QR → validasi).
5. Catat M-01…M-07 dengan definisi yang sama. Hitung M-08…M-10 dari dashboard.
6. Ulangi langkah 2 dan 4 dua kali lagi; ambil median, catat rentang min–maks.
7. Simpan bukti: tangkapan waktu, ekspor rekap, screenshot dashboard.

## 4. Lembar pencatatan (isi setelah uji)

### 4.1 Data mentah

| Run | Metode | M-01 (s) | M-02 (s) | M-03 (s) | M-04 (s) | M-05 (baris) | M-06 (%) | M-07 (%) |
|---|---|---|---|---|---|---|---|---|
| 1 | Manual | | | | | | | |
| 1 | AksiBareng | | | | | | | |
| 2 | Manual | | | | | | | |
| 2 | AksiBareng | | | | | | | |
| 3 | Manual | | | | | | | |
| 3 | AksiBareng | | | | | | | |
| **Median** | Manual | | | | | | | |
| **Median** | AksiBareng | | | | | | | |

### 4.2 Transparansi (dari data demo)

| Metrik | Nilai | Cara verifikasi |
|---|---|---|
| M-08 Kelengkapan bukti pengeluaran | __ % | `expenses` dengan `expense_evidence` / total `APPROVED`+`PAID` |
| M-09 Distribusi terverifikasi | __ % | batch `VERIFIED` / total batch |
| M-10 Kampanye dengan anggaran | __ % | kampanye `ACTIVE` dengan `campaign_budgets` |

## 5. Rumus ringkas

```text
pengurangan = (median_manual - median_aplikasi) / median_manual × 100%
```
Sajikan dalam tabel: metrik, manual, aplikasi, selisih absolut, persentase, catatan.

Contoh format hasil (angka **wajib** diisi dari uji nyata, bukan contoh):

| Metrik | Manual | AksiBareng | Selisih | Perubahan |
|---|---|---|---|---|
| M-01 Pembuatan kegiatan | ___ s | ___ s | ___ s | ___ % |
| M-02 Rekap pendaftar | ___ s | ___ s | ___ s | ___ % |
| M-03 Pembagian tugas | ___ s | ___ s | ___ s | ___ % |
| M-04 Rekap presensi | ___ s | ___ s | ___ s | ___ % |
| M-05 Kesalahan pendataan | ___ | ___ | ___ | ___ % |
| M-06 Kelengkapan data | ___ % | ___ % | ___ pp | — |

## 6. Aturan pelaporan

1. **Ukuran sampel wajib disebut.** "20 relawan, 3 pengulangan, median" — bukan "lebih cepat".
2. **Persentase butuh angka dasar.** Tanpa baseline terukur, tulis "belum diukur", bukan estimasi.
3. **Jangan membandingkan hal berbeda.** Waktu pembuatan kegiatan manual vs aplikasi harus memakai definisi dan cakupan yang sama.
4. **Data simulasi dilabeli.** "Pengujian terkontrol dengan data simulasi, bukan komunitas mitra."
5. **Sebutkan batasan:** jumlah peserta kecil, satu lingkungan jaringan, peserta uji sudah mengenal aplikasi (bias belajar), waktu chain tidak dihitung dalam M-02/M-04.
6. **Jangan menghapus hasil buruk.** Jika aplikasi lebih lambat pada metrik tertentu (mis. M-01 karena verifikasi organisasi), tulis apa adanya dan jelaskan sebabnya.
7. **Angka chain terpisah.** Waktu konfirmasi Sepolia tidak dicampur ke metrik operasional.

## 7. Status pengukuran saat ini

| Item | Status |
|---|---|
| Baseline manual | **Belum dijalankan** |
| Uji aplikasi | **Belum dijalankan** |
| Angka final | **Belum ada** — tabel §4 dan §5 harus diisi sebelum presentasi |
| Pemilik pengukuran | (isi nama) |
| Tenggat | (isi tanggal, sebelum latihan demo terakhir) |

Selama tabel ini belum terisi, materi demo tidak boleh memuat persentase peningkatan.

## 8. Metrik yang sengaja tidak diklaim

- Jumlah pengguna nyata, retensi, atau dampak sosial.
- Nilai donasi (semua testnet, tanpa nilai ekonomi).
- Pengurangan biaya operasional dalam Rupiah.
- Kecepatan atau keamanan relatif terhadap platform lain (tidak ada studi banding).
