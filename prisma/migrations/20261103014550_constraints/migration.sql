-- Constraint yang tidak dapat dinyatakan Prisma — lihat docs/DATABASE.md §11.
-- Jaring pengaman terakhir di database; validasi aplikasi tetap ada dan mengembalikan 409.
-- Kolom fisik mengikuti nama field Prisma (camelCase), tabel snake_case plural.

-- users: email unik tanpa peka huruf besar/kecil (AUTH-01)
CREATE UNIQUE INDEX "users_email_lower_key" ON "users" (lower("email"));

-- wallet_links: alamat selalu lowercase, satu wallet tidak diklaim dua akun (AUTH-07)
ALTER TABLE "wallet_links"
  ADD CONSTRAINT "wallet_links_address_lowercase" CHECK ("address" = lower("address"));
CREATE UNIQUE INDEX "wallet_links_address_chain_key" ON "wallet_links" (lower("address"), "chainId");

-- events: rentang waktu masuk akal, kuota 1..5000 (EVT-01, EVT-08)
ALTER TABLE "events"
  ADD CONSTRAINT "events_period_valid" CHECK ("endsAt" > "startsAt");
ALTER TABLE "events"
  ADD CONSTRAINT "events_registration_window_valid" CHECK ("registrationClosesAt" >= "registrationOpensAt");
ALTER TABLE "events"
  ADD CONSTRAINT "events_quota_range" CHECK ("quota" BETWEEN 1 AND 5000);

-- event_tasks: kuota posisi positif (SCH-01)
ALTER TABLE "event_tasks"
  ADD CONSTRAINT "event_tasks_quota_positive" CHECK ("quota" > 0);

-- attendance_sessions: hanya satu sesi terbuka per kegiatan (ATT-01)
CREATE UNIQUE INDEX "attendance_sessions_one_open_per_event"
  ON "attendance_sessions" ("eventId")
  WHERE "status" = 'OPEN';

-- donations: satu transaksi chain dicatat sekali (DON-05)
CREATE UNIQUE INDEX "donations_chain_tx_key"
  ON "donations" ("chainId", "txHash")
  WHERE "txHash" IS NOT NULL;

-- goods_donations: jumlah barang positif (GDS-01)
ALTER TABLE "goods_donations"
  ADD CONSTRAINT "goods_donations_quantity_positive" CHECK ("quantity" > 0);

-- inventory_items: stok tidak negatif dan alokasi tidak melebihi stok (GDS-05)
ALTER TABLE "inventory_items"
  ADD CONSTRAINT "inventory_items_quantities_non_negative"
  CHECK ("quantityReceived" >= 0 AND "quantityAllocated" >= 0 AND "quantityDistributed" >= 0);
ALTER TABLE "inventory_items"
  ADD CONSTRAINT "inventory_items_allocated_within_received"
  CHECK ("quantityAllocated" <= "quantityReceived");
ALTER TABLE "inventory_items"
  ADD CONSTRAINT "inventory_items_distributed_within_allocated"
  CHECK ("quantityDistributed" <= "quantityAllocated");

-- expenses: nominal pengeluaran positif (EXP-01)
ALTER TABLE "expenses"
  ADD CONSTRAINT "expenses_amount_positive" CHECK ("amountWei" > 0);

-- distribution_items: jumlah terkirim/diterima tidak melampaui rencana (DST-06)
ALTER TABLE "distribution_items"
  ADD CONSTRAINT "distribution_items_dispatched_within_planned"
  CHECK ("quantityDispatched" <= "quantityPlanned");
ALTER TABLE "distribution_items"
  ADD CONSTRAINT "distribution_items_received_within_dispatched"
  CHECK ("quantityReceived" <= "quantityDispatched");

-- blockchain_transactions: satu log chain tidak tercatat ganda (T4.9)
CREATE UNIQUE INDEX "blockchain_transactions_chain_tx_log_key"
  ON "blockchain_transactions" ("chainId", "txHash", "logIndex")
  WHERE "txHash" IS NOT NULL;
