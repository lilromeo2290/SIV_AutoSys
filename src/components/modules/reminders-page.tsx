'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Bell,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  MessageSquare,
  Phone,
  Mail,
  Clock,
  User,
  Car,
  CalendarDays,
  AlertTriangle,
  Send,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/app-store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReminderCustomer {
  id: string;
  name: string;
  phone: string;
}

interface ReminderVehicle {
  id: string;
  make: string;
  model: string;
  plateNumber: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  plateNumber: string;
  customerId: string;
}

interface Reminder {
  id: string;
  customerId: string;
  vehicleId: string;
  type: string;
  description: string;
  dueDate: string;
  status: 'PENDING' | 'SENT' | 'COMPLETED' | 'FAILED';
  channel: 'SMS' | 'WHATSAPP' | 'EMAIL';
  sentAt: string | null;
  createdAt: string;
  customer: ReminderCustomer;
  vehicle: ReminderVehicle;
}

interface ReminderFormData {
  customerId: string;
  vehicleId: string;
  type: string;
  description: string;
  dueDate: string;
  channel: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMPTY_FORM: ReminderFormData = {
  customerId: '',
  vehicleId: '',
  type: '',
  description: '',
  dueDate: '',
  channel: 'SMS',
};

const STATUS_OPTIONS = ['ALL', 'PENDING', 'SENT', 'COMPLETED', 'FAILED'] as const;
const CHANNEL_OPTIONS = ['ALL', 'SMS', 'WHATSAPP', 'EMAIL'] as const;

const SERVICE_TYPES = [
  'Oil Change',
  'Tire Rotation',
  'Brake Inspection',
  'Battery Replacement',
  'Air Filter Replacement',
  'Transmission Service',
  'Coolant Flush',
  'Timing Belt Replacement',
  'Wheel Alignment',
  'General Inspection',
  'Other',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isOverdue(reminder: Reminder): boolean {
  if (reminder.status !== 'PENDING') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(reminder.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-100 text-amber-800 hover:bg-amber-100/80';
    case 'SENT':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100/80';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 hover:bg-green-100/80';
    case 'FAILED':
      return 'bg-red-100 text-red-800 hover:bg-red-100/80';
    default:
      return '';
  }
}

function getChannelBadgeClasses(channel: string): string {
  switch (channel) {
    case 'SMS':
      return 'bg-green-100 text-green-800';
    case 'WHATSAPP':
      return 'bg-emerald-100 text-emerald-800';
    case 'EMAIL':
      return 'bg-blue-100 text-blue-800';
    default:
      return '';
  }
}

function getChannelIcon(channel: string, className?: string) {
  const cls = className || 'h-3.5 w-3.5';
  switch (channel) {
    case 'SMS':
      return <MessageSquare className={cls} />;
    case 'WHATSAPP':
      return <Phone className={cls} />;
    case 'EMAIL':
      return <Mail className={cls} />;
    default:
      return null;
  }
}

function getChannelLabel(channel: string): string {
  switch (channel) {
    case 'SMS':
      return 'SMS';
    case 'WHATSAPP':
      return 'WhatsApp';
    case 'EMAIL':
      return 'Email';
    default:
      return channel;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-7 w-10" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

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

function StatsCards({
  reminders,
}: {
  reminders: Reminder[];
}) {
  const total = reminders.length;
  const pending = reminders.filter((r) => r.status === 'PENDING').length;
  const sent = reminders.filter((r) => r.status === 'SENT').length;
  const completed = reminders.filter((r) => r.status === 'COMPLETED').length;

  const stats = [
    {
      label: 'Total Reminders',
      value: total,
      icon: Bell,
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
    },
    {
      label: 'Pending',
      value: pending,
      icon: Clock,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700',
    },
    {
      label: 'Sent',
      value: sent,
      icon: Send,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
    },
    {
      label: 'Completed',
      value: completed,
      icon: CheckCircle2,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-700',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function RemindersPage() {
  const { toast } = useToast();
  const { canCreate, canEdit } = useAppStore();

  // Data state
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [formData, setFormData] = useState<ReminderFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const fetchReminders = useCallback(async () => {
    try {
      const res = await fetch('/api/reminders');
      if (!res.ok) throw new Error(`Failed to fetch reminders (${res.status})`);
      const data: Reminder[] = await res.json();
      setReminders(data);
    } catch (err) {
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to load reminders',
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
        description:
          err instanceof Error ? err.message : 'Failed to load customers',
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
        description:
          err instanceof Error ? err.message : 'Failed to load vehicles',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    Promise.all([fetchReminders(), fetchCustomers(), fetchVehicles()]).finally(
      () => {
        setLoading(false);
      }
    );
  }, [fetchReminders, fetchCustomers, fetchVehicles]);

  // -------------------------------------------------------------------------
  // Filtering
  // -------------------------------------------------------------------------

  const filteredReminders = reminders.filter((r) => {
    // Status filter
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;

    // Channel filter
    if (channelFilter !== 'ALL' && r.channel !== channelFilter) return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.customer.name.toLowerCase().includes(q) ||
        r.vehicle.make.toLowerCase().includes(q) ||
        r.vehicle.model.toLowerCase().includes(q) ||
        r.vehicle.plateNumber.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    }

    return true;
  });

  // -------------------------------------------------------------------------
  // Vehicles filtered by selected customer (for dropdown)
  // -------------------------------------------------------------------------

  const customerVehicles = formData.customerId
    ? vehicles.filter((v) => v.customerId === formData.customerId)
    : vehicles;

  // -------------------------------------------------------------------------
  // CRUD handlers
  // -------------------------------------------------------------------------

  function openCreateDialog() {
    setEditingReminder(null);
    setFormData(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(reminder: Reminder) {
    setEditingReminder(reminder);
    setFormData({
      customerId: reminder.customerId,
      vehicleId: reminder.vehicleId,
      type: reminder.type,
      description: reminder.description,
      dueDate: reminder.dueDate.split('T')[0],
      channel: reminder.channel,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.customerId || !formData.vehicleId || !formData.type.trim() || !formData.dueDate) {
      toast({
        title: 'Validation Error',
        description: 'Customer, Vehicle, Type, and Due Date are required.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId: formData.customerId,
        vehicleId: formData.vehicleId,
        type: formData.type.trim(),
        description: formData.description.trim(),
        dueDate: new Date(formData.dueDate).toISOString(),
        channel: formData.channel,
      };

      const isEdit = editingReminder !== null;
      const res = await fetch('/api/reminders', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEdit ? { ...payload, id: editingReminder.id } : payload
        ),
      });

      if (!res.ok)
        throw new Error(`Failed to ${isEdit ? 'update' : 'create'} reminder`);

      toast({
        title: isEdit ? 'Reminder Updated' : 'Reminder Created',
        description: `${formData.type.trim()} reminder has been ${isEdit ? 'updated' : 'created'} successfully.`,
      });

      setDialogOpen(false);
      await fetchReminders();
    } catch (err) {
      toast({
        title: 'Error',
        description:
          err instanceof Error
            ? err.message
            : `Failed to ${editingReminder ? 'update' : 'create'} reminder`,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(reminder: Reminder) {
    if (
      !confirm(
        `Are you sure you want to delete this reminder for "${reminder.type}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/reminders?id=${reminder.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`Failed to delete reminder (${res.status})`);

      toast({
        title: 'Reminder Deleted',
        description: `The "${reminder.type}" reminder has been removed.`,
      });

      await fetchReminders();
    } catch (err) {
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to delete reminder',
        variant: 'destructive',
      });
    }
  }

  async function handleMarkAsSent(reminder: Reminder) {
    try {
      const res = await fetch('/api/reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reminder.id,
          status: 'SENT',
          sentAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error('Failed to mark reminder as sent');

      toast({
        title: 'Reminder Sent',
        description: `The "${reminder.type}" reminder has been marked as sent.`,
      });

      await fetchReminders();
    } catch (err) {
      toast({
        title: 'Error',
        description:
          err instanceof Error
            ? err.message
            : 'Failed to update reminder status',
        variant: 'destructive',
      });
    }
  }

  async function handleMarkComplete(reminder: Reminder) {
    try {
      const res = await fetch('/api/reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reminder.id,
          status: 'COMPLETED',
        }),
      });

      if (!res.ok)
        throw new Error('Failed to mark reminder as complete');

      toast({
        title: 'Reminder Completed',
        description: `The "${reminder.type}" reminder has been marked as complete.`,
      });

      await fetchReminders();
    } catch (err) {
      toast({
        title: 'Error',
        description:
          err instanceof Error
            ? err.message
            : 'Failed to update reminder status',
        variant: 'destructive',
      });
    }
  }

  function updateFormField(field: keyof ReminderFormData, value: string) {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Clear vehicle when customer changes
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
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        {/* Stats skeleton */}
        <StatsSkeleton />
        {/* Filter bar skeleton */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Service Reminders</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Schedule and track service reminders for your customers and their
            vehicles.
          </p>
        </div>
        {canCreate('reminders') && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Reminder
          </Button>
          <DialogContent className="sm:max-w-lg">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingReminder ? 'Edit Reminder' : 'Create Reminder'}
                </DialogTitle>
                <DialogDescription>
                  {editingReminder
                    ? 'Update the reminder details below.'
                    : 'Schedule a new service reminder for a customer.'}
                </DialogDescription>
              </DialogHeader>
              <Separator className="my-2" />
              <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto pr-2">
                {/* Customer */}
                <div className="grid gap-2">
                  <Label htmlFor="reminder-customer">
                    Customer <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(val) => updateFormField('customerId', val)}
                    disabled={submitting}
                  >
                    <SelectTrigger id="reminder-customer" className="w-full">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            {customer.name} — {customer.phone}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vehicle */}
                <div className="grid gap-2">
                  <Label htmlFor="reminder-vehicle">
                    Vehicle <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.vehicleId}
                    onValueChange={(val) => updateFormField('vehicleId', val)}
                    disabled={submitting || !formData.customerId}
                  >
                    <SelectTrigger id="reminder-vehicle" className="w-full">
                      <SelectValue
                        placeholder={
                          formData.customerId
                            ? 'Select a vehicle'
                            : 'Select a customer first'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {customerVehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          <div className="flex items-center gap-2">
                            <Car className="h-3.5 w-3.5 text-muted-foreground" />
                            {vehicle.make} {vehicle.model} — {vehicle.plateNumber}
                          </div>
                        </SelectItem>
                      ))}
                      {customerVehicles.length === 0 && formData.customerId && (
                        <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                          No vehicles found for this customer
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Type */}
                <div className="grid gap-2">
                  <Label htmlFor="reminder-type">
                    Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val) => updateFormField('type', val)}
                    disabled={submitting}
                  >
                    <SelectTrigger id="reminder-type" className="w-full">
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="grid gap-2">
                  <Label htmlFor="reminder-description">Description</Label>
                  <Input
                    id="reminder-description"
                    placeholder="e.g. Next oil change due at 40,000 miles"
                    value={formData.description}
                    onChange={(e) => updateFormField('description', e.target.value)}
                    disabled={submitting}
                  />
                </div>

                {/* Due Date */}
                <div className="grid gap-2">
                  <Label>
                    Due Date <span className="text-destructive">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        disabled={submitting}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {formData.dueDate
                          ? formatDate(formData.dueDate)
                          : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          formData.dueDate
                            ? new Date(formData.dueDate)
                            : undefined
                        }
                        onSelect={(date) =>
                          updateFormField(
                            'dueDate',
                            date ? date.toISOString().split('T')[0] : ''
                          )
                        }
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Channel */}
                <div className="grid gap-2">
                  <Label htmlFor="reminder-channel">Channel</Label>
                  <Select
                    value={formData.channel}
                    onValueChange={(val) => updateFormField('channel', val)}
                    disabled={submitting}
                  >
                    <SelectTrigger id="reminder-channel" className="w-full">
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SMS">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-3.5 w-3.5 text-green-700" />
                          SMS
                        </div>
                      </SelectItem>
                      <SelectItem value="WHATSAPP">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-emerald-700" />
                          WhatsApp
                        </div>
                      </SelectItem>
                      <SelectItem value="EMAIL">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-blue-700" />
                          Email
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? 'Saving...'
                    : editingReminder
                      ? 'Update Reminder'
                      : 'Create Reminder'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <StatsCards reminders={reminders} />

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by customer, vehicle, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {status === 'ALL' ? 'All Statuses' : status.charAt(0) + status.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            {CHANNEL_OPTIONS.map((channel) => (
              <SelectItem key={channel} value={channel}>
                {channel === 'ALL'
                  ? 'All Channels'
                  : getChannelLabel(channel)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reminders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Customer
                  </div>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <div className="flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5 text-muted-foreground" />
                    Vehicle
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                    Type
                  </div>
                </TableHead>
                <TableHead className="hidden lg:table-cell">Description</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    Due Date
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Channel</TableHead>
                <TableHead className="hidden xl:table-cell">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    Sent At
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReminders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Bell className="h-8 w-8 opacity-40" />
                      <p className="text-sm font-medium">
                        {searchQuery.trim() ||
                        statusFilter !== 'ALL' ||
                        channelFilter !== 'ALL'
                          ? 'No reminders match your filters.'
                          : 'No reminders found.'}
                      </p>
                      {!searchQuery.trim() &&
                        statusFilter === 'ALL' &&
                        channelFilter === 'ALL' && (
                          <p className="text-xs">
                            Click &quot;Create Reminder&quot; to get started.
                          </p>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredReminders.map((reminder) => {
                  const overdue = isOverdue(reminder);
                  return (
                    <TableRow
                      key={reminder.id}
                      className={overdue ? 'bg-red-50/60 hover:bg-red-50/80' : undefined}
                    >
                      {/* Customer */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {reminder.customer.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {reminder.customer.phone}
                          </span>
                        </div>
                      </TableCell>

                      {/* Vehicle */}
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {reminder.vehicle.make} {reminder.vehicle.model}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {reminder.vehicle.plateNumber}
                          </span>
                        </div>
                      </TableCell>

                      {/* Type */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {overdue && (
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                          )}
                          <span className="font-medium">{reminder.type}</span>
                        </div>
                      </TableCell>

                      {/* Description */}
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]">
                          {reminder.description}
                        </span>
                      </TableCell>

                      {/* Due Date */}
                      <TableCell>
                        <span
                          className={`text-sm ${overdue ? 'text-red-700 font-semibold' : ''}`}
                        >
                          {formatDate(reminder.dueDate)}
                        </span>
                        {overdue && (
                          <span className="block text-[10px] text-red-600 font-medium">
                            Overdue
                          </span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getStatusBadgeClasses(reminder.status)}
                        >
                          {reminder.status.charAt(0) +
                            reminder.status.slice(1).toLowerCase()}
                        </Badge>
                      </TableCell>

                      {/* Channel */}
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant="secondary"
                          className={`gap-1.5 ${getChannelBadgeClasses(reminder.channel)}`}
                        >
                          {getChannelIcon(reminder.channel)}
                          {getChannelLabel(reminder.channel)}
                        </Badge>
                      </TableCell>

                      {/* Sent At */}
                      <TableCell className="hidden xl:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(reminder.sentAt)}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit('reminders') && (reminder.status === 'PENDING' ||
                            reminder.status === 'FAILED') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleMarkAsSent(reminder)}
                              aria-label="Mark as Sent"
                              title="Mark as Sent"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {canEdit('reminders') && (reminder.status === 'PENDING' ||
                            reminder.status === 'SENT') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleMarkComplete(reminder)}
                              aria-label="Mark as Complete"
                              title="Mark as Complete"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          {canEdit('reminders') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(reminder)}
                            aria-label="Edit reminder"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          )}
                          {canEdit('reminders') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(reminder)}
                            aria-label="Delete reminder"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
