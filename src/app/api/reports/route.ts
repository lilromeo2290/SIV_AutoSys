import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Job cards status breakdown
    const jobsByStatus = await db.jobCard.groupBy({
      by: ['status'],
      _count: true,
    })

    // Technician productivity
    const technicians = await db.staff.findMany({
      where: { role: 'TECHNICIAN' },
      include: {
        assignedJobs: {
          include: { labourEntries: true, partsUsed: true },
        },
      },
    })

    const techProductivity = technicians.map(tech => {
      const jobs = tech.assignedJobs
      const completedJobs = jobs.filter(j => j.status === 'COMPLETED' || j.status === 'APPROVED' || j.status === 'INVOICED')
      const totalHours = jobs.reduce((sum, j) => sum + j.labourEntries.reduce((s, l) => s + l.hours, 0), 0)
      const totalRevenue = jobs.reduce((sum, j) => sum + (j.actualCost || 0), 0)
      
      return {
        name: tech.name,
        totalJobs: jobs.length,
        completedJobs: completedJobs.length,
        totalHours: Math.round(totalHours * 100) / 100,
        totalRevenue,
        avgRevenuePerJob: completedJobs.length > 0 ? Math.round((totalRevenue / completedJobs.length) * 100) / 100 : 0,
      }
    })

    // Parts usage report
    const partsUsed = await db.partsUsed.findMany({
      include: { sparePart: true, jobCard: true },
    })

    const partsUsageByCategory: Record<string, { count: number; totalCost: number }> = {}
    partsUsed.forEach(pu => {
      const cat = pu.sparePart.category
      if (!partsUsageByCategory[cat]) partsUsageByCategory[cat] = { count: 0, totalCost: 0 }
      partsUsageByCategory[cat].count += pu.quantity
      partsUsageByCategory[cat].totalCost += pu.quantity * pu.unitPrice
    })

    // Revenue by period
    const allInvoices = await db.invoice.findMany({
      include: { payments: true },
    })

    const revenueSummary = {
      totalRevenue: allInvoices.reduce((sum, inv) => sum + inv.total, 0),
      paidRevenue: allInvoices.filter(i => i.status === 'PAID').reduce((sum, inv) => sum + inv.total, 0),
      outstandingRevenue: allInvoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED').reduce((sum, inv) => sum + inv.total - inv.paidAmount, 0),
      overdueAmount: allInvoices.filter(i => i.status === 'OVERDUE').reduce((sum, inv) => sum + inv.total - inv.paidAmount, 0),
      totalPayments: allInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
    }

    // Cost analysis
    const allPartsUsed = await db.partsUsed.findMany()
    const allLabour = await db.labourEntry.findMany()

    const costSummary = {
      totalPartsCost: allPartsUsed.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0),
      totalLabourCost: allLabour.reduce((sum, l) => sum + l.hours * l.rate, 0),
      totalCost: allPartsUsed.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0) + allLabour.reduce((sum, l) => sum + l.hours * l.rate, 0),
    }

    return NextResponse.json({
      jobsByStatus,
      techProductivity,
      partsUsageByCategory,
      revenueSummary,
      costSummary,
    })
  } catch (error) {
    console.error('Reports error:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
