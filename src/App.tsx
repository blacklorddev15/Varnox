import React, { useState } from 'react';
import { Shield, Terminal, Zap, ChevronRight, Sparkles, Cpu, Lock, Smartphone, Check, Copy, RefreshCw, Radio, Server, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'pairing' | 'overview' | 'modules'>('pairing');
  const [phoneNumber, setPhoneNumber] = useState('');
  const pairingBridgeUrl = (import.meta.env.VITE_VARNOX_PAIRING_URL || '/api').replace(/\/$/, '');
  const [isLoading, setIsLoading] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGeneratePairing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      setErrorMessage('Please enter a valid WhatsApp phone number with country code (e.g. 2547XXXXXXXX).');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setPairingCode(null);

    try {
      const cleaned = phoneNumber.replace(/[^0-9]/g, '');
      
      if (!pairingBridgeUrl) {
        throw new Error('The Varnox pairing bridge is not configured yet. Add VITE_VARNOX_PAIRING_URL in Vercel, then redeploy.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const response = await fetch(`${pairingBridgeUrl}/pair?phone=${cleaned}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || 'The pairing bridge rejected the request.');
      }

      const code = data.code || data.pairingCode || data.pairCode;
      if (!code) {
        throw new Error('The pairing bridge responded without a pairing code.');
      }
      setPairingCode(String(code));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to reach the Varnox pairing bridge.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-anime-artwork text-white relative flex flex-col justify-between overflow-x-hidden font-sans">
      {/* Very light transparent overlay to ensure the background artwork is fully visible */}
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px] pointer-events-none z-0"></div>

      {/* Top Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center font-heading font-extrabold text-cyan-300 text-xl shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            ⬡
          </div>
          <div>
            <h1 className="text-lg font-heading font-black tracking-widest text-cyan-300 flex items-center gap-2">
              BOT HUB <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 font-mono text-cyan-300">VARNOX</span>
            </h1>
            <p className="text-[11px] text-zinc-300 font-mono tracking-wider">CENTRALIZED NEURAL LINK</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 font-mono text-xs tracking-wider">
          <button 
            onClick={() => setActiveTab('pairing')} 
            className={`transition-all hover:text-cyan-300 ${activeTab === 'pairing' ? 'text-cyan-300 border-b border-cyan-300 pb-0.5' : 'text-zinc-300'}`}
          >
            // PAIRING PORTAL
          </button>
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`transition-all hover:text-cyan-300 ${activeTab === 'overview' ? 'text-cyan-300 border-b border-cyan-300 pb-0.5' : 'text-zinc-300'}`}
          >
            // HUB STATUS
          </button>
          <button 
            onClick={() => setActiveTab('modules')} 
            className={`transition-all hover:text-cyan-300 ${activeTab === 'modules' ? 'text-cyan-300 border-b border-cyan-300 pb-0.5' : 'text-zinc-300'}`}
          >
            // ECOSYSTEM
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-400/40 text-xs font-mono text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            ACTIVE HUB
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 flex flex-col justify-center flex-grow w-full items-center">
        
        {/* Mobile Tab bar */}
        <div className="flex md:hidden w-full gap-2 mb-6 font-mono text-xs justify-center">
          <button 
            onClick={() => setActiveTab('pairing')} 
            className={`px-3 py-1.5 rounded border ${activeTab === 'pairing' ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200' : 'bg-black/55 border-white/20 text-zinc-300'}`}
          >
            Pairing
          </button>
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`px-3 py-1.5 rounded border ${activeTab === 'overview' ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200' : 'bg-black/55 border-white/20 text-zinc-300'}`}
          >
            Status
          </button>
          <button 
            onClick={() => setActiveTab('modules')} 
            className={`px-3 py-1.5 rounded border ${activeTab === 'modules' ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200' : 'bg-black/55 border-white/20 text-zinc-300'}`}
          >
            Ecosystem
          </button>
        </div>

        {activeTab === 'pairing' && (
          <div className="w-full max-w-lg bg-black/45 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-[0_8px_32px_rgba(0,0_0,0.5)]">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-mono mb-3">
                <Radio className="w-3.5 h-3.5 animate-pulse" /> WHATSAPP PAIRING GATEWAY
              </div>
              <h2 className="text-2xl font-heading font-bold text-white tracking-wide">CONNECT VARNOX XMD</h2>
              <p className="text-sm text-zinc-300 mt-2 font-sans">
                Everything is now combined in one unified hub. Enter your WhatsApp number to generate your secure pairing code instantly.
              </p>
            </div>

            <form onSubmit={handleGeneratePairing} className="space-y-6">
              <div>
                <label className="block text-xs font-mono text-cyan-300 mb-2 uppercase tracking-wider">
                  WhatsApp Number (with country code)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 font-mono">+</span>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="254700000000"
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3.5 pl-8 text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-mono">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-heading font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm tracking-wider uppercase"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> GENERATING SECURE CODE...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" /> GENERATE PAIRING CODE
                  </>
                )}
              </button>
            </form>

            {pairingCode && (
              <div className="mt-8 p-5 rounded-xl bg-cyan-950/50 border border-cyan-400/40 text-center animate-fadeIn">
                <p className="text-xs font-mono text-cyan-300 mb-2 uppercase tracking-widest">Your Secure Pairing Code</p>
                <div className="text-3xl font-mono font-black text-white tracking-widest bg-black/50 py-3 rounded-lg border border-cyan-500/30 select-all mb-4">
                  {pairingCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Code Copied to Clipboard!' : 'Copy Code to Link'}
                </button>
                <p className="text-[11px] text-zinc-300 mt-3 font-sans">
                  Open WhatsApp on your phone &gt; Linked Devices &gt; Link with phone number instead &gt; Enter this live code.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="w-full max-w-lg bg-black/45 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-[0_8px_32px_rgba(0,0_0,0.5)] space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-heading font-bold text-white">HUB STATUS & MIGRATION</h2>
              <p className="text-xs text-zinc-300 font-mono mt-1">ALL BOTS COMBINED INTO ONE UNIFIED VERSION</p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">Hub Status:</span>
                <span className="text-emerald-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> ONLINE</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">Merged Version:</span>
                <span className="text-cyan-300">Varnox XMD Universal</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">Hosting Engine:</span>
                <span className="text-cyan-300">Pterodactyl &amp; Vercel</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
              <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                Everything is now in one place. Both bots have been successfully combined into a single, merged platform. Head over to the pairing portal to connect your number and access all features instantly.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="w-full max-w-lg bg-black/45 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-[0_8px_32px_rgba(0,0_0,0.5)] space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-heading font-bold text-white">ECOSYSTEM MODULES</h2>
              <p className="text-xs text-zinc-300 font-mono mt-1">AVAILABLE CAPABILITIES & COMMAND SUITES</p>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Group Security</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Advanced AI</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Media Download</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Sticker Tools</span>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => setActiveTab('pairing')}
                className="inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-200 font-mono text-xs tracking-wider"
              >
                <span>// RETURN TO PAIRING PORTAL</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/40 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-zinc-400 gap-2">
        <p>&copy; 2026 VARNOX ECOSYSTEM. ALL RIGHTS RESERVED.</p>
        <p className="text-cyan-300">TRANSPARENT ANIME HUB • FULLY COMBINED</p>
      </footer>
    </div>
  );
}
