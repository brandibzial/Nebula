"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";

type MetaMaskState = {
  isConnected: boolean;
  address?: `0x${string}`;
  chainId?: number;
  provider?: ethers.Eip1193Provider;
  signer?: ethers.JsonRpcSigner;
  readonlyProvider?: ethers.Provider;
  connect: () => Promise<void>;
};

type EventfulProvider = ethers.Eip1193Provider & {
  on?: (event: string, listener: (...args: any[]) => void) => void;
  removeListener?: (event: string, listener: (...args: any[]) => void) => void;
};

export function useMetaMask(): MetaMaskState {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<`0x${string}` | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>(undefined);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  const [readonlyProvider, setReadonlyProvider] = useState<ethers.Provider | undefined>(undefined);

  useEffect(() => {
    const eth = (globalThis as any).ethereum as EventfulProvider | undefined;
    if (eth) {
      setProvider(eth);
      eth.request?.({ method: "eth_accounts" }).then((accounts) => {
        if (Array.isArray(accounts) && accounts.length > 0) {
          setIsConnected(true);
          setAddress(accounts[0] as `0x${string}`);
        }
      });
      eth.request?.({ method: "eth_chainId" }).then((cid) => {
        if (typeof cid === "string") {
          setChainId(parseInt(cid, 16));
        }
      });
      const onAccountsChanged = (accs: string[]) => {
        if (accs.length > 0) {
          setIsConnected(true);
          setAddress(accs[0] as `0x${string}`);
        } else {
          setIsConnected(false);
          setAddress(undefined);
        }
      };
      const onChainChanged = (cid: string) => {
        setChainId(parseInt(cid, 16));
      };
      eth.on?.("accountsChanged", onAccountsChanged);
      eth.on?.("chainChanged", onChainChanged);
      return () => {
        eth.removeListener?.("accountsChanged", onAccountsChanged);
        eth.removeListener?.("chainChanged", onChainChanged);
      };
    }
  }, []);

  useEffect(() => {
    if (!provider) return;
    try {
      const web3 = new ethers.BrowserProvider(provider);
      web3.getSigner().then(setSigner).catch(() => setSigner(undefined));
      setReadonlyProvider(web3);
    } catch {
      setSigner(undefined);
      setReadonlyProvider(undefined);
    }
  }, [provider, address, chainId]);

  const connect = async () => {
    const eth = (globalThis as any).ethereum as EventfulProvider | undefined;
    if (!eth) {
      alert("请安装 MetaMask");
      return;
    }
    try {
      const accs = (await eth.request?.({ method: "eth_requestAccounts" })) as string[];
      if (Array.isArray(accs) && accs.length > 0) {
        setIsConnected(true);
        setAddress(accs[0] as `0x${string}`);
      }
      const cid = (await eth.request?.({ method: "eth_chainId" })) as string;
      setChainId(parseInt(cid, 16));
      setProvider(eth);
    } catch (e) {
      console.error(e);
    }
  };

  return { isConnected, address, chainId, provider, signer, readonlyProvider, connect };
}




