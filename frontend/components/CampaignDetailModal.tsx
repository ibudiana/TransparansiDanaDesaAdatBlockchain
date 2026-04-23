"use client";

import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  X,
  ShieldCheck,
  DollarSign,
  Settings,
  Users,
  CheckCircle,
  HandCoins,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CampaignData } from "@/features/contract/types";

interface ExpenseRequest {
  id: number;
  description: string;
  amount: bigint;
  approvalCount: bigint;
  finalized: boolean;
  alreadyApproved: boolean;
}

interface CampaignDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: number;
  campaign: CampaignData;
  contract: ethers.Contract;
  account: string | null;
  refreshCampaigns: () => void;
}

export default function CampaignDetailModal({
  isOpen,
  onClose,
  campaignId,
  campaign,
  contract,
  account,
  refreshCampaigns,
}: CampaignDetailModalProps) {
  const [expenses, setExpenses] = useState<ExpenseRequest[]>([]);
  const [validators, setValidators] = useState<string[]>([]);
  const [donationAmount, setDonationAmount] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmt, setExpenseAmt] = useState("");
  const [valAddress, setValAddress] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const isAdmin =
    account &&
    campaign?.admin &&
    account.toLowerCase() === campaign.admin.toLowerCase();

  const isValidator =
    account &&
    validators.some((v) => v.toLowerCase() === account.toLowerCase());

  const targetEth = campaign
    ? Number(ethers.formatEther(campaign.targetAmount))
    : 0;
  const balanceEth = campaign
    ? Number(ethers.formatEther(campaign.balance))
    : 0;
  const progressPercentage =
    targetEth > 0 ? Math.min((balanceEth / targetEth) * 100, 100) : 0;

  const fetchData = useCallback(async () => {
    if (!contract || !campaign) return;
    try {
      // Fetch Expenses
      const count = await contract.getExpenseCount(campaignId);
      const expenseList = [];
      for (let i = 0; i < Number(count); i++) {
        const req = await contract.getExpenseRequest(campaignId, i);

        let alreadyApproved = false;
        if (account) {
          try {
            alreadyApproved = await contract.hasApproved(
              campaignId,
              i,
              account,
            );
          } catch (e) {
            console.warn("hasApproved check failed for index", i, e);
          }
        }

        expenseList.push({
          id: i,
          description: req[0],
          amount: req[1],
          approvalCount: req[2],
          finalized: req[3],
          alreadyApproved,
        });
      }
      setExpenses(expenseList);

      // Fetch Validators
      const valList = await contract.getValidatorList(campaignId);
      setValidators(valList);
    } catch (e) {
      console.error("Fetch data error:", e);
    }
  }, [account, campaign, campaignId, contract]);

  useEffect(() => {
    if (isOpen && contract) {
      fetchData();
    }
  }, [isOpen, contract, fetchData]);

  const handleAction = async (
    actionName: string,
    actionFn: () => Promise<ethers.ContractTransactionResponse>,
  ) => {
    setLoadingAction(actionName);
    const toastId = toast.loading(`Process: ${actionName}...`);
    try {
      const tx = await actionFn();
      await tx.wait();
      toast.success(`${actionName} completed successfully!`, { id: toastId });
      refreshCampaigns();
      fetchData();
    } catch (e: unknown) {
      console.error(e);
      toast.error(
        (e as { reason?: string; message?: string }).reason ||
          (e as { message?: string }).message ||
          `${actionName} failed`,
        { id: toastId },
      );
    } finally {
      setLoadingAction(null);
    }
  };

  if (!isOpen || !campaign) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-white/10 p-6 sm:p-8 flex flex-col gap-6 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] scrollbar-hide"
      >
        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex gap-3 items-center">
              <h2 className="text-3xl font-extrabold text-white">
                {campaign.name}
              </h2>
              <div className="flex gap-2">
                <Badge variant={campaign.active ? "success" : "danger"}>
                  {campaign.active ? "Active" : "Closed"}
                </Badge>
                {isAdmin && (
                  <Badge
                    variant="info"
                    className="bg-primary/20 text-primary border-primary/20"
                  >
                    Admin
                  </Badge>
                )}
                {isValidator && !isAdmin && (
                  <Badge
                    variant="info"
                    className="bg-accent/20 text-accent border-accent/20"
                  >
                    Validator Account
                  </Badge>
                )}
              </div>
            </div>
            <p
              className="text-slate-400 font-mono text-sm max-w-50 sm:max-w-none truncate"
              title={campaign.admin}
            >
              Admin: {campaign.admin}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X size={20} />
          </Button>
        </div>

        {/* PROGRESS */}
        <Card className="bg-slate-800/40 p-6">
          <div className="flex justify-between text-sm sm:text-base mb-4">
            <div>
              <span className="text-slate-400 block sm:inline">Terkumpul</span>
              <div className="text-white font-bold text-2xl">
                {balanceEth.toFixed(4)} ETH
              </div>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block sm:inline">Target</span>
              <div className="text-slate-300 font-medium">
                {targetEth.toFixed(4)} ETH
              </div>
            </div>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-linear-to-r from-primary to-accent relative"
            >
              <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
            </motion.div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          {/* DONATE SECTION */}
          {campaign.active && (
            <Card
              className={`bg-slate-800/20 p-5 ${isAdmin ? "md:col-span-1" : "md:col-span-2"}`}
            >
              <h3 className="flex items-center gap-2 text-primary font-semibold text-lg mb-6">
                <HandCoins size={20} /> Dukung Campaign Ini
              </h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={() =>
                      handleAction("Donating", () =>
                        contract.donate(campaignId, {
                          value: ethers.parseEther(donationAmount),
                        }),
                      )
                    }
                    loading={loadingAction === "Donating"}
                    className="px-8 shadow-primary/20"
                  >
                    Donate
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* ADMIN TOOLS */}
          {isAdmin && (
            <Card className="bg-primary/5 border-primary/20 p-5 md:col-span-1 md:row-span-3">
              <h3 className="flex items-center gap-2 text-primary text-lg font-semibold mb-6 border-b border-primary/10 pb-2">
                <Settings size={20} /> Admin Control
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                    Request Pengeluaran
                  </label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Deskripsi misal: Beli Bunga"
                      value={expenseDesc}
                      onChange={(e) => setExpenseDesc(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="ETH"
                        value={expenseAmt}
                        onChange={(e) => setExpenseAmt(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={() =>
                          handleAction("Request Expense", () =>
                            contract.requestExpense(
                              campaignId,
                              ethers.parseEther(expenseAmt),
                              expenseDesc,
                            ),
                          )
                        }
                        variant="secondary"
                        size="sm"
                      >
                        Ajukan
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                    Kelola Validator
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="0x..."
                      value={valAddress}
                      onChange={(e) => setValAddress(e.target.value)}
                      className="flex-1 font-mono text-xs"
                    />
                    <Button
                      onClick={() =>
                        handleAction("Add Validator", () =>
                          contract.addValidator(campaignId, valAddress),
                        )
                      }
                      variant="outline"
                      size="sm"
                      className="w-10"
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                    Update Target (ETH)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Baru"
                      value={newTarget}
                      onChange={(e) => setNewTarget(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={() =>
                        handleAction("Update Target", () =>
                          contract.updateCampaignTarget(
                            campaignId,
                            ethers.parseEther(newTarget),
                          ),
                        )
                      }
                      variant="secondary"
                      size="sm"
                    >
                      Update
                    </Button>
                  </div>
                </div>

                {campaign.active ? (
                  <Button
                    onClick={() =>
                      handleAction("Deactivate Campaign", () =>
                        contract.deactivateCampaign(campaignId),
                      )
                    }
                    variant="danger"
                    className="w-full mt-4"
                  >
                    Tutup Campaign
                  </Button>
                ) : (
                  balanceEth > 0 && (
                    <Button
                      onClick={() =>
                        handleAction("Pengajuan Penarikan", () =>
                          contract.withdrawRemaining(campaignId),
                        )
                      }
                      className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
                    >
                      <HandCoins className="mr-2" size={18} /> Ajukan Penarikan
                      Sisa Dana ({balanceEth.toFixed(4)} ETH)
                    </Button>
                  )
                )}
              </div>
            </Card>
          )}

          {/* VALIDATOR LIST */}
          <Card
            className={`bg-slate-800/20 p-5 ${isAdmin ? "md:col-span-1" : "md:col-span-2"}`}
          >
            <h3 className="flex items-center gap-2 text-primary font-semibold text-lg mb-6">
              <ShieldCheck size={20} /> Daftar Validator
            </h3>
            <div className="space-y-2 max-h-50 overflow-y-auto pr-2 custom-scrollbar">
              {validators.map((addr) => (
                <div
                  key={addr}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 group/item"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-slate-300 font-mono text-xs truncate max-w-37.5 sm:max-w-none">
                      {addr}
                      {addr.toLowerCase() === campaign.admin.toLowerCase() && (
                        <span className="ml-2 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-md uppercase font-bold">
                          Admin
                        </span>
                      )}
                      {account &&
                        addr.toLowerCase() === account.toLowerCase() && (
                          <span className="ml-2 text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-md uppercase font-bold">
                            You
                          </span>
                        )}
                    </span>
                  </div>
                  {isAdmin &&
                    addr.toLowerCase() !== campaign.admin.toLowerCase() && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleAction("Remove Validator", () =>
                            contract.removeValidator(campaignId, addr),
                          )
                        }
                        className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-opacity font-medium"
                      >
                        Remove
                      </Button>
                    )}
                </div>
              ))}
            </div>
          </Card>

          {/* EXPENSES LIST */}
          <Card
            className={`bg-slate-800/20 p-5 ${isAdmin ? "md:col-span-1" : "md:col-span-2"}`}
          >
            <h3 className="flex items-center gap-2 text-accent font-semibold text-lg mb-6">
              <DollarSign size={20} /> Riwayat Pengeluaran
            </h3>

            <div className="space-y-4 max-h-100 overflow-y-auto pr-2 custom-scrollbar">
              {expenses.length === 0 ? (
                <div className="text-center py-10 text-slate-500 italic">
                  Belum ada pengajuan pengeluaran.
                </div>
              ) : (
                expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className={`p-4 rounded-2xl border transition-all ${exp.finalized ? "bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/5 shadow-inner" : "bg-white/5 border-white/10"}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-semibold text-white text-lg">
                        {exp.description}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-accent border-accent/20 bg-accent/5 font-mono"
                      >
                        {Number(ethers.formatEther(exp.amount)).toFixed(4)} ETH
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Users size={16} />
                        <span className="font-medium">
                          {Number(exp.approvalCount)} Persetujuan
                        </span>
                      </div>

                      {exp.finalized ? (
                        <Badge variant="success" className="gap-1.5 px-3 py-1">
                          <CheckCircle size={14} /> Selesai
                        </Badge>
                      ) : (
                        <div className="flex gap-2">
                          {isValidator && !exp.alreadyApproved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleAction("Approve Expense", () =>
                                  contract.approveExpense(campaignId, exp.id),
                                )
                              }
                              className="text-xs h-8"
                            >
                              Validate
                            </Button>
                          )}

                          {isValidator && exp.alreadyApproved && (
                            <Badge
                              variant="outline"
                              className="text-emerald-400 border-emerald-400/20 bg-emerald-400/5 gap-1 shadow-inner"
                            >
                              <CheckCircle size={12} /> Validated
                            </Badge>
                          )}

                          {isAdmin && Number(exp.approvalCount) >= 2 && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleAction("Finalize Expense", () =>
                                  contract.finalizeExpense(campaignId, exp.id),
                                )
                              }
                              className="text-xs h-8 bg-emerald-500 text-slate-900 font-bold"
                            >
                              Cairkan
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
