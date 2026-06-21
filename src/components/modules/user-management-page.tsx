'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  UserPlus,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Key,
} from 'lucide-react';
import { useAppStore, ROLE_LABELS, ROLE_COLORS, ROLE_ICONS, type UserRole, type ModulePage } from '@/store/app-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  assignedJobs?: { id: string; status: string }[];
}

// Module permissions for each role
const MODULE_ACCESS: Record<UserRole, string[]> = {
  ADMIN: ['Dashboard', 'Customers', 'Job Cards', 'Workshop', 'Inventory', 'Billing', 'Reminders', 'Reports', 'User Mgmt'],
  MANAGER: ['Dashboard', 'Customers', 'Job Cards', 'Workshop', 'Billing', 'Reminders', 'Reports'],
  SERVICE_ADVISOR: ['Dashboard', 'Customers', 'Job Cards', 'Workshop', 'Billing'],
  CASHIER: ['Dashboard', 'Customers', 'Billing'],
  STOREKEEPER: ['Dashboard', 'Inventory', 'Workshop'],
  TECHNICIAN: ['Dashboard', 'Workshop', 'Job Cards'],
};

const MODULE_CREATE: Record<UserRole, string[]> = {
  ADMIN: ['Customers', 'Job Cards', 'Inventory', 'Billing', 'Reminders', 'User Mgmt'],
  MANAGER: ['Customers', 'Job Cards', 'Billing', 'Reminders'],
  SERVICE_ADVISOR: ['Customers', 'Job Cards'],
  CASHIER: ['Billing'],
  STOREKEEPER: ['Inventory'],
  TECHNICIAN: [],
};

const MODULE_EDIT: Record<UserRole, string[]> = {
  ADMIN: ['Customers', 'Job Cards', 'Inventory', 'Billing', 'Reminders', 'User Mgmt'],
  MANAGER: ['Customers', 'Job Cards', 'Billing', 'Reminders'],
  SERVICE_ADVISOR: ['Customers', 'Job Cards'],
  CASHIER: ['Billing'],
  STOREKEEPER: ['Inventory'],
  TECHNICIAN: [],
};

const MODULE_APPROVE: Record<UserRole, string[]> = {
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
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  iconBg,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  iconBg: string;
  subtitle?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground truncate">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </Card>
  );
}

