# AGENTS.md

Panduan kerja untuk kontributor manusia dan AI agent di repository AksiBareng. Baca ini sebelum menulis kode.

## Sumber kebenaran

| Pertanyaan | Dokumen |
|---|---|
| Apa yang harus dibangun dan prioritasnya | `docs/PRD.md` (gunakan requirement ID: `EVT-06`, `DON-04`, …) |
| Bagaimana komponen disusun | `docs/ARCHITECTURE.md` |
| Tabel & kolom | `docs/DATABASE.md` |
| Endpoint & error | `docs/API.md` |
| Siapa boleh apa | `docs/RBAC.md` |
| Perilaku kontrak | `docs/SMART_CONTRACTS.md` |

PRD menang atas dokumen lain bila terjadi konflik isi fitur. `docs/DATABASE.md` menang untuk bentuk data, `docs/API.md` untuk bentuk kontrak HTTP.

## Konvensi kode

- Bahasa: identifier, komentar kode, dan pesan commit dalam **Inggris**; teks antarmuka dan pesan error yang dilihat pengguna dalam **Bahasa Indonesia**.
- TypeScript `strict`. Tidak ada `any` baru tanpa alasan tertulis.
- Validasi input di batas server dengan **Zod**; skema ditaruh di `lib/validation/`.
- Semua akses data lewat Prisma di `lib/db.ts`. Jangan membuat Prisma client baru per request.
- Nama tabel/kolom Prisma: `snake_case` untuk tabel (`@@map`), `camelCase` untuk field.
- Status memakai `enum` Prisma, bukan string bebas. Nilai enum mengikuti `docs/DATABASE.md`.
- Nominal uang: `Decimal` (IDR) atau string wei (token). **Jangan pernah** `number`/float untuk nilai transaksi.
- Waktu: `timestamptz` di database, ISO-8601 di API, format lokal `id-ID` saat ditampilkan.
- Nominal on-chain disimpan sebagai string desimal wei; konversi hanya di lapisan `lib/chain/`.

## Perintah yang harus lulus sebelum menyatakan selesai

```bash
pnpm typecheck && pnpm lint && pnpm test
```

Jika perubahan menyentuh `prisma/schema.prisma`, tambahkan `pnpm prisma migrate dev` dan pastikan migrasi ikut ter-commit. Jika menyentuh `contracts/`, jalankan `pnpm chain:test`.

## Aturan wajib (guardrail)

1. **Jangan** menaruh data pribadi apa pun on-chain: nama, email, telepon, alamat, NIK, kondisi kesehatan, foto wajah penerima. Yang boleh: ID acak, hash, nominal, timestamp, alamat wallet pelaku transaksi.
2. **Jangan** meminta atau menyimpan private key / seed phrase pengguna. Verifikasi wallet hanya melalui tanda tangan pesan (EIP-4361 style nonce).
3. **Jangan** meng-hardcode alamat kontrak atau kunci apa pun. Semua dari env; `.env` tidak di-commit.
4. **Jangan** menandai transaksi `CONFIRMED` tanpa bukti receipt yang sukses dan jumlah konfirmasi terpenuhi.
5. **Jangan** membuat teks atau status yang mengklaim uang sungguhan diterima/dibayarkan pada MVP. Semua donasi uang adalah testnet dan wajib berlabel simulasi.
6. **Jangan** menampilkan identitas/alamat penerima bantuan. Tampilkan agregat atau anonim.
7. Otorisasi dicek di server (route handler / server action / policy di `lib/authz.ts`). Menyembunyikan tombol di UI bukan kontrol keamanan.
8. Jika transaksi blockchain gagal, catatan database tetap ada dan status on-chain menjadi `RETRY_REQUIRED`. Jangan rollback validasi bisnis karena kegagalan chain.

## Alur kerja perubahan

1. Cari requirement ID yang relevan di `docs/PRD.md`; sebutkan di deskripsi commit (`feat(events): enforce quota on registration [EVT-08]`).
2. Jika mengubah data → perbarui `docs/DATABASE.md` di commit yang sama.
3. Jika mengubah endpoint → perbarui `docs/API.md` di commit yang sama.
4. Jika mengubah perilaku kontrak → perbarui `docs/SMART_CONTRACTS.md` + unit test.
5. Jika mengubah aturan akses → perbarui `docs/RBAC.md`.
6. Perubahan perilaku pengguna harus punya test di `docs/TESTING.md` (tambahkan baris bila belum ada).

Dokumen yang tidak diperbarui bersama kode dianggap bug.

## Gaya UI

- Copy Bahasa Indonesia, kalimat pendek, tanpa jargon Web3 di alur utama ("Hubungkan wallet" hanya di halaman yang memang butuh).
- Semua status memakai label yang dapat dipahami: `Menunggu konfirmasi`, `Terkonfirmasi`, `Gagal — coba lagi`.
- Wajib ada state: loading, kosong, error, pending. Lihat `docs/UI_UX.md`.
- Target sentuh minimal 44×44 px, kontras teks minimal 4.5:1, fokus keyboard terlihat, formulir punya `label` eksplisit.

## Larangan operasional

- Tidak ada `git push --force` ke branch bersama, tidak ada commit langsung ke `main` tanpa review.
- Tidak ada deploy ke mainnet, tidak ada pembelian gas, tidak ada transaksi dengan dana nyata.
- Tidak ada penyimpanan kredensial di issue, komentar, atau log.
