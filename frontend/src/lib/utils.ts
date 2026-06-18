import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const statusColor = (s: string) => {
  switch (s) {
    case "online":   case "normal":   return "text-green-400";
    case "warning":                   return "text-yellow-400";
    case "critical": case "error":    return "text-red-400";
    case "offline":                   return "text-slate-500";
    default:                          return "text-slate-400";
  }
};

export const statusBg = (s: string) => {
  switch (s) {
    case "online":   case "normal":   return "bg-green-500";
    case "warning":                   return "bg-yellow-500";
    case "critical": case "error":    return "bg-red-500";
    case "offline":                   return "bg-slate-600";
    default:                          return "bg-slate-500";
  }
};

export const severityBadge = (s: string) => {
  switch (s) {
    case "critical": return "badge-critical";
    case "warning":  return "badge-warning";
    default:         return "badge-info";
  }
};

export const formatRelative = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const formatBytes = (str: string) => str;

export const basinLabel = (b: string) =>
  b.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
