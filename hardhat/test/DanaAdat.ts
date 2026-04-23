import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("DanaUpacaraDesaAdat", function () {
  let contract: any;
  let admin: any, validator1: any, validator2: any, donor: any, other: any;
  const TARGET = ethers.parseEther("10");
  const DONATION = ethers.parseEther("5");
  const EXPENSE_AMOUNT = ethers.parseEther("2");

  beforeEach(async function () {
    [admin, validator1, validator2, donor, other] = await ethers.getSigners();

    const Contract = await ethers.getContractFactory("DanaUpacaraDesaAdat");
    contract = await Contract.deploy();
    await contract.waitForDeployment();
  });

  describe("Campaign Creation", function () {
    it("Should create a campaign successfully", async function () {
      await expect(
        contract.connect(admin).createCampaign("Upacara Ngaben", TARGET),
      )
        .to.emit(contract, "CampaignCreated")
        .withArgs(0, "Upacara Ngaben");

      const campaign = await contract.getCampaign(0);

      expect(campaign[0]).to.equal("Upacara Ngaben");
      expect(campaign[1]).to.equal(admin.address);
      expect(campaign[2]).to.equal(TARGET);
      expect(campaign[3]).to.equal(0);
      expect(campaign[4]).to.equal(true);
    });

    it("Should fail if target is zero", async function () {
      await expect(contract.createCampaign("Invalid", 0)).to.be.revertedWith(
        "Target must be greater than zero",
      );
    });
  });

  describe("Donations", function () {
    beforeEach(async function () {
      await contract.connect(admin).createCampaign("Ngaben", TARGET);
    });

    it("Should accept donations", async function () {
      await expect(
        contract.connect(donor).donate(0, {
          value: DONATION,
        }),
      )
        .to.emit(contract, "DonationReceived")
        .withArgs(0, donor.address, DONATION);

      const balance = await contract.getBalance(0);
      expect(balance).to.equal(DONATION);
    });

    it("Should reject zero donations", async function () {
      await expect(
        contract.connect(donor).donate(0, { value: 0 }),
      ).to.be.revertedWith("Donation must be greater than zero");
    });
  });

  describe("Validator Management", function () {
    beforeEach(async function () {
      await contract.connect(admin).createCampaign("Ngaben", TARGET);
    });

    it("Admin should be the first validator", async function () {
      expect(await contract.getValidatorStatus(0, admin.address)).to.equal(
        true,
      );
    });

    it("Should add a new validator", async function () {
      await expect(contract.connect(admin).addValidator(0, validator1.address))
        .to.emit(contract, "ValidatorAdded")
        .withArgs(0, validator1.address);

      expect(await contract.getValidatorStatus(0, validator1.address)).to.equal(
        true,
      );
    });

    it("Should remove a validator", async function () {
      await contract.connect(admin).addValidator(0, validator1.address);

      await expect(
        contract.connect(admin).removeValidator(0, validator1.address),
      )
        .to.emit(contract, "ValidatorRemoved")
        .withArgs(0, validator1.address);

      expect(await contract.getValidatorStatus(0, validator1.address)).to.equal(
        false,
      );
    });

    it("Non-validator cannot add validators", async function () {
      await expect(
        contract.connect(other).addValidator(0, validator2.address),
      ).to.be.revertedWith("Not validator");
    });
  });

  describe("Expense Requests", function () {
    beforeEach(async function () {
      await contract.connect(admin).createCampaign("Ngaben", TARGET);

      await contract.connect(admin).addValidator(0, validator1.address);

      await contract.connect(admin).addValidator(0, validator2.address);

      await contract.connect(donor).donate(0, {
        value: DONATION,
      });
    });

    it("Admin should create an expense request", async function () {
      await expect(
        contract
          .connect(admin)
          .requestExpense(0, EXPENSE_AMOUNT, "Beli Sarana"),
      )
        .to.emit(contract, "ExpenseRequested")
        .withArgs(0, 0, EXPENSE_AMOUNT);

      const request = await contract.getExpenseRequest(0, 0);
      expect(request.amount).to.equal(EXPENSE_AMOUNT);
      expect(request.finalized).to.equal(false);
    });

    it("Non-admin cannot create expense request", async function () {
      await expect(
        contract.connect(donor).requestExpense(0, EXPENSE_AMOUNT, "Invalid"),
      ).to.be.revertedWith("Not admin");
    });
  });

  describe("Expense Approval and Finalization", function () {
    beforeEach(async function () {
      await contract.connect(admin).createCampaign("Ngaben", TARGET);

      await contract.connect(admin).addValidator(0, validator1.address);

      await contract.connect(admin).addValidator(0, validator2.address);

      await contract.connect(donor).donate(0, {
        value: DONATION,
      });

      await contract
        .connect(admin)
        .requestExpense(0, EXPENSE_AMOUNT, "Biaya Upacara");
    });

    it("Validators should approve expense", async function () {
      await contract.connect(validator1).approveExpense(0, 0);

      await contract.connect(validator2).approveExpense(0, 0);

      const request = await contract.getExpenseRequest(0, 0);
      expect(request.approvalCount).to.equal(2);
    });

    it("Should prevent duplicate approvals", async function () {
      await contract.connect(validator1).approveExpense(0, 0);

      await expect(
        contract.connect(validator1).approveExpense(0, 0),
      ).to.be.revertedWith("Already approved");
    });

    it("Admin should finalize expense after approvals", async function () {
      await contract.connect(validator1).approveExpense(0, 0);

      await contract.connect(validator2).approveExpense(0, 0);

      await expect(contract.connect(admin).finalizeExpense(0, 0)).to.emit(
        contract,
        "ExpenseFinalized",
      );
    });

    it("Should fail finalization with insufficient approvals", async function () {
      await contract.connect(validator1).approveExpense(0, 0);

      await expect(
        contract.connect(admin).finalizeExpense(0, 0),
      ).to.be.revertedWith("Not enough approvals");
    });
  });

  describe("Campaign Management", function () {
    beforeEach(async function () {
      await contract.connect(admin).createCampaign("Ngaben", TARGET);
    });

    it("Admin can update campaign target", async function () {
      const newTarget = ethers.parseEther("20");

      await expect(contract.connect(admin).updateCampaignTarget(0, newTarget))
        .to.emit(contract, "CampaignTargetUpdated")
        .withArgs(0, newTarget);

      const campaign = await contract.getCampaign(0);
      expect(campaign[2]).to.equal(newTarget);
    });

    it("Admin can deactivate campaign", async function () {
      await expect(contract.connect(admin).deactivateCampaign(0)).to.emit(
        contract,
        "CampaignDeactivated",
      );

      const campaign = await contract.getCampaign(0);
      expect(campaign[4]).to.equal(false);
    });

    it("Should prevent donation to inactive campaign", async function () {
      await contract.connect(admin).deactivateCampaign(0);

      await expect(
        contract.connect(donor).donate(0, {
          value: DONATION,
        }),
      ).to.be.revertedWith("Campaign is inactive");
    });
  });
});
