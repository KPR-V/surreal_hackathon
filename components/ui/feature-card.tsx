"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  header: string;
  description: string;
  onClick?: () => void;
  className?: string;
}

export function FeatureCard({ header, description, onClick, className }: FeatureCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-visible rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 cursor-pointer transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-xl hover:shadow-white/10",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-white/90 line-clamp-2">
            {header}
          </h3>
          <p className="text-sm text-white/70 group-hover:text-white/80 line-clamp-3">
            {description}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
            <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
      </div>
    </div>
  );
}