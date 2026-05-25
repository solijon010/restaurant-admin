import { ShieldAlert, BarChart3, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface InsufficientDataOverlayProps {
  title?: string;
  description?: string;
  compact?: boolean;
}

export function InsufficientDataOverlay({
  title = "Ma'lumot kam",
  description = "Statistikani ko'rish uchun yetarli ma'lumot mavjud emas. Ma'lumotlar to'plangandan so'ng bu yerda grafiklar paydo bo'ladi.",
  compact = false,
}: InsufficientDataOverlayProps) {
  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 gap-3 text-center px-4">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
          <ShieldAlert className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="relative overflow-hidden border-dashed">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-6 left-8">
          <BarChart3 className="h-20 w-20 text-foreground" />
        </div>
        <div className="absolute bottom-8 right-12">
          <TrendingUp className="h-16 w-16 text-foreground" />
        </div>
        <div className="absolute top-12 right-1/3">
          <BarChart3 className="h-12 w-12 text-foreground rotate-12" />
        </div>
      </div>

      <div className="relative flex flex-col items-center justify-center py-16 sm:py-20 px-6 text-center">
        {/* Icon circle */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-muted/80 flex items-center justify-center border border-border shadow-sm">
            <ShieldAlert className="h-9 w-9 text-muted-foreground" />
          </div>
          {/* Decorative ring */}
          <div className="absolute -inset-2 rounded-3xl border border-border/50 opacity-60" />
          <div className="absolute -inset-4 rounded-[20px] border border-border/30 opacity-30" />
        </div>

        {/* Text */}
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
          {description}
        </p>

        {/* Decorative dots */}
        <div className="flex items-center gap-1.5 mt-6">
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />
        </div>
      </div>
    </Card>
  );
}
