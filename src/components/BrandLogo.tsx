import { cn } from "@/lib/utils";

export function BrandLogo({ className, size = "md", showSubtitle = true }: {
  className?: string;
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
}) {
  const scale = size === "lg" ? "text-5xl md:text-6xl" : size === "sm" ? "text-2xl" : "text-3xl md:text-4xl";
  return (
    <div className={cn("inline-flex flex-col items-center text-center", className)}>
      <div className={cn("font-display font-black tracking-tight leading-none", scale)}>
        <span className="brand-silver">GOLAÇO</span>{" "}
        <span className="brand-cup">CUP</span>
      </div>
      {showSubtitle && (
        <div className="mt-2 text-[10px] md:text-xs font-light tracking-[0.45em] text-white/80 uppercase">
          Battle Your Friends
        </div>
      )}
    </div>
  );
}
