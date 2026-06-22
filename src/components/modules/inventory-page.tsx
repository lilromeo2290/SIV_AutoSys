'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  DollarSign,
  Tag,
  Layers,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/app-store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Supplier {
  id: string;
  name: string;
  phone: string;
}

interface Part {
  id: string;
  partNumber: string;
  name: string;
  category: string;
  description: string | null;
  quantity: number;
  minStock: number;
  costPrice: number;
  sellPrice: number;
  supplierId: string | null;
  location: string | null;
  supplier: Supplier | null;
  createdAt: string;
}

interface PartFormData {
  partNumber: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  costPrice: number;
  sellPrice: number;
  supplierId: string;
  location: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMPTY_FORM: PartFormData = {
  partNumber: '',
  name: '',
  category: '',
  quantity: 0,
  minStock: 0,
  costPrice: 0,
  sellPrice: 0,
  supplierId: '',
  location: '',
};

const KNOWN_CATEGORIES = [
  'Brakes',
  'Engine',
  'Electrical',
  'Suspension',
  'Filters',
  'Fluids',
  'Tires',
  'Body',
  'Transmission',
  'Exhaust',
  'Cooling',
  'Steering',
  'Lighting',
  'Accessories',
  'Hardware',
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function isLowStock(part: Part): boolean {
  return part.quantity <= part.minStock;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
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

function LowStockSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-48" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function InventoryPage() {
  const { toast } = useToast();
  const { canCreate, canEdit } = useAppStore();

  // Data state
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [formData, setFormData] = useState<PartFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const fetchParts = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory');
      if (!res.ok) throw new Error(`Failed to fetch inventory (${res.status})`);
      const data: Part[] = await res.json();
      setParts(data);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load inventory',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const uniqueCategories = useMemo(() => {
    const dataCategories = [...new Set(parts.map((p) => p.category))];
    // Merge known categories with those from data, maintaining order
    const merged = [...new Set([...dataCategories, ...KNOWN_CATEGORIES])];
    return merged.sort();
  }, [parts]);

  const uniqueSuppliers = useMemo(() => {
    const supplierMap = new Map<string, Supplier>();
    parts.forEach((p) => {
      if (p.supplier) {
        supplierMap.set(p.supplier.id, p.supplier);
      }
    });
    return Array.from(supplierMap.values());
  }, [parts]);

  const stats = useMemo(() => {
    const totalParts = parts.length;
    const totalCategories = new Set(parts.map((p) => p.category)).size;
    const lowStockCount = parts.filter(isLowStock).length;
    const totalValue = parts.reduce(
      (sum, p) => sum + p.quantity * p.costPrice,
      0
    );
    return { totalParts, totalCategories, lowStockCount, totalValue };
  }, [parts]);

  const lowStockParts = useMemo(() => {
    return parts.filter(isLowStock);
  }, [parts]);

