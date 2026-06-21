import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

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
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}
