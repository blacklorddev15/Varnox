import React, { useState, useEffect } from 'react';
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
  KeyRound,
  Lock,
  Radio,
  RefreshCw,
  Server,
  Shield,
  Sliders,
  Sparkles,
  Terminal,
  Users,
  Zap,
  X,
  Key,
} from 'lucide-react';

type Tab = 'pairing' | 'overview' | 'modules' | 'admin';

const modules = [
  { icon: Shield, title: 'Group security', detail: 'Moderation & protection' },
  { icon: Terminal, title: 'AI command suite', detail: 'Tools, chat & automation' },
  { icon: Cpu, title: 'Media engine', detail: 'Download & conversion' },
  { icon: Sparkles, title: 'Creative tools', detail: 'Stickers, reactions & fun' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('pairing');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [activationKey, setActivationKey] = useState('');
  const pairingBridgeUrl = (import.meta.env.VITE_VARNOX_PAIRING_URL || '/api/pair').replace(/\/$/, '');
  const [isLoading, setIsLoading] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bridgeStatus, setBridgeStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Live stats & admin state
  const [uptime, setUptime] = useState('—');
  const [pairedCount, setPairedCount] = useState<number | null>(null);
  const [isPremiumMode, setIsPremiumMode] = useState(false);

  // Admin modal & settings state
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  // Editable panel settings
  const [panelDomain, setPanelDomain] = useState('https://pterodactyl.mzazi.shop');
  const [serverIp, setServerIp] = useState('139.59.111.210');
  const [serverPort, setServerPort] = useState('25572');
  const [serverId, setServerId] = useState('');
  const [backendSecretInput, setBackendSecretInput] = useState('');
  const [backendSecretMasked, setBackendSecretMasked] = useState('Not configured');
  const [migrationTestStatus, setMigrationTestStatus] = useState<string | null>(null);
  const [generatedKeysList, setGeneratedKeysList] = useState<string[]>(['VARNOX-PRO-2026', 'SKYLAR-VIP-777']);
  const [adminStatusMessage, setAdminStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`${pairingBridgeUrl}?stats=1`, { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const data = await res.json();
          setBridgeStatus(data.status === 'offline' ? 'offline' : 'online');
          if (data.uptime) setUptime(data.uptime);
          if (data.pairedCount !== undefined) setPairedCount(Number(data.pairedCount));
          if (typeof data.premiumMode === 'boolean') setIsPremiumMode(data.premiumMode);
          if (data.panelDomain) setPanelDomain(data.panelDomain);
          if (data.serverIp) setServerIp(data.serverIp);
          if (data.serverPort) setServerPort(data.serverPort);
          if (data.serverId) setServerId(data.serverId);
          if (data.backendSecretMasked) setBackendSecretMasked(data.backendSecretMasked);
        } else {
          setBridgeStatus('offline');
          setUptime('—');
          setPairedCount(null);
        }
      } catch {
        setBridgeStatus('offline');
        setUptime('—');
        setPairedCount(null);
      }
    }
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [pairingBridgeUrl]);

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
      
      const endpoint = `${pairingBridgeUrl}?phone=${cleaned}${activationKey ? `&key=${encodeURIComponent(activationKey)}` : ''}`;
      const response = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.message || 'The pairing bridge rejected the request.');
      
      const code = data.code || data.pairingCode || data.pairCode;
      if (!code) throw new Error('The pairing bridge responded without a pairing code.');
      
      setPairingCode(String(code));
      if (data.pairedCount !== undefined) setPairedCount(Number(data.pairedCount));
      setBridgeStatus('online');
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

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);
    try {
      const res = await fetch(pairingBridgeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'admin_login', password: adminPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAdminLoggedIn(true);
        if (data.config) {
          if (data.config.panelDomain) setPanelDomain(data.config.panelDomain);
          if (data.config.serverIp) setServerIp(data.config.serverIp);
          if (data.config.serverPort) setServerPort(data.config.serverPort);
          if (data.config.serverId) setServerId(data.config.serverId);
          if (data.config.backendSecretMasked) setBackendSecretMasked(data.config.backendSecretMasked);
          if (typeof data.config.premiumMode === 'boolean') setIsPremiumMode(data.config.premiumMode);
        }
      } else {
        setAdminLoginError(data.error || 'Incorrect admin password.');
      }
    } catch {
      setBridgeStatus('offline');
      setAdminLoginError('Website admin authentication is unavailable. The bot backend may be offline, but that does not block website login.');
    }
  };

  const handleSaveSettings = async () => {
    setAdminStatusMessage(null);
    try {
      const res = await fetch(pairingBridgeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
        body: JSON.stringify({
          action: 'update_settings',
          password: adminPassword,
          panelDomain,
          serverIp,
          serverPort,
          serverId,
          ...(backendSecretInput.trim() ? { backendSecret: backendSecretInput.trim() } : {}),
          premiumMode: isPremiumMode,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBackendSecretInput('');
        if (data.config?.backendSecretMasked) setBackendSecretMasked(data.config.backendSecretMasked);
        setAdminStatusMessage('Pterodactyl details saved. No public website code edit is required.');
      } else {
        setAdminStatusMessage(data.error || 'Failed to update settings.');
      }
    } catch {
      setBridgeStatus('offline');
      setAdminStatusMessage('Website settings could not be saved. Retry while the website API is available; the bot backend itself may remain offline.');
    }
  };

  const handleTestMigrationConnection = async () => {
    setMigrationTestStatus('Testing backend connection…');
    try {
      const res = await fetch(pairingBridgeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
        body: JSON.stringify({ action: 'test_connection', password: adminPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Connection test was rejected.');
      setMigrationTestStatus(data.backendOnline ? 'ONLINE — backend is reachable.' : `OFFLINE — ${data.message || 'backend is not reachable.'}`);
    } catch (error) {
      setMigrationTestStatus(error instanceof Error ? error.message : 'Connection test failed.');
    }
  };

  const handleGenerateKey = async () => {
    try {
      const res = await fetch(pairingBridgeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPassword },
        body: JSON.stringify({ action: 'generate_key', password: adminPassword }),
      });
      const data = await res.json();
      if (res.ok && data.key) {
        setGeneratedKeysList((prev) => [data.key, ...prev]);
        setAdminStatusMessage(`Generated new activation key: ${data.key}`);
      }
    } catch {
      setBridgeStatus('offline');
      setAdminStatusMessage('Varnox bridge is offline. No activation key was generated.');
    }
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdminModal(true)}
              className="flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3.5 py-2 text-[10px] font-mono tracking-[0.14em] text-cyan-200 transition hover:bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            >
              <Sliders className="w-3.5 h-3.5" /> ADMIN PANEL
            </button>
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/8 px-3 py-2 text-[10px] font-mono tracking-[0.13em] text-emerald-200">
              <span className={`h-1.5 w-1.5 rounded-full ${bridgeStatus === 'online' ? 'bg-emerald-300 animate-premium-pulse' : bridgeStatus === 'offline' ? 'bg-rose-300' : 'bg-amber-300 animate-pulse'}`} />
              {bridgeStatus === 'online' ? 'ONLINE' : bridgeStatus === 'offline' ? 'OFFLINE' : 'CHECKING'}
            </div>
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
                <p className="text-lg font-heading text-white">{uptime}</p>
                <p className="mt-1 text-[9px] font-mono uppercase tracking-[0.16em] text-slate-300">Live uptime</p>
              </div>
              <div className="border-l border-white/12 pl-4">
                <p className="text-lg font-heading text-white">{pairedCount === null ? '—' : pairedCount.toLocaleString()}</p>
                <p className="mt-1 text-[9px] font-mono uppercase tracking-[0.16em] text-slate-300">Users paired</p>
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
                    <div className="flex items-center justify-between gap-3 text-[10px] font-mono tracking-[0.2em] text-cyan-200">
                      <span className="flex items-center gap-1.5"><Radio className="h-3.5 w-3.5 animate-premium-pulse" /> SECURE ENTRY</span>
                      {isPremiumMode && <span className="rounded bg-amber-400/20 px-2 py-0.5 text-amber-300 border border-amber-400/30">PREMIUM MODE</span>}
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

                  {isPremiumMode && (
                    <div>
                      <label className="mb-2 flex items-center justify-between text-[10px] font-mono tracking-[0.18em] text-amber-300">
                        <span>ACTIVATION KEY REQUIRED</span>
                        <span className="text-slate-400">GENERATE IN ADMIN</span>
                      </label>
                      <div className="flex items-center rounded-xl border border-amber-400/35 bg-black/35 px-4 transition focus-within:border-amber-400">
                        <KeyRound className="mr-2 h-4 w-4 text-amber-300" />
                        <input
                          type="text"
                          value={activationKey}
                          onChange={(event) => setActivationKey(event.target.value)}
                          placeholder="Enter activation key"
                          className="w-full bg-transparent py-4 text-sm font-mono text-white outline-none placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                  )}

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
                  <span className={`flex items-center gap-2 ${bridgeStatus === 'offline' ? 'text-rose-200' : bridgeStatus === 'checking' ? 'text-amber-200' : 'text-emerald-200'}`}><Activity className="h-3.5 w-3.5" /> {bridgeStatus === 'online' ? 'BRIDGE OPERATIONAL' : bridgeStatus === 'offline' ? 'BRIDGE OFFLINE' : 'CHECKING BRIDGE'}</span>
                  <span>HTTPS / ENCRYPTED</span>
                </div>
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="premium-card rounded-[26px] p-6 sm:p-8">
                <div className="flex items-start justify-between">
                  <div><p className="text-[10px] font-mono tracking-[0.2em] text-cyan-200">NETWORK OVERVIEW</p><h3 className="mt-3 font-heading text-2xl text-white">Live Hub Metrics</h3></div>
                  <Users className="h-6 w-6 text-cyan-200" />
                </div>
                <div className="my-6 h-px hairline opacity-50" />
                <div className="space-y-3">
                  {[['Hub status', bridgeStatus === 'online' ? 'ONLINE' : bridgeStatus === 'offline' ? 'OFFLINE' : 'CHECKING', bridgeStatus === 'online' ? 'text-emerald-200' : bridgeStatus === 'offline' ? 'text-rose-200' : 'text-amber-200'], ['Live uptime', uptime, 'text-cyan-200'], ['Total paired users', pairedCount === null ? '—' : pairedCount.toLocaleString(), 'text-cyan-200'], ['Hosting mode', isPremiumMode ? 'Premium (Key Required)' : 'Free (Open Pairing)', 'text-amber-300'], ['Active panel', panelDomain, 'text-cyan-200']].map(([label, value, color]) => <div key={label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-mono"><span className="text-slate-400">{label}</span><span className={color}>{value}</span></div>)}
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

      {/* Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-cyan-500/30 bg-slate-950/90 p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.25)] relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAdminModal(false)}
              className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-xl bg-cyan-500/20 border border-cyan-400/40 p-3 text-cyan-300">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-white">Varnox Admin Suite</h3>
                <p className="text-xs font-mono text-slate-400">Control panel domain, server nodes, &amp; premium keys</p>
              </div>
            </div>

            {!isAdminLoggedIn ? (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-cyan-300 mb-2 uppercase tracking-wider">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>
                {adminLoginError && <p className="text-xs font-mono text-rose-400">{adminLoginError}</p>}
                <button
                  type="submit"
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-heading font-bold py-3 rounded-xl transition uppercase text-xs tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  Unlock Admin Dashboard
                </button>
              </form>
            ) : (
                <div className="space-y-6">
                  <div className={`rounded-2xl border px-4 py-3 text-xs font-mono ${bridgeStatus === 'online' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-rose-400/30 bg-rose-500/10 text-rose-200'}`}>
                    {bridgeStatus === 'online' ? 'Titan/Varnox backend online. Backend controls are active.' : 'Backend offline. Website admin is unlocked, but server settings and activation-key actions are unavailable until the bot returns online.'}
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div>
                    <p className="text-sm font-bold text-white">Mode: {isPremiumMode ? 'Premium (Key Required)' : 'Free (Open Pairing)'}</p>
                    <p className="text-xs text-slate-400">Toggle whether activation keys are required to pair.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPremiumMode(!isPremiumMode)}
                    disabled={bridgeStatus !== 'online'}
                    className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${isPremiumMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}`}
                  >
                    {isPremiumMode ? 'PREMIUM ON' : 'FREE MODE'}
                  </button>
                </div>

                <div className="space-y-4 border-t border-white/10 pt-4">
                  <h4 className="text-xs font-mono text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                    <Server className="w-4 h-4" /> Pterodactyl Panel Migration Settings
                  </h4>
                  <p className="text-xs text-slate-400">
                    Update your panel domain or server IP/port here when changing servers. No Vercel website edits required!
                  </p>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-300 mb-1">PTERODACTYL PANEL DOMAIN</label>
                    <input
                      type="text"
                      value={panelDomain}
                      onChange={(e) => setPanelDomain(e.target.value)}
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-300 mb-1">SERVER IP / HOST</label>
                      <input type="text" value={serverIp} onChange={(e) => setServerIp(e.target.value)} className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-300 mb-1">ALLOCATION PORT</label>
                      <input type="text" value={serverPort} onChange={(e) => setServerPort(e.target.value)} className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-300 mb-1">PTERODACTYL SERVER ID</label>
                    <input type="text" value={serverId} onChange={(e) => setServerId(e.target.value)} placeholder="Paste the server identifier from Pterodactyl" className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-400" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-300 mb-1">BACKEND API SECRET</label>
                    <input type="password" value={backendSecretInput} onChange={(e) => setBackendSecretInput(e.target.value)} placeholder="Leave blank to keep saved secret" autoComplete="new-password" className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-400" />
                    <p className="mt-1 text-[10px] text-slate-500 font-mono">Saved secret: {backendSecretMasked} (hidden)</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleSaveSettings} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs py-3 rounded-xl transition uppercase tracking-wider">Save Pterodactyl Details</button>
                    <button onClick={handleTestMigrationConnection} className="w-full bg-cyan-500/15 border border-cyan-400/30 hover:bg-cyan-500/25 text-cyan-200 font-mono text-xs py-3 rounded-xl transition uppercase tracking-wider">Test Connection</button>
                  </div>
                  {migrationTestStatus && <p className="text-xs font-mono text-slate-300">{migrationTestStatus}</p>}
                </div>

                <div className="space-y-3 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                      <Key className="w-4 h-4" /> Activation Keys ({generatedKeysList.length})
                    </h4>
                    <button
                      onClick={handleGenerateKey}
                      disabled={bridgeStatus !== 'online'}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-mono hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-40 transition"
                    >
                      + Generate New Key
                    </button>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
                    {generatedKeysList.map((k, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-black/40 border border-white/10 px-3 py-2 rounded-lg text-slate-300">
                        <span>{k}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(k);
                            setAdminStatusMessage(`Copied key: ${k}`);
                          }}
                          className="text-cyan-400 hover:text-cyan-300 text-[10px]"
                        >
                          Copy
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {adminStatusMessage && (
                  <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 text-xs font-mono">
                    {adminStatusMessage}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="relative z-10 border-t border-white/10 bg-slate-950/30 px-5 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-[9px] font-mono tracking-[0.16em] text-slate-400 sm:flex-row">
          <span>© 2026 VARNOX ECOSYSTEM / ALL RIGHTS RESERVED</span>
          <span className="text-cyan-200">{bridgeStatus === 'online' ? `UPTIME: ${uptime} • PAIRED: ${pairedCount === null ? '—' : pairedCount.toLocaleString()}` : `BRIDGE ${bridgeStatus === 'offline' ? 'OFFLINE' : 'CHECKING'}`}</span>
        </div>
      </div>
    </div>
  );
}
