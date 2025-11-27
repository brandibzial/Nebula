'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMetaMask } from '@/hooks/useMetaMask';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ethers } from 'ethers';
import { NebulaResumeABI } from '@/abi/NebulaResumeABI';
import { NebulaResumeAddresses } from '@/abi/NebulaResumeAddresses';

export default function CreateProfilePage() {
  const router = useRouter();
  const { address, chainId, isConnected } = useMetaMask();
  const [loading, setLoading] = useState(false);
  const [pinataJWT, setPinataJWT] = useState('');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    metadataCID: '',
    // 完全不同的字段结构
    identity: {
      fullName: '',
      professionalTitle: '',
      bio: '',
      profileImage: '',
      currentLocation: '',
      nationality: '',
    },
    social: {
      linkedIn: '',
      telegram: '',
      discord: '',
      personalWebsite: '',
      githubProfile: '',
      twitterHandle: '',
    },
    expertise: [] as Array<{ category: string; level: string; yearsOfExperience: number }>,
    projects: [] as Array<{ 
      projectName: string; 
      role: string; 
      techStack: string; 
      achievements: string; 
      projectUrl: string;
      timeline: string;
    }>,
    achievements: [] as Array<{ 
      achievementTitle: string; 
      organization: string; 
      dateAwarded: string; 
      evidenceUrl: string;
    }>,
    workHistory: [] as Array<{
      organization: string;
      jobTitle: string;
      responsibilities: string;
      periodStart: string;
      periodEnd: string;
      verificationHash: string;
    }>,
  });

  const contractInfo = NebulaResumeAddresses[chainId?.toString() as keyof typeof NebulaResumeAddresses];
  const contractAddress = contractInfo?.address as `0x${string}` | undefined;

  const addWorkHistory = () => {
    setFormData({
      ...formData,
      workHistory: [
        ...formData.workHistory,
        { organization: '', jobTitle: '', responsibilities: '', periodStart: '', periodEnd: '', verificationHash: '' },
      ],
    });
  };
  const removeWorkHistory = (index: number) => {
    setFormData({
      ...formData,
      workHistory: formData.workHistory.filter((_, i) => i !== index),
    });
  };
  const updateWorkHistory = (index: number, field: string, value: string) => {
    const newWorkHistory = [...formData.workHistory];
    newWorkHistory[index] = { ...newWorkHistory[index], [field]: value };
    setFormData({ ...formData, workHistory: newWorkHistory });
  };

  const addProject = () => setFormData({ 
    ...formData, 
    projects: [...formData.projects, { projectName: '', role: '', techStack: '', achievements: '', projectUrl: '', timeline: '' }] 
  });
  const updateProject = (i: number, k: keyof (typeof formData)['projects'][number], v: string) => {
    const arr = [...formData.projects];
    arr[i] = { ...arr[i], [k]: v } as any;
    setFormData({ ...formData, projects: arr });
  };
  const removeProject = (i: number) => setFormData({ ...formData, projects: formData.projects.filter((_, idx) => idx !== i) });

  const addExpertise = () => setFormData({ 
    ...formData, 
    expertise: [...formData.expertise, { category: '', level: '', yearsOfExperience: 0 }] 
  });
  const updateExpertise = (i: number, k: keyof (typeof formData)['expertise'][number], v: string | number) => {
    const arr = [...formData.expertise];
    arr[i] = { ...arr[i], [k]: v } as any;
    setFormData({ ...formData, expertise: arr });
  };
  const removeExpertise = (i: number) => setFormData({ ...formData, expertise: formData.expertise.filter((_, idx) => idx !== i) });

  const addAchievement = () => setFormData({ 
    ...formData, 
    achievements: [...formData.achievements, { achievementTitle: '', organization: '', dateAwarded: '', evidenceUrl: '' }] 
  });
  const updateAchievement = (i: number, k: keyof (typeof formData)['achievements'][number], v: string) => {
    const arr = [...formData.achievements];
    arr[i] = { ...arr[i], [k]: v } as any;
    setFormData({ ...formData, achievements: arr });
  };
  const removeAchievement = (i: number) => setFormData({ ...formData, achievements: formData.achievements.filter((_, idx) => idx !== i) });

  const metadataJson = useMemo(() => {
    return {
      $schema: 'https://schema.nebulacv.app/v2',
      identity: formData.identity,
      social: formData.social,
      expertise: formData.expertise,
      projects: formData.projects,
      achievements: formData.achievements,
      workHistory: formData.workHistory,
      createdAt: new Date().toISOString(),
      ownerAddress: address,
    };
  }, [formData, address]);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(metadataJson, null, 2));
      alert('JSON copied to clipboard. Please upload to IPFS and paste the CID above.');
    } catch {}
  };

  const uploadToPinata = async () => {
    const jwtFromDom = (document.getElementById('pinata-jwt') as HTMLInputElement | null)?.value ?? '';
    let jwt = (pinataJWT ?? '').trim() || jwtFromDom.trim();
    const headerValue = jwt.startsWith('Bearer ') ? jwt : `Bearer ${jwt}`;
    if (!jwt) { alert('Please enter Pinata JWT'); return; }
    try {
      setUploading(true);
      const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: headerValue,
        },
        body: JSON.stringify({
          pinataOptions: { cidVersion: 1 },
          pinataMetadata: { name: `nebulacv-${Date.now()}` },
          pinataContent: metadataJson,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Pinata upload failed');
      }
      if (data?.IpfsHash) {
        setFormData({ ...formData, metadataCID: data.IpfsHash });
        alert(`Upload successful! CID: ${data.IpfsHash}`);
      } else {
        throw new Error('Pinata did not return IpfsHash');
      }
    } catch (e: any) {
      alert(`Upload failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!contractAddress || !isConnected) {
      alert('Please connect wallet first');
      return;
    }
    if (!formData.metadataCID) {
      alert('Please enter metadata CID (upload JSON to IPFS then paste CID)');
      return;
    }
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, NebulaResumeABI.abi, signer);

      const tx = await contract.createProfile(formData.metadataCID);
      await tx.wait();

      const profileId = await contract.resumeCount();
      for (const work of formData.workHistory) {
        if (work.organization && work.jobTitle) {
          const startTimestamp = work.periodStart ? new Date(work.periodStart).getTime() / 1000 : 0;
          const endTimestamp = work.periodEnd ? new Date(work.periodEnd).getTime() / 1000 : 0;
          const expTx = await contract.addMilestone(
            profileId,
            work.organization,
            work.jobTitle,
            work.responsibilities,
            Math.floor(startTimestamp),
            Math.floor(endTimestamp),
            work.verificationHash || ''
          );
          await expTx.wait();
        }
      }
      alert('Resume created successfully!');
      router.push(`/resume/${profileId}`);
    } catch (error: any) {
      alert(`Creation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12">
            <div className="text-6xl mb-6">🔌</div>
            <h3 className="text-xl font-bold uppercase neon-glow mb-4">NOT CONNECTED</h3>
            <p className="text-gray-400 mb-6">Connect your wallet to create resume</p>
            <Button size="lg">CONNECT WALLET</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* 页头 - 赛博风格 */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-2xl" />
        <div className="relative cyber-card p-8 border-2 border-cyan-500/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center"
                 style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <h1 className="text-4xl font-black uppercase tracking-wider neon-glow">CREATE RESUME</h1>
              <p className="text-sm text-cyan-400 tracking-widest">Build your on-chain NEBULA profile</p>
            </div>
          </div>
          <div className="cyber-divider my-4" />
          <p className="text-gray-400 text-sm">Fill in your professional information, deploy to blockchain</p>
        </div>
      </div>

      {/* Identity Info */}
      <Card>
        <CardHeader>
          <CardTitle>IDENTITY</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 text-gray-300">Full Name *</label>
              <input
                type="text"
                placeholder="John Doe"
                className="input"
                value={formData.identity.fullName}
                onChange={(e) => setFormData({ ...formData, identity: { ...formData.identity, fullName: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-300">Professional Title *</label>
              <input
                type="text"
                placeholder="Senior Blockchain Developer"
                className="input"
                value={formData.identity.professionalTitle}
                onChange={(e) => setFormData({ ...formData, identity: { ...formData.identity, professionalTitle: e.target.value } })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2 text-gray-300">Professional Bio</label>
            <textarea
              placeholder="Brief introduction of your expertise and career..."
              rows={3}
              className="textarea"
              value={formData.identity.bio}
              onChange={(e) => setFormData({ ...formData, identity: { ...formData.identity, bio: e.target.value } })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-2 text-gray-300">Profile Image URL</label>
              <input
                type="text"
                placeholder="https://.../profile.jpg"
                className="input"
                value={formData.identity.profileImage}
                onChange={(e) => setFormData({ ...formData, identity: { ...formData.identity, profileImage: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-300">Current Location</label>
              <input
                type="text"
                placeholder="San Francisco, USA"
                className="input"
                value={formData.identity.currentLocation}
                onChange={(e) => setFormData({ ...formData, identity: { ...formData.identity, currentLocation: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-300">Nationality</label>
              <input
                type="text"
                placeholder="USA"
                className="input"
                value={formData.identity.nationality}
                onChange={(e) => setFormData({ ...formData, identity: { ...formData.identity, nationality: e.target.value } })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle>SOCIAL LINKS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="LinkedIn Profile" className="input" value={formData.social.linkedIn} onChange={(e) => setFormData({ ...formData, social: { ...formData.social, linkedIn: e.target.value } })} />
            <input type="text" placeholder="Telegram Username" className="input" value={formData.social.telegram} onChange={(e) => setFormData({ ...formData, social: { ...formData.social, telegram: e.target.value } })} />
            <input type="text" placeholder="Discord Handle" className="input" value={formData.social.discord} onChange={(e) => setFormData({ ...formData, social: { ...formData.social, discord: e.target.value } })} />
            <input type="text" placeholder="Personal Website" className="input" value={formData.social.personalWebsite} onChange={(e) => setFormData({ ...formData, social: { ...formData.social, personalWebsite: e.target.value } })} />
            <input type="text" placeholder="GitHub Profile" className="input" value={formData.social.githubProfile} onChange={(e) => setFormData({ ...formData, social: { ...formData.social, githubProfile: e.target.value } })} />
            <input type="text" placeholder="Twitter Handle" className="input" value={formData.social.twitterHandle} onChange={(e) => setFormData({ ...formData, social: { ...formData.social, twitterHandle: e.target.value } })} />
          </div>
        </CardContent>
      </Card>

      {/* Expertise */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>EXPERTISE</CardTitle>
            <Button variant="outline" size="sm" onClick={addExpertise}>+ ADD SKILL</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.expertise.length === 0 ? (
            <p className="text-gray-400 text-sm">Add your technical skills and expertise areas</p>
          ) : (
            formData.expertise.map((exp, i) => (
              <div key={i} className="space-y-3 cyber-card p-4 border-cyan-400/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input className="input" placeholder="Category (e.g. Blockchain)" value={exp.category} onChange={(e) => updateExpertise(i, 'category', e.target.value)} />
                  <input className="input" placeholder="Level (e.g. Expert)" value={exp.level} onChange={(e) => updateExpertise(i, 'level', e.target.value)} />
                  <input className="input" type="number" placeholder="Years" value={exp.yearsOfExperience} onChange={(e) => updateExpertise(i, 'yearsOfExperience', parseInt(e.target.value) || 0)} />
                </div>
                <div className="text-right"><button className="text-red-400 hover:text-red-300 text-sm" onClick={() => removeExpertise(i)}>DELETE</button></div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>PROJECTS</CardTitle>
            <Button variant="outline" size="sm" onClick={addProject}>+ ADD PROJECT</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.projects.length === 0 ? (
            <p className="text-gray-400 text-sm">Showcase your notable projects and contributions</p>
          ) : (
            formData.projects.map((proj, i) => (
              <div key={i} className="space-y-3 cyber-card p-4 border-purple-400/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="input" placeholder="Project Name" value={proj.projectName} onChange={(e) => updateProject(i, 'projectName', e.target.value)} />
                  <input className="input" placeholder="Your Role" value={proj.role} onChange={(e) => updateProject(i, 'role', e.target.value)} />
                </div>
                <input className="input" placeholder="Tech Stack (e.g. Solidity, React, IPFS)" value={proj.techStack} onChange={(e) => updateProject(i, 'techStack', e.target.value)} />
                <textarea className="textarea" rows={2} placeholder="Key Achievements..." value={proj.achievements} onChange={(e) => updateProject(i, 'achievements', e.target.value)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="input" placeholder="Project URL" value={proj.projectUrl} onChange={(e) => updateProject(i, 'projectUrl', e.target.value)} />
                  <input className="input" placeholder="Timeline (e.g. 2023-2024)" value={proj.timeline} onChange={(e) => updateProject(i, 'timeline', e.target.value)} />
                </div>
                <div className="text-right"><button className="text-red-400 hover:text-red-300 text-sm" onClick={() => removeProject(i)}>DELETE</button></div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>ACHIEVEMENTS</CardTitle>
            <Button variant="outline" size="sm" onClick={addAchievement}>+ ADD ACHIEVEMENT</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.achievements.length === 0 ? (
            <p className="text-gray-400 text-sm">Awards, certifications, and notable recognitions</p>
          ) : (
            formData.achievements.map((ach, i) => (
              <div key={i} className="space-y-3 cyber-card p-4 border-pink-400/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input className="input" placeholder="Achievement Title" value={ach.achievementTitle} onChange={(e) => updateAchievement(i, 'achievementTitle', e.target.value)} />
                  <input className="input" placeholder="Organization" value={ach.organization} onChange={(e) => updateAchievement(i, 'organization', e.target.value)} />
                  <input className="input" type="month" placeholder="Date" value={ach.dateAwarded} onChange={(e) => updateAchievement(i, 'dateAwarded', e.target.value)} />
                </div>
                <input className="input" placeholder="Evidence URL (optional)" value={ach.evidenceUrl} onChange={(e) => updateAchievement(i, 'evidenceUrl', e.target.value)} />
                <div className="text-right"><button className="text-red-400 hover:text-red-300 text-sm" onClick={() => removeAchievement(i)}>DELETE</button></div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Work History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>WORK HISTORY</CardTitle>
            <Button variant="outline" size="sm" onClick={addWorkHistory}>
              <span className="mr-1">+</span> ADD WORK
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {formData.workHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No work history added yet</p>
              <Button variant="ghost" size="sm" onClick={addWorkHistory} className="mt-4">
                + ADD FIRST WORK
              </Button>
            </div>
          ) : (
            formData.workHistory.map((work, index) => (
              <div key={index} className="cyber-card p-6 space-y-4 relative border-cyan-400/30">
                <button
                  onClick={() => removeWorkHistory(index)}
                  className="absolute top-4 right-4 text-red-400 hover:text-red-300"
                >
                  ✕
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2 text-gray-300">Organization *</label>
                    <input
                      type="text"
                      placeholder="Company / DAO Name"
                      className="input"
                      value={work.organization}
                      onChange={(e) => updateWorkHistory(index, 'organization', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-gray-300">Job Title *</label>
                    <input
                      type="text"
                      placeholder="Senior Engineer"
                      className="input"
                      value={work.jobTitle}
                      onChange={(e) => updateWorkHistory(index, 'jobTitle', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-300">Key Responsibilities</label>
                  <textarea
                    placeholder="Describe your main duties and achievements..."
                    rows={3}
                    className="textarea"
                    value={work.responsibilities}
                    onChange={(e) => updateWorkHistory(index, 'responsibilities', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2 text-gray-300">Period Start</label>
                    <input
                      type="month"
                      className="input"
                      value={work.periodStart}
                      onChange={(e) => updateWorkHistory(index, 'periodStart', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-gray-300">Period End (leave empty if current)</label>
                    <input
                      type="month"
                      className="input"
                      value={work.periodEnd}
                      onChange={(e) => updateWorkHistory(index, 'periodEnd', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-300">Verification Hash (optional)</label>
                  <input
                    type="text"
                    placeholder="QmXxx..."
                    className="input"
                    value={work.verificationHash}
                    onChange={(e) => updateWorkHistory(index, 'verificationHash', e.target.value)}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Metadata JSON Preview */}
      <Card>
        <CardHeader>
          <CardTitle>METADATA JSON (Upload to IPFS, then paste CID below)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <pre className="rounded-xl p-4 bg-black/40 border border-white/10 overflow-auto text-xs max-h-72">
{JSON.stringify(metadataJson, null, 2)}
          </pre>
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex gap-3">
              <Button variant="outline" onClick={copyJson}>COPY JSON</Button>
              <a className="cyber-btn border-purple-500/50 text-xs px-4 py-2" href="https://web3.storage/" target="_blank" rel="noreferrer">WEB3.STORAGE</a>
              <a className="cyber-btn border-purple-500/50 text-xs px-4 py-2" href="https://pinata.cloud/" target="_blank" rel="noreferrer">PINATA</a>
            </div>
            <div className="flex-1" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input id="pinata-jwt" type="text" autoComplete="off" autoCorrect="off"
              autoCapitalize="none" spellCheck={false} className="md:col-span-4 input"
              placeholder="Paste Pinata JWT here (local use only, not stored)"
              value={pinataJWT} onChange={(e) => setPinataJWT(e.target.value)}
              onInput={(e) => setPinataJWT((e.target as HTMLInputElement).value)} />
            <Button onClick={uploadToPinata} loading={uploading} variant="primary" className="md:col-span-1 text-xs">
              UPLOAD & FILL CID
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CID + Actions */}
      <Card>
        <CardHeader>
          <CardTitle>ON-CHAIN DEPLOYMENT</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <label className="block text-sm text-gray-300">Metadata CID (IPFS)</label>
          <input
            type="text"
            placeholder="QmXxx..."
            className="input"
            value={formData.metadataCID}
            onChange={(e) => setFormData({ ...formData, metadataCID: e.target.value })}
          />
          <p className="text-xs text-gray-400">Upload the JSON above to IPFS, copy the CID and paste it here.</p>
        </CardContent>
      </Card>

      {/* Actions - 赛博风格 */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-2xl" />
        <div className="relative cyber-card p-8 border-2 border-cyan-500/30">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="secondary" size="lg" onClick={() => router.back()} className="sm:w-auto w-full">
              ◄ CANCEL
            </Button>
            <Button size="lg" onClick={handleCreate} loading={loading} className="flex-1">
              ⚡ DEPLOY TO CHAIN
            </Button>
          </div>
          <div className="mt-4 text-center text-xs text-gray-500 font-mono">
            * Data will be permanently stored on blockchain, please ensure information is accurate
          </div>
        </div>
      </div>
    </div>
  );
}
