"use client";

import { Wallet, Activity } from "lucide-react";
import useContract from "../features/contract/hooks/useContract";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function Navbar() {
  const { account, connectWallet, isConnecting } = useContract();

  const truncateAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="p-2 sm:p-2.5 bg-primary/10 text-primary rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
              <Activity size={24} />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-xl font-black text-white tracking-tighter">
                Dana<span className="text-primary group-hover:text-accent transition-colors">Adat</span>
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:block">
                Village Fund DApp
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!account ? (
              <Button
                onClick={connectWallet}
                loading={isConnecting}
                className="px-6 rounded-2xl shadow-primary/20"
              >
                {!isConnecting && <Wallet size={18} className="mr-2" />}
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="hidden md:flex gap-1.5 py-1 px-3 border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Connected
                </Badge>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 rounded-2xl border border-white/5 shadow-inner">
                  <span className="font-mono text-sm text-slate-200">
                    {truncateAddress(account)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
