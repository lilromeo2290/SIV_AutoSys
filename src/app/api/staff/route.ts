import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { Role } from '@prisma/client'

// GET - List all staff
export async function GET() {
  try {
    const staff = await db.staff.findMany({
      include: {
        assignedJobs: {
          where: { status: { in: ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'] } },
          include: { vehicle: true, customer: true },
        },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(staff)
  } catch (error) {
    console.error('Staff GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

// POST - Create new staff member
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, role, active } = body

    if (!name || !email || !phone || !role) {
      return NextResponse.json(
        { error: 'Name, email, phone, and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles: string[] = ['ADMIN', 'MANAGER', 'SERVICE_ADVISOR', 'CASHIER', 'STOREKEEPER', 'TECHNICIAN']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }, { status: 400 })
    }

    // Check for duplicate email
    const existing = await db.staff.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'A staff member with this email already exists' }, { status: 409 })
    }

    const staff = await db.staff.create({
      data: {
        name,
        email,
        phone,
        role: role as Role,
        active: active !== undefined ? active : true,
      },
    })

    return NextResponse.json(staff, { status: 201 })
  } catch (error) {
    console.error('Staff POST error:', error)
    return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 })
  }
}
