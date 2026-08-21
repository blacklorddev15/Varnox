import React, { useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Command,
  Copy,
  Cpu,
  Fingerprint,
  Lock,
  Radio,
  RefreshCw,
  Server,
  Shield,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';

type Tab = 'pairing' | 'overview' | 'modules';

const modules = [
  { icon: Shield, title: 'Group security', detail: 'Moderation & protection' },
  { icon: Terminal, title: 'AI command suite', detail: 'Tools, chat & automation' },
  { icon: Cpu, title: 'Media engine', detail: 'Download & conversion' },
  { icon: Sparkles, title: 'Creative tools', detail: 'Stickers, reactions & fun' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('pairing');
  const [phoneNumber, setPhoneNumber] = useState('');
  const pairingBridgeUrl = (import.meta.env.VITE_VARNOX_PAIRING_URL || '/api').replace(/\/$/, '');
  const [isLoading, setIsLoading] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGeneratePairing = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      setErrorMessage('Enter a valid WhatsApp number with country code, for example 2547XXXXXXXX.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setPairingCode(null);

    try {
      const cleaned = phoneNumber.replace(/[^0-9]/g, '');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const response = await fetch(`${pairingBridgeUrl}/pair?phone=${cleaned}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || data.error || 'The pairing bridge rejected the request.');
      const code = data.code || data.pairingCode || data.pairCode;
      if (!code) throw new Error('The pairing bridge responded without a pairing code.');
      setPairingCode(String(code));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to reach the Varnox pairing bridge.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'pairing', label: 'Pairing portal' },
    { key: 'overview', label: 'Hub status' },
    { key: 'modules', label: 'Ecosystem' },
  ];

  return (
    <div className="min-h-screen bg-anime-artwork text-white relative flex flex-col overflow-x-hidden font-sans">
      <div className="absolute inset-0 premium-grid pointer-events-none z-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-slate-950/35 pointer-events-none z-0" />

      <header className="relative z-10 px-5 sm:px-8 py-5 border-b border-white/10 bg-slate-950/35 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/55 bg-slate-950/55 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.22)]">
              <div className="absolute inset-1 rounded-xl border border-cyan-200/15" />
              <Command className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-lg font-bold tracking-[0.22em] text-white">VARNOX</h1>
                <span className="rounded border border-cyan-300/35 bg-cyan-300/10 px-1.5 py-0.5 text-[9px] font-mono tracking-[0.18em] text-cyan-200">XMD</span>
              </div>
              <p className="mt-0.5 text-[10px] font-mono tracking-[0.2em] text-slate-300">BOT INTELLIGENCE / 01</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1 rounded-full border border-white/10 bg-black/25 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-2 text-[11px] font-mono tracking-[0.12em] transition-all ${activeTab === tab.key ? 'bg-white/12 text-cyan-200 shadow-inner shadow-white/10' : 'text-slate-300 hover:bg-white/8 hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/8 px-3 py-2 text-[10px] font-mono tracking-[0.13em] text-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-premium-pulse" />
            SYSTEMS ONLINE
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-5 py-10 sm:px-8 lg:py-16">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1fr_0.82fr] lg:gap-20">
          <section className="max-w-xl">
            <div className="mb-6 flex items-center gap-3 text-[10px] font-mono tracking-[0.28em] text-cyan-200">
              <span className="h-px w-12 hairline" />
              AETHER NETWORK / NODE 07
            </div>
            <h2 className="max-w-2xl font-heading text-5xl font-semibold leading-[1.06] tracking-tight text-white sm:text-7xl">
              Link your <span className="text-cyan-200 [text-shadow:0_0_25px_rgba(103,232,249,0.35)]">number.</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-7 text-slate-200/90 sm:text-lg">
              A single premium gateway for your connected bot ecosystem. Pair once, then access the complete Varnox XMD command suite from one place.
            </p>

            <div className="mt-9 grid max-w-lg grid-cols-3 gap-3 border-y border-white/12 py-4">
              <div>
                <p className="text-lg font-heading text-white">24/7</p>
                <p className="mt-1 text-[9px] font-mono uppercase tracking-[0.16em] text-slate-300">Node uptime</p>
              </div>
              <div className="border-l border-white/12 pl-4">
                <p className="text-lg font-heading text-white">01</p>
                <p className="mt-1 text-[9px] font-mono uppercase tracking-[0.16em] text-slate-300">Unified hub</p>
              </div>
              <div className="border-l border-white/12 pl-4">
                <p className="text-lg font-heading text-white">AES</p>
                <p className="mt-1 text-[9px] font-mono uppercase tracking-[0.16em] text-slate-300">Secure link</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-300">
              <span className="inline-flex items-center gap-2"><Fingerprint className="h-4 w-4 text-cyan-200" /> IDENTITY VERIFIED</span>
              <span className="h-1 w-1 rounded-full bg-cyan-300/70" />
              <span className="inline-flex items-center gap-2"><Server className="h-4 w-4 text-cyan-200" /> REMOTE NODE READY</span>
            </div>
          </section>

          <section className="w-full max-w-xl justify-self-end">
            {activeTab === 'pairing' && (
              <div className="premium-card rounded-[26px] p-5 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.2em] text-cyan-200">
                      <Radio className="h-3.5 w-3.5 animate-premium-pulse" /> SECURE ENTRY
                    </div>
                    <h3 className="mt-3 font-heading text-2xl font-semibold tracking-wide text-white">Pair your device</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">Enter your WhatsApp number to request a live link from the Varnox node.</p>
                  </div>
                  <div className="rounded-xl border border-white/12 bg-white/5 p-3 text-cyan-200"><Lock className="h-5 w-5" /></div>
                </div>

                <div className="my-6 h-px hairline opacity-50" />

                <form onSubmit={handleGeneratePairing} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-[10px] font-mono tracking-[0.18em] text-slate-300">WHATSAPP NUMBER / COUNTRY CODE</label>
                    <div className="flex items-center rounded-xl border border-white/15 bg-black/35 px-4 transition focus-within:border-cyan-300/70 focus-within:shadow-[0_0_0_3px_rgba(103,232,249,0.1)]">
                      <span className="mr-2 text-cyan-200">+</span>
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(event) => setPhoneNumber(event.target.value)}
                        placeholder="254700000000"
                        className="w-full bg-transparent py-4 text-sm font-mono text-white outline-none placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  {errorMessage && <div className="rounded-xl border border-rose-300/25 bg-rose-950/40 px-4 py-3 text-xs leading-5 text-rose-100">{errorMessage}</div>}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group flex w-full items-center justify-between rounded-xl bg-cyan-200 px-5 py-4 text-left text-sm font-semibold text-slate-950 shadow-[0_12px_30px_rgba(103,232,249,0.2)] transition hover:bg-cyan-100 hover:shadow-[0_14px_35px_rgba(103,232,249,0.34)] disabled:cursor-wait disabled:opacity-60"
                  >
                    <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.14em]">{isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}{isLoading ? 'REQUESTING LIVE LINK' : 'GENERATE PAIRING CODE'}</span>
                    <ArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </button>
                </form>

                {pairingCode && (
                  <div className="animate-fadeIn mt-6 rounded-2xl border border-cyan-300/35 bg-cyan-300/8 p-4">
                    <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.18em] text-cyan-200">
                      <span className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" /> LIVE PAIRING CODE</span>
                      <span className="text-emerald-200">READY</span>
                    </div>
                    <div className="mt-3 rounded-xl border border-white/12 bg-black/35 px-4 py-4 text-center font-mono text-3xl font-bold tracking-[0.22em] text-white">{pairingCode}</div>
                    <button onClick={handleCopyCode} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-200/30 bg-cyan-200/10 py-2.5 text-[10px] font-mono tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-200/20">
                      {copied ? <Check className="h-4 w-4 text-emerald-200" /> : <Copy className="h-4 w-4" />}{copied ? 'COPIED TO CLIPBOARD' : 'COPY CODE TO LINK'}
                    </button>
                    <p className="mt-3 text-center text-[11px] leading-5 text-slate-300">WhatsApp &gt; Linked Devices &gt; Link with phone number instead.</p>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-[9px] font-mono tracking-[0.15em] text-slate-400">
                  <span className="flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-emerald-200" /> BRIDGE OPERATIONAL</span>
                  <span>HTTPS / ENCRYPTED</span>
                </div>
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="premium-card rounded-[26px] p-6 sm:p-8">
                <div className="flex items-start justify-between">
                  <div><p className="text-[10px] font-mono tracking-[0.2em] text-cyan-200">NETWORK OVERVIEW</p><h3 className="mt-3 font-heading text-2xl text-white">One hub. Every command.</h3></div>
                  <Activity className="h-6 w-6 text-cyan-200" />
                </div>
                <div className="my-6 h-px hairline opacity-50" />
                <div className="space-y-3">
                  {[['Hub status', 'ONLINE', 'text-emerald-200'], ['Merged version', 'Varnox XMD Universal', 'text-cyan-200'], ['Hosting engine', 'Pterodactyl + Vercel', 'text-white'], ['Link security', 'Encrypted bridge', 'text-white']].map(([label, value, color]) => <div key={label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-mono"><span className="text-slate-400">{label}</span><span className={color}>{value}</span></div>)}
                </div>
                <button onClick={() => setActiveTab('pairing')} className="mt-6 inline-flex items-center gap-2 text-[10px] font-mono tracking-[0.16em] text-cyan-200 transition hover:text-white">RETURN TO PAIRING <ChevronRight className="h-4 w-4" /></button>
              </div>
            )}

            {activeTab === 'modules' && (
              <div className="premium-card rounded-[26px] p-6 sm:p-8">
                <div className="flex items-start justify-between"><div><p className="text-[10px] font-mono tracking-[0.2em] text-cyan-200">COMMAND ECOSYSTEM</p><h3 className="mt-3 font-heading text-2xl text-white">Everything in one place.</h3></div><Sparkles className="h-6 w-6 text-cyan-200" /></div>
                <div className="my-6 h-px hairline opacity-50" />
                <div className="grid gap-3 sm:grid-cols-2">{modules.map(({ icon: Icon, title, detail }) => <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-300/35 hover:bg-cyan-300/8"><Icon className="h-5 w-5 text-cyan-200" /><p className="mt-4 text-sm font-semibold text-white">{title}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></div>)}</div>
                <button onClick={() => setActiveTab('pairing')} className="mt-6 inline-flex items-center gap-2 text-[10px] font-mono tracking-[0.16em] text-cyan-200 transition hover:text-white">OPEN PAIRING PORTAL <ChevronRight className="h-4 w-4" /></button>
              </div>
            )}
          </section>
        </div>
      </main>

      <div className="relative z-10 border-t border-white/10 bg-slate-950/30 px-5 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-[9px] font-mono tracking-[0.16em] text-slate-400 sm:flex-row">
          <span>© 2026 VARNOX ECOSYSTEM / ALL RIGHTS RESERVED</span>
          <span className="text-cyan-200">PREMIUM BOT INTELLIGENCE / FULLY COMBINED</span>
        </div>
      </div>
    </div>
  );
}
