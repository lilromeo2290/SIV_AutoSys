'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Wrench,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface JobStatusCount {
  status: string;
  _count: number;
}

interface TechProductivity {
  name: string;
  totalJobs: number;
  completedJobs: number;
  totalHours: number;
  totalRevenue: number;
  avgRevenuePerJob: number;
}

interface PartsCategory {
  count: number;
  totalCost: number;
}

interface RevenueSummary {
  totalRevenue: number;
  paidRevenue: number;
  outstandingRevenue: number;
  overdueAmount: number;
  totalPayments: number;
}

interface CostSummary {
  totalPartsCost: number;
  totalLabourCost: number;
  totalCost: number;
}

interface ReportsData {
  jobsByStatus: JobStatusCount[];
  techProductivity: TechProductivity[];
  partsUsageByCategory: Record<string, PartsCategory>;
  revenueSummary: RevenueSummary;
  costSummary: CostSummary;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHART_COLORS = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
];

const STATUS_LABEL_MAP: Record<string, string> = {
  COMPLETED: 'Completed',
  IN_PROGRESS: 'In Progress',
  PENDING: 'Pending',
  WAITING_PARTS: 'Waiting Parts',
  INVOICED: 'Invoiced',
  APPROVED: 'Approved',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function toPartsArray(
  record: Record<string, PartsCategory>,
): { category: string; count: number; totalCost: number }[] {
  return Object.entries(record).map(([category, data]) => ({
    category,
    count: data.count,
    totalCost: data.totalCost,
  }));
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-800 border-transparent';
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800 border-transparent';
    case 'PENDING':
      return 'bg-slate-100 text-slate-700 border-transparent';
    case 'WAITING_PARTS':
      return 'bg-amber-100 text-amber-800 border-transparent';
    case 'INVOICED':
      return 'bg-purple-100 text-purple-800 border-transparent';
    case 'APPROVED':
      return 'bg-teal-100 text-teal-800 border-transparent';
    default:
      return '';
  }
}

// ---------------------------------------------------------------------------
// Skeleton Components
// ---------------------------------------------------------------------------

function FinancialCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-7 w-20" />
        </div>
      </div>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Financial Summary Cards
// ---------------------------------------------------------------------------

interface FinancialCardData {
  label: string;
  value: number;
  icon: React.ElementType;
  iconBg: string;
  format: 'currency';
  trend?: 'up' | 'down';
}

