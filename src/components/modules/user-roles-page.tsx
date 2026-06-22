'use client';

import { useEffect, useState } from 'react';
import {
  Shield,
  UserCheck,
  UserPlus,
  Edit,
  Trash2,
  XCircle,
  CheckCircle,
  Search,
  Key,
  ShieldCheck,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { useAppStore, ROLE_LABELS, ROLE_COLORS, ROLE_ICONS, type UserRole } from '@/store/app-store';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  assignedJobs?: { id: string; status: string }[];
}

// Permission maps for display
const MODULE_ACCESS: Record<string, string[]> = {
  ADMIN: ['Dashboard', 'Customers', 'Job Cards', 'Workshop', 'Inventory', 'Billing', 'Reminders', 'Reports'],
  MANAGER: ['Dashboard', 'Customers', 'Job Cards', 'Workshop', 'Billing', 'Reminders', 'Reports'],
  SERVICE_ADVISOR: ['Dashboard', 'Customers', 'Job Cards', 'Workshop', 'Billing'],
  CASHIER: ['Dashboard', 'Customers', 'Billing'],
  STOREKEEPER: ['Dashboard', 'Inventory', 'Workshop'],
  TECHNICIAN: ['Dashboard', 'Workshop', 'Job Cards'],
};

const MODULE_CREATE: Record<string, string[]> = {
  ADMIN: ['Customers', 'Job Cards', 'Inventory', 'Billing', 'Reminders'],
  MANAGER: ['Customers', 'Job Cards', 'Billing', 'Reminders'],
  SERVICE_ADVISOR: ['Customers', 'Job Cards'],
  CASHIER: ['Billing'],
  STOREKEEPER: ['Inventory'],
  TECHNICIAN: [],
};

const MODULE_EDIT: Record<string, string[]> = {
  ADMIN: ['Customers', 'Job Cards', 'Inventory', 'Billing', 'Reminders'],
  MANAGER: ['Customers', 'Job Cards', 'Billing', 'Reminders'],
  SERVICE_ADVISOR: ['Customers', 'Job Cards'],
  CASHIER: ['Billing'],
  STOREKEEPER: ['Inventory'],
  TECHNICIAN: [],
};

