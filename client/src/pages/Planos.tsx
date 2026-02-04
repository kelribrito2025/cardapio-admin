import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  Crown,
  Zap,
  Star,
  Download,
  MoreHorizontal,
  Eye,
  FileText,
  Mail,
  Calendar,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface PlanFeature {
  text: string;
}

interface Plan {
  id: string;
  name: string;
  price: {
    monthly: number;
    annual: number;
  };
  features: PlanFeature[];
  buttonText: string;
  highlighted?: boolean;
  icon: React.ReactNode;
  badge?: string;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: {
      monthly: 0,
      annual: 0,
    },
    icon: <Star className="h-5 w-5" />,
    features: [
      { text: "Limited transactions" },
      { text: "1 bank account" },
      { text: "Basic categories" },
      { text: "Basic financial overview" },
    ],
    buttonText: "Start Free",
  },
  {
    id: "basic",
    name: "Basic",
    price: {
      monthly: 29,
      annual: 290,
    },
    icon: <Zap className="h-5 w-5" />,
    features: [
      { text: "Unlimited transactions" },
      { text: "Connect up to 5 bank accounts" },
      { text: "Custom categories" },
      { text: "Financial reports" },
      { text: "Email support" },
    ],
    buttonText: "Upgrade",
  },
  {
    id: "pro",
    name: "Pro",
    price: {
      monthly: 59,
      annual: 590,
    },
    icon: <Crown className="h-5 w-5" />,
    highlighted: true,
    badge: "Most Popular",
    features: [
      { text: "Everything in Basic" },
      { text: "Unlimited bank accounts" },
      { text: "Advanced analytics" },
      { text: "AI financial assistant" },
      { text: "Custom reports" },
    ],
    buttonText: "Upgrade to Pro",
  },
];

// Mock data for billing history
const billingHistory = [
  {
    id: "INV-001",
    plan: "Pro",
    purchaseDate: "2024-01-15",
    amount: 590,
    endDate: "2025-01-15",
    status: "success" as const,
  },
  {
    id: "INV-002",
    plan: "Basic",
    purchaseDate: "2023-12-01",
    amount: 29,
    endDate: "2024-01-01",
    status: "success" as const,
  },
  {
    id: "INV-003",
    plan: "Pro",
    purchaseDate: "2023-11-15",
    amount: 59,
    endDate: "2023-12-15",
    status: "failed" as const,
  },
];

type BillingStatus = "all" | "success" | "processing" | "failed";

export default function Planos() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [statusFilter, setStatusFilter] = useState<BillingStatus>("all");
  const { user } = useAuth();

  // Mock current plan - in real app, this would come from user data
  const currentPlan = {
    id: "free",
    name: "Free",
    price: 0,
    renewalDate: null,
    billingEmail: user?.email || "usuario@email.com",
  };

  const filteredHistory = billingHistory.filter(
    (item) => statusFilter === "all" || item.status === statusFilter
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            Success
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            Processing
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <AdminLayout>
      {/* Header with Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <PageHeader
          title="Billing & Subscription"
          description="Gerencie seu plano e histórico de pagamentos"
        />
        
        <div className="flex items-center gap-3 bg-card border border-border/50 rounded-full px-4 py-2 shadow-sm">
          <span className={cn(
            "text-sm font-medium transition-colors",
            !isAnnual ? "text-foreground" : "text-muted-foreground"
          )}>
            Monthly Plan
          </span>
          <Switch
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
            className="data-[state=checked]:bg-primary"
          />
          <span className={cn(
            "text-sm font-medium transition-colors",
            isAnnual ? "text-foreground" : "text-muted-foreground"
          )}>
            Annual Plan
          </span>
          {isAnnual && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
              Save 17%
            </Badge>
          )}
        </div>
      </div>

      {/* Plans Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlan.id;
          const price = isAnnual ? plan.price.annual : plan.price.monthly;
          const period = plan.id === "free" ? "" : isAnnual ? "/year" : "/month";

          return (
            <div
              key={plan.id}
              className={cn(
                "relative bg-card rounded-2xl border overflow-hidden transition-all duration-300",
                plan.highlighted
                  ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]"
                  : "border-border/50 shadow-soft hover:shadow-elevated hover:-translate-y-1"
              )}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              {/* Gradient overlay for Pro */}
              {plan.highlighted && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
              )}

              {/* Header */}
              <div className="relative p-6 pb-4">
                <div
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center mb-4",
                    plan.highlighted
                      ? "bg-primary text-primary-foreground"
                      : plan.id === "free"
                      ? "bg-gray-100 text-gray-600"
                      : "bg-blue-100 text-blue-600"
                  )}
                >
                  {plan.icon}
                </div>

                <h3 className="text-xl font-bold text-foreground mb-3">
                  {plan.name}
                </h3>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">
                    {formatCurrency(price)}
                  </span>
                  {period && (
                    <span className="text-muted-foreground text-sm">
                      {period}
                    </span>
                  )}
                </div>

                {plan.id === "free" && (
                  <p className="text-xs text-muted-foreground mt-2">
                    No credit card required
                  </p>
                )}
              </div>

              {/* Features */}
              <div className="relative p-6 pt-4 border-t border-border/50">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  What's included:
                </p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-sm text-foreground"
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                          plan.highlighted
                            ? "bg-primary/10 text-primary"
                            : "bg-green-100 text-green-600"
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </div>
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    "w-full font-semibold",
                    isCurrentPlan
                      ? "bg-muted text-muted-foreground hover:bg-muted cursor-default"
                      : plan.highlighted
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : "bg-foreground hover:bg-foreground/90 text-background"
                  )}
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? "Current Plan" : plan.buttonText}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Plan Section */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Left side - Your Plan */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">Your Plan</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm font-medium px-3 py-1">
                  {currentPlan.name}
                </Badge>
                <span className="text-2xl font-bold text-foreground">
                  {formatCurrency(currentPlan.price)}
                </span>
                {currentPlan.price > 0 && (
                  <span className="text-muted-foreground text-sm">/month</span>
                )}
              </div>
              
              {currentPlan.renewalDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Renews on {formatDate(currentPlan.renewalDate)}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Billing email: {currentPlan.billingEmail}</span>
              </div>
              
              {currentPlan.id !== "pro" && (
                <Button variant="link" className="p-0 h-auto text-primary font-medium">
                  Upgrade Plan →
                </Button>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px bg-border/50 self-stretch" />

          {/* Right side - Next Payment */}
          <div className="flex-1 lg:pl-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">Next Payment</h3>
            </div>
            
            {currentPlan.price === 0 ? (
              <div className="text-muted-foreground">
                <p className="text-sm">No upcoming charges</p>
                <p className="text-xs mt-1">Upgrade to a paid plan to access premium features</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-foreground">
                    {formatCurrency(currentPlan.price)}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    on {currentPlan.renewalDate ? formatDate(currentPlan.renewalDate) : "N/A"}
                  </span>
                </div>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                  Cancel Plan
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Billing History Section */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-semibold text-foreground">Billing History</h3>
            
            <div className="flex items-center gap-3">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as BillingStatus)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Invoice</TableHead>
                <TableHead className="font-semibold">Plan</TableHead>
                <TableHead className="font-semibold">Purchase Date</TableHead>
                <TableHead className="font-semibold">Amount</TableHead>
                <TableHead className="font-semibold">End Date</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No billing history found
                  </TableCell>
                </TableRow>
              ) : (
                filteredHistory.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.plan}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(item.purchaseDate)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell>{formatDate(item.endDate)}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2">
                            <Eye className="h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Download className="h-4 w-4" />
                            Download Invoice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
