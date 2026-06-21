import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const reminders = await db.serviceReminder.findMany({
      include: { customer: true, vehicle: true },
      orderBy: { dueDate: 'asc' },
    })
    return NextResponse.json(reminders)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
  }
}
