# UI / UX — AksiBareng

Panduan antarmuka: peta route, isi setiap halaman, label status berbahasa Indonesia, state wajib, dan aturan aksesibilitas. Requirement: `docs/PRD.md` §12, §14.4.

## 1. Prinsip

1. **Alur kerja dulu, bukan fitur.** Setiap layar punya satu aksi utama yang jelas.
2. **Web3 tidak terlihat di tempat yang tidak perlu.** Jargon chain hanya muncul di halaman yang berhubungan dengan transaksi, dengan bahasa manusia: "Catat bukti ke blockchain" bukan "call contract method".
3. **Jujur soal status.** Tidak ada data yang tampak "selesai" padahal masih tertunda.
4. **Satu sumber kebenaran visual per status.** Warna + ikon + teks, tidak pernah warna saja.
5. **Seluler serius.** Banyak relawan memakai ponsel di lokasi kegiatan; scanner dan check-in harus nyaman di layar 360 px.
6. **Privasi terlihat.** Penerima bantuan ditampilkan sebagai agregat; UI tidak menawarkan unggah foto wajah tanpa peringatan.

## 2. Peta route

| Route | Akses | Halaman |
|---|---|---|
| `/` | publik | Landing: nilai, alur 3 langkah, statistik agregat demo, label simulasi |
| `/events` | publik | Katalog kegiatan + filter kategori/tanggal (P1) |
| `/events/[slug]` | publik | Detail kegiatan, kuota tersisa, tombol daftar/riwayat |
| `/campaigns` | publik | Katalog kampanye aktif |
| `/campaigns/[slug]` | publik | Detail kampanye + ringkasan dana + tab transparansi |
| `/campaigns/[slug]/transparency` | publik | Laporan dana, pengeluaran per kategori, distribusi, aktivitas on-chain |
| `/verify` | publik | Verifikasi catatan kontribusi / hash bukti |
| `/how-it-works` | publik | Penjelasan alur + batasan blockchain + privasi |
| `/login`, `/register` | publik | Form auth |
| `/dashboard` | login | Redirect ke dashboard sesuai role |
| `/dashboard/me` | volunteer | Ringkasan: kegiatan mendatang, kontribusi, donasi, saldo testnet |
| `/dashboard/me/events` | volunteer | Kegiatan yang diikuti + status |
| `/dashboard/me/contributions` | volunteer | Riwayat kontribusi + status chain + link explorer |
| `/dashboard/me/donations` | volunteer | Riwayat donasi uang (label simulasi) |
| `/dashboard/me/goods` | volunteer | Donasi barang yang diajukan |
| `/dashboard/me/wallet` | volunteer | Hubungkan/lepas wallet, penjelasan risiko |
| `/dashboard/me/settings` | login | Profil, nama tampilan, anonim, hapus akun |
| `/dashboard/organizer` | organizer | Ringkasan: kegiatan aktif, pendaftar, kampanye, tugas menunggu |
| `/dashboard/organizer/events` | organizer | Daftar kegiatan + status |
| `/dashboard/organizer/events/new` | organizer | Form buat kegiatan |
| `/dashboard/organizer/events/[id]` | organizer | Detail + kuota + pendaftar |
| `/dashboard/organizer/events/[id]/tasks` | organizer | Posisi tugas + penempatan relawan |
| `/dashboard/organizer/events/[id]/attendance` | organizer | Sesi check-in + QR (tampil) + scanner |
| `/dashboard/organizer/events/[id]/verify` | organizer | Validasi kontribusi |
| `/dashboard/organizer/campaigns` | organizer | Daftar kampanye + status review |
| `/dashboard/organizer/campaigns/new` | organizer | Form kampanye + anggaran berversi |
| `/dashboard/organizer/campaigns/[id]` | organizer | Detail, donasi, inventaris, pengeluaran, distribusi (tab) |
| `/dashboard/organizer/campaigns/[id]/inventory` | organizer | Stok: diterima / dialokasikan / disalurkan / sisa |
| `/dashboard/organizer/campaigns/[id]/expenses` | organizer | Pengajuan pengeluaran + bukti + persetujuan |
| `/dashboard/organizer/campaigns/[id]/distributions` | organizer | Batch, item, bukti, transisi status |
| `/dashboard/organizer/organization` | organizer | Profil organisasi + status verifikasi |
| `/dashboard/admin` | admin | Ringkasan antrean review, transaksi gagal, laporan |
| `/dashboard/admin/organizations` | admin | Antrean verifikasi organisasi |
| `/dashboard/admin/campaigns` | admin | Antrean review kampanye + pause |
| `/dashboard/admin/reports` | admin | Laporan penyalahgunaan (P1) |
| `/dashboard/admin/transactions` | admin | Transaksi chain + retry |
| `/dashboard/admin/audit` | admin | Audit log + filter (P1) |
| `/dashboard/admin/settings` | admin | Kategori, parameter platform |

