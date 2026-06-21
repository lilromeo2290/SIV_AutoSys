import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const jobCards = await db.jobCard.findMany({
      include: {
        customer: true,
        vehicle: true,
        technician: true,
        tasks: { orderBy: { createdAt: 'asc' } },
        partsUsed: { include: { sparePart: true } },
        labourEntries: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(jobCards)
  } catch (error) {
    console.error('Workshop API error:', error)
    return NextResponse.json({ error: 'Failed to fetch workshop data' }, { status: 500 })
  }
}