  const filteredParts = useMemo(() => {
    return parts.filter((part) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          part.partNumber.toLowerCase().includes(q) ||
          part.name.toLowerCase().includes(q) ||
          part.category.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && part.category !== categoryFilter) {
        return false;
      }

      // Low stock filter
      if (lowStockOnly && !isLowStock(part)) {
        return false;
      }

      return true;
    });
  }, [parts, searchQuery, categoryFilter, lowStockOnly]);

  // -------------------------------------------------------------------------
  // CRUD handlers
  // -------------------------------------------------------------------------

  function openCreateDialog() {
    setEditingPart(null);
    setFormData(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(part: Part) {
    setEditingPart(part);
    setFormData({
      partNumber: part.partNumber,
      name: part.name,
      category: part.category,
      quantity: part.quantity,
      minStock: part.minStock,
      costPrice: part.costPrice,
      sellPrice: part.sellPrice,
      supplierId: part.supplierId ?? '',
      location: part.location ?? '',
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.partNumber.trim() || !formData.name.trim() || !formData.category.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Part Number, Name, and Category are required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.costPrice < 0 || formData.sellPrice < 0) {
      toast({
        title: 'Validation Error',
        description: 'Cost Price and Sell Price must be non-negative.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.quantity < 0 || formData.minStock < 0) {
      toast({
        title: 'Validation Error',
        description: 'Quantity and Min Stock must be non-negative.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const isEdit = editingPart !== null;
      const url = '/api/inventory';
      const payload = {
        partNumber: formData.partNumber.trim(),
        name: formData.name.trim(),
        category: formData.category.trim(),
        quantity: formData.quantity,
        minStock: formData.minStock,
        costPrice: formData.costPrice,
        sellPrice: formData.sellPrice,
        supplierId: formData.supplierId.trim() || undefined,
        location: formData.location.trim() || undefined,
      };

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...payload, id: editingPart.id } : payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Failed to ${isEdit ? 'update' : 'create'} part`);
      }

      toast({
        title: isEdit ? 'Part Updated' : 'Part Added',
        description: `${formData.name.trim()} (${formData.partNumber.trim()}) has been ${isEdit ? 'updated' : 'added'} successfully.`,
      });

      setDialogOpen(false);
      await fetchParts();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : `Failed to ${editingPart ? 'update' : 'create'} part`,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(part: Part) {
    if (!confirm(`Are you sure you want to delete "${part.name}" (${part.partNumber})? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/inventory?id=${part.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Failed to delete part (${res.status})`);

      toast({
        title: 'Part Deleted',
        description: `${part.name} (${part.partNumber}) has been removed from inventory.`,
      });

      await fetchParts();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete part',
        variant: 'destructive',
      });
    }
  }

  function updateFormField(field: keyof PartFormData, value: string | number) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  // -------------------------------------------------------------------------
  // Render – Loading
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
          <Skeleton className="h-10 w-32" />
        </div>
        {/* Stats skeleton */}
        <StatsSkeleton />
        {/* Search/filter skeleton */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-10 w-44" />
        </div>
        {/* Table skeleton */}
        <TableSkeleton />
        {/* Low stock skeleton */}
        <LowStockSkeleton />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track parts, monitor stock levels, and manage suppliers for your workshop.
          </p>
        </div>
        {canCreate('inventory') && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Part
            </Button>
          </DialogTrigger>

          {/* Add/Edit Dialog */}
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingPart ? 'Edit Part' : 'Add New Part'}
                </DialogTitle>
                <DialogDescription>
                  {editingPart
                    ? 'Update the part details below.'
                    : 'Fill in the details to add a new part to inventory.'}
                </DialogDescription>
              </DialogHeader>
              <Separator className="my-2" />
              <div className="grid gap-4 py-2">
                {/* Row 1: Part Number + Name */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="part-number">
                      Part Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="part-number"
                      placeholder="e.g. BRK-001"
                      value={formData.partNumber}
                      onChange={(e) => updateFormField('partNumber', e.target.value)}
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="part-name">
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="part-name"
                      placeholder="e.g. Front Brake Pad Set"
                      value={formData.name}
                      onChange={(e) => updateFormField('name', e.target.value)}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="grid gap-2">
                  <Label htmlFor="part-category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => updateFormField('category', val)}
                    disabled={submitting}
                  >
                    <SelectTrigger id="part-category" className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Row 2: Quantity + Min Stock */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="part-quantity">Quantity</Label>
                    <Input
                      id="part-quantity"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.quantity}
                      onChange={(e) => updateFormField('quantity', parseInt(e.target.value) || 0)}
                      disabled={submitting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="part-minstock">Min Stock Level</Label>
                    <Input
                      id="part-minstock"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.minStock}
                      onChange={(e) => updateFormField('minStock', parseInt(e.target.value) || 0)}
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Row 3: Cost Price + Sell Price */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="part-cost">
                      Cost Price <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <Input
                        id="part-cost"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.costPrice}
                        onChange={(e) => updateFormField('costPrice', parseFloat(e.target.value) || 0)}
                        className="pl-9"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="part-sell">
                      Sell Price <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <Input
                        id="part-sell"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.sellPrice}
                        onChange={(e) => updateFormField('sellPrice', parseFloat(e.target.value) || 0)}
                        className="pl-9"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>

                {/* Supplier */}
                <div className="grid gap-2">
                  <Label htmlFor="part-supplier">Supplier</Label>
                  <Select
                    value={formData.supplierId}
                    onValueChange={(val) => updateFormField('supplierId', val)}
                    disabled={submitting}
                  >
                    <SelectTrigger id="part-supplier" className="w-full">
                      <SelectValue placeholder="Select a supplier (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueSuppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location */}
                <div className="grid gap-2">
                  <Label htmlFor="part-location">Location</Label>
                  <Input
                    id="part-location"
                    placeholder="e.g. Shelf A-3, Bin 12"
                    value={formData.location}
                    onChange={(e) => updateFormField('location', e.target.value)}
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
                    : editingPart
                      ? 'Update Part'
                      : 'Add Part'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Parts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold tabular-nums">{stats.totalParts}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold tabular-nums">{stats.totalCategories}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle
                className={`h-5 w-5 ${stats.lowStockCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
              />
              <span
                className={`text-2xl font-bold tabular-nums ${stats.lowStockCount > 0 ? 'text-destructive' : ''}`}
              >
                {stats.lowStockCount}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Inventory Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold tabular-nums">
                {formatCurrency(stats.totalValue)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search / Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by part #, name, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch
              id="low-stock-toggle"
              checked={lowStockOnly}
              onCheckedChange={setLowStockOnly}
            />
            <Label htmlFor="low-stock-toggle" className="text-sm whitespace-nowrap cursor-pointer">
              Low Stock Only
            </Label>
          </div>
        </div>
      </div>

      {/* Parts Table */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Part #</TableHead>
                  <TableHead className="min-w-[160px]">Name</TableHead>
                  <TableHead className="min-w-[100px] hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                      Category
                    </div>
                  </TableHead>
                  <TableHead className="text-center min-w-[80px]">In Stock</TableHead>
                  <TableHead className="text-center min-w-[80px] hidden sm:table-cell">Min Stock</TableHead>
                  <TableHead className="text-right min-w-[100px] hidden lg:table-cell">Cost Price</TableHead>
                  <TableHead className="text-right min-w-[100px] hidden lg:table-cell">Sell Price</TableHead>
                  <TableHead className="min-w-[120px] hidden xl:table-cell">Supplier</TableHead>
                  <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Package className="h-8 w-8 opacity-40" />
                        <p className="text-sm font-medium">
                          {searchQuery.trim() || categoryFilter !== 'all' || lowStockOnly
                            ? 'No parts match your filters.'
                            : 'No parts in inventory.'}
                        </p>
                        {!searchQuery.trim() && categoryFilter === 'all' && !lowStockOnly && (
                          <p className="text-xs">
                            Click &quot;Add Part&quot; to get started.
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParts.map((part) => {
                    const low = isLowStock(part);
                    return (
                      <TableRow key={part.id} className={low ? 'bg-destructive/5' : undefined}>
                        <TableCell className="font-mono text-sm font-medium">
                          {part.partNumber}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{part.name}</span>
                            {part.location && (
                              <span className="text-xs text-muted-foreground md:hidden">
                                {part.location}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="secondary" className="font-normal">
                            {part.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`inline-flex items-center justify-center tabular-nums font-semibold text-sm px-2 py-0.5 rounded ${
                              low
                                ? 'bg-destructive/15 text-destructive'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            }`}
                          >
                            {low && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {part.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-center tabular-nums hidden sm:table-cell">
                          {part.minStock}
                        </TableCell>
                        <TableCell className="text-right tabular-nums hidden lg:table-cell">
                          {formatCurrency(part.costPrice)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums hidden lg:table-cell">
                          {formatCurrency(part.sellPrice)}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-muted-foreground text-sm">
                          {part.supplier?.name || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canEdit('inventory') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(part)}
                              aria-label={`Edit ${part.name}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            )}
                            {canEdit('inventory') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(part)}
                              aria-label={`Delete ${part.name}`}
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
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alert Section */}
      {lowStockParts.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-semibold">Low Stock Alerts</h2>
            <Badge variant="destructive" className="tabular-nums">
              {lowStockParts.length}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            The following parts are at or below their minimum stock level and need to be reordered.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lowStockParts.map((part) => (
              <Card
                key={part.id}
                className="border-destructive/30 bg-destructive/5"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {part.partNumber}
                        </span>
                        <Badge variant="secondary" className="text-xs font-normal">
                          {part.category}
                        </Badge>
                      </div>
                      <p className="font-semibold text-sm truncate">{part.name}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          In Stock: <span className="font-bold text-destructive tabular-nums">{part.quantity}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Min: <span className="tabular-nums">{part.minStock}</span>
                        </span>
                      </div>
                      {part.supplier && (
                        <p className="text-xs text-muted-foreground">
                          Supplier: {part.supplier.name}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {canEdit('inventory') && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEditDialog(part)}
                        aria-label={`Reorder ${part.name}`}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Global low stock alert banner */}
      {lowStockParts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{lowStockParts.length} part{lowStockParts.length > 1 ? 's' : ''}</strong> are at or below minimum stock levels.
            Please review the alerts above and reorder as needed.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
