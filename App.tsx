
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, RotateCcw, Settings, X, Loader2, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { BlockData, IntervalType } from './types';
import { fetchLatestBlock, fetchBlockByNum, transformTronBlock, isAligned } from './utils/helpers';
import TrendChart from './components/TrendChart';
import DataTable from './components/DataTable';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('tron_api_key') || '');
  const [showSettings, setShowSettings] = useState(!localStorage.getItem('tron_api_key'));
  const [activeInterval, setActiveInterval] = useState<IntervalType>(1);
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const blocksRef = useRef<BlockData[]>([]);
  const intervalRef = useRef<IntervalType>(activeInterval);
  const pollingRef = useRef<number | null>(null);
  const isPollingBusy = useRef(false);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    intervalRef.current = activeInterval;
  }, [activeInterval]);

  const saveApiKey = (key: string) => {
    const trimmed = key.trim();
    if (!trimmed) return;
    localStorage.setItem('tron_api_key', trimmed);
    setApiKey(trimmed);
    setShowSettings(false);
    setError(null);
  };

  const fetchData = useCallback(async (interval: IntervalType) => {
    if (!apiKey) {
      setShowSettings(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const latestRaw = await fetchLatestBlock(apiKey);
      const latest = transformTronBlock(latestRaw);
      
      // Calculate the start height based on interval alignment
      let currentHeight = latest.height;
      if (interval > 1) {
        currentHeight = Math.floor(currentHeight / interval) * interval;
      }
      
      const count = 60; // Fetch 60 interval points
      const heights: number[] = [];
      for (let i = 0; i < count; i++) {
        heights.push(currentHeight - (i * interval));
      }
      
      const results: BlockData[] = [];
      const batchSize = 5; // Smaller batch size to avoid rate limits
      for (let i = 0; i < heights.length; i += batchSize) {
        const batch = heights.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (num) => {
            try {
              const b = await fetchBlockByNum(num, apiKey);
              return transformTronBlock(b);
            } catch (e) {
              return null;
            }
          })
        );
        results.push(...batchResults.filter((b): b is BlockData => b !== null));
      }

      setBlocks(results.sort((a, b) => b.height - a.height));
    } catch (err: any) {
      console.error(err);
      setError("网络请求失败。请确认 API Key 是否正确（需启用权限）以及是否能够正常访问 TronGrid。");
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    if (apiKey) fetchData(activeInterval);
  }, [activeInterval, apiKey, fetchData]);

  // Polling logic with gap-filling to prevent jumping
  useEffect(() => {
    if (!apiKey || searchQuery || isLoading) return;

    const poll = async () => {
      if (isPollingBusy.current) return;
      isPollingBusy.current = true;

      try {
        const latestRaw = await fetchLatestBlock(apiKey);
        const latest = transformTronBlock(latestRaw);
        const currentTopHeight = blocksRef.current[0]?.height || 0;

        if (latest.height > currentTopHeight) {
          const interval = intervalRef.current;
          const missedHeights: number[] = [];
          
          // Identify all heights we missed that align with current interval
          for (let h = currentTopHeight + 1; h <= latest.height; h++) {
            if (isAligned(h, interval)) {
              missedHeights.push(h);
            }
          }

          if (missedHeights.length > 0) {
            setIsSyncing(true);
            const newBlocks = await Promise.all(
              missedHeights.map(num => fetchBlockByNum(num, apiKey).then(transformTronBlock))
            );
            
            setBlocks(prev => {
              const combined = [...newBlocks, ...prev];
              // Sort descending and deduplicate
              const unique = Array.from(new Map(combined.map(b => [b.height, b])).values());
              return unique.sort((a, b) => b.height - a.height).slice(0, 150);
            });
            setIsSyncing(false);
          }
        }
        setError(null);
      } catch (e) {
        console.warn("Polling Sync Error:", e);
      } finally {
        isPollingBusy.current = false;
      }
    };

    pollingRef.current = window.setInterval(poll, 3000); // 3 seconds interval
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [apiKey, searchQuery, isLoading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) {
      fetchData(activeInterval);
      return;
    }
    const filtered = blocks.filter(b => 
      b.height.toString().includes(searchQuery) || 
      b.hash.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setBlocks(filtered);
  };

  const intervals: { label: string; value: IntervalType }[] = [
    { label: '单区块', value: 1 },
    { label: '20区块', value: 20 },
    { label: '60区块', value: 60 },
    { label: '100区块', value: 100 },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 pb-20 min-h-screen">
      <header className="mb-8 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-4">
          <div className="w-10"></div>
          <h1 className="text-3xl font-bold text-blue-600 tracking-tight">哈希单双走势 <span className="text-gray-300 font-light">|</span> Live</h1>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
        <p className="text-gray-400 text-[10px] uppercase tracking-[0.2em] font-bold flex items-center">
          <ShieldCheck className="w-3 h-3 mr-1.5 text-green-500" />
          Real-time Connection: TronGrid Mainnet
        </p>
      </header>

      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-10 relative animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowSettings(false)} className="absolute top-8 right-8 p-1.5 hover:bg-gray-100 rounded-full text-gray-400">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Settings className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">API 配置</h2>
              <p className="text-gray-500 text-sm mt-3 leading-relaxed">请输入您的 TronGrid API Key。<br/>这可以确保您看到的是实时、真实的区块链数据。</p>
            </div>
            <div className="space-y-5">
              <div className="group">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest ml-1">TronGrid API Key</label>
                <input
                  type="text"
                  defaultValue={apiKey}
                  id="api-key-input"
                  placeholder="Paste key here..."
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-mono text-sm shadow-inner"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveApiKey((e.target as HTMLInputElement).value);
                  }}
                />
              </div>
              <button
                onClick={() => {
                  const input = document.getElementById('api-key-input') as HTMLInputElement;
                  saveApiKey(input.value);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-100 active:scale-95"
              >
                验证并连接
              </button>
              <div className="pt-2">
                <a href="https://www.trongrid.io/" target="_blank" className="block text-center text-xs font-bold text-blue-500 hover:text-blue-700 underline decoration-2 underline-offset-4">
                  去官网申请免费 Key →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-5 rounded-2xl flex items-start text-red-700 shadow-sm animate-in slide-in-from-top-4">
          <AlertCircle className="w-5 h-5 mr-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm mb-1">同步出错</h4>
            <p className="text-xs opacity-80 leading-relaxed">{error}</p>
          </div>
          <button onClick={() => fetchData(activeInterval)} className="ml-4 px-4 py-2 bg-red-100 rounded-lg text-xs font-black uppercase hover:bg-red-200 transition-colors">重试</button>
        </div>
      )}

      <nav className="flex justify-center flex-wrap gap-2 md:gap-4 mb-10">
        {intervals.map((item) => (
          <button
            key={item.value}
            onClick={() => setActiveInterval(item.value)}
            disabled={isLoading}
            className={`px-8 py-3 rounded-2xl text-xs md:text-sm font-black transition-all duration-300 border-2 ${
              activeInterval === item.value
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xl scale-110'
                : 'bg-white text-gray-400 border-transparent hover:border-blue-100 hover:text-blue-500'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="relative group">
        {(isLoading || isSyncing) && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-[1px] rounded-3xl transition-all">
            <div className="bg-white/90 p-6 rounded-3xl shadow-2xl flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <span className="text-xs font-black text-gray-600 uppercase tracking-widest">{isLoading ? '正在初始化...' : '正在补全缺漏区块...'}</span>
            </div>
          </div>
        )}
        <TrendChart blocks={blocks} />
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 my-8 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <form onSubmit={handleSearch} className="flex-1 w-full relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索区块号或 Hash..."
            className="w-full pl-6 pr-14 py-4 rounded-2xl bg-gray-50 border-0 focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm transition-all"
          />
          <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
        </form>
        <div className="flex space-x-3 w-full md:w-auto">
          <button onClick={() => {setSearchQuery(''); fetchData(activeInterval);}} className="flex-1 md:flex-none flex items-center justify-center px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl text-sm font-black hover:bg-gray-200 transition-all active:scale-95">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={handleSearch} className="flex-1 md:flex-none flex items-center justify-center px-12 py-4 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95">
            查询
          </button>
        </div>
      </div>

      <DataTable blocks={blocks} />

      <div className="fixed bottom-8 right-8 z-50">
        <div className="bg-white/95 backdrop-blur shadow-2xl rounded-2xl px-6 py-4 border border-gray-100 flex items-center space-x-4">
          <div className="relative flex h-3 w-3">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${apiKey && !error ? 'animate-ping bg-green-400' : 'bg-red-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${apiKey && !error ? 'bg-green-500' : 'bg-red-500'}`}></span>
          </div>
          <div className="flex flex-col pr-2">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter leading-none mb-1">Status</span>
            <span className="text-[11px] font-black text-gray-700 flex items-center">
              {apiKey && !error ? (isSyncing ? 'SYNCING' : 'LIVE') : 'OFFLINE'}
              {isSyncing && <RefreshCw className="w-3 h-3 ml-2 animate-spin text-blue-500" />}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