## 3. Label status (teks yang dilihat pengguna)

| Nilai internal | Label UI | Warna semantik |
|---|---|---|
| `DRAFT` | Draf | netral |
| `PENDING_REVIEW` | Menunggu tinjauan | peringatan |
| `PUBLISHED` / `ACTIVE` | Aktif | positif |
| `PAUSED` | Dijeda | peringatan |
| `ONGOING` | Sedang berlangsung | positif |
| `CLOSED` | Ditutup | netral |
| `COMPLETED` | Selesai | netral-positif |
| `CANCELLED` | Dibatalkan | negatif |
| `REJECTED` | Ditolak | negatif |
| `REGISTERED` | Terdaftar | netral |
| `CHECKED_IN` | Sudah check-in | positif |
| `VERIFIED` | Terverifikasi | positif |
| `NO_SHOW` | Tidak hadir | negatif |
| `REVOKED` | Dicabut | negatif |
| `PROPOSED` | Diajukan | netral |
| `APPROVED` | Disetujui | positif |
| `PAID` | Sudah dibayar (dicatat) | netral-positif |
| `PLANNED` | Direncanakan | netral |
| `PREPARED` | Disiapkan | netral |
| `DISPATCHED` | Dikirim | netral |
| `DELIVERED` | Diterima | positif |
| `PARTIALLY_DELIVERED` | Diterima sebagian | peringatan |
| `NEEDS_REVIEW` | Perlu ditinjau | peringatan |
| `PENDING` (tx) | Menunggu konfirmasi | netral |
| `CONFIRMED` (tx) | Terkonfirmasi | positif |
| `FAILED` (tx) | Gagal | negatif |
| `RETRY_REQUIRED` (tx) | Perlu diulang | peringatan |
| `SUBMITTED` | Diajukan | netral |
| `ACCEPTED` | Diterima organizer | positif |
| `RECEIVED` | Barang diterima | positif |
| `UNVERIFIED` | Belum terverifikasi | netral |
| `ORGANIZATION_NOT_VERIFIED` (error) | Organisasi belum terverifikasi | peringatan |

## 4. State wajib per halaman data

| State | Isi |
|---|---|
| Loading | Skeleton (bukan spinner penuh layar); pertahankan layout |
| Kosong | Penjelasan + satu aksi ("Belum ada kegiatan. Buat kegiatan pertama.") |
| Error | Pesan manusia + tombol "Coba lagi" + kode error kecil untuk dukungan |
| Pending (chain) | Badge "Menunggu konfirmasi" + tautan explorer + tombol muat ulang; jangan blokir halaman |
| Sukses | Konfirmasi singkat, bukan dialog modal yang menghalangi |
| Tanpa izin | Halaman 403 dengan penjelasan peran yang dibutuhkan, tanpa data resource |

## 5. Copy

Aturan:

- Bahasa Indonesia, sapaan "Anda", kalimat ≤ 20 kata untuk teks bantuan.
- Hindari jargon: "wallet" → "dompet digital (wallet)" pada kemunculan pertama.
- Nominal testnet selalu disertai label: **"SIMULASI — aset testnet, bukan uang sungguhan"**.
- Angka uang memakai `id-ID`: `Rp150.000`, `0,015 ETH testnet`.
- Status chain selalu menyebut sumber: "Dari blockchain" / "Dari catatan organizer".

Contoh:

