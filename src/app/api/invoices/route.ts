import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { InvoiceStatus } from '@prisma/client'

export async function GET() {
  try {
    const invoices = await db.invoice.findMany({
      include: {
        customer: true,
        jobCard: true,
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(invoices)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const count = await db.invoice.count()
    const invoiceNumber = `INV-2024-${String(count + 1).padStart(3, '0')}`
    
    const items = body.items || []
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0)
    const tax = subtotal * 0.1
    const total = subtotal + tax - (body.discount || 0)
    
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        customerId: body.customerId,
        jobCardId: body.jobCardId || null,
        status: body.status || InvoiceStatus.DRAFT,
        subtotal,
        tax,
        discount: body.discount || 0,
        total,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: { customer: true, items: true },
    })
    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    const updateData: any = {}
    
    if (data.status !== undefined) updateData.status = data.status as InvoiceStatus
    if (data.discount !== undefined) updateData.discount = parseFloat(data.discount)
    if (data.notes !== undefined) updateData.notes = data.notes || null
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
    if (data.paidAmount !== undefined) updateData.paidAmount = parseFloat(data.paidAmount)
    if (data.status === InvoiceStatus.PAID) updateData.paidAt = new Date()
    
    const invoice = await db.invoice.update({
      where: { id },
      data: updateData,
      include: { customer: true, items: true, payments: true },
    })
    return NextResponse.json(invoice)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.invoice.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}
