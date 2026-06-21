'use client';

import { Fragment, useEffect, useState, useCallback } from 'react';
import {
  UserPlus,
  Search,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  Car,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  mileage: number;
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  notes: string | null;
  vehicles: Vehicle[];
}

interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

type SortDirection = 'asc' | 'desc';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMPTY_FORM: CustomerFormData = {
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
};

function formatMileage(mileage: number): string {
  return mileage.toLocaleString('en-US');
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

function VehicleSubTable({ vehicles }: { vehicles: Vehicle[] }) {
  if (vehicles.length === 0) {
    return (
      <div className="py-4 px-8 text-sm text-muted-foreground">
        No vehicles registered for this customer.
      </div>
    );
  }

  return (
    <div className="px-8 py-3">
      <div className="rounded-lg border bg-muted/30 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-xs font-semibold uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <Car className="h-3.5 w-3.5" />
                  Make / Model
                </div>
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">Year</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">Color</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider">Plate Number</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Mileage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell className="font-medium">
                  {vehicle.make} {vehicle.model}
                </TableCell>
                <TableCell>{vehicle.year}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {vehicle.color}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{vehicle.plateNumber}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMileage(vehicle.mileage)} mi
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CustomersPage() {
  const { toast } = useToast();

  // Data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

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
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // -------------------------------------------------------------------------
  // Filtering & sorting
  // -------------------------------------------------------------------------

  const filteredCustomers = customers
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  // -------------------------------------------------------------------------
  // CRUD handlers
  // -------------------------------------------------------------------------

  function openCreateDialog() {
    setEditingCustomer(null);
    setFormData(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(customer: Customer) {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? '',
      address: customer.address ?? '',
      notes: customer.notes ?? '',
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name and phone are required fields.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      const isEdit = editingCustomer !== null;
      const url = '/api/customers';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...payload, id: editingCustomer.id } : payload),
      });

      if (!res.ok) throw new Error(`Failed to ${isEdit ? 'update' : 'create'} customer`);

      toast({
        title: isEdit ? 'Customer Updated' : 'Customer Created',
        description: `${formData.name.trim()} has been ${isEdit ? 'updated' : 'added'} successfully.`,
      });

      setDialogOpen(false);
      await fetchCustomers();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : `Failed to ${editingCustomer ? 'update' : 'create'} customer`,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(customer: Customer) {
    if (!confirm(`Are you sure you want to delete ${customer.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/customers?id=${customer.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Failed to delete customer (${res.status})`);

      toast({
        title: 'Customer Deleted',
        description: `${customer.name} has been removed.`,
      });

      if (expandedId === customer.id) {
        setExpandedId(null);
      }

      await fetchCustomers();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete customer',
        variant: 'destructive',
      });
    }
  }

  function toggleSort() {
    setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function updateFormField(field: keyof CustomerFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        {/* Search skeleton */}
        <Skeleton className="h-10 w-full max-w-sm" />
        {/* Table skeleton */}
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your workshop customers and view their registered vehicles.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingCustomer ? 'Edit Customer' : 'Add Customer'}
                </DialogTitle>
                <DialogDescription>
                  {editingCustomer
                    ? 'Update customer information below.'
                    : 'Fill in the details to register a new customer.'}
                </DialogDescription>
              </DialogHeader>
              <Separator className="my-2" />
              <div className="grid gap-4 py-2">
                {/* Name */}
                <div className="grid gap-2">
                  <label htmlFor="customer-name" className="text-sm font-medium">
                    Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="customer-name"
                    placeholder="e.g. Robert Johnson"
                    value={formData.name}
                    onChange={(e) => updateFormField('name', e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
                {/* Phone */}
                <div className="grid gap-2">
                  <label htmlFor="customer-phone" className="text-sm font-medium">
                    Phone <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="customer-phone"
                    placeholder="e.g. 555-2001"
                    value={formData.phone}
                    onChange={(e) => updateFormField('phone', e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
                {/* Email */}
                <div className="grid gap-2">
                  <label htmlFor="customer-email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="customer-email"
                    type="email"
                    placeholder="e.g. robert@email.com"
                    value={formData.email}
                    onChange={(e) => updateFormField('email', e.target.value)}
                    disabled={submitting}
                  />
                </div>
                {/* Address */}
                <div className="grid gap-2">
                  <label htmlFor="customer-address" className="text-sm font-medium">
                    Address
                  </label>
                  <Input
                    id="customer-address"
                    placeholder="e.g. 12 Oak Street"
                    value={formData.address}
                    onChange={(e) => updateFormField('address', e.target.value)}
                    disabled={submitting}
                  />
                </div>
                {/* Notes */}
                <div className="grid gap-2">
                  <label htmlFor="customer-notes" className="text-sm font-medium">
                    Notes
                  </label>
                  <Textarea
                    id="customer-notes"
                    placeholder="Additional notes about this customer..."
                    value={formData.notes}
                    onChange={(e) => updateFormField('notes', e.target.value)}
                    disabled={submitting}
                  />
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
                    : editingCustomer
                      ? 'Update Customer'
                      : 'Add Customer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search / Filter bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by name, phone, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={toggleSort}
                >
                  <div className="flex items-center gap-1.5">
                    Name
                    {sortDir === 'asc' ? (
                      <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Email
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    Phone
                  </div>
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    Address
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Car className="h-3.5 w-3.5 text-muted-foreground" />
                    Vehicles
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <UserPlus className="h-8 w-8 opacity-40" />
                      <p className="text-sm font-medium">
                        {searchQuery.trim()
                          ? 'No customers match your search.'
                          : 'No customers found.'}
                      </p>
                      {!searchQuery.trim() && (
                        <p className="text-xs">
                          Click &quot;Add Customer&quot; to get started.
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => {
                  const isExpanded = expandedId === customer.id;
                  return (
                    <Fragment key={customer.id}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => toggleExpand(customer.id)}
                      >
                        <TableCell className="w-8 p-2">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {customer.email || '—'}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-muted-foreground md:hidden" />
                            {customer.phone}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {customer.address || '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className="tabular-nums"
                          >
                            {customer.vehicles.length}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(customer)}
                              aria-label={`Edit ${customer.name}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(customer)}
                              aria-label={`Delete ${customer.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${customer.id}-vehicles`}>
                          <TableCell colSpan={7} className="p-0 border-b">
                            <VehicleSubTable vehicles={customer.vehicles} />
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
    </div>
  );
}