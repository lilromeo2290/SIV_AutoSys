'use client';

import { Fragment, useEffect, useState, useCallback } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  RefreshCw,
  Car,
  User,
  Wrench,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/app-store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type JobStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'WAITING_PARTS'
  | 'COMPLETED'
  | 'APPROVED'
  | 'INVOICED'
  | 'CANCELLED';

interface Task {
  id: string;
  taskName: string;
  completed: boolean;
  laborHrs: number;
}

interface PartUsed {
  id: string;
  quantity: number;
  unitPrice: number;
  sparePart: {
    name: string;
    partNumber: string;
  };
}

interface LabourEntry {
  id: string;
  hours: number;
  rate: number;
  staff: {
    name: string;
  };
  date: string;
}

interface JobCard {
  id: string;
  jobNumber: string;
  customerId: string;
  vehicleId: string;
  technicianId: string;
  description: string;
  status: JobStatus;
  priority: number;
  estimatedCost: number;
  actualCost: number;
  startedAt: string;
  completedAt: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
  };
  vehicle: {
    make: string;
    model: string;
    plateNumber: string;
  };
  technician: {
    id: string;
    name: string;
  };
  tasks: Task[];
  partsUsed: PartUsed[];
  labourEntries: LabourEntry[];
}

interface Customer {
  id: string;
  name: string;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  plateNumber: string;
  customerId: string;
}

interface Staff {
  id: string;
  name: string;
}

interface JobCardFormData {
  customerId: string;
  vehicleId: string;
  technicianId: string;
  description: string;
  priority: string;
  estimatedCost: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: { value: JobStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'WAITING_PARTS', label: 'Waiting Parts' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'INVOICED', label: 'Invoiced' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  ...STATUS_OPTIONS,
];

const STATUS_BADGE_CLASSES: Record<JobStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800',
  WAITING_PARTS: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800',
  APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
  INVOICED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800',
};

const EMPTY_FORM: JobCardFormData = {
  customerId: '',
  vehicleId: '',
  technicianId: '',
  description: '',
  priority: '2',
  estimatedCost: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatStatusLabel(status: JobStatus): string {
  return status.replace(/_/g, ' ');
}

function getPriorityBadge(priority: number) {
  switch (priority) {
    case 1:
      return <Badge variant="secondary">Low</Badge>;
    case 3:
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800">
          High
        </Badge>
      );
    default:
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800">
          Medium
        </Badge>
      );
  }
}

