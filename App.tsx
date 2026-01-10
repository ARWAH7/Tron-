
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Search, RotateCcw, Settings, X, Loader2, ShieldCheck, AlertCircle, RefreshCw, BarChart3, PieChart } from 'lucide-react';
import { BlockData, IntervalType } from './types';
import { fetchLatestBlock, fetchBlockByNum, transformTronBlock, isAligned } from './utils/helpers';
import TrendChart from './components/TrendChart';
import DataTable from './components/DataTable';

type ViewType = 'parity' | 'size';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('tron_api_key') || '');
  const [showSettings, setShowSettings] = useState(() => !localStorage.getItem('tron_api_key'));
  const [activeInterval, setActiveInterval] = useState<IntervalType>(1);
  const [activeView, setActiveView] = useState<ViewType>('parity');
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const blocksRef = useRef<BlockData[]>([]);
  const intervalRef = useRef<IntervalType>(activeInterval);
  const isPollingBusy = useRef(false);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    intervalRef.current = activeInterval;
  }, [activeInterval]);

  const saveApiKey = useCallback((key: string) => {
    const trimmed = key.trim();
    if (!trimmed) return;
    localStorage.setItem('tron_api_key', trimmed);
    setApiKey(trimmed);
    setShowSettings(false);
    setError(null);
  }, []);

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
      
      let currentHeight = latest.height;
      if (interval > 1) {
        currentHeight = Math.floor(currentHeight / interval) * interval;
      }
      
      const count = 60;
      const targetHeights: number[] = [];
      for (let i = 0; i < count; i++) {
        targetHeights.push(currentHeight - (i * interval));
      }
      
      const results: BlockData[] = [];
      // Use a smaller batch size to avoid hitting concurrent connection limits
      const batchSize = 3; 
      
      for (let i = 0; i < targetHeights.length; i += batchSize) {
        const batch = targetHeights.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (num) => {
            try {
              // fetchBlockByNum has its own internal memory cache now
              return await fetchBlockByNum(num, apiKey);
            } catch (e) {
              return null;
            }
          })
        );
        results.push(...batchResults.filter((b): b is BlockData => b !== null));
        
        // Minor delay between batches to respect TronGrid's likely per-second limit
        if (i + batchSize < targetHeights.length) {
          await new Promise(r => setTimeout(r, 100));
        }
      }

      setBlocks(results.sort((a, b) => b.height - a.height));
    } catch (err: any) {
      console.error("fetchData error:", err);
      setError(err.message || "网络请求失败。请确认 API Key 是否正确并具有访问权限。");
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    if (apiKey) fetchData(activeInterval);
  }, [activeInterval, apiKey, fetchData]);

  useEffect(() => {
    if (!apiKey || searchQuery || isLoading) return;

    const poll = async () => {
      if (isPollingBusy.current || document.hidden) return;
      isPollingBusy.current = true;

      try {
        const latestRaw = await fetchLatestBlock(apiKey);
        const latest = transformTronBlock(latestRaw);
        const currentTopHeight = blocksRef.current[0]?.height || 0;

        if (latest.height > currentTopHeight) {
          const interval = intervalRef.current;
          const missedHeights: number[] = [];
          
          for (let h = currentTopHeight + 1; h <= latest.height; h++) {
            if (isAligned(h, interval)) missedHeights.push(h);
          }

          if (missedHeights.length > 0) {
            setIsSyncing(true);
            const newBlocks: BlockData[] = [];
            
            // Sequential fetching for poll to be very gentle
            for (const num of missedHeights) {
              try {
                const b = await fetchBlockByNum(num, apiKey);
                newBlocks.push(b);
                await new Promise(r => setTimeout(r, 50)); 
              } catch (e) {
                // ignore single block errors during polling
              }
            }
            
            if (newBlocks.length > 0) {
              setBlocks(prev => {
                const combined = [...newBlocks, ...prev];
                const uniqueMap = new Map();
                for (const b of combined) {
                  if (!uniqueMap.has(b.height)) uniqueMap.set(b.height, b);
                }
                return Array.from(uniqueMap.values())
                  .sort((a, b) => b.height - a.height)
                  .slice(0, 150);
              });
            }
            setIsSyncing(false);
          }
        }
        if (error) setError(null);
      } catch (e) {
        // Silent catch for polling
      } finally {
        isPollingBusy.current = false;
      }
    };

    const pollingId = window.setInterval(poll, 5000); // Relaxed polling to 5s
    return () => clearInterval(pollingId);
  }, [apiKey, searchQuery, isLoading, error]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) {
      fetchData(activeInterval);
      return;
    }
    setBlocks(prev => prev.filter(b => 
      b.height.toString().includes(searchQuery) || 
      b.hash.toLowerCase().includes(searchQuery.toLowerCase())
    ));
  }, [searchQuery, activeInterval, fetchData]);

  const intervals = useMemo(() => [
    { label: '单区块', value: 1 as IntervalType },
    { label: '20区块', value: 20 as IntervalType },
    { label: '60区块', value: 60 as IntervalType },
    { label: '100区块', value: 100 as IntervalType },
  ], []);

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 pb-24 min-h-screen antialiased">
      <header className="mb-6 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-6">
          <div className="w-10"></div>
          <h1 className="text-3xl md:text-4xl font-black text-blue-600 tracking-tight text-center">
            哈希走势大盘 <span className="text-gray-300 font-light mx-2">|</span> <span className="text-gray-400">Analysis</span>
          </h1>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-3 bg-white shadow-sm border border-gray-100 hover:bg-gray-50 rounded-2xl transition-all text-gray-500 active:scale-95"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 mb-6 w-full max-w-sm">
          <button
            onClick={() => setActiveView('parity')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-black transition-all duration-300 ${
              activeView === 'parity' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>单双走势</span>
          </button>
          <button
            onClick={() => setActiveView('size')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-black transition-all duration-300 ${
              activeView === 'size' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>大小走势</span>
          </button>
        </div>

        <p className="bg-white px-5 py-2 rounded-full shadow-sm border border-gray-50 text-gray-400 text-[10px] uppercase tracking-[0.25em] font-black flex items-center">
          <ShieldCheck className="w-3.5 h-3.5 mr-2 text-green-500" />
          Mainnet Protocol Verified
        </p>
      </header>

      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowSettings(false)} className="absolute top-10 right-10 p-2 hover:bg-gray-100 rounded-full text-gray-400">
              <X className="w-6 h-6" />
            </button>
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <Settings className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">API 安全连接</h2>
              <p className="text-gray-500 text-sm mt-3 leading-relaxed">接入 TronGrid 获取实时链上哈希</p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-[0.2em] ml-2">API KEY</label>
                <input
                  type="text"
                  defaultValue={apiKey}
                  id="api-key-input"
                  placeholder="Paste TronGrid Key..."
                  className="w-full px-6 py-5 rounded-[1.5rem] bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-mono text-sm shadow-inner"
                />
              </div>
              <button
                onClick={() => {
                  const input = document.getElementById('api-key-input') as HTMLInputElement;
                  saveApiKey(input.value);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[1.5rem] transition-all shadow-xl shadow-blue-100 active:scale-95"
              >
                立即同步
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-10 bg-red-50 border-l-8 border-red-500 p-6 rounded-[1.5rem] flex items-start text-red-700 shadow-md">
          <AlertCircle className="w-6 h-6 mr-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-black text-sm mb-1 uppercase tracking-wider">Network Conflict</h4>
            <p className="text-xs font-medium opacity-80">{error}</p>
          </div>
          <button onClick={() => fetchData(activeInterval)} className="ml-4 px-5 py-2.5 bg-red-100 rounded-xl text-xs font-black uppercase hover:bg-red-200 transition-colors">Retry</button>
        </div>
      )}

      <nav className="flex justify-center flex-wrap gap-3 md:gap-5 mb-10">
        {intervals.map((item) => (
          <button
            key={item.value}
            onClick={() => setActiveInterval(item.value)}
            disabled={isLoading}
            className={`px-10 py-3 rounded-[1.25rem] text-xs md:text-sm font-black transition-all duration-300 border-2 ${
              activeInterval === item.value
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xl scale-110'
                : 'bg-white text-gray-400 border-transparent hover:border-blue-100 hover:text-blue-500'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="space-y-8 mb-12">
        <div className="relative">
          {(isLoading || isSyncing) && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-[2px] rounded-[2rem] transition-all">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center border border-gray-100">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">{isLoading ? 'Initializing' : 'Syncing Data'}</span>
              </div>
            </div>
          )}
          <TrendChart blocks={blocks} mode={activeView} />
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-5 my-10 bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
        <form onSubmit={handleSearch} className="flex-1 w-full relative group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索区块号或 Hash..."
            className="w-full pl-7 pr-16 py-5 rounded-[1.5rem] bg-gray-50 border-0 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all text-sm font-medium"
          />
          <Search className="absolute right-7 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-blue-400 transition-colors" />
        </form>
        <div className="flex space-x-4 w-full md:w-auto">
          <button onClick={() => {setSearchQuery(''); fetchData(activeInterval);}} className="flex-1 md:flex-none flex items-center justify-center px-8 py-5 bg-gray-100 text-gray-400 rounded-[1.5rem] hover:bg-gray-200 transition-all active:scale-95">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={handleSearch} className="flex-1 md:flex-none flex items-center justify-center px-14 py-5 bg-blue-600 text-white rounded-[1.5rem] text-sm font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95">
            查询
          </button>
        </div>
      </div>

      <DataTable blocks={blocks} />

      <div className="fixed bottom-10 right-10 z-50 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-[1.5rem] px-8 py-5 border border-gray-100 flex items-center space-x-5">
          <div className="relative flex h-3.5 w-3.5">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${apiKey && !error ? 'animate-ping bg-green-400' : 'bg-red-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${apiKey && !error ? 'bg-green-500' : 'bg-red-500'}`}></span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1.5">Network Status</span>
            <span className="text-[11px] font-black text-gray-800 flex items-center">
              {apiKey && !error ? (isSyncing ? 'UPDATING' : 'STABLE') : 'ERROR'}
              {isSyncing && <RefreshCw className="w-3 h-3 ml-3 animate-spin text-blue-500" />}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
