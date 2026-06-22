'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  DollarSign,
  CreditCard,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/app-store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'PAID'
  | 'PARTIAL'
  | 'OVERDUE'
  | 'CANCELLED';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  reference: string;
  paidAt: string;
}

interface Customer {
  id: string;
  name: string;
}

interface JobCard {
  id: string;
  jobNumber: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  jobCardId: string | null;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paidAmount: number;
  dueDate: string;
  paidAt: string | null;
  notes: string | null;
  customer: Customer;
  jobCard: JobCard | null;
  items: InvoiceItem[];
  payments: Payment[];
}

interface LineItemForm {
  description: string;
  quantity: string;
  unitPrice: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-800',
  SENT: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  PARTIAL: 'bg-amber-100 text-amber-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function createEmptyLineItem(): LineItemForm {
  return { description: '', quantity: '1', unitPrice: '' };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BillingPage() {
  const { toast } = useToast();
  const { canCreate } = useAppStore();

  // --- Data state ---
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);

  // --- UI state ---
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // --- Form state ---
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formJobCardId, setFormJobCardId] = useState('');
  const [formDiscount, setFormDiscount] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItemForm[]>([
    createEmptyLineItem(),
  ]);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await fetch('/api/invoices');
      if (!res.ok) throw new Error(`Failed to fetch invoices (${res.status})`);
      const data: Invoice[] = await res.json();
      setInvoices(data);
    } catch (err) {
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to load invoices',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers');
      if (!res.ok)
        throw new Error(`Failed to fetch customers (${res.status})`);
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

  const fetchJobCards = useCallback(async () => {
    try {
      const res = await fetch('/api/job-cards');
      if (!res.ok)
        throw new Error(`Failed to fetch job cards (${res.status})`);
      const data: JobCard[] = await res.json();
      setJobCards(data);
    } catch (err) {
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to load job cards',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    Promise.all([fetchInvoices(), fetchCustomers(), fetchJobCards()]).then(
      () => setLoading(false),
    );
  }, [fetchInvoices, fetchCustomers, fetchJobCards]);

  // ---------------------------------------------------------------------------
  // Computed values
  // ---------------------------------------------------------------------------

  const totalRevenue = invoices.reduce((s, i) => s + i.total, 0);
  const paidAmount = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const outstanding = invoices
    .filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED')
    .reduce((s, i) => s + (i.total - i.paidAmount), 0);
  const overdue = invoices
    .filter((i) => i.status === 'OVERDUE')
    .reduce((s, i) => s + (i.total - i.paidAmount), 0);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      !search ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ---------------------------------------------------------------------------
  // Line item helpers
  // ---------------------------------------------------------------------------

  const updateLineItem = (
    index: number,
    field: keyof LineItemForm,
    value: string,
  ) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const addLineItem = () => {
    setLineItems((prev) => [...prev, createEmptyLineItem()]);
  };

  const removeLineItem = (index: number) => {
    setLineItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const lineItemTotal = (item: LineItemForm): number => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return qty * price;
  };

  const formSubtotal = lineItems.reduce((s, item) => s + lineItemTotal(item), 0);
  const formTax = formSubtotal * 0.1; // 10% tax
  const formDiscountVal = parseFloat(formDiscount) || 0;
  const formTotal = formSubtotal + formTax - formDiscountVal;

  // ---------------------------------------------------------------------------
  // CRUD handlers
  // ---------------------------------------------------------------------------

  const resetForm = () => {
    setFormCustomerId('');
    setFormJobCardId('');
    setFormDiscount('');
    setFormNotes('');
    setLineItems([createEmptyLineItem()]);
  };

  const handleCreateInvoice = async () => {
    if (!formCustomerId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a customer.',
        variant: 'destructive',
      });
      return;
    }

    const validItems = lineItems.filter(
      (li) => li.description.trim() && li.quantity && li.unitPrice,
    );
    if (validItems.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one line item.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        customerId: formCustomerId,
        jobCardId: formJobCardId || undefined,
        items: validItems.map((li) => ({
          description: li.description,
          quantity: parseFloat(li.quantity),
          unitPrice: parseFloat(li.unitPrice),
        })),
        discount: formDiscountVal || undefined,
      };

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to create invoice (${res.status})`);
      }

      toast({
        title: 'Invoice Created',
        description: 'The invoice has been created successfully.',
      });

      setCreateDialogOpen(false);
      resetForm();
      await fetchInvoices();
    } catch (err) {
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to create invoice',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const res = await fetch(`/api/invoices?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to delete invoice (${res.status})`);
      }

      toast({
        title: 'Invoice Deleted',
        description: 'The invoice has been deleted successfully.',
      });

      if (expandedId === id) setExpandedId(null);
      await fetchInvoices();
    } catch (err) {
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to delete invoice',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to update invoice (${res.status})`);
      }

      toast({
        title: 'Status Updated',
        description: `Invoice status changed to ${newStatus}.`,
      });

      await fetchInvoices();
    } catch (err) {
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to update invoice',
        variant: 'destructive',
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Loading skeleton
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-5 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-40" />
        </div>

        {/* Table skeleton */}
        <Card>
          <CardContent className="p-0">
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6 p-6">
      {/* ------------------------------------------------------------------- */}
      {/* Header */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Receipt className="h-6 w-6" />
            Billing &amp; Invoicing
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage invoices, track payments, and monitor your workshop&apos;s
            revenue.
          </p>
        </div>
        {canCreate('billing') && (
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Stats Cards */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(paidAmount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(outstanding)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(overdue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Filter Bar */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="PARTIAL">Partial</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Invoices Table */}
      {/* ------------------------------------------------------------------- */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance Due</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={12}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No invoices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((inv) => {
                    const balanceDue = inv.total - inv.paidAmount;
                    const isExpanded = expandedId === inv.id;

                    return (
                      <InvoiceRow
                        key={inv.id}
                        invoice={inv}
                        isExpanded={isExpanded}
                        balanceDue={balanceDue}
                        onToggle={() =>
                          setExpandedId(isExpanded ? null : inv.id)
                        }
                        onStatusChange={handleStatusChange}
                        onDelete={handleDeleteInvoice}
                      />
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------- */}
      {/* Expanded Detail Panels */}
      {/* ------------------------------------------------------------------- */}
      {expandedId &&
        invoices
          .filter((inv) => inv.id === expandedId)
          .map((inv) => (
            <Card key={`detail-${inv.id}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  {inv.invoiceNumber} — Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Invoice Items */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Line Items</h4>
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inv.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.unitPrice)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Payment History */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Payment History</h4>
                  {inv.payments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No payments recorded.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {inv.payments.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell className="font-medium">
                                {formatCurrency(p.amount)}
                              </TableCell>
                              <TableCell>{p.method}</TableCell>
                              <TableCell>{p.reference || '—'}</TableCell>
                              <TableCell>{formatDate(p.paidAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {inv.notes && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold">Notes</h4>
                    <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
                      {inv.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

      {/* ------------------------------------------------------------------- */}
      {/* Create Invoice Dialog */}
      {/* ------------------------------------------------------------------- */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>
              Add line items and assign the invoice to a customer. Job card
              assignment is optional.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Customer */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer *</label>
              <Select
                value={formCustomerId}
                onValueChange={setFormCustomerId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Job Card (optional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Job Card (optional)</label>
              <Select
                value={formJobCardId}
                onValueChange={setFormJobCardId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a job card" />
                </SelectTrigger>
                <SelectContent>
                  {jobCards.map((jc) => (
                    <SelectItem key={jc.id} value={jc.id}>
                      {jc.jobNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Line Items</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLineItem}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-2">
                {lineItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[1fr_80px_110px_90px_36px] items-end gap-2"
                  >
                    <div className="space-y-1">
                      {idx === 0 && (
                        <span className="text-xs text-muted-foreground">
                          Description
                        </span>
                      )}
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(idx, 'description', e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && (
                        <span className="text-xs text-muted-foreground">
                          Qty
                        </span>
                      )}
                      <Input
                        type="number"
                        min="1"
                        placeholder="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(idx, 'quantity', e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && (
                        <span className="text-xs text-muted-foreground">
                          Unit Price
                        </span>
                      )}
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateLineItem(idx, 'unitPrice', e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && (
                        <span className="text-xs text-muted-foreground">
                          Total
                        </span>
                      )}
                      <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm">
                        {formatCurrency(lineItemTotal(item))}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      onClick={() => removeLineItem(idx)}
                      disabled={lineItems.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(formSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (10%)</span>
                <span>{formatCurrency(formTax)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Discount</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formDiscount}
                  onChange={(e) => setFormDiscount(e.target.value)}
                  className="h-8 w-28 text-right"
                />
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(formTotal)}</span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                placeholder="Additional notes (optional)"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateInvoice} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invoice Row (separate component for readability)
// ---------------------------------------------------------------------------

interface InvoiceRowProps {
  invoice: Invoice;
  isExpanded: boolean;
  balanceDue: number;
  onToggle: () => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

function InvoiceRow({
  invoice: inv,
  isExpanded,
  balanceDue,
  onToggle,
  onStatusChange,
  onDelete,
}: InvoiceRowProps) {
  const { canEdit, canApprove } = useAppStore();
  return (
    <>
      <TableRow className={isExpanded ? 'bg-muted/40' : ''}>
        <TableCell className="w-8">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onToggle}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
        <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
        <TableCell>{inv.customer.name}</TableCell>
        <TableCell>
          <Badge
            variant="secondary"
            className={STATUS_BADGE[inv.status]}
          >
            {inv.status}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          {formatCurrency(inv.subtotal)}
        </TableCell>
        <TableCell className="text-right">
          {formatCurrency(inv.tax)}
        </TableCell>
        <TableCell className="text-right">
          {inv.discount > 0 ? formatCurrency(inv.discount) : '—'}
        </TableCell>
        <TableCell className="text-right font-medium">
          {formatCurrency(inv.total)}
        </TableCell>
        <TableCell className="text-right">
          {formatCurrency(inv.paidAmount)}
        </TableCell>
        <TableCell className="text-right">
          <span
            className={
              balanceDue > 0
                ? 'font-medium text-red-600'
                : 'text-muted-foreground'
            }
          >
            {formatCurrency(balanceDue)}
          </span>
        </TableCell>
        <TableCell>{formatDate(inv.dueDate)}</TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            {/* Quick status change */}
            {canApprove('billing') && (
            <Select
              value={inv.status}
              onValueChange={(val) => onStatusChange(inv.id, val)}
            >
              <SelectTrigger className="h-8 w-[100px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggle}
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {canEdit('billing') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-600"
              onClick={() => onDelete(inv.id)}
              title="Delete invoice"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    </>
  );
}