import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

// ============ STAT CARD ============
interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, loading, className }: StatCardProps) {
  if (loading) {
    return (
      <div className={cn(
        "bg-card rounded-xl p-5 border border-border/50 shadow-soft",
        className
      )}>
        <div className="flex items-start justify-between">
          <div className="space-y-2.5 flex-1">
            <div className="skeleton h-3.5 w-28 rounded-md" />
            <div className="skeleton h-8 w-32 rounded-md" />
          </div>
          <div className="skeleton h-12 w-12 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-card rounded-xl p-5 border border-border/50 shadow-soft transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5",
      className
    )}>
      <div className="flex items-start justify-between gap-3.5">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground font-medium tracking-wide uppercase">
            {title}
          </p>
          <p className="text-3xl font-bold mt-2 tracking-tight">{value}</p>
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full text-xs font-semibold",
              trend.isPositive 
                ? "bg-emerald-50 text-emerald-600" 
                : "bg-red-50 text-red-600"
            )}>
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}% vs ontem</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-primary/10 rounded-lg shrink-0">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </div>
  );
}

// ============ STATUS BADGE ============
type BadgeVariant = "success" | "warning" | "error" | "info" | "default";

interface StatusBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const badgeVariants: Record<BadgeVariant, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
  warning: "bg-amber-50 text-amber-700 border-amber-200/50",
  error: "bg-red-50 text-red-700 border-red-200/50",
  info: "bg-blue-50 text-blue-700 border-blue-200/50",
  default: "bg-gray-50 text-gray-700 border-gray-200/50",
};

export function StatusBadge({ variant = "default", children, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border tracking-wide",
      badgeVariants[variant],
      className
    )}>
      {children}
    </span>
  );
}

// ============ EMPTY STATE ============
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-20 px-7 text-center",
      className
    )}>
      <div className="p-5 bg-muted/50 rounded-2xl mb-6">
        <Icon className="h-12 w-12 text-muted-foreground/70" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2.5">{title}</h3>
      {description && (
        <p className="text-base text-muted-foreground max-w-sm mb-7 leading-relaxed">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-base font-semibold hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ============ PAGE HEADER ============
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3", className)}>
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && (
          <p className="text-base text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

// ============ DATA TABLE SKELETON ============
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-soft">
      <div className="p-6 border-b border-border/50">
        <div className="skeleton h-7 w-60 rounded-lg" />
      </div>
      <div className="divide-y divide-border/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-5 p-6">
            {Array.from({ length: columns }).map((_, j) => (
              <div key={j} className="skeleton h-5 flex-1 rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ SECTION CARD ============
interface SectionCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function SectionCard({ title, description, children, actions, className, noPadding }: SectionCardProps) {
  return (
    <div className={cn("bg-card rounded-xl border border-border/50 shadow-soft", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-6 py-3 border-b border-border/50" style={{height: '46px'}}>
          <div>
            {title && <h3 className="font-semibold text-base">{title}</h3>}
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={noPadding ? "" : "p-6"}>
        {children}
      </div>
    </div>
  );
}

// ============ ACTION MENU ============
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionMenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "default" | "destructive";
  separator?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
}

export function ActionMenu({ items }: ActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-elevated border-border/50">
        {items.map((item, index) => (
          <div key={index}>
            {item.separator && index > 0 && <DropdownMenuSeparator className="bg-border/50" />}
            <DropdownMenuItem
              onClick={item.onClick}
              className={cn(
                "cursor-pointer rounded-lg mx-1.5 my-1",
                item.variant === "destructive" && "text-destructive focus:text-destructive"
              )}
            >
              {item.icon && <item.icon className="h-5 w-5 mr-3" />}
              {item.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
