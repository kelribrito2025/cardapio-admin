import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Download,
  MoreVertical,
  Eye,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: {
      monthly: 0,
      annual: 0,
    },
    features: [
      { text: "Limited transactions" },
      { text: "1 bank account" },
      { text: "Basic categories" },
      { text: "Basic reports" },
    ],
    buttonText: "Current Plan",
  },
  {
    id: "basic",
    name: "Basic",
    price: {
      monthly: 29,
      annual: 290,
    },
    features: [
      { text: "Unlimited transactions" },
      { text: "Connect 5 bank accounts" },
      { text: "Custom categories" },
      { text: "Financial reports" },
      { text: "Email support" },
    ],
    buttonText: "Get Started",
  },
  {
    id: "pro",
    name: "Pro",
    price: {
      monthly: 59,
      annual: 120,
    },
    highlighted: true,
    features: [
      { text: "Everything in Monthly" },
      { text: "Unlimited bank accounts" },
      { text: "Advanced analytics" },
      { text: "AI financial assistant" },
      { text: "Custom reports" },
    ],
    buttonText: "Get Started",
  },
];

// Mock data for billing history with more entries for pagination
const billingHistory = [
  {
    id: "INV_00092323",
    plan: "Business",
    planType: "Annual",
    purchaseDate: "2025-08-30",
    amount: 120,
    endDate: "2026-08-30",
    status: "success" as const,
  },
  {
    id: "INV_00092323",
    plan: "Pro Plan",
    planType: "Annual",
    purchaseDate: "2025-08-26",
    amount: 120,
    endDate: "2025-09-25",
    status: "processing" as const,
  },
  {
    id: "INV_00092323",
    plan: "Pro Plan",
    planType: "Monthly",
    purchaseDate: "2025-08-20",
    amount: 72,
    endDate: "2025-09-20",
    status: "success" as const,
  },
  {
    id: "INV_00092323",
    plan: "Pro Plan",
    planType: "Monthly",
    purchaseDate: "2025-08-15",
    amount: 72,
    endDate: "2025-09-16",
    status: "success" as const,
  },
  {
    id: "INV_00092323",
    plan: "Pro Plan",
    planType: "Annual",
    purchaseDate: "2024-08-12",
    amount: 120,
    endDate: "2025-08-22",
    status: "success" as const,
  },
];

type BillingStatus = "all" | "success" | "processing" | "failed";

