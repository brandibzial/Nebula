'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useMetaMask } from '@/hooks/useMetaMask';
import { useFhevm } from '@/fhevm/useFhevm';

export default function HomePage() {
  const { isConnected, provider, chainId } = useMetaMask();
  const { status: fhevmStatus } = useFhevm({
    provider,
    chainId,
    initialMockChains: { 31337: 'http://localhost:8545' },
    enabled: true
  });
  const statusColor =
    fhevmStatus === 'ready'
      ? 'text-emerald-400'
      : fhevmStatus === 'loading'
      ? 'text-yellow-400'
      : fhevmStatus === 'error'
      ? 'text-red-400'
      : 'text-gray-400';

  return (
    <div className="relative space-y-16">
      {/* Hero Section - 全新设计 */}
      <div className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="w-[600px] h-[600px] border-2 border-cyan-500 animate-pulse"
               style={{ clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' }} />
        </div>
        
        <div className="relative z-10 text-center max-w-5xl mx-auto px-4">
          {/* 状态指示器（包含 FHEVM 状态） */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 animate-pulse"
                   style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
              <span className="text-xs text-cyan-400 tracking-widest font-mono uppercase">SYSTEM ONLINE</span>
              <div className="w-2 h-2 bg-cyan-400 animate-pulse"
                   style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
            </div>
            <div className="text-xs font-mono tracking-widest uppercase">
              <span className="text-gray-400">FHEVM:</span>{' '}
              <span className={statusColor}>{fhevmStatus}</span>
            </div>
          </div>

          {/* 主标题 */}
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-wider mb-6">
            <span className="inline-block neon-glow">NEBULA</span>
            <br />
            <span className="inline-block neon-glow-pink text-5xl md:text-7xl">CYBER RESUME</span>
          </h1>

          {/* Subtitle */}
          <div className="max-w-2xl mx-auto mb-12">
            <p className="text-lg text-gray-300 leading-relaxed font-light">
              Decentralized professional resume system powered by <span className="text-cyan-400 font-bold">FHEVM</span>
              <br />
              <span className="text-sm text-purple-400">End-to-End Encrypted · On-Chain Verified · Privacy Protected</span>
            </p>
          </div>

          {/* CTA 按钮 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/create">
              <Button size="lg" className="min-w-[200px]">
                ⚡ START CREATE
              </Button>
            </Link>
            <Link href="/my">
              <Button size="lg" variant="outline" className="min-w-[200px]">
                📁 MY RESUMES
              </Button>
            </Link>
          </div>

          {/* 数据统计 - 装饰性 */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { label: 'RESUMES', value: '1.2K+' },
              { label: 'VERIFIED', value: '98%' },
              { label: 'SECURE', value: '100%' },
            ].map((stat, i) => (
              <div key={i} className="relative group">
                <div className="absolute inset-0 bg-cyan-500/10 blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative cyber-card p-4 border-cyan-400/30">
                  <div className="text-3xl font-black text-cyan-400 neon-glow">{stat.value}</div>
                  <div className="text-xs text-gray-400 tracking-widest mt-1">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 霓虹分隔线 */}
      <div className="cyber-divider my-16" />

      {/* Features - 新设计 */}
      <div className="relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black uppercase tracking-wider neon-glow mb-2">FEATURES</h2>
          <p className="text-sm text-gray-400 tracking-widest">TECHNICAL CAPABILITIES</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '🔗',
              title: 'ON-CHAIN VERIFIED',
              desc: 'All work experience can be endorsed on-chain by verifiers, ensuring authenticity and traceability.',
              color: 'cyan'
            },
            {
              icon: '🔐',
              title: 'FULLY ENCRYPTED',
              desc: 'Reputation scores and private notes use FHEVM homomorphic encryption, only decryptable by owner.',
              color: 'purple'
            },
            {
              icon: '⚡',
              title: 'CYBER DESIGN',
              desc: 'Cyberpunk-styled interface with neon colors and glitch art for a futuristic experience.',
              color: 'pink'
            }
          ].map((feature, i) => (
            <Card key={i} className="group hover:scale-105 transition-transform duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{feature.icon}</span>
                  <div className={`h-1 flex-1 bg-gradient-to-r ${
                    feature.color === 'cyan' ? 'from-cyan-500 to-transparent' :
                    feature.color === 'purple' ? 'from-purple-500 to-transparent' :
                    'from-pink-500 to-transparent'
                  }`} />
                </div>
                <CardTitle className="text-sm">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="relative">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black uppercase tracking-wider neon-glow-pink mb-2">POWERED BY</h2>
          <p className="text-xs text-gray-400 tracking-widest">CORE TECHNOLOGY STACK</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {['FHEVM', 'ZAMA', 'ETHEREUM', 'IPFS', 'NEXT.JS', 'TAILWIND'].map((tech, i) => (
            <div key={i} className="group">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/20 blur-md group-hover:blur-lg transition-all" />
                <div className="relative px-6 py-3 bg-black/60 border border-purple-500/30 group-hover:border-purple-400/60 transition-all"
                     style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>
                  <span className="text-sm font-bold tracking-wider text-purple-300">{tech}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Bottom */}
      {!isConnected && (
        <div className="relative cyber-card p-12 text-center border-2 border-cyan-500/30 neon-border-animate">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-3xl font-black uppercase mb-4 neon-glow">READY TO START?</h3>
            <p className="text-gray-300 mb-6">Connect your wallet and create your cyber resume instantly</p>
            <Button size="lg" onClick={() => {}} className="min-w-[250px]">
              ⚡ CONNECT WALLET
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
