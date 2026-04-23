"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import Navbar from "../components/Navbar";
import CampaignCard from "../components/CampaignCard";
import CampaignDetailModal from "../components/CampaignDetailModal";
import useContract from "../features/contract/hooks/useContract";
import { PlusCircle, Wallet, LayoutGrid, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { CampaignData } from "@/features/contract/types";

export default function Home() {
  const { account, contract, connectWallet } = useContract();

  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [selectedCampaign, setSelectedCampaign] = useState<CampaignData | null>(
    null,
  );

  const fetchCampaigns = useCallback(async () => {
    if (!contract) return;
    try {
      setLoading(true);
      const countStr = await contract.campaignCount();
      const count = Number(countStr);

      const list: CampaignData[] = [];
      for (let i = 0; i < count; i++) {
        const data = await contract.getCampaign(i);
        list.push({
          id: i,
          name: data[0],
          admin: data[1],
          targetAmount: data[2],
          balance: data[3],
          active: data[4],
        });
      }
      setCampaigns(list.reverse()); // Show newest first
    } catch (e) {
      console.error("Error fetching campaigns:", e);
      toast.error("Gagal mengambil data campaign");
    } finally {
      setLoading(false);
    }
  }, [contract]);

  useEffect(() => {
    if (contract) fetchCampaigns();
    else setLoading(false);
  }, [contract, fetchCampaigns]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !newName || !newTarget) return;

    setIsCreating(true);
    const toastId = toast.loading("Sedang membuat campaign...");
    try {
      const tx = await contract.createCampaign(
        newName,
        ethers.parseEther(newTarget),
      );
      await tx.wait();
      toast.success("Campaign berhasil dibuat!", { id: toastId });
      setNewName("");
      setNewTarget("");
      setShowCreate(false);
      fetchCampaigns();
    } catch (e: unknown) {
      console.error(e);
      toast.error(
        (e as { reason?: string }).reason || "Gagal membuat campaign",
        { id: toastId },
      );
    } finally {
      setIsCreating(false);
    }
  };

  const selectedCampaignLatestData =
    campaigns.find((c) => c.id === selectedCampaign?.id) || null;

  return (
    <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full font-sans">
      <Navbar />

      {/* HERO SECTION */}
      <div className="text-center mb-20 relative px-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-64 bg-primary/10 blur-[120px] pointer-events-none rounded-full"></div>

        <h1 className="font-display relative z-10 text-5xl sm:text-7xl font-black text-white mb-8 tracking-tight leading-[1.1]">
          Transparansi Dana <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-accent to-primary animate-gradient-x">
            Upacara Desa Adat
          </span>
        </h1>

        <p className="relative z-10 text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 font-light leading-relaxed">
          Platform terpercaya untuk pengelolaan donasi upacara adat yang aman,
          transparan, dan terverifikasi secara on-chain.
        </p>

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {!account ? (
            <Button
              size="lg"
              onClick={connectWallet}
              className="w-full sm:w-auto px-10 py-7 text-lg rounded-2xl group"
            >
              <Wallet
                className="mr-2 group-hover:rotate-12 transition-transform"
                size={24}
              />
              Hubungkan Dompet
            </Button>
          ) : (
            <Button
              size="lg"
              variant="primary"
              onClick={() => setShowCreate(true)}
              className="w-full sm:w-auto px-8 rounded-2xl"
            >
              <PlusCircle size={20} className="mr-2" />
              Buat Campaign Baru
            </Button>
          )}
        </div>
      </div>

      {/* CREATE CAMPAIGN MODAL */}
      <AnimatePresence>
        {showCreate && account && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => !isCreating && setShowCreate(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg"
            >
              <Card className="border-primary/20 shadow-primary/5 overflow-hidden">
                <CardHeader className="bg-primary/5 flex flex-row items-center justify-between pb-8">
                  <div className="space-y-1">
                    <CardTitle>Campaign Baru</CardTitle>
                    <CardDescription>
                      Mulai penggalangan dana untuk desa adat Anda.
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowCreate(false)}
                    disabled={isCreating}
                    className="rounded-full h-8 w-8"
                  >
                    <X size={18} />
                  </Button>
                </CardHeader>
                <CardContent className="pt-8">
                  <form onSubmit={handleCreateCampaign} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">
                        Nama Upacara
                      </label>
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Misal: Ngaben Massal 2026"
                        required
                        className="bg-slate-950/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">
                        Target Dana (ETH)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newTarget}
                        onChange={(e) => setNewTarget(e.target.value)}
                        placeholder="0.00"
                        required
                        className="bg-slate-950/50"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreate(false)}
                        disabled={isCreating}
                        className="flex-1 rounded-xl"
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        loading={isCreating}
                        className="flex-3 py-6 rounded-xl"
                      >
                        Simpan Campaign
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CAMPAIGN LIST */}
      <div className="space-y-16">
        {/* ACTIVE CAMPAIGNS */}
        <div className="space-y-10">
          <div className="flex items-center justify-between border-b border-white/10 pb-6">
            <h2 className="font-display text-3xl font-bold text-white flex items-center gap-3">
              <LayoutGrid className="text-primary" size={28} />
              Sedang Berjalan
            </h2>
            {!loading && campaigns.filter((c) => c.active).length > 0 && (
              <span className="text-slate-500 font-mono text-sm">
                {campaigns.filter((c) => c.active).length} Active Campaigns
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="text-slate-500 animate-pulse">
                Memuat data blockchain...
              </p>
            </div>
          ) : campaigns.filter((c) => c.active).length === 0 ? (
            <Card className="py-24 text-center bg-slate-800/10 border-dashed border-slate-700/50">
              <p className="text-slate-400 text-lg">
                Belum ada campaign aktif saat ini.
              </p>
              {account && (
                <Button
                  variant="ghost"
                  className="mt-4"
                  onClick={() => setShowCreate(true)}
                >
                  Jadilah yang pertama untuk membuat!
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {campaigns
                .filter((c) => c.active)
                .map((camp) => (
                  <CampaignCard
                    key={camp.id}
                    {...camp}
                    onClick={() => setSelectedCampaign(camp)}
                  />
                ))}
            </div>
          )}
        </div>

        {/* INACTIVE/CLOSED CAMPAIGNS */}
        {!loading && campaigns.filter((c) => !c.active).length > 0 && (
          <div className="space-y-10 pt-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-6 opacity-60">
              <h2 className="text-2xl font-bold text-slate-400 flex items-center gap-3">
                <LayoutGrid className="text-slate-500" size={24} />
                Telah Selesai [Arsip]
              </h2>
              <span className="text-slate-600 font-mono text-sm">
                {campaigns.filter((c) => !c.active).length} Closed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
              {campaigns
                .filter((c) => !c.active)
                .map((camp) => (
                  <CampaignCard
                    key={camp.id}
                    {...camp}
                    onClick={() => setSelectedCampaign(camp)}
                  />
                ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL */}
      <CampaignDetailModal
        isOpen={!!selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
        campaign={selectedCampaignLatestData as CampaignData}
        campaignId={selectedCampaignLatestData?.id as number}
        contract={contract as ethers.Contract}
        account={account}
        refreshCampaigns={fetchCampaigns}
      />
    </main>
  );
}
