// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title DonationTransparency
/// @notice Kampanye, donasi testnet, dan penjangkaran hash bukti (docs/SMART_CONTRACTS.md §2).
/// @dev Hanya data minimal on-chain: bytes32 key, alamat, nominal, timestamp. ReleaseFunds
///      hanya mengendalikan ETH yang benar-benar berada di kontrak ini (PRD §10.2, ADR-004).
contract DonationTransparency is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant CAMPAIGN_MANAGER_ROLE = keccak256("CAMPAIGN_MANAGER_ROLE");
    bytes32 public constant RECORDER_ROLE = keccak256("RECORDER_ROLE");
    bytes32 public constant APPROVER_ROLE = keccak256("APPROVER_ROLE");
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");

    enum CampaignStatus {
        None,
        Active,
        Paused,
        Closed
    }

    enum ExpenseStatus {
        None,
        Proposed,
        Approved,
        Released,
        Rejected
    }

    struct Campaign {
        bytes32 key; // keccak256("campaign:" + uuid)
        address organizer; // wallet organizer, bukan identitas personal
        uint256 targetWei;
        uint256 totalDonatedWei;
        uint256 totalReleasedWei;
        uint32 createdAt;
        CampaignStatus status;
    }

    struct ExpenseRecord {
        bytes32 key; // keccak256("expense:" + uuid)
        uint256 amountWei;
        bytes32 evidenceHash; // keccak256(manifest ‖ salt); terakhir yang dijangkar
        address proposedBy;
        address approvedBy;
        uint32 proposedAt;
        ExpenseStatus status;
    }

    error ZeroAddress();
    error ZeroAmount();
    error InvalidKey();
    error DuplicateKey();
    error UnknownCampaign();
    error CampaignNotActive();
    error CampaignNotPaused();
    error InvalidStatus();
    error NotCampaignOrganizer();
    error SelfApprovalNotAllowed();
    error InsufficientBalance();
    error ZeroEvidenceHash();
    error UnknownExpense();
    error TransferFailed();

    uint256 public nextCampaignId;

    mapping(uint256 => Campaign) private _campaigns;
    mapping(bytes32 => uint256) private _campaignIdByKey;
    mapping(uint256 => mapping(bytes32 => ExpenseRecord)) private _expenses;

    event CampaignCreated(uint256 indexed id, bytes32 indexed key, address indexed organizer, uint256 targetWei);
    event CampaignStatusChanged(uint256 indexed id, CampaignStatus status);
    event DonationReceived(uint256 indexed id, address indexed donor, uint256 amountWei, uint256 totalWei);
    event ExpenseProposed(uint256 indexed id, bytes32 indexed expenseKey, uint256 amountWei);
    event ExpenseApproved(uint256 indexed id, bytes32 indexed expenseKey, address indexed approver);
    event ExpenseProofRecorded(uint256 indexed id, bytes32 indexed expenseKey, bytes32 evidenceHash);
    event DistributionRecorded(uint256 indexed id, bytes32 indexed batchKey, bytes32 evidenceHash);
    event FundsReleased(uint256 indexed id, bytes32 indexed expenseKey, address indexed to, uint256 amountWei);
    event CampaignClosed(uint256 indexed id, bytes32 reportHash);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ────────────────────────── admin / lifecycle ──────────────────────────

    /// @notice Menangguhkan `donate` dan `releaseFunds`; pencatatan bukti tetap boleh.
    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /// @notice Mengaktifkan kembali `donate` dan `releaseFunds`.
    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function createCampaign(bytes32 key, address organizer, uint256 targetWei)
        external
        onlyRole(CAMPAIGN_MANAGER_ROLE)
        returns (uint256 id)
    {
        if (key == bytes32(0)) revert InvalidKey();
        if (organizer == address(0)) revert ZeroAddress();
        if (targetWei == 0) revert ZeroAmount();
        if (_campaignIdByKey[key] != 0) revert DuplicateKey();

        id = ++nextCampaignId;
        _campaigns[id] = Campaign({
            key: key,
            organizer: organizer,
            targetWei: targetWei,
            totalDonatedWei: 0,
            totalReleasedWei: 0,
            createdAt: uint32(block.timestamp),
            status: CampaignStatus.None
        });
        _campaignIdByKey[key] = id;

        emit CampaignCreated(id, key, organizer, targetWei);
    }

    /// @notice Aktivasi setelah review admin di database (CAM-04).
    function activateCampaign(uint256 id) external onlyRole(CAMPAIGN_MANAGER_ROLE) {
        Campaign storage campaign = _campaign(id);
        if (campaign.status != CampaignStatus.None) revert InvalidStatus();

        campaign.status = CampaignStatus.Active;
        emit CampaignStatusChanged(id, CampaignStatus.Active);
    }

    /// @notice Penindakan (PRD §9.1). `false` mencabut penangguhan.
    function setCampaignPaused(uint256 id, bool paused) external onlyRole(CAMPAIGN_MANAGER_ROLE) {
        Campaign storage campaign = _campaign(id);
        if (paused) {
            if (campaign.status != CampaignStatus.Active) revert InvalidStatus();
            campaign.status = CampaignStatus.Paused;
            emit CampaignStatusChanged(id, CampaignStatus.Paused);
        } else {
            if (campaign.status != CampaignStatus.Paused) revert CampaignNotPaused();
            campaign.status = CampaignStatus.Active;
            emit CampaignStatusChanged(id, CampaignStatus.Active);
        }
    }

    function closeCampaign(uint256 id, bytes32 reportHash) external onlyRole(CAMPAIGN_MANAGER_ROLE) {
        Campaign storage campaign = _campaign(id);
        if (campaign.status == CampaignStatus.None) revert InvalidStatus();
        if (campaign.status == CampaignStatus.Closed) revert InvalidStatus();

        campaign.status = CampaignStatus.Closed;
        emit CampaignStatusChanged(id, CampaignStatus.Closed);
        emit CampaignClosed(id, reportHash);
    }

    // ────────────────────────── donasi ──────────────────────────

    function donate(uint256 id) external payable nonReentrant whenNotPaused {
        Campaign storage campaign = _campaign(id);
        if (campaign.status != CampaignStatus.Active) revert CampaignNotActive();
        if (msg.value == 0) revert ZeroAmount();

        campaign.totalDonatedWei += msg.value;
        emit DonationReceived(id, msg.sender, msg.value, campaign.totalDonatedWei);
    }

    // ────────────────────────── pengeluaran ──────────────────────────

    /// @notice Hanya pemegang RECORDER_ROLE yang juga organizer kampanye, supaya
    ///         relayer tidak bisa mengusulkan pengeluaran atas kampanye sembarang.
    function proposeExpense(uint256 id, bytes32 expenseKey, uint256 amountWei) external onlyRole(RECORDER_ROLE) {
        Campaign storage campaign = _campaign(id);
        if (campaign.status == CampaignStatus.Closed) revert InvalidStatus();
        if (msg.sender != campaign.organizer) revert NotCampaignOrganizer();
        if (expenseKey == bytes32(0)) revert InvalidKey();
        if (amountWei == 0) revert ZeroAmount();
        if (_expenses[id][expenseKey].key != bytes32(0)) revert DuplicateKey();

        _expenses[id][expenseKey] = ExpenseRecord({
            key: expenseKey,
            amountWei: amountWei,
            evidenceHash: bytes32(0),
            proposedBy: msg.sender,
            approvedBy: address(0),
            proposedAt: uint32(block.timestamp),
            status: ExpenseStatus.Proposed
        });

        emit ExpenseProposed(id, expenseKey, amountWei);
    }

    function approveExpense(uint256 id, bytes32 expenseKey) external onlyRole(APPROVER_ROLE) {
        ExpenseRecord storage expense = _expense(id, expenseKey);
        if (expense.status != ExpenseStatus.Proposed) revert InvalidStatus();
        if (msg.sender == expense.proposedBy) revert SelfApprovalNotAllowed();

        expense.status = ExpenseStatus.Approved;
        expense.approvedBy = msg.sender;

        emit ExpenseApproved(id, expenseKey, msg.sender);
    }

    function recordExpenseProof(uint256 id, bytes32 expenseKey, bytes32 evidenceHash)
        external
        onlyRole(RECORDER_ROLE)
    {
        _campaign(id); // kampanye wajib ada
        if (evidenceHash == bytes32(0)) revert ZeroEvidenceHash();
        ExpenseRecord storage expense = _expense(id, expenseKey);

        expense.evidenceHash = evidenceHash;
        emit ExpenseProofRecorded(id, expenseKey, evidenceHash);
    }

    function recordDistribution(uint256 id, bytes32 batchKey, bytes32 evidenceHash)
        external
        onlyRole(RECORDER_ROLE)
    {
        _campaign(id);
        if (batchKey == bytes32(0)) revert InvalidKey();
        if (evidenceHash == bytes32(0)) revert ZeroEvidenceHash();

        emit DistributionRecorded(id, batchKey, evidenceHash);
    }

    /// @notice Hanya `Approved`; maksimal saldo kampanye; idempoten (Released sekali).
    function releaseFunds(uint256 id, bytes32 expenseKey, address payable to)
        external
        onlyRole(TREASURER_ROLE)
        nonReentrant
        whenNotPaused
    {
        if (to == address(0)) revert ZeroAddress();
        Campaign storage campaign = _campaign(id);
        ExpenseRecord storage expense = _expense(id, expenseKey);
        if (expense.status != ExpenseStatus.Approved) revert InvalidStatus();

        uint256 amount = expense.amountWei;
        if (amount > campaignBalance(id)) revert InsufficientBalance();

        // Effects sebelum interaction; jika call gagal seluruh transaksi revert.
        expense.status = ExpenseStatus.Released;
        campaign.totalReleasedWei += amount;

        (bool success,) = to.call{value: amount}("");
        if (!success) revert TransferFailed(); // efek sudah ditulis; revert mengembalikan semuanya

        emit FundsReleased(id, expenseKey, to, amount);
    }

    // ────────────────────────── views ──────────────────────────

    function getCampaign(uint256 id) external view returns (Campaign memory) {
        return _campaign(id);
    }

    function getExpense(uint256 id, bytes32 expenseKey) external view returns (ExpenseRecord memory) {
        return _expense(id, expenseKey);
    }

    /// @notice Saldo kampanye dari ledger internal (`totalDonatedWei - totalReleasedWei`).
    function campaignBalance(uint256 id) public view returns (uint256) {
        Campaign storage campaign = _campaign(id);
        return campaign.totalDonatedWei - campaign.totalReleasedWei;
    }

    function campaignIdByKey(bytes32 key) external view returns (uint256) {
        return _campaignIdByKey[key];
    }

    // ────────────────────────── internal ──────────────────────────

    function _campaign(uint256 id) private view returns (Campaign storage campaign) {
        campaign = _campaigns[id];
        if (campaign.key == bytes32(0)) revert UnknownCampaign();
    }

    function _expense(uint256 id, bytes32 expenseKey) private view returns (ExpenseRecord storage expense) {
        _campaign(id);
        expense = _expenses[id][expenseKey];
        if (expense.key == bytes32(0)) revert UnknownExpense();
    }
}
