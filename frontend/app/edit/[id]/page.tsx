'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMetaMask } from '@/hooks/useMetaMask';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ethers } from 'ethers';
import { NebulaResumeABI } from '@/abi/NebulaResumeABI';
import { NebulaResumeAddresses } from '@/abi/NebulaResumeAddresses';

export default function EditProfilePage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id as string;
  const { address, chainId, isConnected } = useMetaMask();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [metadataCID, setMetadataCID] = useState('');
  const [newExperience, setNewExperience] = useState({
    company: '',
    position: '',
    description: '',
    startDate: '',
    endDate: '',
    proofCID: '',
  });

  const contractInfo = NebulaResumeAddresses[chainId?.toString() as keyof typeof NebulaResumeAddresses];
  const contractAddress = contractInfo?.address as `0x${string}` | undefined;

  useEffect(() => {
    if (contractAddress && profileId) {
      loadProfile();
    }
  }, [contractAddress, profileId]);

  const loadProfile = async () => {
    if (!contractAddress) return;
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const contract = new ethers.Contract(contractAddress, NebulaResumeABI.abi, provider);
      const profileData = await contract.getProfile(profileId);
      if (profileData.owner.toLowerCase() !== address?.toLowerCase()) {
        alert('你不是此履历的所有者');
        router.push('/');
        return;
      }
      setMetadataCID(profileData.metadataCID);
    } catch (error) {
      alert('履历不存在');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMetadata = async () => {
    if (!contractAddress || !isConnected) {
      alert('请先连接钱包');
      return;
    }
    setSaving(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, NebulaResumeABI.abi, signer);
      const tx = await contract.updateProfile(profileId, metadataCID);
      await tx.wait();
      alert('元数据更新成功！');
    } catch (error: any) {
      alert(`更新失败: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddExperience = async () => {
    if (!contractAddress || !isConnected) {
      alert('请先连接钱包');
      return;
    }
    if (!newExperience.company || !newExperience.position) {
      alert('请填写公司和职位');
      return;
    }
    setSaving(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, NebulaResumeABI.abi, signer);
      const startTimestamp = new Date(newExperience.startDate).getTime() / 1000;
      const endTimestamp = newExperience.endDate ? new Date(newExperience.endDate).getTime() / 1000 : 0;
      const tx = await contract.addMilestone(
        profileId,
        newExperience.company,
        newExperience.position,
        newExperience.description,
        Math.floor(startTimestamp),
        Math.floor(endTimestamp),
        newExperience.proofCID || ''
      );
      await tx.wait();
      alert('经历添加成功！');
      setNewExperience({
        company: '',
        position: '',
        description: '',
        startDate: '',
        endDate: '',
        proofCID: '',
      });
      router.push(`/resume/${profileId}`);
    } catch (error: any) {
      alert(`添加失败: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-400" />
        <p className="mt-4 text-gray-300">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">编辑履历 #{profileId}</h1>
        <p className="text-gray-300">更新履历元数据或添加新经历</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>更新元数据</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="block text-sm mb-2 text-gray-300">元数据 CID（IPFS）</label>
            <input type="text" placeholder="QmXxx..." className="input" value={metadataCID} onChange={(e) => setMetadataCID(e.target.value)} />
          </div>
          <Button onClick={handleUpdateMetadata} loading={saving}>
            更新元数据
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>添加新经历</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 text-gray-300">公司名称 *</label>
              <input type="text" placeholder="Acme Inc." className="input" value={newExperience.company} onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-300">职位 *</label>
              <input type="text" placeholder="高级工程师" className="input" value={newExperience.position} onChange={(e) => setNewExperience({ ...newExperience, position: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2 text-gray-300">工作描述</label>
            <textarea placeholder="描述你的工作内容和成就..." rows={3} className="textarea" value={newExperience.description} onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 text-gray-300">开始日期</label>
              <input type="month" className="input" value={newExperience.startDate} onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-300">结束日期（留空表示至今）</label>
              <input type="month" className="input" value={newExperience.endDate} onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2 text-gray-300">证明文件 CID（可选）</label>
            <input type="text" placeholder="QmXxx..." className="input" value={newExperience.proofCID} onChange={(e) => setNewExperience({ ...newExperience, proofCID: e.target.value })} />
          </div>
          <Button onClick={handleAddExperience} loading={saving} className="w-full">
            添加经历
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button variant="secondary" size="lg" onClick={() => router.push(`/resume/${profileId}`)}>
          返回查看
        </Button>
      </div>
    </div>
  );
}




