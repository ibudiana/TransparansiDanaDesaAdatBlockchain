import { useState, useEffect, useCallback } from "react";
import { ethers, type Eip1193Provider } from "ethers";
import { toast } from "sonner";
import artifact from "../../../lib/hardhat/DanaUpacaraDesaAdat.json";
import { CONTRACT_ADDRESS } from "../../../lib/hardhat/config";

type EthereumProvider = Eip1193Provider & {
  on(event: string, listener: (...args: unknown[]) => void): void;
  removeListener(event: string, listener: (...args: unknown[]) => void): void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export default function useContract() {
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Initialize without prompting
  const init = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      const _provider = new ethers.BrowserProvider(window.ethereum);

      // debug harus pakai provider lokal, bukan state
      // const code = await _provider.getCode(CONTRACT_ADDRESS);
      // console.log("BYTECODE:", code);

      const accounts = await _provider.send("eth_accounts", []);

      const signer = accounts.length ? await _provider.getSigner() : null;

      const _contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        artifact.abi,
        signer ?? _provider,
      );

      setProvider(_provider);
      setContract(_contract);
      setAccount(accounts[0] ?? null);
    } catch (err) {
      console.error("Auto-connect failed:", err);
    }
  }, []);

  useEffect(() => {
    init();

    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", init);
      window.ethereum.on("chainChanged", () => window.location.reload());
    }

    return () => {
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeListener("accountsChanged", init);
      }
    };
  }, [init]);

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      toast.error(
        "MetaMask tidak terdeteksi. Silakan pasang MetaMask terlebih dahulu!",
      );
      return;
    }

    setIsConnecting(true);
    try {
      const _provider = new ethers.BrowserProvider(window.ethereum);
      // const network = await _provider.getNetwork();

      // if (Number(network.chainId) !== 31337) {
      //   try {
      //     await window.ethereum.request({
      //       method: "wallet_switchEthereumChain",
      //       params: [{ chainId: "0x7a69" }], // 31337 in hex
      //     });
      //     return; // Halaman akan reload via event chainChanged
      //   } catch (switchError: unknown) {
      //     if (hasCode(switchError) && switchError.code === 4902) {
      //       console.error(
      //         "Localhost 8545 network is not added to your MetaMask.",
      //       );
      //     }
      //     setIsConnecting(false);
      //     return;
      //   }
      // }

      const accounts = await _provider.send("eth_requestAccounts", []);
      const signer = await _provider.getSigner();
      const _contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        artifact.abi,
        signer,
      );

      setAccount(accounts[0]);
      setContract(_contract);
      setProvider(_provider);
    } catch (err) {
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };

  return { account, contract, provider, isConnecting, connectWallet };
}
