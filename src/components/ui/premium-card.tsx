import { cn } from "@/lib/utils";
import { Card, CardProps } from "@/components/ui/card";

interface PremiumCardProps extends CardProps {
  children: React.ReactNode;
  className?: string;
}

export function PremiumCard({ children, className, ...props }: PremiumCardProps) {
  return (
    <Card
      className={cn(
        "rounded-2xl border border-white/10 bg-[#0f1b2d]/80",
        "bg-[radial-gradient(100%_100%_at_0%_0%,rgba(38,139,255,0.12),transparent_40%),radial-gradient(120%_120%_at_100%_0%,rgba(16,185,129,0.06),transparent_50%)]",
        "backdrop-blur-sm shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)]",
        "transition-colors hover:border-white/20",
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
}