function getPriorityLabel(priority: number): string {
  switch (priority) {
    case 1:
      return 'Low';
    case 3:
      return 'High';
    default:
      return 'Medium';
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TableSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function JobDetailPanel({ job }: { job: JobCard }) {
  const tasksCompleted = job.tasks.filter((t) => t.completed).length;
  const tasksTotal = job.tasks.length;
  const partsTotal = job.partsUsed.reduce(
    (sum, p) => sum + p.quantity * p.unitPrice,
    0
  );
  const labourTotal = job.labourEntries.reduce(
    (sum, l) => sum + l.hours * l.rate,
    0
  );
  const labourHoursTotal = job.labourEntries.reduce(
    (sum, l) => sum + l.hours,
    0
  );

  return (
    <div className="px-6 py-4 bg-muted/20 space-y-5">
      {/* Tasks Checklist */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">
            Tasks ({tasksCompleted}/{tasksTotal} completed)
          </h4>
        </div>
        {job.tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground pl-6">No tasks assigned.</p>
        ) : (
          <ul className="space-y-2 pl-1">
            {job.tasks.map((task) => (
              <li key={task.id} className="flex items-center gap-3">
                <Checkbox checked={task.completed} disabled />
                <span
                  className={`text-sm ${
                    task.completed
                      ? 'text-muted-foreground line-through'
                      : 'text-foreground'
                  }`}
                >
                  {task.taskName}
                </span>
                <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                  {task.laborHrs}h
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Separator />

      {/* Parts Used */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Wrench className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Parts Used</h4>
        </div>
        {job.partsUsed.length === 0 ? (
          <p className="text-sm text-muted-foreground pl-6">No parts recorded.</p>
        ) : (
          <div className="rounded-lg border bg-background overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">
                    Part
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">
                    Part #
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-center">
                    Qty
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                    Unit Price
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {job.partsUsed.map((part) => (
                  <TableRow key={part.id}>
                    <TableCell className="font-medium text-sm">
                      {part.sparePart.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {part.sparePart.partNumber}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {part.quantity}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {formatCurrency(part.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm font-medium">
                      {formatCurrency(part.quantity * part.unitPrice)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableCell colSpan={4} className="text-right text-sm font-semibold">
                    Parts Total
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm font-bold">
                    {formatCurrency(partsTotal)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Separator />

      {/* Labour Entries */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <User className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Labour Entries</h4>
        </div>
        {job.labourEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground pl-6">No labour entries.</p>
        ) : (
          <div className="rounded-lg border bg-background overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">
                    Staff
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">
                    Date
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-center">
                    Hours
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                    Rate
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {job.labourEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium text-sm">
                      {entry.staff.name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(entry.date)}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {entry.hours}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {formatCurrency(entry.rate)}/hr
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm font-medium">
                      {formatCurrency(entry.hours * entry.rate)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableCell colSpan={2} className="text-right text-sm font-semibold">
                    Labour Total ({labourHoursTotal}h)
                  </TableCell>
                  <TableCell colSpan={3} className="text-right tabular-nums text-sm font-bold">
                    {formatCurrency(labourTotal)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function JobCardsPage() {
  const { toast } = useToast();
  const { canCreate, canEdit, canApprove } = useAppStore();

  // Data state
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Create/Edit dialog state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobCard | null>(null);
  const [formData, setFormData] = useState<JobCardFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Status change dialog state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusChangingJob, setStatusChangingJob] = useState<JobCard | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const fetchJobCards = useCallback(async () => {
    try {
      const res = await fetch('/api/job-cards');
      if (!res.ok) throw new Error(`Failed to fetch job cards (${res.status})`);
      const data: JobCard[] = await res.json();
      setJobCards(data);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load job cards',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers');
      if (!res.ok) throw new Error(`Failed to fetch customers (${res.status})`);
      const data: Customer[] = await res.json();
      setCustomers(data);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load customers',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch('/api/vehicles');
      if (!res.ok) throw new Error(`Failed to fetch vehicles (${res.status})`);
      const data: Vehicle[] = await res.json();
      setVehicles(data);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load vehicles',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch('/api/staff');
      if (!res.ok) throw new Error(`Failed to fetch staff (${res.status})`);
      const data: Staff[] = await res.json();
      setStaff(data);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load staff',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchJobCards(), fetchCustomers(), fetchVehicles(), fetchStaff()]);
    setLoading(false);
  }, [fetchJobCards, fetchCustomers, fetchVehicles, fetchStaff]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // -------------------------------------------------------------------------
  // Filtering
  // -------------------------------------------------------------------------

  const filteredJobCards = jobCards.filter((job) => {
    // Status filter
    if (statusFilter !== 'ALL' && job.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      job.jobNumber.toLowerCase().includes(q) ||
      job.customer.name.toLowerCase().includes(q) ||
      job.description.toLowerCase().includes(q) ||
      job.technician?.name?.toLowerCase().includes(q) ||
      job.vehicle.plateNumber.toLowerCase().includes(q) ||
      `${job.vehicle.make} ${job.vehicle.model}`.toLowerCase().includes(q)
    );
  });

  // Vehicles filtered by the currently selected customer
  const filteredVehicles = formData.customerId
    ? vehicles.filter((v) => v.customerId === formData.customerId)
    : vehicles;

  // -------------------------------------------------------------------------
  // CRUD handlers
  // -------------------------------------------------------------------------

  function openCreateDialog() {
    setEditingJob(null);
    setFormData(EMPTY_FORM);
    setFormDialogOpen(true);
  }

  function openEditDialog(job: JobCard) {
    setEditingJob(job);
    setFormData({
      customerId: job.customerId,
      vehicleId: job.vehicleId,
      technicianId: job.technicianId || '',
      description: job.description,
      priority: String(job.priority ?? 2),
      estimatedCost: job.estimatedCost ? String(job.estimatedCost) : '',
    });
    setFormDialogOpen(true);
  }

  function openStatusDialog(job: JobCard) {
    setStatusChangingJob(job);
    setNewStatus(job.status);
    setStatusDialogOpen(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.customerId || !formData.vehicleId || !formData.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Customer, vehicle, and description are required fields.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const isEdit = editingJob !== null;
      const payload: Record<string, unknown> = {
        customerId: formData.customerId,
        vehicleId: formData.vehicleId,
        description: formData.description.trim(),
      };

      if (formData.technicianId) payload.technicianId = formData.technicianId;
      if (formData.priority) payload.priority = Number(formData.priority);
      if (formData.estimatedCost) payload.estimatedCost = Number(formData.estimatedCost);

      if (isEdit) {
        payload.id = editingJob!.id;
      }

      const res = await fetch('/api/job-cards', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Failed to ${isEdit ? 'update' : 'create'} job card`);

      toast({
        title: isEdit ? 'Job Card Updated' : 'Job Card Created',
        description: `${isEdit ? editingJob!.jobNumber : 'New job card'} has been ${isEdit ? 'updated' : 'created'} successfully.`,
      });

      setFormDialogOpen(false);
      await fetchJobCards();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : `Failed to ${editingJob ? 'update' : 'create'} job card`,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(e: React.FormEvent) {
    e.preventDefault();
    if (!statusChangingJob || !newStatus) return;

    setStatusSubmitting(true);
    try {
      const res = await fetch('/api/job-cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: statusChangingJob.id,
          status: newStatus,
        }),
      });

      if (!res.ok) throw new Error('Failed to update job status');

      toast({
        title: 'Status Updated',
        description: `${statusChangingJob.jobNumber} status changed to ${formatStatusLabel(newStatus as JobStatus)}.`,
      });

      setStatusDialogOpen(false);
      setStatusChangingJob(null);
      setNewStatus('');
      await fetchJobCards();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setStatusSubmitting(false);
    }
  }

  async function handleDelete(job: JobCard) {
    if (!confirm(`Are you sure you want to delete ${job.jobNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/job-cards?id=${job.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Failed to delete job card (${res.status})`);

      toast({
        title: 'Job Card Deleted',
        description: `${job.jobNumber} has been removed.`,
      });

      if (expandedId === job.id) {
        setExpandedId(null);
      }

      await fetchJobCards();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete job card',
        variant: 'destructive',
      });
    }
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function updateFormField(field: keyof JobCardFormData, value: string) {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Reset vehicle when customer changes
      if (field === 'customerId') {
        updated.vehicleId = '';
      }
      return updated;
    });
  }

  // -------------------------------------------------------------------------
  // Render: Loading
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>
        {/* Filter bar skeleton */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 w-full sm:max-w-xs" />
          <Skeleton className="h-10 w-full sm:w-48" />
        </div>
        {/* Table skeleton */}
        <TableSkeleton />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Main
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Job Card Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create, track, and manage all workshop job cards and their progress.
          </p>
        </div>
        <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
          {canCreate('job-cards') && (
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Job Card
              </Button>
            </DialogTrigger>
          )}

          {/* ------------------------------------------------------------- */}
          {/* Create / Edit Dialog                                           */}
          {/* ------------------------------------------------------------- */}
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleFormSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingJob ? 'Edit Job Card' : 'Create Job Card'}
                </DialogTitle>
                <DialogDescription>
                  {editingJob
                    ? `Update details for ${editingJob.jobNumber}.`
                    : 'Fill in the details to create a new job card.'}
                </DialogDescription>
              </DialogHeader>
              <Separator className="my-2" />
              <div className="grid gap-4 py-2">
                {/* Customer */}
                <div className="grid gap-2">
                  <label htmlFor="jc-customer" className="text-sm font-medium">
                    Customer <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(val) => updateFormField('customerId', val)}
                    disabled={submitting}
                  >
                    <SelectTrigger className="w-full" id="jc-customer">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            {c.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vehicle */}
                <div className="grid gap-2">
                  <label htmlFor="jc-vehicle" className="text-sm font-medium">
                    Vehicle <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={formData.vehicleId}
                    onValueChange={(val) => updateFormField('vehicleId', val)}
                    disabled={submitting || !formData.customerId}
                  >
                    <SelectTrigger className="w-full" id="jc-vehicle">
                      <SelectValue
                        placeholder={
                          formData.customerId
                            ? 'Select a vehicle'
                            : 'Select a customer first'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredVehicles.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No vehicles found for this customer.
                        </div>
                      ) : (
                        filteredVehicles.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            <div className="flex items-center gap-2">
                              <Car className="h-3.5 w-3.5 text-muted-foreground" />
                              {v.make} {v.model} ({v.plateNumber})
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Technician */}
                <div className="grid gap-2">
                  <label htmlFor="jc-technician" className="text-sm font-medium">
                    Technician
                  </label>
                  <Select
                    value={formData.technicianId}
                    onValueChange={(val) => updateFormField('technicianId', val)}
                    disabled={submitting}
                  >
                    <SelectTrigger className="w-full" id="jc-technician">
                      <SelectValue placeholder="Select a technician (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <div className="flex items-center gap-2">
                            <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                            {s.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="grid gap-2">
                  <label htmlFor="jc-description" className="text-sm font-medium">
                    Description <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    id="jc-description"
                    placeholder="Describe the work to be done..."
                    value={formData.description}
                    onChange={(e) => updateFormField('description', e.target.value)}
                    required
                    disabled={submitting}
                    rows={3}
                  />
                </div>

                {/* Priority & Estimated Cost */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Priority */}
                  <div className="grid gap-2">
                    <label htmlFor="jc-priority" className="text-sm font-medium">
                      Priority
                    </label>
                    <Select
                      value={formData.priority}
                      onValueChange={(val) => updateFormField('priority', val)}
                      disabled={submitting}
                    >
                      <SelectTrigger className="w-full" id="jc-priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Low</SelectItem>
                        <SelectItem value="2">Medium</SelectItem>
                        <SelectItem value="3">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Estimated Cost */}
                  <div className="grid gap-2">
                    <label htmlFor="jc-cost" className="text-sm font-medium">
                      Estimated Cost
                    </label>
                    <Input
                      id="jc-cost"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.estimatedCost}
                      onChange={(e) => updateFormField('estimatedCost', e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? 'Saving...'
                    : editingJob
                      ? 'Update Job Card'
                      : 'Create Job Card'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Filter bar                                                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search job #, customer, vehicle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={fetchAll}
          aria-label="Refresh data"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Job Cards Table                                                   */}
      {/* ----------------------------------------------------------------- */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead className="min-w-[120px]">Job #</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Customer
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5 text-muted-foreground" />
                    Vehicle
                  </div>
                </TableHead>
                <TableHead className="hidden xl:table-cell">Description</TableHead>
                <TableHead className="hidden md:table-cell">
                  <div className="flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                    Technician
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Priority</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Est. Cost</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobCards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ClipboardList className="h-8 w-8 opacity-40" />
                      <p className="text-sm font-medium">
                        {searchQuery.trim() || statusFilter !== 'ALL'
                          ? 'No job cards match your filters.'
                          : 'No job cards found.'}
                      </p>
                      {!searchQuery.trim() && statusFilter === 'ALL' && (
                        <p className="text-xs">
                          Click &quot;Create Job Card&quot; to get started.
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobCards.map((job) => {
                  const isExpanded = expandedId === job.id;
                  return (
                    <Fragment key={job.id}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => toggleExpand(job.id)}
                      >
                        {/* Expand toggle */}
                        <TableCell className="w-10 p-2">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>

                        {/* Job # */}
                        <TableCell className="font-semibold font-mono text-sm">
                          {job.jobNumber}
                        </TableCell>

                        {/* Customer */}
                        <TableCell className="font-medium">{job.customer.name}</TableCell>

                        {/* Vehicle */}
                        <TableCell>
                          <div>
                            <span className="text-sm font-medium">
                              {job.vehicle.make} {job.vehicle.model}
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground font-mono">
                              {job.vehicle.plateNumber}
                            </span>
                          </div>
                        </TableCell>

                        {/* Description (hidden on small) */}
                        <TableCell className="hidden xl:table-cell max-w-[200px] truncate text-sm text-muted-foreground">
                          {job.description}
                        </TableCell>

                        {/* Technician (hidden on small) */}
                        <TableCell className="hidden md:table-cell text-sm">
                          {job.technician?.name || '—'}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge className={STATUS_BADGE_CLASSES[job.status]}>
                            {formatStatusLabel(job.status)}
                          </Badge>
                        </TableCell>

                        {/* Priority (hidden on small) */}
                        <TableCell className="hidden lg:table-cell">
                          {getPriorityBadge(job.priority)}
                        </TableCell>

                        {/* Estimated Cost (hidden on mobile) */}
                        <TableCell className="hidden sm:table-cell text-right tabular-nums text-sm">
                          {job.estimatedCost ? formatCurrency(job.estimatedCost) : '—'}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {canApprove('job-cards') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openStatusDialog(job)}
                                aria-label={`Change status of ${job.jobNumber}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {canEdit('job-cards') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditDialog(job)}
                                aria-label={`Edit ${job.jobNumber}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canEdit('job-cards') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(job)}
                                aria-label={`Delete ${job.jobNumber}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expandable Detail Row */}
                      {isExpanded && (
                        <TableRow key={`${job.id}-detail`}>
                          <TableCell colSpan={10} className="p-0 border-b">
                            <JobDetailPanel job={job} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ----------------------------------------------------------------- */}
      {/* Status Change Dialog                                              */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleStatusChange}>
            <DialogHeader>
              <DialogTitle>Change Job Status</DialogTitle>
              <DialogDescription>
                Update the status for{' '}
                <span className="font-semibold text-foreground">
                  {statusChangingJob?.jobNumber}
                </span>
                .
              </DialogDescription>
            </DialogHeader>
            <Separator className="my-2" />
            <div className="py-4 space-y-4">
              {/* Current Status */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Current Status:
                </span>
                {statusChangingJob && (
                  <Badge className={STATUS_BADGE_CLASSES[statusChangingJob.status]}>
                    {formatStatusLabel(statusChangingJob.status)}
                  </Badge>
                )}
              </div>

              {/* New Status Select */}
              <div className="grid gap-2">
                <label htmlFor="status-select" className="text-sm font-medium">
                  New Status
                </label>
                <Select
                  value={newStatus}
                  onValueChange={setNewStatus}
                  disabled={statusSubmitting}
                >
                  <SelectTrigger className="w-full" id="status-select">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Job Summary */}
              {statusChangingJob && (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer:</span>
                    <span className="font-medium">{statusChangingJob.customer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicle:</span>
                    <span className="font-medium">
                      {statusChangingJob.vehicle.make} {statusChangingJob.vehicle.model}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Priority:</span>
                    <span>{getPriorityLabel(statusChangingJob.priority)}</span>
                  </div>
                  {statusChangingJob.estimatedCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Est. Cost:</span>
                      <span className="tabular-nums">
                        {formatCurrency(statusChangingJob.estimatedCost)}
                      </span>
                    </div>
                  )}
                  {statusChangingJob.actualCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Actual Cost:</span>
                      <span className="tabular-nums font-medium">
                        {formatCurrency(statusChangingJob.actualCost)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStatusDialogOpen(false)}
                disabled={statusSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={statusSubmitting || !newStatus}>
                {statusSubmitting ? 'Updating...' : 'Update Status'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}