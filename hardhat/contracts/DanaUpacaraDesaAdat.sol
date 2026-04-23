// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DanaUpacaraDesaAdat {

    // STRUCTURES
    struct Campaign {
        string name;
        address admin;
        uint256 targetAmount;
        uint256 balance;
        bool active;
        mapping(address => bool) validators;
        address[] validatorList;
        uint256 validatorCount;
    }

    struct ExpenseRequest {
        string description;
        uint256 amount;
        uint256 approvalCount;
        bool finalized;
        mapping(address => bool) approvals;
    }

    // address public superAdmin; // dihapus karena tidak digunakan

    
    // STATE VARIABLES

    uint256 public campaignCount;
    mapping(uint256 => Campaign) private campaigns;
    mapping(uint256 => mapping(uint256 => ExpenseRequest)) private expenseRequests;
    mapping(uint256 => uint256) private expenseCounts;

    
    // EVENTS
    event CampaignCreated(uint campaignId, string name);
    event DonationReceived(uint campaignId, address donor, uint amount);
    event ExpenseRequested(uint campaignId, uint requestId, uint amount);
    event ExpenseApproved(uint campaignId, uint requestId, address validator);
    event ExpenseFinalized(uint campaignId, uint requestId);
    event CampaignDeactivated(uint campaignId);
    event ValidatorAdded(uint campaignId, address validator);
    event ValidatorRemoved(uint campaignId, address validator);
    event CampaignTargetUpdated(uint campaignId, uint newTarget);
    event RemainingFundsWithdrawn(uint campaignId, uint256 amount);

    
    // MODIFIERS
    // modifier onlySuperAdmin() {
    //     require(msg.sender == superAdmin, "Not super admin");
    //     _;
    // } dihapus karena tidak digunakan

    modifier onlyAdmin(uint campaignId) {
        require(msg.sender == campaigns[campaignId].admin, "Not admin");
        _;
    }

    modifier onlyValidator(uint campaignId) {
        require(campaigns[campaignId].validators[msg.sender], "Not validator");
        _;
    }

    modifier campaignExists(uint campaignId) {
        require(campaignId < campaignCount, "Campaign not found");
        _;
    }

    modifier onlyActiveCampaign(uint campaignId) {
        require(campaigns[campaignId].active, "Campaign is inactive");
        _;
    }

    
    // CONSTRUCTOR
    // constructor() {
    //     superAdmin = msg.sender; // dihapus karena tidak digunakan
    // }

    
    // CREATE FUNCTIONS
    // 1. Membuat campaign kegiatan adat
    function createCampaign(
        string memory name,
        uint256 targetAmount
    ) external {
        require(targetAmount > 0, "Target must be greater than zero");

        Campaign storage newCampaign = campaigns[campaignCount];
        newCampaign.name = name;
        newCampaign.admin = msg.sender;
        newCampaign.targetAmount = targetAmount;
        newCampaign.balance = 0;
        newCampaign.active = true;
        newCampaign.validatorCount = 0;

        // Admin otomatis menjadi validator pertama
        newCampaign.validators[msg.sender] = true;
        newCampaign.validatorList.push(msg.sender);
        newCampaign.validatorCount++;

        emit CampaignCreated(campaignCount, name);
        campaignCount++;
    }

    // 2. Donasi ke campaign
    function donate(uint256 campaignId)
        external
        payable
        campaignExists(campaignId)
        onlyActiveCampaign(campaignId)
    {
        require(msg.value > 0, "Donation must be greater than zero");

        campaigns[campaignId].balance += msg.value;
        emit DonationReceived(campaignId, msg.sender, msg.value);
    }

    // 3. Mengajukan request pengeluaran dana
    function requestExpense(
        uint256 campaignId,
        uint256 amount,
        string memory description
    )
        external
        campaignExists(campaignId)
        onlyAdmin(campaignId)
        onlyActiveCampaign(campaignId)
    {
        require(amount > 0, "Amount must be greater than zero");
        require(
            campaigns[campaignId].balance >= amount,
            "Insufficient campaign balance"
        );

        uint256 requestId = expenseCounts[campaignId];

        ExpenseRequest storage newRequest =
            expenseRequests[campaignId][requestId];

        newRequest.description = description;
        newRequest.amount = amount;
        newRequest.approvalCount = 0;
        newRequest.finalized = false;

        expenseCounts[campaignId]++;

        emit ExpenseRequested(campaignId, requestId, amount);
    }

    // 4. Menambahkan validator dengan voting
    function addValidator(uint256 campaignId, address validator)
        external
        campaignExists(campaignId)
        onlyValidator(campaignId)
        onlyActiveCampaign(campaignId)
    {
        require(!campaigns[campaignId].validators[validator], "Already validator");

        campaigns[campaignId].validators[validator] = true;
        campaigns[campaignId].validatorList.push(validator);
        campaigns[campaignId].validatorCount++;

        emit ValidatorAdded(campaignId, validator);
    }

    
    // READ FUNCTIONS
    // 5. Melihat detail campaign
    function getCampaign(uint256 campaignId)
        external
        view
        campaignExists(campaignId)
        returns (
            string memory,
            address,
            uint256,
            uint256,
            bool
        )
    {
        Campaign storage c = campaigns[campaignId];
        return (
            c.name,
            c.admin,
            c.targetAmount,
            c.balance,
            c.active
        );
    }

    // 6. Melihat balance campaign
    function getBalance(uint256 campaignId)
        external
        view
        campaignExists(campaignId)
        returns (uint256)
    {
        return campaigns[campaignId].balance;
    }

    // 7. Melihat detail request pengeluaran dana   
    function getExpenseRequest(uint256 campaignId, uint256 requestId)
        external
        view
        campaignExists(campaignId)
        returns (
            string memory description,
            uint256 amount,
            uint256 approvalCount,
            bool finalized
        )
    {
        ExpenseRequest storage req =
            expenseRequests[campaignId][requestId];

        return (
            req.description,
            req.amount,
            req.approvalCount,
            req.finalized
        );
    }

    // 8. Melihat status validator
    function getValidatorStatus(uint256 campaignId, address validator)
        external
        view
        campaignExists(campaignId)
        returns (bool)
    {
        return campaigns[campaignId].validators[validator];
    }

    // 9. Melihat jumlah request pengeluaran dana
    function getExpenseCount(uint256 campaignId)
        external
        view
        campaignExists(campaignId)
        returns (uint256)
    {
        return expenseCounts[campaignId];
    }

    // 10. Melihat list validator
    function getValidatorList(uint256 campaignId)
        external
        view
        campaignExists(campaignId)
        returns (address[] memory)
    {
        return campaigns[campaignId].validatorList;
    }

    // 11. Cek apakah validator sudah menyetujui request ini
    function hasApproved(uint256 campaignId, uint256 requestId, address validator)
        external
        view
        campaignExists(campaignId)
        returns (bool)
    {
        return expenseRequests[campaignId][requestId].approvals[validator];
    }

    
    // UPDATE FUNCTIONS
    // 11. Menyetujui request pengeluaran dana
    function approveExpense(
        uint256 campaignId,
        uint256 requestId
    )
        external
        campaignExists(campaignId)
        onlyValidator(campaignId)
    {
        ExpenseRequest storage req =
            expenseRequests[campaignId][requestId];

        require(!req.finalized, "Request already finalized");
        require(!req.approvals[msg.sender], "Already approved");

        req.approvals[msg.sender] = true;
        req.approvalCount++;

        emit ExpenseApproved(campaignId, requestId, msg.sender);
    }

    // 12. Mengubah target dana campaign
    function updateCampaignTarget(
        uint256 campaignId,
        uint256 newTarget
    )
        external
        campaignExists(campaignId)
        onlyAdmin(campaignId)
    {
        require(newTarget > 0, "Invalid target amount");

        campaigns[campaignId].targetAmount = newTarget;
        emit CampaignTargetUpdated(campaignId, newTarget);
    }

    
    // DELETE / FINALIZE FUNCTIONS
    // 13. Finalisasi request pengeluaran dana
    function finalizeExpense(
        uint256 campaignId,
        uint256 requestId
    )
        external
        campaignExists(campaignId)
        onlyAdmin(campaignId)
    {
        ExpenseRequest storage req =
            expenseRequests[campaignId][requestId];

        require(!req.finalized, "Already finalized");
        require(req.approvalCount >= 2, "Not enough approvals");

        Campaign storage c = campaigns[campaignId];
        require(c.balance >= req.amount, "Insufficient balance");

        c.balance -= req.amount;
        req.finalized = true;

        (bool success, ) = c.admin.call{value: req.amount}("");
        require(success, "Transfer failed");

        emit ExpenseFinalized(campaignId, requestId);
    }

    // 14. Menonaktifkan campaign
    function deactivateCampaign(uint256 campaignId)
        external
        campaignExists(campaignId)
        onlyAdmin(campaignId)
    {
        campaigns[campaignId].active = false;
        emit CampaignDeactivated(campaignId);
    }

    // 15. Menghapus validator
    function removeValidator(uint256 campaignId, address validator)
        external
        campaignExists(campaignId)
        onlyValidator(campaignId)
        onlyActiveCampaign(campaignId)
    {
        Campaign storage c = campaigns[campaignId];
        require(c.validators[validator], "Not validator");

        c.validators[validator] = false;
        c.validatorCount--;

        // Remove from list
        for (uint i = 0; i < c.validatorList.length; i++) {
            if (c.validatorList[i] == validator) {
                c.validatorList[i] = c.validatorList[c.validatorList.length - 1];
                c.validatorList.pop();
                break;
            }
        }

        emit ValidatorRemoved(campaignId, validator);
    }

    // 16. Membuat request penarikan sisa dana campaign yang sudah ditutup : Ini tetap memerlukan persetujuan validator (voting)
    function withdrawRemaining(uint256 campaignId)
        external
        campaignExists(campaignId)
        onlyAdmin(campaignId)
    {
        Campaign storage c = campaigns[campaignId];
        require(!c.active, "Campaign must be deactivated first");
        require(c.balance > 0, "No remaining balance");

        uint256 amount = c.balance;

        // Record to history as a new request
        uint256 requestId = expenseCounts[campaignId];
        ExpenseRequest storage newRequest = expenseRequests[campaignId][requestId];
        newRequest.description = "Penarikan Sisa Dana (Penutupan Campaign)";
        newRequest.amount = amount;
        newRequest.finalized = false; // finalisasi tetap melalui voting
        newRequest.approvalCount = 0;
        
        expenseCounts[campaignId]++;

        emit ExpenseRequested(campaignId, requestId, amount);
    }
}