import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Dashboard stats
    const [
      totalCustomers,
      totalJobCards,
      totalInvoices,
      totalParts,
      activeJobs,
      pendingJobs,
      completedJobs,
      totalRevenue,
      overdueInvoices,
      lowStockParts,
    ] = await Promise.all([
      db.customer.count(),
      db.jobCard.count(),
      db.invoice.count(),
      db.sparePart.count(),
      db.jobCard.count({ where: { status: { in: ['IN_PROGRESS', 'WAITING_PARTS'] } } }),
      db.jobCard.count({ where: { status: 'PENDING' } }),
      db.jobCard.count({ where: { status: 'COMPLETED' } }),
      db.invoice.aggregate({ _sum: { total: true } }),
      db.invoice.count({ where: { status: 'OVERDUE' } }),
      db.sparePart.findMany({ where: { quantity: { lte: 5 } }, include: { supplier: true } }),
    ])

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const paidInvoices = await db.invoice.findMany({
      where: { 
        status: 'PAID',
        paidAt: { gte: sixMonthsAgo },
      },
      select: { paidAt: true, total: true, paidAmount: true },
    })

    // Technician performance
    const technicians = await db.staff.findMany({
      where: { role: 'TECHNICIAN' },
      include: {
        assignedJobs: true,
      },
    })

    const technicianStats = technicians.map(tech => ({
      id: tech.id,
      name: tech.name,
      totalJobs: tech.assignedJobs.length,
      completedJobs: tech.assignedJobs.filter(j => j.status === 'COMPLETED' || j.status === 'APPROVED' || j.status === 'INVOICED').length,
      activeJobs: tech.assignedJobs.filter(j => j.status === 'IN_PROGRESS' || j.status === 'WAITING_PARTS').length,
    }))

    // Parts usage by category
    const partsByCategory = await db.sparePart.groupBy({
      by: ['category'],
      _sum: { quantity: true, costPrice: true },
    })

    // Recent job cards
    const recentJobs = await db.jobCard.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true, vehicle: true, technician: true },
    })

    return NextResponse.json({
      stats: {
        totalCustomers,
        totalJobCards,
        totalInvoices,
        totalParts,
        activeJobs,
        pendingJobs,
        completedJobs,
        totalRevenue: totalRevenue._sum.total || 0,
        overdueInvoices,
      },
      lowStockParts,
      paidInvoices,
      technicianStats,
      partsByCategory,
      recentJobs,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