function FinancialCards({
  revenueSummary,
  costSummary,
}: {
  revenueSummary: RevenueSummary;
  costSummary: CostSummary;
}) {
  const netProfit = revenueSummary.totalRevenue - costSummary.totalCost;

  const cards: FinancialCardData[] = [
    {
      label: 'Total Revenue',
      value: revenueSummary.totalRevenue,
      icon: DollarSign,
      iconBg: 'bg-emerald-100 text-emerald-600',
      format: 'currency',
      trend: 'up',
    },
    {
      label: 'Paid Revenue',
      value: revenueSummary.paidRevenue,
      icon: TrendingUp,
      iconBg: 'bg-green-100 text-green-600',
      format: 'currency',
      trend: 'up',
    },
    {
      label: 'Outstanding',
      value: revenueSummary.outstandingRevenue,
      icon: TrendingDown,
      iconBg: 'bg-amber-100 text-amber-600',
      format: 'currency',
    },
    {
      label: 'Parts Cost',
      value: costSummary.totalPartsCost,
      icon: Package,
      iconBg: 'bg-orange-100 text-orange-600',
      format: 'currency',
    },
    {
      label: 'Labour Cost',
      value: costSummary.totalLabourCost,
      icon: Wrench,
      iconBg: 'bg-blue-100 text-blue-600',
      format: 'currency',
    },
    {
      label: 'Net Profit',
      value: netProfit,
      icon: BarChart3,
      iconBg: netProfit >= 0
        ? 'bg-emerald-100 text-emerald-600'
        : 'bg-red-100 text-red-600',
      format: 'currency',
      trend: netProfit >= 0 ? 'up' : 'down',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="p-4">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground truncate">
                  {card.label}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold tracking-tight">
                    {formatCurrency(card.value)}
                  </p>
                  {card.trend && (
                    card.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Jobs by Status Bar Chart
// ---------------------------------------------------------------------------

function JobsByStatusChart({ jobsByStatus }: { jobsByStatus: JobStatusCount[] }) {
  const data = jobsByStatus.map((item) => ({
    name: STATUS_LABEL_MAP[item.status] ?? item.status,
    status: item.status,
    jobs: item._count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jobs by Status</CardTitle>
        <CardDescription>Distribution of all jobs across current statuses</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No jobs data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as (typeof data)[number];
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Jobs: <span className="font-medium text-foreground">{d.jobs}</span>
                      </p>
                    </div>
                  );
                }}
              />
              <Legend />
              <Bar
                dataKey="jobs"
                name="Jobs"
                radius={[4, 4, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.status}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Parts Usage Pie/Donut Chart
// ---------------------------------------------------------------------------

function PartsUsageChart({
  partsUsageByCategory,
}: {
  partsUsageByCategory: Record<string, PartsCategory>;
}) {
  const data = toPartsArray(partsUsageByCategory);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parts Usage by Category</CardTitle>
        <CardDescription>Distribution of parts usage across categories</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No parts usage data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="count"
                nameKey="category"
                label={({ category, percent }) =>
                  `${category} ${(percent * 100).toFixed(0)}%`
                }
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string, props) => [
                  `${value} items ($${props.payload.totalCost.toFixed(2)})`,
                  name,
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Technician Productivity Table
// ---------------------------------------------------------------------------

function TechnicianProductivityTable({
  techProductivity,
}: {
  techProductivity: TechProductivity[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Technician Productivity
        </CardTitle>
        <CardDescription>
          Performance metrics for each technician
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Total Jobs</TableHead>
                <TableHead className="text-right">Completed Jobs</TableHead>
                <TableHead className="text-right">Total Hours</TableHead>
                <TableHead className="text-right">Revenue Generated</TableHead>
                <TableHead className="text-right">Avg Revenue/Job</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {techProductivity.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No technician data available
                  </TableCell>
                </TableRow>
              ) : (
                techProductivity.map((tech, index) => (
                  <TableRow key={`${tech.name}-${index}`}>
                    <TableCell className="font-medium">{tech.name}</TableCell>
                    <TableCell className="text-right">{tech.totalJobs}</TableCell>
                    <TableCell className="text-right">
                      {tech.completedJobs}
                    </TableCell>
                    <TableCell className="text-right">
                      {tech.totalHours.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(tech.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(tech.avgRevenuePerJob)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Parts Usage Breakdown Table
// ---------------------------------------------------------------------------

function PartsUsageTable({
  partsUsageByCategory,
}: {
  partsUsageByCategory: Record<string, PartsCategory>;
}) {
  const data = toPartsArray(partsUsageByCategory);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Parts Usage Breakdown
        </CardTitle>
        <CardDescription>
          Items used and costs per parts category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Items Used Count</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No parts usage data available
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.category}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor:
                              CHART_COLORS[
                                data.indexOf(item) % CHART_COLORS.length
                              ],
                          }}
                        />
                        <span className="font-medium">{item.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.totalCost)}
                    </TableCell>
                  </TableRow>
                ))
              )}
              {data.length > 0 && (
                <TableRow className="font-bold border-t-2">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">
                    {data.reduce((sum, item) => sum + item.count, 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(
                      data.reduce((sum, item) => sum + item.totalCost, 0),
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Revenue Breakdown
// ---------------------------------------------------------------------------

function RevenueBreakdown({
  revenueSummary,
}: {
  revenueSummary: RevenueSummary;
}) {
  const total = revenueSummary.totalRevenue;
  const paidPercent = total > 0 ? (revenueSummary.paidRevenue / total) * 100 : 0;
  const outstandingPercent =
    total > 0 ? (revenueSummary.outstandingRevenue / total) * 100 : 0;
  const overduePercent =
    total > 0 ? (revenueSummary.overdueAmount / total) * 100 : 0;

  const segments = [
    {
      label: 'Paid',
      amount: revenueSummary.paidRevenue,
      percent: paidPercent,
      color: '#10b981',
      bgColor: 'bg-emerald-500',
    },
    {
      label: 'Outstanding',
      amount: revenueSummary.outstandingRevenue,
      percent: outstandingPercent,
      color: '#f59e0b',
      bgColor: 'bg-amber-500',
    },
    {
      label: 'Overdue',
      amount: revenueSummary.overdueAmount,
      percent: overduePercent,
      color: '#ef4444',
      bgColor: 'bg-red-500',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Revenue Breakdown
        </CardTitle>
        <CardDescription>
          Paid, outstanding, and overdue amounts of total revenue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stacked horizontal bar */}
        <div className="space-y-2">
          <div className="flex h-8 w-full overflow-hidden rounded-md">
            {segments.map((seg) => (
              <div
                key={seg.label}
                className={`${seg.bgColor} transition-all duration-500 flex items-center justify-center`}
                style={{ width: `${seg.percent}%` }}
              >
                {seg.percent >= 10 && (
                  <span className="text-xs font-semibold text-white">
                    {seg.percent.toFixed(0)}%
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Total Revenue: {formatCurrency(total)}</span>
          </div>
        </div>

        <Separator />

        {/* Segment details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {segments.map((seg) => (
            <div
              key={seg.label}
              className="flex items-center gap-3 rounded-lg border p-4"
            >
              <div
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">{seg.label}</p>
                <p className="text-lg font-bold">{formatCurrency(seg.amount)}</p>
              </div>
              <Badge
                variant="secondary"
                className={
                  seg.label === 'Paid'
                    ? 'bg-emerald-100 text-emerald-700 border-transparent'
                    : seg.label === 'Outstanding'
                      ? 'bg-amber-100 text-amber-700 border-transparent'
                      : 'bg-red-100 text-red-700 border-transparent'
                }
              >
                {seg.percent.toFixed(1)}%
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Status Badges for Jobs
// ---------------------------------------------------------------------------

function StatusBadgesRow({ jobsByStatus }: { jobsByStatus: JobStatusCount[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {jobsByStatus.map((item) => (
        <Badge
          key={item.status}
          className={getStatusColor(item.status)}
        >
          {STATUS_LABEL_MAP[item.status] ?? item.status}: {item._count}
        </Badge>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchReports() {
      try {
        const res = await fetch('/api/reports');
        if (!res.ok) throw new Error(`Failed to fetch reports data (${res.status})`);
        const json: ReportsData = await res.json();
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'An error occurred',
          );
          setLoading(false);
        }
      }
    }

    fetchReports();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7" />
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive overview of workshop operations, financials, and performance metrics.
          </p>
        </div>
        <div className="flex items-center justify-center h-64 text-destructive">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* Financial cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <FinancialCardSkeleton key={i} />
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>

        {/* Revenue breakdown skeleton */}
        <div className="grid grid-cols-1 gap-6">
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>

        {/* Tables skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TableSkeleton />
          <TableSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-7 w-7" />
          Reports & Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive overview of workshop operations, financials, and performance metrics.
        </p>
      </div>

      {/* Tabs for sections */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Detailed Tables</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Financial Summary Cards */}
          <FinancialCards
            revenueSummary={data.revenueSummary}
            costSummary={data.costSummary}
          />

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <JobsByStatusChart jobsByStatus={data.jobsByStatus} />
            <PartsUsageChart partsUsageByCategory={data.partsUsageByCategory} />
          </div>

          {/* Revenue Breakdown */}
          <RevenueBreakdown revenueSummary={data.revenueSummary} />
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {/* Quick status summary */}
          <Card>
            <CardHeader>
              <CardTitle>Jobs Status Summary</CardTitle>
              <CardDescription>
                Quick overview of all job statuses in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StatusBadgesRow jobsByStatus={data.jobsByStatus} />
            </CardContent>
          </Card>

          {/* Tables Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TechnicianProductivityTable techProductivity={data.techProductivity} />
            <PartsUsageTable partsUsageByCategory={data.partsUsageByCategory} />
          </div>

          {/* Revenue Breakdown repeated here for detail view */}
          <RevenueBreakdown revenueSummary={data.revenueSummary} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
