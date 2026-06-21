import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { JobStatus } from '@prisma/client'

export async function GET() {
  try {
    const jobCards = await db.jobCard.findMany({
      include: {
        customer: true,
        vehicle: true,
        technician: true,
        tasks: true,
        partsUsed: { include: { sparePart: true } },
        labourEntries: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(jobCards)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch job cards' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const count = await db.jobCard.count()
    const jobNumber = `JC-2024-${String(count + 1).padStart(3, '0')}`
    
    const jobCard = await db.jobCard.create({
      data: {
        jobNumber,
        customerId: body.customerId,
        vehicleId: body.vehicleId,
        technicianId: body.technicianId || null,
        description: body.description,
        priority: body.priority || 0,
        estimatedCost: body.estimatedCost ? parseFloat(body.estimatedCost) : null,
        status: body.status || JobStatus.PENDING,
        startedAt: body.status === JobStatus.IN_PROGRESS ? new Date() : null,
      },
      include: { customer: true, vehicle: true, technician: true },
    })
    return NextResponse.json(jobCard, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create job card' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    const updateData: any = {}
    
    if (data.status) updateData.status = data.status as JobStatus
    if (data.description !== undefined) updateData.description = data.description
    if (data.technicianId !== undefined) updateData.technicianId = data.technicianId || null
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.estimatedCost !== undefined) updateData.estimatedCost = data.estimatedCost ? parseFloat(data.estimatedCost) : null
    if (data.actualCost !== undefined) updateData.actualCost = data.actualCost ? parseFloat(data.actualCost) : null
    
    if (data.status === JobStatus.IN_PROGRESS) updateData.startedAt = new Date()
    if (data.status === JobStatus.COMPLETED) updateData.completedAt = new Date()
    if (data.status === JobStatus.APPROVED) updateData.approvedAt = new Date()
    
    const jobCard = await db.jobCard.update({
      where: { id },
      data: updateData,
      include: { customer: true, vehicle: true, technician: true, tasks: true },
    })
    return NextResponse.json(jobCard)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update job card' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.jobCard.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete job card' }, { status: 500 })
  }
}
