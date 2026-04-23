import { ethers } from "ethers";
import { ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface CampaignCardProps {
  id: number;
  name: string;
  targetAmount: bigint;
  balance: bigint;
  active: boolean;
  admin: string;
  onClick: () => void;
}

export default function CampaignCard({
  id,
  name,
  targetAmount,
  balance,
  active,
  admin,
  onClick,
}: CampaignCardProps) {
  const targetEth = Number(ethers.formatEther(targetAmount || 0));
  const balanceEth = Number(ethers.formatEther(balance || 0));
  const progressPercentage = targetEth > 0 ? Math.min((balanceEth / targetEth) * 100, 100) : 0;

  return (
    <Card 
      onClick={onClick}
      className={`group cursor-pointer hover:border-primary/50 hover:shadow-primary/10 ${!active && 'opacity-80'}`}
    >
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-xl group-hover:text-primary transition-colors">{name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono bg-slate-800/50">ID: {id}</Badge>
              <Badge variant="outline" className="font-mono bg-slate-800/50 hidden sm:inline-flex">
                Admin: {admin.substring(0, 4)}...{admin.substring(admin.length - 4)}
              </Badge>
            </div>
          </div>
          <Badge variant={active ? "success" : "danger"} className="gap-1 px-3 py-1">
            {active ? <ShieldCheck size={12} /> : <AlertCircle size={12} />}
            {active ? "Active" : "Closed"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Terkumpul</span>
          <span className="text-white font-bold">{balanceEth.toFixed(4)} ETH</span>
        </div>

        <div className="space-y-2">
          <div className="w-full bg-slate-800/60 rounded-full h-2 overflow-hidden border border-slate-700/30">
            <div 
              className="h-full rounded-full bg-linear-to-r from-primary to-accent transition-all duration-1000 ease-out relative"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute top-0 right-0 bottom-0 w-12 bg-white/10 blur-sm animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-slate-500 font-bold">
            <span>{progressPercentage.toFixed(0)}% Selesai</span>
            <span>Target: {targetEth.toFixed(2)} ETH</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex items-center text-primary text-sm font-semibold group-hover:gap-2 transition-all">
          Lihat Detail <ArrowRight size={16} className="ml-1 opacity-0 group-hover:opacity-100 transition-all" />
        </div>
      </CardFooter>
    </Card>
  );
}
