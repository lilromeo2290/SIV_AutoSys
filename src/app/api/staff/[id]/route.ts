import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { Role } from '@prisma/client'

// GET - Single staff member
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const staff = await db.staff.findUnique({
      where: { id },
      include: {
        assignedJobs: {
          include: { vehicle: true, customer: true },
        },
        labourEntries: {
          include: { jobCard: true },
        },
      },
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    return NextResponse.json(staff)
  } catch (error) {
    console.error('Staff GET by ID error:', error)
    return NextResponse.json({ error: 'Failed to fetch staff member' }, { status: 500 })
  }
}

// PUT - Update staff member (role, permissions, active status)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, phone, role, active } = body

    // Check staff exists
    const existing = await db.staff.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Validate role if provided
    if (role) {
      const validRoles: string[] = ['ADMIN', 'MANAGER', 'SERVICE_ADVISOR', 'CASHIER', 'STOREKEEPER', 'TECHNICIAN']
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Check email uniqueness if email is being changed
    if (email && email !== existing.email) {
      const emailExists = await db.staff.findUnique({ where: { email } })
      if (emailExists) {
        return NextResponse.json({ error: 'A staff member with this email already exists' }, { status: 409 })
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (role !== undefined) updateData.role = role as Role
    if (active !== undefined) updateData.active = active

    const staff = await db.staff.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(staff)
  } catch (error) {
    console.error('Staff PUT error:', error)
    return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 })
  }
}

// DELETE - Delete staff member
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check staff exists
    const existing = await db.staff.findUnique({
      where: { id },
      include: {
        assignedJobs: true,
        labourEntries: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Check if staff has active job assignments
    const activeJobs = existing.assignedJobs.filter(
      (j) => ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'].includes(j.status)
    )
    if (activeJobs.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete staff member. They have ${activeJobs.length} active job assignment(s). Reassign or complete those jobs first.`,
        },
        { status: 409 }
      )
    }

    // Nullify technicianId on all assigned jobs
    await db.jobCard.updateMany({
      where: { technicianId: id },
      data: { technicianId: null },
    })

    // Delete labour entries (they belong to the staff)
    await db.labourEntry.deleteMany({
      where: { staffId: id },
    })

    // Delete the staff
    await db.staff.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Staff member deleted successfully' })
  } catch (error) {
    console.error('Staff DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete staff member' }, { status: 500 })
  }
}
