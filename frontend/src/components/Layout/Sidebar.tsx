import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Map, BarChart3, Bell, Database,
  Server, Network, GitBranch, Waves, ChevronLeft, ChevronRight,
  Shield, Activity,
} from "lucide-react";
import { cn } from "../../lib/utils";

const NAV = [
  { to: "/",              icon: LayoutDashboard, label: "Executive Dashboard" },
  { to: "/map",           icon: Map,             label: "Live Ocean Map"      },
  { to: "/analytics",     icon: BarChart3,       label: "Climate Analytics"   },
  { to: "/alerts",        icon: Bell,            label: "Alert Center"        },
  { to: "/data",          icon: Database,        label: "Research Data"       },
  { to: "/infrastructure",icon: Server,          label: "Infrastructure"      },
  { to: "/architecture",  icon: Network,         label: "System Architecture" },
  { to: "/devops",        icon: GitBranch,       label: "DevOps Pipeline"     },
];

interface Props { collapsed: boolean; onToggle: () => void; }

export default function Sidebar({ collapsed, onToggle }: Props) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative flex flex-col h-screen bg-deep-800/95 border-r border-ocean-800/30
                 backdrop-blur-xl shrink-0 overflow-hidden z-20"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-ocean-800/30">
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-ocean-400 to-cyber-500
                          flex items-center justify-center shadow-glow-blue">
            <Waves className="w-5 h-5 text-white" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full
                           border-2 border-deep-800 animate-pulse-slow" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="text-sm font-bold text-white leading-tight">DeepBlue</p>
              <p className="text-[10px] text-ocean-300 leading-tight font-mono tracking-wider">
                RESEARCH PLATFORM
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status pill */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mx-3 mt-3 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20
                       flex items-center gap-2"
          >
            <Activity className="w-3 h-3 text-green-400 shrink-0" />
            <span className="text-[11px] text-green-400 font-medium">All Systems Operational</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === "/"}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 2 }}
                className={cn("nav-item", isActive && "active")}
                title={collapsed ? label : undefined}
              >
                <Icon className={cn("w-5 h-5 shrink-0",
                  isActive ? "text-ocean-300" : "text-slate-500 group-hover:text-ocean-300"
                )} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute right-2 w-1.5 h-1.5 rounded-full bg-ocean-400"
                  />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-ocean-800/30 px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ocean-500 to-cyber-600
                          flex items-center justify-center text-white text-xs font-bold shrink-0">
            SA
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 overflow-hidden"
              >
                <p className="text-xs font-semibold text-white truncate">Saif Salmani</p>
                <p className="text-[10px] text-slate-500 truncate">Platform Admin</p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Shield className="w-4 h-4 text-ocean-400" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full
                   bg-deep-600 border border-ocean-700/50 text-ocean-300 hover:text-white
                   hover:bg-ocean-600 transition-colors flex items-center justify-center z-30"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  );
}
