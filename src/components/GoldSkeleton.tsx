import { cn } from "@/lib/utils";

interface GoldSkeletonProps {
  className?: string;
  lines?: number;
}

export function GoldSkeleton({ className, lines = 3 }: GoldSkeletonProps) {
  return (
    <div className={cn("space-y-3 p-5", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded-full animate-gold-shimmer"
          style={{ width: `${85 - i * 15}%`, animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
