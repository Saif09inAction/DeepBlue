import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, Maximize2, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { alerts } from "../../data/mockData";
import { cn, formatRelative } from "../../lib/utils";

export default function Navbar() {
  const [time, setTime]           = useState(new Date());
  const [showAlerts, setShowAlerts] = useState(false);
  const [isOnline, setIsOnline]   = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const firing = alerts.filter(a => a.status === "firing").slice(0, 5);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <header className="h-14 border-b border-ocean-800/30 bg-deep-800/80 backdrop-blur-xl
                       flex items-center px-4 gap-4 sticky top-0 z-10 shrink-0">
      {/* Search */}
      <div className="flex-1 max-w-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            placeholder="Search sensors, alerts…"
            className="w-full bg-deep-700/50 border border-ocean-800/30 rounded-lg
                       pl-9 pr-4 py-1.5 text-sm text-slate-300 placeholder:text-slate-600
                       focus:outline-none focus:border-ocean-400/50 focus:bg-deep-700
                       transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Live clock */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                        bg-deep-700/50 border border-ocean-800/30">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
          <span className="text-xs font-mono text-slate-300">
            {time.toUTCString().slice(17, 25)} UTC
          </span>
        </div>

        {/* Connection */}
        <button
          onClick={() => setIsOnline(p => !p)}
          className={cn("p-2 rounded-lg border transition-colors",
            isOnline
              ? "border-green-500/20 bg-green-500/10 text-green-400"
              : "border-red-500/20 bg-red-500/10 text-red-400"
          )}
          title="Connection status"
        >
          {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        </button>

        {/* Refresh */}
        <button className="p-2 rounded-lg border border-ocean-800/30 bg-deep-700/50
                           text-slate-400 hover:text-ocean-300 hover:border-ocean-400/30
                           transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg border border-ocean-800/30 bg-deep-700/50
                     text-slate-400 hover:text-ocean-300 hover:border-ocean-400/30 transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Alerts bell */}
        <div className="relative">
          <button
            onClick={() => setShowAlerts(p => !p)}
            className="relative p-2 rounded-lg border border-ocean-800/30 bg-deep-700/50
                       text-slate-400 hover:text-ocean-300 hover:border-ocean-400/30 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {firing.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500
                               text-white text-[9px] font-bold flex items-center justify-center
                               animate-pulse-slow">
                {firing.length}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showAlerts && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 glass-card border border-ocean-700/40
                           shadow-ocean-lg overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-ocean-800/30">
                  <p className="text-sm font-semibold text-white">Active Alerts</p>
                  <p className="text-xs text-slate-500">{firing.length} firing right now</p>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {firing.map(alert => (
                    <div key={alert.id}
                      className="px-4 py-3 border-b border-ocean-800/20 hover:bg-ocean-900/30
                                 transition-colors cursor-pointer">
                      <div className="flex items-start gap-2">
                        <span className={cn("w-2 h-2 rounded-full mt-1 shrink-0",
                          alert.severity === "critical" ? "bg-red-500" : "bg-yellow-500"
                        )} />
                        <div>
                          <p className="text-xs font-medium text-white">{alert.title}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {alert.location} · {formatRelative(alert.detectedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 text-center">
                  <a href="/alerts" className="text-xs text-ocean-400 hover:text-ocean-300 transition-colors">
                    View all alerts →
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
