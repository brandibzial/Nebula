'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMetaMask } from '@/hooks/useMetaMask';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ethers } from 'ethers';
import { NebulaResumeABI } from '@/abi/NebulaResumeABI';
import { NebulaResumeAddresses } from '@/abi/NebulaResumeAddresses';

export default function MyProfilesPage() {
  const { address, chainId, isConnected, connect } = useMetaMask();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const contractInfo = NebulaResumeAddresses[chainId?.toString() as keyof typeof NebulaResumeAddresses];
  const contractAddress = contractInfo?.address as `0x${string}` | undefined;

  useEffect(() => {
    if (isConnected && address && contractAddress) {
      load();
    }
  }, [isConnected, address, contractAddress]);

  const load = async () => {
    if (!contractAddress || !address) return;
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const contract = new ethers.Contract(contractAddress, NebulaResumeABI.abi, provider);
      const ids: bigint[] = await contract.getProfilesByUser(address);

      const list: any[] = [];
      for (const id of ids) {
        try {
          const r = await contract.getProfile(id);
          list.push({
            id: Number(id),
            metadataCID: r.metadataCID,
            owner: r.owner,
            experienceCount: r.experiences?.length || 0,
            verifiedCount: r.experiences?.filter((e: any) => e.verified).length || 0,
          });
        } catch {}
      }
      setProfiles(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full text-center border-2 border-cyan-500/30">
          <CardContent className="py-12">
            <div className="text-6xl mb-6">🔒</div>
            <h3 className="text-xl font-bold uppercase neon-glow mb-4">ACCESS DENIED</h3>
            <p className="text-gray-400 mb-6">Connect your wallet to view your resumes</p>
            <Button onClick={connect} size="lg">⚡ CONNECT WALLET</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 页头 */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 blur-2xl" />
        <div className="relative cyber-card p-8 border-2 border-purple-500/30 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-wider neon-glow-pink">MY RESUMES</h1>
            <p className="text-sm text-purple-400 tracking-widest mt-1">My On-Chain Resume Archive</p>
          </div>
          <Link href="/create">
            <Button size="lg">
              ⚡ CREATE NEW
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="cyber-spinner mx-auto" />
          <p className="mt-6 text-cyan-400 font-mono tracking-wider animate-pulse">LOADING DATA...</p>
        </div>
      ) : profiles.length === 0 ? (
        <Card className="border-2 border-purple-500/30">
          <CardContent className="text-center py-16">
            <div className="text-7xl mb-6">📋</div>
            <h3 className="text-2xl font-black uppercase neon-glow-pink mb-3">NO RESUMES FOUND</h3>
            <p className="text-gray-400 mb-8">Create your first cyber resume and start your on-chain career</p>
            <Link href="/create">
              <Button size="lg">⚡ START CREATE</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((r) => (
            <Card key={r.id} className="group hover:scale-105 hover:border-cyan-400/50 transition-all duration-300">
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl font-black uppercase neon-glow">
                    RESUME #{r.id}
                  </div>
                  <div className="px-2 py-1 bg-purple-500/20 border border-purple-400/40 text-xs font-mono text-purple-300"
                       style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))' }}>
                    {r.verifiedCount}/{r.experienceCount}
                  </div>
                </div>
                
                <div className="cyber-divider my-4" />
                
                <div className="flex gap-3">
                  <Link href={`/resume/${r.id}`} className="flex-1">
                    <Button size="sm" className="w-full">VIEW</Button>
                  </Link>
                  <Link href={`/edit/${r.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full">EDIT</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


