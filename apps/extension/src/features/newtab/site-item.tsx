import React from "react";

interface SiteItemProps {
  site: {
    name: string;
    url: string;
  };
  isBlocked: boolean;
  onToggle: (url: string) => void;
}

export function SiteItem({ site, isBlocked, onToggle }: SiteItemProps) {
  return (
    <button
      onClick={() => onToggle(site.url)}
      className={`meelio-flex meelio-w-full meelio-items-center meelio-justify-between meelio-rounded meelio-p-3 meelio-transition-colors ${
        isBlocked
          ? "meelio-bg-red-500/20 hover:meelio-bg-red-500/30"
          : "meelio-bg-white/10 hover:meelio-bg-white/20"
      }`}
    >
      <span>{site.name}</span>
      <div className="meelio-flex meelio-items-center meelio-gap-2">
        <span className="meelio-text-sm meelio-text-gray-400">{site.url}</span>
        <span className="meelio-text-sm">{isBlocked ? "🚫" : "➕"}</span>
      </div>
    </button>
  );
}
