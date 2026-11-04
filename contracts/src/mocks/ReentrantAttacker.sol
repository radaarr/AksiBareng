// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DonationTransparency} from "../DonationTransparency.sol";

/// @notice Kontrak penyerang untuk uji reentrancy pada `releaseFunds`.
///         Hanya dipakai di test; tidak pernah di-deploy.
contract ReentrantAttacker {
    DonationTransparency public immutable donationTransparency;
    bytes32 public expenseKey;
    uint256 public campaignId;
    bool private _attacking;

    constructor(DonationTransparency donationTransparency_) {
        donationTransparency = donationTransparency_;
    }

    function arm(uint256 id, bytes32 key) external {
        campaignId = id;
        expenseKey = key;
    }

    function attack() external {
        _attacking = true;
        donationTransparency.releaseFunds(campaignId, expenseKey, payable(address(this)));
    }

    receive() external payable {
        if (_attacking) {
            _attacking = false; // hanya satu re-entrancy
            donationTransparency.releaseFunds(campaignId, expenseKey, payable(address(this)));
        }
    }
}
