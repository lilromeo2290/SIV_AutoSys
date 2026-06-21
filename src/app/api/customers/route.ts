import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const customers = await db.customer.findMany({
      include: { vehicles: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(customers)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const customer = await db.customer.create({
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone,
        address: body.address || null,
        notes: body.notes || null,
      },
    })
    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    const customer = await db.customer.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone,
        address: data.address || null,
        notes: data.notes || null,
      },
    })
    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.customer.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}