| Konteks | Teks |
|---|---|
| Tombol daftar | `Daftar sebagai relawan` |
| Kuota penuh | `Kuota sudah penuh (20/20). Coba kegiatan lain.` |
| Pendaftaran ditutup | `Pendaftaran ditutup pada 1 Nov 2026, 23.59.` |
| QR kedaluwarsa | `Kode check-in sudah kedaluwarsa. Minta relawan menampilkan kode baru.` |
| QR dipakai ulang | `Kode ini sudah dipakai untuk check-in.` |
| Tx tertunda | `Transaksi sedang menunggu konfirmasi jaringan. Biasanya 15–30 detik.` |
| Tx gagal | `Transaksi gagal di jaringan. Catatan Anda tetap tersimpan. Coba lagi.` |
| Donasi | `Donasi ini memakai aset testnet Sepolia dan tidak bernilai uang.` |
| Wallet | `Kami tidak pernah meminta seed phrase atau private key Anda.` |
| Bukti privat | `Bukti ini hanya terlihat oleh organizer dan admin.` |
| Penerima | `Data penerima bantuan ditampilkan sebagai ringkasan untuk melindungi privasi.` |

## 6. Aksesibilitas

| Aspek | Aturan |
|---|---|
| Kontras | Teks ≥ 4.5:1; teks besar ≥ 3:1; jangan pakai abu-abu terang untuk teks status |
| Target sentuh | ≥ 44×44 px, jarak antar target ≥ 8 px |
| Fokus | Ring fokus 2 px terlihat di semua elemen interaktif; urutan tab sesuai visual |
| Semantik | `label` untuk setiap input, `aria-describedby` untuk pesan error, heading berurutan |
| Status | Ikon + teks, bukan warna saja (buta warna) |
| Form | Error di dekat field, diumumkan lewat `role="alert"` |
| Gerak | Hormati `prefers-reduced-motion`; animasi ≤ 200 ms |
| Bahasa | `<html lang="id">`; label tanggal memakai format lokal |
| Scanner | Tombol besar, umpan balik getar/teks saat berhasil, fallback input kode manual |

## 7. Responsif

| Breakpoint | Perilaku |
|---|---|
| < 640 px | Satu kolom; tabel jadi kartu berlabel; navigasi bawah untuk dashboard volunteer; tombol aksi lengket di bawah |
| 640–1024 px | Dua kolom untuk kartu; sidebar dashboard dapat dilipat |
| ≥ 1024 px | Sidebar tetap, tabel penuh, dua panel (daftar + detail) di halaman review admin |

Aturan: tidak ada scroll horizontal pada 360 px; angka panjang (wei) dipotong dengan `…` dan dapat disalin penuh.

## 8. Elemen khusus Web3

- **Badge sumber data**: `Blockchain` (ikon rantai) / `Catatan organizer` / `Pernyataan organizer` — selalu tampil di samping angka pada laporan transparansi.
- **Tx hash**: tampil 6+4 karakter, tombol salin, tautan explorer dengan `rel="noopener"`.
- **Hash bukti**: disertai teks "Hash membuktikan file tidak berubah, bukan kebenaran isinya."
- **Wallet connect**: hanya muncul pada aksi yang membutuhkan (donasi uang, tautkan wallet); tidak pernah menjadi gerbang untuk melihat katalog, mendaftar kegiatan, atau melihat laporan.
- **Pending tanpa blokir**: transaksi berjalan di latar; pengguna dapat melanjutkan langkah lain.

## 9. Anti-pola yang dilarang

- Menyembunyikan label simulasi agar terlihat seperti donasi nyata.
- Menampilkan "Berhasil" sebelum transaksi terkonfirmasi.
- Menampilkan foto penerima bantuan tanpa `privacy_review = APPROVED`.
- Menampilkan alamat rumah/peta presisi penerima.
- Dark patterns: countdown palsu, kuota fiktif, tombol "donasi" berulang otomatis.
- Mewajibkan wallet untuk aktivitas non-Web3.
- Menampilkan error mentah (`Error: P2002`) ke pengguna.
- Menyembunyikan tombol sebagai satu-satunya kontrol otorisasi.

## 10. Checklist QA UI

- [ ] Semua route di §2 ada dan tidak ada tautan mati.
- [ ] Setiap tabel/kartu punya state kosong dan loading.
- [ ] Semua status internal punya label UI di §3 dan tidak ada teks enum mentah tampil.
- [ ] Uji di 360 px, 768 px, 1280 px tanpa scroll horizontal.
- [ ] Navigasi keyboard penuh pada form login, daftar kegiatan, dan buat kampanye.
- [ ] Kontras diperiksa untuk badge status dan teks sekunder.
- [ ] Label simulasi tampil di semua permukaan yang menyebut nominal.
- [ ] Pesan error §4 dan §5 dipakai apa adanya (konsisten dengan `docs/API.md`).
