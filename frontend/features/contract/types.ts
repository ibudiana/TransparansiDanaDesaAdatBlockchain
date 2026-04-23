export interface Campaign {
  name: string;
  admin: string;
  targetAmount: bigint;
  balance: bigint;
  active: boolean;
  validatorList?: string[];
}

export interface CampaignData {
  id: number;
  name: string;
  admin: string;
  targetAmount: bigint;
  balance: bigint;
  active: boolean;
  validatorList?: string[];
}

export type Toast = {
  id: number;
  message: string;
  type: "success" | "error" | "info";
};
