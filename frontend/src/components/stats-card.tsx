import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingUp } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: string;
  isLoading?: boolean;
  variant?: 'default' | 'warning';
  className?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  isLoading = false,
  variant = 'default',
  className = ""
}: StatsCardProps) {
  const getIconColor = () => {
    switch (variant) {
      case 'warning':
        return 'text-chart-4';
      default:
        return 'text-primary';
    }
  };

  const getIconBgColor = () => {
    switch (variant) {
      case 'warning':
        return 'bg-chart-4/10';
      default:
        return 'bg-primary/10';
    }
  };

  const getTrendColor = () => {
    if (!trend) return 'text-muted-foreground';
    
    if (variant === 'warning' || trend.includes('Requiere')) {
      return 'text-chart-4';
    }
    return 'text-accent';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse w-32" />
              <div className="h-8 bg-muted rounded animate-pulse w-16" />
            </div>
            <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
          </div>
          <div className="mt-4">
            <div className="h-3 bg-muted rounded animate-pulse w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div className={`w-12 h-12 ${getIconBgColor()} rounded-lg flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${getIconColor()}`} />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center space-x-2">
            <div className={`flex items-center ${getTrendColor()} text-sm`}>
              {!trend.includes('Requiere') && (
                <TrendingUp className="w-4 h-4 mr-1" />
              )}
              <span>{trend}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
