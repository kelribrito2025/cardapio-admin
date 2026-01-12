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
      <div className={cn("bg-card rounded-xl p-5 border shadow-sm", className)}>
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-8 w-32 rounded" />
          </div>
          <div className="skeleton h-10 w-10 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-card rounded-xl p-5 border shadow-sm", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && (
            <p className={cn(
              "text-xs mt-1 font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              {trend.isPositive ? "+" : ""}{trend.value}% vs ontem
            </p>
          )}
        </div>
        <div className="p-2.5 bg-primary/10 rounded-lg">
          <Icon className="h-5 w-5 text-primary" />
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
  success: "bg-green-100 text-green-700 border-green-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  error: "bg-red-100 text-red-700 border-red-200",
  info: "bg-blue-100 text-blue-700 border-blue-200",
  default: "bg-gray-100 text-gray-700 border-gray-200",
};

export function StatusBadge({ variant = "default", children, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
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
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      <div className="p-4 bg-muted rounded-full mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
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
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6", className)}>
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
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
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="p-4 border-b">
        <div className="skeleton h-6 w-48 rounded" />
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            {Array.from({ length: columns }).map((_, j) => (
              <div key={j} className="skeleton h-4 flex-1 rounded" />
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
    <div className={cn("bg-card rounded-xl border shadow-sm", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            {title && <h3 className="font-semibold">{title}</h3>}
            {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={noPadding ? "" : "p-5"}>
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
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item, index) => (
          <div key={index}>
            {item.separator && index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={item.onClick}
              className={cn(
                "cursor-pointer",
                item.variant === "destructive" && "text-destructive"
              )}
            >
              {item.icon && <item.icon className="h-4 w-4 mr-2" />}
              {item.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
