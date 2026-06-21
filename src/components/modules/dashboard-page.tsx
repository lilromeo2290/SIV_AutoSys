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
  Users,
  Wrench,
  Clock,
  DollarSign,
  AlertTriangle,
  FileWarning,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

interface DashboardStats {
  totalCustomers: number;
  activeJobs: number;
  pendingJobs: number;
  completedJobs: number;
  totalRevenue: number;
  totalParts: number;
  totalInvoices: number;
  overdueInvoices: number;
}

interface LowStockPart {
  id: string;
  partNumber: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  supplier: { name: string };
}

interface PaidInvoice {
  paidAt: string;
  total: number;
  paidAmount: number;
}

interface TechnicianStat {
  id: string;
  name: string;
  totalJobs: number;
  completedJobs: number;
  activeJobs: number;
}

interface RecentJob {
  id: string;
  jobNumber: string;
  description: string;
  status: string;
  createdAt: string;
  customer: { name: string };
  vehicle: { make: string; model: string; plateNumber: string };
  technician: { name: string };
}

interface DashboardData {
  stats: DashboardStats;
  lowStockParts: LowStockPart[];
  paidInvoices: PaidInvoice[];
  technicianStats: TechnicianStat[];
  recentJobs: RecentJob[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'PENDING':
      return <Badge variant="secondary">{status}</Badge>;
    case 'IN_PROGRESS':
      return <Badge className="bg-blue-100 text-blue-800 border-transparent">{status.replace('_', ' ')}</Badge>;
    case 'WAITING_PARTS':
      return <Badge className="bg-amber-100 text-amber-800 border-transparent">{status.replace('_', ' ')}</Badge>;
    case 'COMPLETED':
      return <Badge className="bg-green-100 text-green-800 border-transparent">{status}</Badge>;
    case 'APPROVED':
      return <Badge className="bg-emerald-100 text-emerald-800 border-transparent">{status}</Badge>;
    case 'INVOICED':
      return <Badge className="bg-purple-100 text-purple-800 border-transparent">{status}</Badge>;
    case 'CANCELLED':
      return <Badge variant="destructive">{status}</Badge>;
    case 'DRAFT':
      return <Badge variant="secondary">{status}</Badge>;
    case 'PAID':
      return <Badge className="bg-green-100 text-green-800 border-transparent">{status}</Badge>;
    case 'SENT':
      return <Badge className="bg-blue-100 text-blue-800 border-transparent">{status}</Badge>;
    case 'OVERDUE':
      return <Badge className="bg-red-100 text-red-800 border-transparent">{status}</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KpiCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-16" />
        </div>
      </div>
    </Card>
  );
}

function KpiCards({ stats }: { stats: DashboardStats }) {
  const kpis = [
    { label: 'Total Customers', value: stats.totalCustomers, icon: Users, iconBg: 'bg-slate-100 text-slate-600', format: 'number' as const },
    { label: 'Active Jobs', value: stats.activeJobs, icon: Wrench, iconBg: 'bg-blue-100 text-blue-600', format: 'number' as const },
    { label: 'Pending Jobs', value: stats.pendingJobs, icon: Clock, iconBg: 'bg-amber-100 text-amber-600', format: 'number' as const },
    { label: 'Total Revenue', value: stats.totalRevenue, icon: DollarSign, iconBg: 'bg-green-100 text-green-600', format: 'currency' as const },
    { label: 'Low Stock Alerts', value: stats.totalParts, icon: AlertTriangle, iconBg: 'bg-orange-100 text-orange-600', format: 'number' as const },
    { label: 'Overdue Invoices', value: stats.overdueInvoices, icon: FileWarning, iconBg: 'bg-red-100 text-red-600', format: 'number' as const },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.label} className="p-4">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${kpi.iconBg}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground truncate">{kpi.label}</p>
                <p className="text-2xl font-bold tracking-tight">
                  {kpi.format === 'currency' ? formatCurrency(kpi.value) : kpi.value}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

const PIE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#64748b', '#ef4444'];

function RevenueChart({ paidInvoices }: { paidInvoices: PaidInvoice[] }) {
  // Group paid invoices by month
  const monthMap = new Map<string, number>();
  paidInvoices.forEach((inv) => {
    const date = new Date(inv.paidAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, (monthMap.get(key) ?? 0) + inv.paidAmount);
  });

  const data = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({
      month,
      revenue: Math.round(revenue * 100) / 100,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No revenue data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
              <Legend />
              <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function JobsByStatusChart({ stats }: { stats: DashboardStats }) {
  const data = [
    { name: 'Completed', value: stats.completedJobs },
    { name: 'Active', value: stats.activeJobs },
    { name: 'Pending', value: stats.pendingJobs },
  ].filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jobs by Status</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No jobs data available
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
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
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

function TechnicianPerformanceTable({ technicians }: { technicians: TechnicianStat[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Technician Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Total Jobs</TableHead>
              <TableHead className="text-right">Completed Jobs</TableHead>
              <TableHead className="text-right">Active Jobs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {technicians.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No technician data available
                </TableCell>
              </TableRow>
            ) : (
              technicians.map((tech) => (
                <TableRow key={tech.id}>
                  <TableCell className="font-medium">{tech.name}</TableCell>
                  <TableCell className="text-right">{tech.totalJobs}</TableCell>
                  <TableCell className="text-right">{tech.completedJobs}</TableCell>
                  <TableCell className="text-right">{tech.activeJobs}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function RecentJobsTable({ jobs }: { jobs: RecentJob[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Jobs</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Technician</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No recent jobs available
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.jobNumber}</TableCell>
                  <TableCell>{job.customer.name}</TableCell>
                  <TableCell>{`${job.vehicle.make} ${job.vehicle.model} (${job.vehicle.plateNumber})`}</TableCell>
                  <TableCell>{getStatusBadge(job.status)}</TableCell>
                  <TableCell>{job.technician.name}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      try {
        const res = await fetch('/api/dashboard');
        if (!res.ok) throw new Error(`Failed to fetch dashboard data (${res.status})`);
        const json: DashboardData = await res.json();
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'An error occurred');
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TableSkeleton />
          <TableSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCards stats={data.stats} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart paidInvoices={data.paidInvoices} />
        <JobsByStatusChart stats={data.stats} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TechnicianPerformanceTable technicians={data.technicianStats} />
        <RecentJobsTable jobs={data.recentJobs} />
      </div>
    </div>
  );
}