const MODULE_APPROVE: Record<string, string[]> = {
  ADMIN: ['Job Cards', 'Billing'],
  MANAGER: ['Job Cards', 'Billing'],
  SERVICE_ADVISOR: [],
  CASHIER: [],
  STOREKEEPER: [],
  TECHNICIAN: [],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

// ---------------------------------------------------------------------------
// Permission Preview (used in dialogs)
// ---------------------------------------------------------------------------

function PermissionPreview({ role }: { role: UserRole }) {
  return (
    <div className="space-y-3 mt-3">
      <div>
        <h4 className="text-xs font-semibold mb-1.5 flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-green-500" /> Module Access</h4>
        <div className="flex flex-wrap gap-1">{(MODULE_ACCESS[role] || []).map((mod) => <Badge key={mod} variant="outline" className="text-[10px] px-1.5 py-0">{mod}</Badge>)}</div>
      </div>
      <div>
        <h4 className="text-xs font-semibold mb-1.5 flex items-center gap-1.5"><UserPlus className="h-3.5 w-3.5 text-blue-500" /> Can Create</h4>
        <div className="flex flex-wrap gap-1">
          {MODULE_CREATE[role]?.length > 0 ? MODULE_CREATE[role].map((mod) => <Badge key={mod} className="text-[10px] px-1.5 py-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-transparent">{mod}</Badge>) : <span className="text-xs text-muted-foreground">None</span>}
        </div>
      </div>
      <div>
        <h4 className="text-xs font-semibold mb-1.5 flex items-center gap-1.5"><Edit className="h-3.5 w-3.5 text-amber-500" /> Can Edit</h4>
        <div className="flex flex-wrap gap-1">
          {MODULE_EDIT[role]?.length > 0 ? MODULE_EDIT[role].map((mod) => <Badge key={mod} className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-transparent">{mod}</Badge>) : <span className="text-xs text-muted-foreground">None</span>}
        </div>
      </div>
      <div>
        <h4 className="text-xs font-semibold mb-1.5 flex items-center gap-1.5"><Key className="h-3.5 w-3.5 text-purple-500" /> Can Approve</h4>
        <div className="flex flex-wrap gap-1">
          {MODULE_APPROVE[role]?.length > 0 ? MODULE_APPROVE[role].map((mod) => <Badge key={mod} className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-transparent">{mod}</Badge>) : <span className="text-xs text-muted-foreground">None</span>}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main User Roles & Staff Page
// ---------------------------------------------------------------------------

const ALL_ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'SERVICE_ADVISOR', 'CASHIER', 'STOREKEEPER', 'TECHNICIAN'];

export function UserRolesPage() {
  const currentUser = useAppStore((s) => s.currentUser);
  const isAdmin = currentUser?.role === 'ADMIN';

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Selected staff
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('TECHNICIAN');
  const [formActive, setFormActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch staff
  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/staff');
      if (res.ok) {
        const staffJson: StaffMember[] = await res.json();
        setStaff(staffJson);
      }
    } catch { /* silently fail for refresh */ }
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/staff');
        if (!res.ok) throw new Error(`Failed to fetch staff (${res.status})`);
        const staffJson: StaffMember[] = await res.json();
        if (!cancelled) { setStaff(staffJson); setLoading(false); }
      } catch (err) {
        if (!cancelled) { setError(err instanceof Error ? err.message : 'An error occurred'); setLoading(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Filtered staff
  const filteredStaff = staff.filter((s) => {
    const matchSearch = search === '' || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search);
    const matchRole = roleFilter === 'all' || s.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Staff by role for role cards
  const staffByRole = ALL_ROLES.map((role) => {
    const members = staff.filter((s) => s.role === role);
    const activeCount = members.filter((s) => s.active).length;
    return { role, members, activeCount };
  });

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('TECHNICIAN');
    setFormActive(true);
  };

  // ---- Create Handler ----
  const handleCreate = async () => {
    if (!formName.trim() || !formEmail.trim() || !formPhone.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), email: formEmail.trim(), phone: formPhone.trim(), role: formRole, active: formActive }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      toast.success(`${formName.trim()} created successfully`);
      setCreateOpen(false);
      resetForm();
      fetchStaff();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create');
    } finally { setSubmitting(false); }
  };

  // ---- Edit Handler ----
  const handleEdit = async () => {
    if (!selectedStaff || !formName.trim() || !formEmail.trim() || !formPhone.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/staff/${selectedStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), email: formEmail.trim(), phone: formPhone.trim(), role: formRole, active: formActive }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      toast.success(`${formName.trim()} updated successfully`);
      setEditOpen(false);
      setSelectedStaff(null);
      resetForm();
      fetchStaff();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally { setSubmitting(false); }
  };

  // ---- Delete Handler ----
  const handleDelete = async () => {
    if (!selectedStaff) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/staff/${selectedStaff.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      toast.success(`${selectedStaff.name} deleted`);
      setDeleteOpen(false);
      setSelectedStaff(null);
      fetchStaff();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    } finally { setDeleting(false); }
  };

  // ---- Toggle Active Handler ----
  const handleToggleActive = async (member: StaffMember) => {
    try {
      const res = await fetch(`/api/staff/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !member.active }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      toast.success(`${member.name} ${!member.active ? 'activated' : 'deactivated'}`);
      fetchStaff();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const openEditDialog = (member: StaffMember) => {
    setSelectedStaff(member);
    setFormName(member.name);
    setFormEmail(member.email);
    setFormPhone(member.phone);
    setFormRole(member.role as UserRole);
    setFormActive(member.active);
    setEditOpen(true);
  };

  const openDeleteDialog = (member: StaffMember) => {
    setSelectedStaff(member);
    setDeleteOpen(true);
  };

  const hasActiveJobs = (member: StaffMember) =>
    (member.assignedJobs || []).some((j) => ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'].includes(j.status));

  if (error) {
    return <div className="flex items-center justify-center h-64 text-destructive"><p>{error}</p></div>;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              User Roles &amp; Staff
            </CardTitle>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button size="sm" className="text-xs h-8" onClick={() => { resetForm(); setCreateOpen(true); }}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Staff
                </Button>
              )}
            </div>
          </div>
          <CardDescription className="mt-1">
            {staff.length} staff member{staff.length !== 1 ? 's' : ''} across {ALL_ROLES.length} roles
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Role Cards Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {staffByRole.map(({ role, members, activeCount }) => {
              const isCurrentRole = currentUser?.role === role;
              return (
                <div
                  key={role}
                  className={`rounded-lg border p-3 transition-all text-center cursor-default ${
                    isCurrentRole ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <span className="text-2xl">{ROLE_ICONS[role]}</span>
                  <h4 className="font-semibold text-xs mt-1.5 leading-none">{ROLE_LABELS[role]}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {activeCount}/{members.length} active
                  </p>
                  {isCurrentRole && (
                    <Badge className="text-[9px] px-1 py-0 mt-1">
                      <UserCheck className="h-2.5 w-2.5 mr-0.5" /> You
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>

          {/* Staff Table (Admin sees full table; others see compact list) */}
          {isAdmin ? (
            <>
              {/* Search and filter row */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by name, email, or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-40 h-9">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {ALL_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="h-20 text-center text-muted-foreground">No staff members found</TableCell></TableRow>
                  ) : filteredStaff.map((member) => {
                    const isSelf = currentUser?.id === member.id;
                    return (
                      <TableRow key={member.id} className={!member.active ? 'opacity-60' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold ring-2 ring-background ${member.active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                              {getInitials(member.name)}
                            </div>
                            <div>
                              <p className="font-medium text-sm leading-none">
                                {member.name}
                                {isSelf && <Badge variant="secondary" className="ml-1.5 text-[9px] px-1 py-0">You</Badge>}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 md:hidden truncate max-w-[160px]">{member.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{member.email}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] font-medium ${ROLE_COLORS[member.role as UserRole]}`}>
                            <span className="mr-0.5">{ROLE_ICONS[member.role as UserRole]}</span>
                            {ROLE_LABELS[member.role as UserRole]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            <div className={`h-2 w-2 rounded-full ${member.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <span className="text-xs text-muted-foreground">{member.active ? 'Active' : 'Inactive'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(member)}>
                                <Edit className="h-4 w-4 mr-2" />Edit Role &amp; Info
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(member)}>
                                {member.active ? <><XCircle className="h-4 w-4 mr-2" />Deactivate</> : <><CheckCircle className="h-4 w-4 mr-2" />Activate</>}
                              </DropdownMenuItem>
                              {!isSelf && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDeleteDialog(member)}>
                                    <Trash2 className="h-4 w-4 mr-2" />Delete User
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          ) : (
            /* Non-admin: compact staff list */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {staffByRole.map(({ role, members }) => (
                <div key={role} className="rounded-lg border p-3 bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{ROLE_ICONS[role]}</span>
                    <h4 className="font-semibold text-xs">{ROLE_LABELS[role]}</h4>
                    <Badge variant="outline" className="text-[9px] ml-auto">{members.length}</Badge>
                  </div>
                  <div className="space-y-1.5">
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 text-xs">
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-semibold ${m.active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {getInitials(m.name)}
                        </div>
                        <span className="truncate">{m.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== Create Staff Dialog ===== */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" />Add New Staff Member</DialogTitle>
            <DialogDescription>Create a new staff account and assign their role. Permissions are assigned automatically.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3.5 py-1">
            <div className="grid gap-1.5">
              <Label htmlFor="c-name">Full Name *</Label>
              <Input id="c-name" placeholder="e.g. Jane Smith" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-email">Email *</Label>
              <Input id="c-email" type="email" placeholder="e.g. jane@ops.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-phone">Phone *</Label>
              <Input id="c-phone" type="tel" placeholder="e.g. 555-0200" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-role">Role *</Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as UserRole)}>
                <SelectTrigger id="c-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}><span className="flex items-center gap-1.5"><span>{ROLE_ICONS[r]}</span>{ROLE_LABELS[r]}</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2.5">
              <Switch checked={formActive} onCheckedChange={setFormActive} id="c-active" />
              <Label htmlFor="c-active" className="text-sm">Active upon creation</Label>
            </div>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Permissions for {ROLE_LABELS[formRole]}</p>
              <PermissionPreview role={formRole} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting}>{submitting ? 'Creating...' : 'Create Staff Member'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Edit Staff Dialog ===== */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit className="h-5 w-5" />Edit Staff Member</DialogTitle>
            <DialogDescription>Update details and role. Changing role updates module permissions.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3.5 py-1">
            <div className="grid gap-1.5">
              <Label htmlFor="e-name">Full Name *</Label>
              <Input id="e-name" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="e-email">Email *</Label>
              <Input id="e-email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="e-phone">Phone *</Label>
              <Input id="e-phone" type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="e-role">Role *</Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as UserRole)}>
                <SelectTrigger id="e-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r} value={r}><span className="flex items-center gap-1.5"><span>{ROLE_ICONS[r]}</span>{ROLE_LABELS[r]}</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2.5">
              <Switch checked={formActive} onCheckedChange={setFormActive} id="e-active" />
              <Label htmlFor="e-active" className="text-sm">{formActive ? 'Active' : 'Inactive'}</Label>
            </div>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Permissions for {ROLE_LABELS[formRole]}</p>
              <PermissionPreview role={formRole} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditOpen(false); setSelectedStaff(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleEdit} disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Delete Confirmation ===== */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Delete Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedStaff?.name}</strong>? This action cannot be undone.
              {selectedStaff && hasActiveJobs(selectedStaff) && (
                <div className="mt-3 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <strong>Warning:</strong> This staff member has active job assignments. Reassign or complete those jobs first.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteOpen(false); setSelectedStaff(null); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting || (selectedStaff ? hasActiveJobs(selectedStaff) : false)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete Staff Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