function PermissionPreview({ role }: { role: UserRole }) {
  return (
    <div className="space-y-4 mt-4">
      <div>
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-green-500" />
          Module Access
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {MODULE_ACCESS[role].map((mod) => (
            <Badge key={mod} variant="outline" className="text-xs font-medium">
              {mod}
            </Badge>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <UserPlus className="h-4 w-4 text-blue-500" />
          Can Create
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {MODULE_CREATE[role].length > 0 ? (
            MODULE_CREATE[role].map((mod) => (
              <Badge key={mod} className="text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-transparent">
                {mod}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No create permissions</span>
          )}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <Edit className="h-4 w-4 text-amber-500" />
          Can Edit
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {MODULE_EDIT[role].length > 0 ? (
            MODULE_EDIT[role].map((mod) => (
              <Badge key={mod} className="text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-transparent">
                {mod}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No edit permissions</span>
          )}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <Key className="h-4 w-4 text-purple-500" />
          Can Approve
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {MODULE_APPROVE[role].length > 0 ? (
            MODULE_APPROVE[role].map((mod) => (
              <Badge key={mod} className="text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-transparent">
                {mod}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No approve permissions</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function UserManagementPage() {
  const { currentUser, canCreate, canEdit } = useAppStore();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('table');

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [permViewOpen, setPermViewOpen] = useState(false);

  // Selected staff for edit/delete/permission view
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('TECHNICIAN');
  const [formActive, setFormActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch('/api/staff');
      if (!res.ok) throw new Error('Failed to fetch staff');
      const data = await res.json();
      setStaff(data);
    } catch (err) {
      toast.error('Failed to load staff data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Filtered staff
  const filteredStaff = staff.filter((s) => {
    const matchSearch =
      search === '' ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search);
    const matchRole = roleFilter === 'all' || s.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Stats
  const totalStaff = staff.length;
  const activeStaff = staff.filter((s) => s.active).length;
  const inactiveStaff = totalStaff - activeStaff;
  const roleDistribution: Record<string, number> = {};
  staff.forEach((s) => {
    roleDistribution[s.role] = (roleDistribution[s.role] || 0) + 1;
  });

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
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          role: formRole,
          active: formActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create staff member');
      }

      toast.success(`${formName.trim()} has been created successfully`);
      setCreateOpen(false);
      resetForm();
      fetchStaff();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create staff member');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Edit Handler ----
  const handleEdit = async () => {
    if (!selectedStaff) return;
    if (!formName.trim() || !formEmail.trim() || !formPhone.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/staff/${selectedStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          role: formRole,
          active: formActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update staff member');
      }

      toast.success(`${formName.trim()} has been updated successfully`);
      setEditOpen(false);
      setSelectedStaff(null);
      resetForm();
      fetchStaff();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update staff member');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Delete Handler ----
  const handleDelete = async () => {
    if (!selectedStaff) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/staff/${selectedStaff.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete staff member');
      }

      toast.success(`${selectedStaff.name} has been deleted`);
      setDeleteOpen(false);
      setSelectedStaff(null);
      fetchStaff();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete staff member');
    } finally {
      setDeleting(false);
    }
  };

  // ---- Toggle Active Handler ----
  const handleToggleActive = async (member: StaffMember) => {
    try {
      const res = await fetch(`/api/staff/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !member.active }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update status');
      }

      toast.success(
        `${member.name} has been ${!member.active ? 'activated' : 'deactivated'}`
      );
      fetchStaff();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  // ---- Helpers ----
  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('TECHNICIAN');
    setFormActive(true);
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

  const openPermView = (member: StaffMember) => {
    setSelectedStaff(member);
    setFormRole(member.role as UserRole);
    setPermViewOpen(true);
  };

  const roles: UserRole[] = ['ADMIN', 'MANAGER', 'SERVICE_ADVISOR', 'CASHIER', 'STOREKEEPER', 'TECHNICIAN'];

  // ---- Render ----
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent>
            <TableSkeleton />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" />
            User Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Create, manage, and assign roles & permissions to staff members
          </p>
        </div>
        {canCreate('user-management') && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Staff"
          value={totalStaff}
          icon={Users}
          iconBg="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        />
        <StatsCard
          title="Active Staff"
          value={activeStaff}
          icon={CheckCircle}
          iconBg="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        />
        <StatsCard
          title="Inactive Staff"
          value={inactiveStaff}
          icon={XCircle}
          iconBg="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        />
        <StatsCard
          title="Role Types"
          value={Object.keys(roleDistribution).length}
          icon={Shield}
          iconBg="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          subtitle={`of ${roles.length} available roles`}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="table">
            <Users className="h-4 w-4 mr-2" />
            Staff List
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="h-4 w-4 mr-2" />
            Role Overview
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Key className="h-4 w-4 mr-2" />
            Permission Matrix
          </TabsTrigger>
        </TabsList>

        {/* ===== Staff List Tab ===== */}
        <TabsContent value="table" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Staff Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden sm:table-cell">Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden lg:table-cell">Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Active Jobs</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        {search || roleFilter !== 'all'
                          ? 'No staff members match your filters'
                          : 'No staff members found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStaff.map((member) => {
                      const isSelf = currentUser?.id === member.id;
                      const activeJobCount =
                        member.assignedJobs?.filter((j) =>
                          ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'].includes(j.status)
                        ).length || 0;

                      return (
                        <TableRow key={member.id} className={!member.active ? 'opacity-60' : ''}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ring-2 ring-background ${
                                  member.active
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {getInitials(member.name)}
                              </div>
                              <div>
                                <p className="font-medium text-sm leading-none">
                                  {member.name}
                                  {isSelf && (
                                    <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
                                      You
                                    </Badge>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5 md:hidden truncate max-w-[180px]">
                                  {member.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            {member.email}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">
                            {member.phone}
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-xs font-medium ${ROLE_COLORS[member.role as UserRole]}`}>
                              <span className="mr-1">{ROLE_ICONS[member.role as UserRole]}</span>
                              {ROLE_LABELS[member.role as UserRole]}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center gap-1.5">
                              <div
                                className={`h-2 w-2 rounded-full ${
                                  member.active ? 'bg-green-500' : 'bg-gray-400'
                                }`}
                              />
                              <span className="text-sm text-muted-foreground">
                                {member.active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-center">
                            {activeJobCount > 0 ? (
                              <Badge variant="secondary" className="text-xs">
                                {activeJobCount}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {canEdit('user-management') && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openPermView(member)}>
                                    <Shield className="h-4 w-4 mr-2" />
                                    View Permissions
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEditDialog(member)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Role & Info
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleActive(member)}>
                                    {member.active ? (
                                      <>
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Activate
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  {!isSelf && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => openDeleteDialog(member)}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete User
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Role Overview Tab ===== */}
        <TabsContent value="roles" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => {
              const members = staff.filter((s) => s.role === role);
              const activeCount = members.filter((s) => s.active).length;
              return (
                <Card key={role} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${ROLE_COLORS[role]}`}
                      >
                        {ROLE_ICONS[role]}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{ROLE_LABELS[role]}</CardTitle>
                        <CardDescription className="text-xs">
                          {members.length} staff member{members.length !== 1 ? 's' : ''}
                        </CardDescription>
                      </div>
                      <Badge className={`text-xs ${ROLE_COLORS[role]}`}>
                        {activeCount} active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Staff avatars list */}
                    <div className="space-y-2">
                      {members.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No staff assigned to this role
                        </p>
                      ) : (
                        members.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold ${
                                m.active
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {getInitials(m.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{m.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                            </div>
                            <div
                              className={`h-2 w-2 rounded-full ${
                                m.active ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                              title={m.active ? 'Active' : 'Inactive'}
                            />
                          </div>
                        ))
                      )}
                    </div>

                    {/* Quick permission summary */}
                    <Separator className="my-3" />
                    <div className="flex flex-wrap gap-1">
                      {(MODULE_ACCESS[role] || []).map((mod) => (
                        <Badge
                          key={mod}
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 font-medium"
                        >
                          {mod}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ===== Permission Matrix Tab ===== */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Role-Permission Matrix
              </CardTitle>
              <CardDescription>
                Overview of all permissions assigned to each role across modules
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">Role</TableHead>
                      <TableHead className="min-w-[140px]">Staff</TableHead>
                      <TableHead className="text-center">Access</TableHead>
                      <TableHead className="text-center">Create</TableHead>
                      <TableHead className="text-center">Edit</TableHead>
                      <TableHead className="text-center">Approve</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role}>
                        <TableCell>
                          <Badge className={`text-xs font-medium ${ROLE_COLORS[role]}`}>
                            <span className="mr-1">{ROLE_ICONS[role]}</span>
                            {ROLE_LABELS[role]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {staff.filter((s) => s.role === role).length} member(s)
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-wrap gap-0.5 justify-center">
                            {MODULE_ACCESS[role].map((mod) => (
                              <Badge
                                key={mod}
                                variant="outline"
                                className="text-[10px] px-1 py-0"
                              >
                                {mod}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-wrap gap-0.5 justify-center">
                            {MODULE_CREATE[role].length > 0 ? (
                              MODULE_CREATE[role].map((mod) => (
                                <Badge
                                  key={mod}
                                  className="text-[10px] px-1 py-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-transparent"
                                >
                                  {mod}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-wrap gap-0.5 justify-center">
                            {MODULE_EDIT[role].length > 0 ? (
                              MODULE_EDIT[role].map((mod) => (
                                <Badge
                                  key={mod}
                                  className="text-[10px] px-1 py-0 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-transparent"
                                >
                                  {mod}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-wrap gap-0.5 justify-center">
                            {MODULE_APPROVE[role].length > 0 ? (
                              MODULE_APPROVE[role].map((mod) => (
                                <Badge
                                  key={mod}
                                  className="text-[10px] px-1 py-0 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-transparent"
                                >
                                  {mod}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ===== Create Staff Dialog ===== */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New Staff Member
            </DialogTitle>
            <DialogDescription>
              Create a new staff account and assign their role. Permissions are automatically assigned based on the selected role.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="create-name">Full Name *</Label>
              <Input
                id="create-name"
                placeholder="e.g. Jane Smith"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-email">Email *</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="e.g. jane@ops.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-phone">Phone *</Label>
              <Input
                id="create-phone"
                type="tel"
                placeholder="e.g. 555-0200"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-role">Role *</Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as UserRole)}>
                <SelectTrigger id="create-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>
                      <span className="flex items-center gap-2">
                        <span>{ROLE_ICONS[r]}</span>
                        {ROLE_LABELS[r]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formActive} onCheckedChange={setFormActive} id="create-active" />
              <Label htmlFor="create-active">Account is active upon creation</Label>
            </div>

            {/* Permission preview */}
            <Separator />
            <div>
              <h4 className="text-sm font-semibold mb-1 flex items-center gap-1.5 text-muted-foreground">
                <Shield className="h-4 w-4" />
                Permissions Preview for {ROLE_LABELS[formRole]}
              </h4>
              <PermissionPreview role={formRole} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Staff Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Edit Staff Dialog ===== */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Staff Member
            </DialogTitle>
            <DialogDescription>
              Update staff details and assign role. Changing the role will update their module permissions accordingly.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone *</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Role *</Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as UserRole)}>
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>
                      <span className="flex items-center gap-2">
                        <span>{ROLE_ICONS[r]}</span>
                        {ROLE_LABELS[r]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formActive} onCheckedChange={setFormActive} id="edit-active" />
              <Label htmlFor="edit-active">
                Account is {formActive ? 'active' : 'inactive'}
              </Label>
            </div>

            {/* Permission preview */}
            <Separator />
            <div>
              <h4 className="text-sm font-semibold mb-1 flex items-center gap-1.5 text-muted-foreground">
                <Shield className="h-4 w-4" />
                Permissions for {ROLE_LABELS[formRole]}
              </h4>
              <PermissionPreview role={formRole} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditOpen(false); setSelectedStaff(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== View Permissions Dialog ===== */}
      <Dialog open={permViewOpen} onOpenChange={setPermViewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              {selectedStaff?.name} - Permissions
            </DialogTitle>
            <DialogDescription>
              Current role: <Badge className={`text-xs ${ROLE_COLORS[formRole]}`}>{ROLE_LABELS[formRole]}</Badge>
            </DialogDescription>
          </DialogHeader>
          <PermissionPreview role={formRole} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPermViewOpen(false); setSelectedStaff(null); }}>
              Close
            </Button>
            {canEdit('user-management') && selectedStaff && (
              <Button
                onClick={() => {
                  setPermViewOpen(false);
                  openEditDialog(selectedStaff);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Permissions
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Delete Confirmation Dialog ===== */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Staff Member
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedStaff?.name}</strong>? This action cannot be
              undone. All their completed job assignments will be unassigned, and their labour entries will be
              removed.
              {selectedStaff?.assignedJobs?.filter((j) =>
                ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'].includes(j.status)
              ).length ? (
                <div className="mt-3 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <strong>Warning:</strong> This staff member has active job assignments. You must reassign or
                  complete those jobs before deletion.
                </div>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteOpen(false); setSelectedStaff(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting || (selectedStaff?.assignedJobs?.filter((j) =>
                ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'].includes(j.status)
              ).length ? true : false)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete Staff Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
