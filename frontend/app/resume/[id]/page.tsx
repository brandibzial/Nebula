'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMetaMask } from '@/hooks/useMetaMask';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ethers } from 'ethers';
import { NebulaResumeABI } from '@/abi/NebulaResumeABI';
import { NebulaResumeAddresses } from '@/abi/NebulaResumeAddresses';
import { useFhevm } from '@/fhevm/useFhevm';
import { FhevmDecryptionSignature } from '@/fhevm/FhevmDecryptionSignature';
import { GenericStringInMemoryStorage } from '@/fhevm/GenericStringStorage';

export default function ProfileViewPage() {
  const params = useParams();
  const profileId = params.id as string;
  const { address, chainId, isConnected, provider } = useMetaMask();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<number | null>(null);

  const contractInfo = NebulaResumeAddresses[chainId?.toString() as keyof typeof NebulaResumeAddresses];
  const contractAddress = contractInfo?.address as `0x${string}` | undefined;

  const { instance: fhevmInstance, status: fhevmStatus } = useFhevm({
    provider: provider,
    chainId,
    initialMockChains: { 31337: 'http://localhost:8545' },
    enabled: true,
  });
  const [storage] = useState(() => new GenericStringInMemoryStorage());

  const [meta, setMeta] = useState<any | null>(null);
  const [metaError, setMetaError] = useState<string>('');

  const [repHandle, setRepHandle] = useState<string>('');
  const [noteHandle, setNoteHandle] = useState<string>('');
  const [repClear, setRepClear] = useState<string>('');
  const [noteClear, setNoteClear] = useState<string>('');
  const [fheBusy, setFheBusy] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    if (contractAddress && profileId) {
      loadProfile();
      loadHandles();
    }
  }, [contractAddress, profileId]);

  const loadProfile = async () => {
    if (!contractAddress) return;
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const contract = new ethers.Contract(contractAddress, NebulaResumeABI.abi, provider);
      const profileData = await contract.getProfile(profileId);
      setProfile({
        id: profileId,
        owner: profileData.owner,
        metadataCID: profileData.metadataCID,
        experiences: profileData.experiences || [],
      });
      try {
        setMetaError('');
        const cid: string = profileData.metadataCID;
        if (cid && typeof cid === 'string') {
          const url = cid.startsWith('ipfs://')
            ? cid.replace('ipfs://', 'https://ipfs.io/ipfs/')
            : `https://ipfs.io/ipfs/${cid}`;
          const resp = await fetch(url);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const json = await resp.json();
          setMeta(json);
        } else {
          setMeta(null);
        }
      } catch (e: any) {
        setMeta(null);
        setMetaError(`Failed to load metadata: ${e.message || e}`);
      }
    } catch (error) {
      console.error('Failed to load resume:', error);
      alert('Resume not found');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (d?: string) => {
    if (!d) return '';
    if (/^\d{4}-\d{2}/.test(d)) return d;
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
  };

  const loadHandles = async () => {
    try {
      if (!contractAddress) return;
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const contract = new ethers.Contract(contractAddress, NebulaResumeABI.abi, provider);
      const rh = await contract.getReputation(profileId);
      const nh = await contract.getPrivateMemo(profileId);
      setRepHandle(rh);
      setNoteHandle(nh);
    } catch {}
  };

  const handleVerify = async (expIndex: number) => {
    if (!contractAddress || !isConnected) {
      alert('Please connect wallet first');
      return;
    }
    setVerifying(expIndex);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, NebulaResumeABI.abi, signer);
      const tx = await contract.verifyMilestone(profileId, expIndex);
      await tx.wait();
      alert('Verification successful!');
      loadProfile();
    } catch (error: any) {
      alert(`Verification failed: ${error.message}`);
    } finally {
      setVerifying(null);
    }
  };

  const adjustReputation = async (delta: number) => {
    if (!fhevmInstance || !contractAddress || !isConnected) {
      alert('Please connect wallet and wait for FHEVM initialization');
      return;
    }
    setFheBusy(true);
    setMsg(`Encrypting and ${delta > 0 ? 'increasing' : 'decreasing'} reputation...`);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, NebulaResumeABI.abi, signer);

      const input = fhevmInstance.createEncryptedInput(contractAddress, signer.address as `0x${string}`);
      input.add32(Math.abs(delta));
      await new Promise((r) => setTimeout(r, 100));
      const enc = await input.encrypt();

      setMsg('Sending transaction...');
      const tx = delta > 0
        ? await contract.increaseReputation(profileId, enc.handles[0], enc.inputProof)
        : await contract.decreaseReputation(profileId, enc.handles[0], enc.inputProof);
      await tx.wait();
      setMsg('Completed, loading latest handle...');
      await loadHandles();
      setMsg('');
    } catch (e: any) {
      setMsg(`Failed: ${e.message}`);
    } finally {
      setFheBusy(false);
    }
  };

  const setRandomNote = async () => {
    if (!fhevmInstance || !contractAddress || !isConnected) {
      alert('Please connect wallet and wait for FHEVM initialization');
      return;
    }
    setFheBusy(true);
    const value = Math.floor(Math.random() * 1000000);
    setMsg(`Encrypting note: ${value}`);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, NebulaResumeABI.abi, signer);

      const input = fhevmInstance.createEncryptedInput(contractAddress, signer.address as `0x${string}`);
      input.add64(value);
      await new Promise((r) => setTimeout(r, 100));
      const enc = await input.encrypt();

      const tx = await contract.setPrivateMemo(profileId, enc.handles[0], enc.inputProof);
      await tx.wait();
      await loadHandles();
      setMsg('');
    } catch (e: any) {
      setMsg(`Failed: ${e.message}`);
    } finally {
      setFheBusy(false);
    }
  };

  const decryptHandle = async (handle: string, setClear: (v: string) => void) => {
    if (!fhevmInstance || !contractAddress || !isConnected) return;
    if (!handle || handle === ethers.ZeroHash) {
      setClear('0');
      return;
    }
    setFheBusy(true);
    setMsg('Building decryption signature...');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const sig = await FhevmDecryptionSignature.loadOrSign(
        fhevmInstance,
        [contractAddress],
        signer,
        storage
      );
      if (!sig) {
        setMsg('Signature failed');
        return;
      }
      setMsg('Decrypting...');
      const result = await fhevmInstance.userDecrypt(
        [{ handle, contractAddress }],
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );
      const clear = result[handle];
      setClear(String(clear));
      setMsg('');
    } catch (e: any) {
      setMsg(`Decryption failed: ${e.message}`);
    } finally {
      setFheBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="cyber-spinner mx-auto" />
        <p className="mt-6 text-cyan-400 font-mono tracking-wider animate-pulse">LOADING RESUME...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full text-center border-2 border-red-500/30">
          <CardContent className="py-16">
            <div className="text-7xl mb-6">⚠️</div>
            <h3 className="text-2xl font-black uppercase text-red-400 mb-4">RESUME NOT FOUND</h3>
            <p className="text-gray-400 mb-8">This resume does not exist or has been deleted</p>
            <Link href="/">
              <Button size="lg" variant="outline">◄ BACK TO HOME</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwner = address && profile.owner.toLowerCase() === address.toLowerCase();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Header - 赛博风格 */}
      <div className="relative">
        <div className="absolute -inset-2 bg-gradient-to-br from-cyan-500/30 via-purple-500/20 to-pink-500/30 blur-3xl" />
        <div className="relative cyber-card p-10 border-2 border-cyan-500/50">
          {/* 背景装饰 */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-transparent blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-cyan-500/30 border-2 border-cyan-400 flex items-center justify-center"
                       style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }}>
                    <span className="text-xl">⚡</span>
                  </div>
                  <h1 className="text-5xl font-black uppercase tracking-wider neon-glow">
                    RESUME #{profileId}
                  </h1>
                </div>
                <p className="text-sm text-cyan-400 tracking-widest">ON-CHAIN VERIFIED PROFILE</p>
              </div>
              {isOwner && (
                <Link href={`/edit/${profileId}`}>
                  <Button size="lg" variant="outline">✏️ EDIT</Button>
                </Link>
              )}
            </div>
            
            <div className="cyber-divider my-6" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="cyber-card p-4 border-cyan-400/30">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">OWNER ADDRESS</div>
                <p className="font-mono text-sm text-cyan-300 break-all">{profile.owner}</p>
              </div>
              <div className="cyber-card p-4 border-purple-400/30">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">METADATA CID</div>
                <p className="font-mono text-sm text-purple-300 break-all">{profile.metadataCID}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardContent>
          <h3 className="text-lg font-semibold mb-4">RESUME DATA</h3>
          {metaError && <p className="text-sm text-red-400 mb-2">{metaError}</p>}
          {!meta && !metaError && <p className="text-sm text-gray-400">Metadata not found, or CID does not point to valid JSON.</p>}
          {meta && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div>
                  {meta.basic?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={meta.basic.avatarUrl} alt="avatar" className="w-32 h-32 rounded-2xl object-cover border border-white/10" />
                  ) : (
                    <div className="w-32 h-32 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400">No Avatar</div>
                  )}
                </div>
                <div className="md:col-span-2 space-y-2">
                  <div className="text-2xl font-bold">{meta.basic?.name || 'Unnamed'}</div>
                  <div className="text-cyan-300 font-medium">{meta.basic?.title || ''}</div>
                  <div className="text-gray-300">{meta.basic?.summary || ''}</div>
                  <div className="text-gray-400 text-sm">{meta.basic?.location || ''}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="font-medium">Contact</div>
                  <div className="text-sm text-gray-300">Email: {meta.contact?.email || '-'}</div>
                  <div className="text-sm text-gray-300">Phone: {meta.contact?.phone || '-'}</div>
                  <div className="text-sm text-gray-300">Website: {meta.contact?.website || '-'}</div>
                  <div className="text-sm text-gray-300">GitHub：{meta.contact?.github || '-'}</div>
                  <div className="text-sm text-gray-300">Twitter：{meta.contact?.twitter || '-'}</div>
                  <div className="text-sm text-gray-300">ENS / Lens：{meta.contact?.ens || meta.contact?.lens || '-'}</div>
                </div>
                <div className="space-y-1">
                  <div className="font-medium">Skills</div>
                  <div className="text-sm text-gray-300">{Array.isArray(meta.skills) ? meta.skills.join(', ') : meta.skills || '-'}</div>
                  <div className="font-medium mt-4">Links</div>
                  <ul className="list-disc pl-5 text-sm text-cyan-300 space-y-1">
                    {(meta.links || []).map((l: any, i: number) => (
                      <li key={i}>
                        <a href={l.url} target="_blank" rel="noreferrer" className="hover:underline">{l.label || l.url}</a>
                      </li>
                    ))}
                    {(!meta.links || meta.links.length === 0) && <li className="text-gray-400">None</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">🔐 FHEVM ENCRYPTED REPUTATION & PRIVATE NOTES</h3>
            <div className="text-sm text-gray-400">FHEVM: {fhevmStatus}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">Encrypted Reputation (euint32)</span>
                <div className="flex gap-2">
                  <Button size="sm" disabled={!isOwner || fheBusy || fhevmStatus !== 'ready'} onClick={() => adjustReputation(+1)}>+1</Button>
                  <Button size="sm" variant="secondary" disabled={!isOwner || fheBusy || fhevmStatus !== 'ready'} onClick={() => adjustReputation(-1)}>-1</Button>
                </div>
              </div>
              <div className="text-sm text-gray-400 mb-2">Handle:</div>
              <p className="font-mono break-all text-xs bg-black/40 border border-white/10 p-2 rounded">{repHandle || '—'}</p>
              <div className="flex items-center justify-between mt-3">
                <div className="text-sm text-gray-400">Plaintext:</div>
                <Button size="sm" variant="outline" disabled={!repHandle || fheBusy || fhevmStatus !== 'ready'} onClick={() => decryptHandle(repHandle, setRepClear)}>DECRYPT</Button>
              </div>
              <p className="text-2xl font-bold text-cyan-300">{repClear || '—'}</p>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">Encrypted Private Note (euint64)</span>
                <Button size="sm" disabled={!isOwner || fheBusy || fhevmStatus !== 'ready'} onClick={setRandomNote}>SET RANDOM NOTE</Button>
              </div>
              <div className="text-sm text-gray-400 mb-2">Handle:</div>
              <p className="font-mono break-all text-xs bg-black/40 border border-white/10 p-2 rounded">{noteHandle || '—'}</p>
              <div className="flex items-center justify-between mt-3">
                <div className="text-sm text-gray-400">Plaintext:</div>
                <Button size="sm" variant="outline" disabled={!noteHandle || fheBusy || fhevmStatus !== 'ready'} onClick={() => decryptHandle(noteHandle, setNoteClear)}>DECRYPT</Button>
              </div>
              <p className="text-2xl font-bold text-fuchsia-300">{noteClear || '—'}</p>
            </div>
          </div>
          {msg && <p className="text-sm text-gray-300">{msg}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">WORK HISTORY</h2>
            <div className="text-sm text-gray-400">
              {profile.experiences.filter((e: any) => e.verified).length} / {profile.experiences.length} Verified
            </div>
          </div>

          <div className="space-y-3">
            {profile.experiences.map((exp: any, i: number) => (
              <div key={i} className="glass rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{exp.company}</div>
                  <div className="text-sm text-gray-400">{exp.position}</div>
                </div>
                {exp.verified ? (
                  <span className="text-green-300 text-sm">✅ Verified</span>
                ) : (
                  <Button size="sm" onClick={() => handleVerify(i)} loading={verifying === i}>
                    VERIFY
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Link href="/">
          <Button variant="outline">BACK TO HOME</Button>
        </Link>
      </div>
    </div>
  );
}


