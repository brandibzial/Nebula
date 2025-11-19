"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMetaMask } from "../hooks/useMetaMask";

export function Navbar() {
  const { isConnected, connect, address, chainId } = useMetaMask();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-20 flex items-center justify-between relative">
          {/* 霓虹底部边框 */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/50 blur-lg group-hover:blur-xl transition-all" />
              <div className="relative w-12 h-12 bg-black border-2 border-cyan-500 flex items-center justify-center overflow-hidden"
                   style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>
                <span className="text-2xl neon-glow">⚡</span>
              </div>
            </div>
            <div>
              <span className="text-2xl font-black uppercase tracking-wider neon-glow">
                NEBULA
              </span>
              <span className="text-xs text-cyan-400 block -mt-1 tracking-widest">CYBER RESUME</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-8">
            {isConnected && (
              <>
                <Link 
                  href="/create" 
                  className={`hidden md:flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-all relative group ${
                    isActive('/create') ? 'text-cyan-400' : 'text-gray-400 hover:text-cyan-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 ${isActive('/create') ? 'bg-cyan-400' : 'bg-gray-600 group-hover:bg-cyan-400'} transition-all`} 
                        style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
                  CREATE
                  {isActive('/create') && (
                    <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-cyan-400" />
                  )}
                </Link>
                <Link 
                  href="/my" 
                  className={`hidden md:flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-all relative group ${
                    isActive('/my') ? 'text-cyan-400' : 'text-gray-400 hover:text-cyan-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 ${isActive('/my') ? 'bg-cyan-400' : 'bg-gray-600 group-hover:bg-cyan-400'} transition-all`} 
                        style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
                  MY RESUMES
                  {isActive('/my') && (
                    <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-cyan-400" />
                  )}
                </Link>
              </>
            )}

            {/* Chain ID Badge */}
            {chainId && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-black/60 border border-purple-500/30 text-xs font-mono text-purple-300"
                   style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}>
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                CHAIN {chainId}
              </div>
            )}

            {/* Connect/Address Button */}
            {!isConnected ? (
              <button onClick={connect} className="cyber-btn-primary text-xs">
                CONNECT WALLET
              </button>
            ) : (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/50 to-pink-500/50 blur-md group-hover:blur-lg transition-all" />
                <div className="relative px-4 py-2 bg-black border border-cyan-400/50 font-mono text-sm text-cyan-300 group-hover:border-cyan-400 transition-all"
                     style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>
                  {address?.slice(0, 4)}...{address?.slice(-4)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}


