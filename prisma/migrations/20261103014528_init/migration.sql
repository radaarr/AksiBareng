-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('VOLUNTEER', 'ORGANIZER', 'ADMIN');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "verification_status" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "wallet_link_status" AS ENUM ('PENDING', 'VERIFIED', 'REVOKED');

-- CreateEnum
CREATE TYPE "event_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "registration_status" AS ENUM ('REGISTERED', 'CANCELLED', 'CHECKED_IN', 'VERIFIED', 'NO_SHOW', 'REJECTED');

-- CreateEnum
CREATE TYPE "attendance_session_status" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "check_in_method" AS ENUM ('QR', 'MANUAL');

-- CreateEnum
CREATE TYPE "contribution_status" AS ENUM ('PENDING', 'VERIFIED', 'REVOKED');

-- CreateEnum
CREATE TYPE "campaign_status" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'PAUSED', 'CLOSED', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "funding_asset" AS ENUM ('NATIVE_ETH_TESTNET');

-- CreateEnum
CREATE TYPE "donation_status" AS ENUM ('INTENT', 'PENDING', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "goods_donation_status" AS ENUM ('SUBMITTED', 'ACCEPTED', 'REJECTED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "goods_condition" AS ENUM ('NEW', 'LIKE_NEW', 'USED_GOOD');

-- CreateEnum
CREATE TYPE "handover_method" AS ENUM ('DROP_OFF', 'PICKUP_BY_ORGANIZER', 'COURIER');

-- CreateEnum
CREATE TYPE "expense_status" AS ENUM ('PROPOSED', 'APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "distribution_status" AS ENUM ('PLANNED', 'PREPARED', 'DISPATCHED', 'DELIVERED', 'VERIFIED', 'PARTIALLY_DELIVERED', 'CANCELLED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "aid_type" AS ENUM ('GOODS', 'FUNDS');

-- CreateEnum
CREATE TYPE "privacy_review" AS ENUM ('PENDING', 'APPROVED', 'REDACTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "tx_kind" AS ENUM ('DONATION', 'ISSUE_CONTRIBUTION', 'REVOKE_CONTRIBUTION', 'RECORD_EXPENSE_PROOF', 'RECORD_DISTRIBUTION', 'CREATE_CAMPAIGN', 'CLOSE_CAMPAIGN');

-- CreateEnum
CREATE TYPE "tx_status" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'RETRY_REQUIRED');

-- CreateEnum
CREATE TYPE "anchor_status" AS ENUM ('NOT_ANCHORED', 'PENDING', 'CONFIRMED', 'FAILED', 'RETRY_REQUIRED');

-- CreateEnum
CREATE TYPE "category_scope" AS ENUM ('EVENT', 'CAMPAIGN', 'EXPENSE');

-- CreateEnum
CREATE TYPE "abuse_target_type" AS ENUM ('CAMPAIGN', 'EVENT');

-- CreateEnum
CREATE TYPE "abuse_report_status" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'VOLUNTEER',
    "isPublicName" BOOLEAN NOT NULL DEFAULT true,
    "status" "user_status" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_links" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "status" "wallet_link_status" NOT NULL DEFAULT 'PENDING',
    "nonce" TEXT NOT NULL,
    "message" TEXT,
    "signature" TEXT,
    "verifiedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "publicArea" TEXT NOT NULL,
    "logoUrl" TEXT,
    "website" TEXT,
    "verificationStatus" "verification_status" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_verifications" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "documentStorageKey" TEXT NOT NULL,
    "documentSha256" TEXT NOT NULL,
    "documentSalt" TEXT NOT NULL,
    "status" "verification_status" NOT NULL DEFAULT 'PENDING',
    "reviewerId" TEXT,
    "reviewNote" TEXT,
    "submittedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMPTZ(3),

    CONSTRAINT "organization_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "locationName" TEXT,
    "publicAddress" TEXT,
    "city" TEXT,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "quota" INTEGER NOT NULL,
    "registrationOpensAt" TIMESTAMPTZ(3) NOT NULL,
    "registrationClosesAt" TIMESTAMPTZ(3) NOT NULL,
    "cancellationDeadline" TIMESTAMPTZ(3),
    "status" "event_status" NOT NULL DEFAULT 'DRAFT',
    "cancelReason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "registration_status" NOT NULL DEFAULT 'REGISTERED',
    "registeredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMPTZ(3),
    "cancelReason" TEXT,

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_tasks" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quota" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "event_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_assignments" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "task_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_sessions" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "openedBy" TEXT NOT NULL,
    "opensAt" TIMESTAMPTZ(3) NOT NULL,
    "closesAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "attendance_session_status" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "tokenNonce" TEXT NOT NULL,
    "checkedInAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedInBy" TEXT NOT NULL,
    "method" "check_in_method" NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributions" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "contribution_status" NOT NULL DEFAULT 'PENDING',
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMPTZ(3),
    "revokedBy" TEXT,
    "revokeReason" TEXT,
    "blockchainTxId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "periodStartsAt" TIMESTAMPTZ(3) NOT NULL,
    "periodEndsAt" TIMESTAMPTZ(3) NOT NULL,
    "targetAmountWei" DECIMAL(78,0) NOT NULL,
    "targetAmountIdrLabel" DECIMAL(18,2),
    "fundingAsset" "funding_asset" NOT NULL DEFAULT 'NATIVE_ETH_TESTNET',
    "generalLocation" TEXT,
    "status" "campaign_status" NOT NULL DEFAULT 'DRAFT',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMPTZ(3),
    "reviewNote" TEXT,
    "onChainCampaignId" INTEGER,
    "closedReason" TEXT,
    "finalReportStorageKey" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_budgets" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "plannedAmountWei" DECIMAL(78,0) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supersededAt" TIMESTAMPTZ(3),

    CONSTRAINT "campaign_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "donorUserId" TEXT,
    "donorDisplayName" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "amountWei" DECIMAL(78,0) NOT NULL,
    "chainId" INTEGER NOT NULL,
    "txHash" TEXT,
    "status" "donation_status" NOT NULL DEFAULT 'INTENT',
    "donationIntentNonce" TEXT NOT NULL,
    "confirmedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_donations" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "donorUserId" TEXT,
    "donorDisplayName" TEXT,
    "itemName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "condition" "goods_condition" NOT NULL,
    "note" TEXT,
    "handoverMethod" "handover_method" NOT NULL,
    "status" "goods_donation_status" NOT NULL DEFAULT 'SUBMITTED',
    "receivedQuantity" INTEGER,
    "receivedBy" TEXT,
    "receivedAt" TIMESTAMPTZ(3),
    "rejectReason" TEXT,

    CONSTRAINT "goods_donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantityReceived" INTEGER NOT NULL DEFAULT 0,
    "quantityAllocated" INTEGER NOT NULL DEFAULT 0,
    "quantityDistributed" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMPTZ(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amountWei" DECIMAL(78,0) NOT NULL,
    "description" TEXT NOT NULL,
    "payeeName" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "status" "expense_status" NOT NULL DEFAULT 'PROPOSED',
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMPTZ(3),
    "reviewNote" TEXT,
    "paidAt" TIMESTAMPTZ(3),
    "paymentReference" TEXT,
    "blockchainTxId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_evidence" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "chainHash" TEXT NOT NULL,
    "documentSalt" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anchorStatus" "anchor_status" NOT NULL DEFAULT 'NOT_ANCHORED',

    CONSTRAINT "expense_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribution_batches" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "aidType" "aid_type" NOT NULL,
    "generalLocation" TEXT,
    "plannedDate" TIMESTAMPTZ(3),
    "dispatchedAt" TIMESTAMPTZ(3),
    "deliveredAt" TIMESTAMPTZ(3),
    "personInChargeId" TEXT NOT NULL,
    "status" "distribution_status" NOT NULL DEFAULT 'PLANNED',
    "notes" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMPTZ(3),
    "blockchainTxId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "distribution_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribution_items" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "inventoryItemId" TEXT,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantityPlanned" INTEGER NOT NULL,
    "quantityDispatched" INTEGER NOT NULL DEFAULT 0,
    "quantityReceived" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "distribution_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribution_evidence" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "chainHash" TEXT NOT NULL,
    "documentSalt" TEXT NOT NULL,
    "capturedBy" TEXT NOT NULL,
    "capturedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "privacyReview" "privacy_review" NOT NULL DEFAULT 'PENDING',
    "anchorStatus" "anchor_status" NOT NULL DEFAULT 'NOT_ANCHORED',

    CONSTRAINT "distribution_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "actorUserId" TEXT,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT,
    "requestId" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blockchain_transactions" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "kind" "tx_kind" NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "txHash" TEXT,
    "status" "tx_status" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "blockNumber" BIGINT,
    "logIndex" INTEGER,
    "submittedBy" TEXT,
    "confirmedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "blockchain_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indexer_cursors" (
    "chainId" INTEGER NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "lastBlock" BIGINT NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "indexer_cursors_pkey" PRIMARY KEY ("chainId","contractAddress")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "scope" "category_scope" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "abuse_reports" (
    "id" TEXT NOT NULL,
    "reporterUserId" TEXT,
    "targetType" "abuse_target_type" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "abuse_report_status" NOT NULL DEFAULT 'OPEN',
    "handledBy" TEXT,
    "handledAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abuse_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "wallet_links_userId_idx" ON "wallet_links"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_links_address_chainId_key" ON "wallet_links"("address", "chainId");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_ownerId_idx" ON "organizations"("ownerId");

-- CreateIndex
CREATE INDEX "organization_verifications_organizationId_submittedAt_idx" ON "organization_verifications"("organizationId", "submittedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE INDEX "events_organizationId_startsAt_idx" ON "events"("organizationId", "startsAt");

-- CreateIndex
CREATE INDEX "event_registrations_userId_idx" ON "event_registrations"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_eventId_userId_key" ON "event_registrations"("eventId", "userId");

-- CreateIndex
CREATE INDEX "event_tasks_eventId_sortOrder_idx" ON "event_tasks"("eventId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "task_assignments_registrationId_key" ON "task_assignments"("registrationId");

-- CreateIndex
CREATE INDEX "task_assignments_taskId_idx" ON "task_assignments"("taskId");

-- CreateIndex
CREATE INDEX "attendance_sessions_eventId_opensAt_idx" ON "attendance_sessions"("eventId", "opensAt");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_tokenNonce_key" ON "attendance_records"("tokenNonce");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_sessionId_registrationId_key" ON "attendance_records"("sessionId", "registrationId");

-- CreateIndex
CREATE UNIQUE INDEX "contributions_registrationId_key" ON "contributions"("registrationId");

-- CreateIndex
CREATE INDEX "contributions_userId_createdAt_idx" ON "contributions"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "contributions_eventId_idx" ON "contributions"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_slug_key" ON "campaigns"("slug");

-- CreateIndex
CREATE INDEX "campaigns_organizationId_status_idx" ON "campaigns"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_budgets_campaignId_version_key" ON "campaign_budgets"("campaignId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "donations_donationIntentNonce_key" ON "donations"("donationIntentNonce");

-- CreateIndex
CREATE INDEX "donations_campaignId_status_idx" ON "donations"("campaignId", "status");

-- CreateIndex
CREATE INDEX "goods_donations_campaignId_status_idx" ON "goods_donations"("campaignId", "status");

-- CreateIndex
CREATE INDEX "inventory_items_campaignId_idx" ON "inventory_items"("campaignId");

-- CreateIndex
CREATE INDEX "expenses_campaignId_status_idx" ON "expenses"("campaignId", "status");

-- CreateIndex
CREATE INDEX "expense_evidence_expenseId_idx" ON "expense_evidence"("expenseId");

-- CreateIndex
CREATE INDEX "distribution_batches_campaignId_status_idx" ON "distribution_batches"("campaignId", "status");

-- CreateIndex
CREATE INDEX "distribution_items_batchId_idx" ON "distribution_items"("batchId");

-- CreateIndex
CREATE INDEX "distribution_evidence_batchId_idx" ON "distribution_evidence"("batchId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_createdAt_idx" ON "audit_logs"("entityType", "entityId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_createdAt_idx" ON "audit_logs"("actorUserId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_transactions_idempotencyKey_key" ON "blockchain_transactions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "blockchain_transactions_status_createdAt_idx" ON "blockchain_transactions"("status", "createdAt");

-- CreateIndex
CREATE INDEX "categories_scope_isActive_idx" ON "categories"("scope", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "categories_scope_slug_key" ON "categories"("scope", "slug");

-- CreateIndex
CREATE INDEX "abuse_reports_targetType_targetId_idx" ON "abuse_reports"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "abuse_reports_status_createdAt_idx" ON "abuse_reports"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "wallet_links" ADD CONSTRAINT "wallet_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_verifications" ADD CONSTRAINT "organization_verifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_verifications" ADD CONSTRAINT "organization_verifications_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_verifications" ADD CONSTRAINT "organization_verifications_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_tasks" ADD CONSTRAINT "event_tasks_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "event_tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "event_registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_openedBy_fkey" FOREIGN KEY ("openedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "attendance_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "event_registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_checkedInBy_fkey" FOREIGN KEY ("checkedInBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "event_registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_validatedBy_fkey" FOREIGN KEY ("validatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_revokedBy_fkey" FOREIGN KEY ("revokedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_blockchainTxId_fkey" FOREIGN KEY ("blockchainTxId") REFERENCES "blockchain_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_budgets" ADD CONSTRAINT "campaign_budgets_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_budgets" ADD CONSTRAINT "campaign_budgets_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_donorUserId_fkey" FOREIGN KEY ("donorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_donations" ADD CONSTRAINT "goods_donations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_donations" ADD CONSTRAINT "goods_donations_donorUserId_fkey" FOREIGN KEY ("donorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_donations" ADD CONSTRAINT "goods_donations_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_blockchainTxId_fkey" FOREIGN KEY ("blockchainTxId") REFERENCES "blockchain_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_evidence" ADD CONSTRAINT "expense_evidence_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_evidence" ADD CONSTRAINT "expense_evidence_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_batches" ADD CONSTRAINT "distribution_batches_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_batches" ADD CONSTRAINT "distribution_batches_personInChargeId_fkey" FOREIGN KEY ("personInChargeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_batches" ADD CONSTRAINT "distribution_batches_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_batches" ADD CONSTRAINT "distribution_batches_blockchainTxId_fkey" FOREIGN KEY ("blockchainTxId") REFERENCES "blockchain_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_items" ADD CONSTRAINT "distribution_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "distribution_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_items" ADD CONSTRAINT "distribution_items_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_evidence" ADD CONSTRAINT "distribution_evidence_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "distribution_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_evidence" ADD CONSTRAINT "distribution_evidence_capturedBy_fkey" FOREIGN KEY ("capturedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blockchain_transactions" ADD CONSTRAINT "blockchain_transactions_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abuse_reports" ADD CONSTRAINT "abuse_reports_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abuse_reports" ADD CONSTRAINT "abuse_reports_handledBy_fkey" FOREIGN KEY ("handledBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
