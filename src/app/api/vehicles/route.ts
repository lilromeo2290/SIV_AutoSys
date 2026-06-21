import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const vehicles = await db.vehicle.findMany({
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(vehicles)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const vehicle = await db.vehicle.create({
      data: {
        customerId: body.customerId,
        make: body.make,
        model: body.model,
        year: parseInt(body.year),
        color: body.color || null,
        plateNumber: body.plateNumber,
        vin: body.vin || null,
        mileage: body.mileage ? parseInt(body.mileage) : 0,
        notes: body.notes || null,
      },
    })
    return NextResponse.json(vehicle, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    const vehicle = await db.vehicle.update({
      where: { id },
      data: {
        make: data.make,
        model: data.model,
        year: data.year ? parseInt(data.year) : undefined,
        color: data.color || null,
        plateNumber: data.plateNumber,
        vin: data.vin || null,
        mileage: data.mileage ? parseInt(data.mileage) : undefined,
        notes: data.notes || null,
      },
    })
    return NextResponse.json(vehicle)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.vehicle.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 })
  }
}