export default function Planos() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [statusFilter, setStatusFilter] = useState<BillingStatus>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const { user } = useAuth();
  const itemsPerPage = 4;

  // Mock current plan
  const currentPlan = {
    id: "business",
    name: "Business Plan",
    price: 120,
    period: "year",
    renewalDate: "10 Dec 2025",
    billingEmail: user?.email || "critozcore@gmail.com",
    isActive: false,
  };

  const filteredHistory = billingHistory.filter(
    (item) => statusFilter === "all" || item.status === statusFilter
  );

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-green-600 font-medium text-sm">Success</span>
          </div>
        );
      case "processing":
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-amber-600 font-medium text-sm">Processing</span>
          </div>
        );
      case "failed":
        return (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-red-600 font-medium text-sm">Failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const toggleAllRows = () => {
    if (selectedRows.length === paginatedHistory.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedHistory.map((_, index) => `row-${index}`));
    }
  };

  return (
    <AdminLayout>
      {/* Header with Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Billing & Subscription</h1>
        
        <div className="flex items-center bg-muted/50 rounded-full p-1">
          <button
            onClick={() => setIsAnnual(false)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-full transition-all",
              !isAnnual
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly Plan
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-full transition-all",
              isAnnual
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Annual Plan
          </button>
        </div>
      </div>

      {/* Select Plan Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Select Plan</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const price = isAnnual ? plan.price.annual : plan.price.monthly;
            const period = isAnnual ? "/year" : "/month";

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative bg-card rounded-xl border p-6 transition-all duration-300 overflow-hidden",
                  plan.highlighted
                    ? "border-blue-500 border-2"
                    : "border-border/50 hover:border-border"
                )}
              >
                {/* Blur effect for Pro card */}
                {plan.highlighted && (
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-400/30 rounded-full blur-3xl pointer-events-none" />
                )}
                
                {/* Most Popular Badge */}
                {plan.highlighted && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </Badge>
                  </div>
                )}

                {/* Plan Name */}
                <h3 className="text-xl font-bold text-foreground mb-4">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-foreground">
                    {price === 0 ? "Free" : formatCurrency(price)}
                  </span>
                  {price > 0 && (
                    <span className="text-muted-foreground text-sm">
                      {period}
                    </span>
                  )}
                </div>

                {/* Divider with "What's Include" */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/50"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-3 text-sm text-muted-foreground">
                      What's Include :
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-3 text-sm text-foreground"
                    >
                      <Check className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <Button
                  className={cn(
                    "w-full font-medium",
                    plan.highlighted
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : plan.id === "free"
                      ? "bg-gray-100 hover:bg-gray-100 text-muted-foreground cursor-default"
                      : "bg-white hover:bg-gray-50 text-foreground border border-border"
                  )}
                  disabled={plan.id === "free"}
                >
                  {plan.buttonText}
                </Button>

                {/* Visit here link */}
                <p className="text-center text-sm text-muted-foreground mt-4">
                  For a more details{" "}
                  <a href="#" className="text-foreground underline hover:no-underline">
                    Visit here
                  </a>
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Your Plan Section */}
      <div className="bg-card rounded-xl border border-border/50 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          {/* Left side - Plan info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-medium text-muted-foreground">Your Plan</span>
              <span className="text-sm text-muted-foreground">
                Renews {currentPlan.renewalDate}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-blue-600 mb-2">
              {currentPlan.name}
            </h3>
            
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-3xl font-bold text-foreground">
                R$ {currentPlan.price.toFixed(2)}
              </span>
              <span className="text-muted-foreground text-sm">
                /{currentPlan.period}
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Billing email: {currentPlan.billingEmail}
            </p>
            
            <button className="text-blue-600 text-sm font-medium mt-3 hover:underline">
              Upgrade Plan
            </button>
          </div>

          {/* Right side - Next Payment & Cancel */}
          <div className="flex flex-col items-end gap-4">
            <Button
              variant="outline"
              className="text-foreground border-border hover:bg-muted"
            >
              Cancel Plan
            </Button>
            
            <div className="text-right">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Next Payment
              </h4>
              <p className="text-lg font-semibold text-foreground">
                No upcoming charges
              </p>
              <p className="text-sm text-muted-foreground">
                Your subscription is paused or inactive.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Billing History Section */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="p-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground">Billing History</h2>
          
          <div className="flex items-center gap-3">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as BillingStatus);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[160px] bg-white border-border">
                <span className="text-sm text-muted-foreground mr-1">Status:</span>
                <SelectValue placeholder="All History" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All History</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedRows.length === paginatedHistory.length && paginatedHistory.length > 0}
                  onCheckedChange={toggleAllRows}
                />
              </TableHead>
              <TableHead className="font-semibold text-foreground">INVOICE</TableHead>
              <TableHead className="font-semibold text-foreground">PLAN</TableHead>
              <TableHead className="font-semibold text-foreground">PURCHASE DATE</TableHead>
              <TableHead className="font-semibold text-foreground">AMOUNTS</TableHead>
              <TableHead className="font-semibold text-foreground">END DATE</TableHead>
              <TableHead className="font-semibold text-foreground">STATUS</TableHead>
              <TableHead className="font-semibold text-foreground text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedHistory.map((item, index) => (
              <TableRow key={`${item.id}-${index}`} className="hover:bg-muted/20">
                <TableCell>
                  <Checkbox
                    checked={selectedRows.includes(`row-${index}`)}
                    onCheckedChange={() => toggleRowSelection(`row-${index}`)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{item.id}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <span className="font-medium text-foreground">{item.plan}</span>
                    <span className="text-muted-foreground text-sm ml-1">({item.planType})</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(item.purchaseDate)}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  ${item.amount.toFixed(2)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(item.endDate)}
                </TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Download Invoice
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="p-4 border-t border-border/50 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, filteredHistory.length)} from{" "}
            {filteredHistory.length}
          </p>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                className={cn(
                  "h-8 w-8",
                  currentPage === page && "bg-foreground text-background"
                )}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
