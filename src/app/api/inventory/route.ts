import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const spareParts = await db.sparePart.findMany({
      include: { supplier: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(spareParts)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch spare parts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const part = await db.sparePart.create({
      data: {
        partNumber: body.partNumber,
        name: body.name,
        category: body.category,
        description: body.description || null,
        quantity: parseInt(body.quantity) || 0,
        minStock: parseInt(body.minStock) || 5,
        costPrice: parseFloat(body.costPrice),
        sellPrice: parseFloat(body.sellPrice),
        supplierId: body.supplierId || null,
        location: body.location || null,
      },
    })
    return NextResponse.json(part, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create spare part' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    const part = await db.sparePart.update({
      where: { id },
      data: {
        partNumber: data.partNumber,
        name: data.name,
        category: data.category,
        description: data.description || null,
        quantity: data.quantity !== undefined ? parseInt(data.quantity) : undefined,
        minStock: data.minStock !== undefined ? parseInt(data.minStock) : undefined,
        costPrice: data.costPrice ? parseFloat(data.costPrice) : undefined,
        sellPrice: data.sellPrice ? parseFloat(data.sellPrice) : undefined,
        supplierId: data.supplierId || null,
        location: data.location || null,
      },
    })
    return NextResponse.json(part)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update spare part' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.sparePart.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete spare part' }, { status: 500 })
  }
}
