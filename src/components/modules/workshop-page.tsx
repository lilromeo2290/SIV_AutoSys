'use client';

import { useEffect, useState } from 'react';
import {
  Wrench,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Car,
  ClipboardList,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type JobStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'WAITING_PARTS'
  | 'COMPLETED'
  | 'APPROVED'
  | 'INVOICED';

interface WorkshopJob {
  id: string;
  jobNumber: string;
  description: string;
  status: JobStatus;
  priority: number;
  estimatedCost: number;
  customer: { name: string };
  vehicle: { make: string; model: string; plateNumber: string };
  technician: { name: string; role: string };
  tasks: { taskName: string; completed: boolean }[];
  partsUsed: unknown[];
  labourEntries: unknown[];
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
  assignedJobs: WorkshopJob[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_BADGE_CLASSES: Record<JobStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800',
  WAITING_PARTS: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800',
  APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
  INVOICED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800',
};

const STATUS_LABELS: Record<JobStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  WAITING_PARTS: 'Waiting Parts',
  COMPLETED: 'Completed',
  APPROVED: 'Approved',
  INVOICED: 'Invoiced',
};

/** Non-completed statuses used for the technician board filter */
const TECH_VISIBLE_STATUSES: JobStatus[] = ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'];

/** Kanban columns and their order */
const KANBAN_COLUMNS: JobStatus[] = ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED'];

const KANBAN_HEADER_ICONS: Record<JobStatus, React.ReactNode> = {
  PENDING: <Clock className="h-4 w-4 text-slate-500" />,
  IN_PROGRESS: <Activity className="h-4 w-4 text-blue-500" />,
  WAITING_PARTS: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  COMPLETED: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  APPROVED: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  INVOICED: <ClipboardList className="h-4 w-4 text-purple-500" />,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Status overview skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Technician board skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 2 }).map((_, j) => (
                <Skeleton key={j} className="h-20 w-full rounded-md" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatusOverviewCards({ jobs }: { jobs: WorkshopJob[] }) {
  const activeJobs = jobs.filter((j) => j.status === 'IN_PROGRESS').length;
  const pendingJobs = jobs.filter((j) => j.status === 'PENDING').length;
  const waitingPartsJobs = jobs.filter((j) => j.status === 'WAITING_PARTS').length;
  const completedToday = jobs.filter((j) => j.status === 'COMPLETED').length;

  const cards = [
    {
      label: 'Active Jobs',
      value: activeJobs,
      icon: <Activity className="h-5 w-5 text-blue-600" />,
      accent: 'text-blue-600',
    },
    {
      label: 'Pending',
      value: pendingJobs,
      icon: <Clock className="h-5 w-5 text-slate-500" />,
      accent: 'text-slate-600',
    },
    {
      label: 'Waiting Parts',
      value: waitingPartsJobs,
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      accent: 'text-amber-600',
    },
    {
      label: 'Completed Today',
      value: completedToday,
      icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      accent: 'text-green-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="py-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">{card.label}</CardDescription>
              {card.icon}
            </div>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${card.accent}`}>{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TechnicianBoard({ staff }: { staff: StaffMember[] }) {
  const technicians = staff.filter((s) => s.active && s.role === 'TECHNICIAN');

  if (technicians.length === 0) {
    return (
      <Card className="py-8">
        <CardContent className="flex flex-col items-center justify-center text-muted-foreground">
          <Users className="h-10 w-10 mb-2" />
          <p className="text-sm">No active technicians found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {technicians.map((tech) => {
        const visibleJobs = tech.assignedJobs.filter((j) =>
          TECH_VISIBLE_STATUSES.includes(j.status)
        );

        return (
          <Card key={tech.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {getInitials(tech.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <CardTitle className="text-sm truncate">{tech.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {visibleJobs.length} active job{visibleJobs.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1">
              {visibleJobs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No active jobs assigned
                </p>
              ) : (
                <ScrollArea className="max-h-72">
                  <div className="space-y-3 pr-2">
                    {visibleJobs.map((job) => (
                      <div
                        key={job.id}
                        className="rounded-md border p-3 space-y-1.5 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {job.jobNumber}
                          </span>
                          <Badge
                            variant="outline"
                            className={STATUS_BADGE_CLASSES[job.status]}
                          >
                            {STATUS_LABELS[job.status]}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {job.customer.name}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Car className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {job.vehicle.make} {job.vehicle.model} &middot;{' '}
                            {job.vehicle.plateNumber}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {job.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function JobStatusBoard({ jobs }: { jobs: WorkshopJob[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {KANBAN_COLUMNS.map((status) => {
        const columnJobs = jobs.filter((j) => j.status === status);

        return (
          <Card key={status} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {KANBAN_HEADER_ICONS[status]}
                <CardTitle className="text-sm">{STATUS_LABELS[status]}</CardTitle>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {columnJobs.length}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1">
              <ScrollArea className="max-h-96">
                <div className="space-y-3 pr-2">
                  {columnJobs.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No jobs
                    </p>
                  ) : (
                    columnJobs.map((job) => (
                      <div
                        key={job.id}
                        className="rounded-md border p-3 space-y-2 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">{job.jobNumber}</span>
                          <Badge
                            variant="outline"
                            className={STATUS_BADGE_CLASSES[job.status]}
                          >
                            {STATUS_LABELS[job.status]}
                          </Badge>
                        </div>
                        <p className="text-xs font-medium text-foreground">
                          {job.customer.name}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Car className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {job.vehicle.make} {job.vehicle.model} &middot;{' '}
                            {job.vehicle.plateNumber}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {job.description}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function WorkScheduling({ jobs }: { jobs: WorkshopJob[] }) {
  /** Active = non-completed statuses for today's schedule */
  const activeJobs = jobs
    .filter((j) => TECH_VISIBLE_STATUSES.includes(j.status))
    .sort((a, b) => a.priority - b.priority);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-foreground" />
          <CardTitle className="text-base">Today&apos;s Schedule</CardTitle>
          <Badge variant="secondary" className="ml-auto text-xs">
            {activeJobs.length} jobs
          </Badge>
        </div>
        <CardDescription>
          Active jobs sorted by priority (highest first)
        </CardDescription>
      </CardHeader>

      <CardContent>
        {activeJobs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No active jobs scheduled for today.
          </p>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="space-y-2 pr-2">
              {activeJobs.map((job, index) => (
                <div key={job.id}>
                  <div className="flex items-start gap-4 rounded-md border p-4 hover:bg-muted/50 transition-colors">
                    {/* Priority indicator */}
                    <div className="flex flex-col items-center justify-center min-w-[2rem]">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          job.priority <= 1
                            ? 'bg-red-100 text-red-700'
                            : job.priority === 2
                              ? 'bg-amber-100 text-amber-700'
                              : job.priority === 3
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-slate-50 text-slate-500'
                        }`}
                      >
                        P{job.priority}
                      </span>
                    </div>

                    {/* Job details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">{job.jobNumber}</span>
                        <Badge
                          variant="outline"
                          className={STATUS_BADGE_CLASSES[job.status]}
                        >
                          {STATUS_LABELS[job.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground">{job.customer.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Car className="h-3 w-3 shrink-0" />
                        <span>
                          {job.vehicle.make} {job.vehicle.model} &middot;{' '}
                          {job.vehicle.plateNumber}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{job.description}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Wrench className="h-3 w-3 shrink-0" />
                        <span>{job.technician.name}</span>
                      </div>
                    </div>
                  </div>
                  {index < activeJobs.length - 1 && <Separator className="my-1" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function WorkshopPage() {
  const [jobs, setJobs] = useState<WorkshopJob[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [jobsRes, staffRes] = await Promise.all([
          fetch('/api/workshop'),
          fetch('/api/staff'),
        ]);

        if (!jobsRes.ok) throw new Error(`Failed to fetch workshop jobs (${jobsRes.status})`);
        if (!staffRes.ok) throw new Error(`Failed to fetch staff (${staffRes.status})`);

        const jobsData: WorkshopJob[] = await jobsRes.json();
        const staffData: StaffMember[] = await staffRes.json();

        if (!cancelled) {
          setJobs(jobsData);
          setStaff(staffData);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-1" />
          <Skeleton className="h-4 w-32" />
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workshop Management</h1>
          <p className="text-sm text-muted-foreground">Technician Board</p>
        </div>
        <Card className="border-destructive/50">
          <CardContent className="py-8 flex flex-col items-center text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-sm font-medium text-destructive">Failed to load workshop data</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                             */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center gap-3">
        <Wrench className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workshop Management</h1>
          <p className="text-sm text-muted-foreground">Technician Board</p>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Status Overview                                                    */}
      {/* ----------------------------------------------------------------- */}
      <StatusOverviewCards jobs={jobs} />

      {/* ----------------------------------------------------------------- */}
      {/* Technician Board                                                   */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-foreground" />
          <h2 className="text-lg font-semibold">Technician Board</h2>
        </div>
        <TechnicianBoard staff={staff} />
      </section>

      <Separator />

      {/* ----------------------------------------------------------------- */}
      {/* Job Status Board (Kanban)                                          */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="h-5 w-5 text-foreground" />
          <h2 className="text-lg font-semibold">Job Status Board</h2>
        </div>
        <JobStatusBoard jobs={jobs} />
      </section>

      <Separator />

      {/* ----------------------------------------------------------------- */}
      {/* Work Scheduling                                                    */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <WorkScheduling jobs={jobs} />
      </section>
    </div>
  );
}
