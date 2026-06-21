import { db } from '@/lib/db'
import { Role, JobStatus, POStatus, InvoiceStatus, ReminderStatus, ReminderChannel } from '@prisma/client'

async function seed() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await db.payment.deleteMany()
  await db.invoiceItem.deleteMany()
  await db.invoice.deleteMany()
  await db.partsUsed.deleteMany()
  await db.labourEntry.deleteMany()
  await db.jobTask.deleteMany()
  await db.jobCard.deleteMany()
  await db.serviceReminder.deleteMany()
  await db.purchaseOrderItem.deleteMany()
  await db.purchaseOrder.deleteMany()
  await db.sparePart.deleteMany()
  await db.supplier.deleteMany()
  await db.vehicle.deleteMany()
  await db.customer.deleteMany()
  await db.staff.deleteMany()

  // ---- Staff ----
  const staff = await db.staff.createMany({
    data: [
      { name: 'John Admin', email: 'john@ops.com', phone: '555-0100', role: Role.ADMIN },
      { name: 'Sarah Manager', email: 'sarah@ops.com', phone: '555-0101', role: Role.MANAGER },
      { name: 'Mike Advisor', email: 'mike@ops.com', phone: '555-0102', role: Role.SERVICE_ADVISOR },
      { name: 'Lisa Cashier', email: 'lisa@ops.com', phone: '555-0103', role: Role.CASHIER },
      { name: 'Tom Store', email: 'tom@ops.com', phone: '555-0104', role: Role.STOREKEEPER },
      { name: 'Dave Tech', email: 'dave@ops.com', phone: '555-0105', role: Role.TECHNICIAN },
      { name: 'Carlos Tech', email: 'carlos@ops.com', phone: '555-0106', role: Role.TECHNICIAN },
      { name: 'Emma Tech', email: 'emma@ops.com', phone: '555-0107', role: Role.TECHNICIAN },
    ]
  })
  const allStaff = await db.staff.findMany()

  // ---- Suppliers ----
  const suppliers = await db.supplier.createMany({
    data: [
      { name: 'AutoParts Co.', contact: 'James Lee', email: 'sales@autoparts.com', phone: '555-1001', address: '123 Industrial Blvd' },
      { name: 'QuickSpares Ltd', contact: 'Nancy Chen', email: 'orders@quickspares.com', phone: '555-1002', address: '456 Commerce Ave' },
      { name: 'Global Parts Inc', contact: 'Peter Wang', email: 'info@globalparts.com', phone: '555-1003', address: '789 Supply Rd' },
    ]
  })
  const allSuppliers = await db.supplier.findMany()

  // ---- Spare Parts ----
  const parts = await db.sparePart.createMany({
    data: [
      { partNumber: 'BRK-001', name: 'Front Brake Pad Set', category: 'Brakes', costPrice: 25.00, sellPrice: 45.00, quantity: 48, minStock: 10, supplierId: allSuppliers[0].id },
      { partNumber: 'OIL-001', name: 'Synthetic Engine Oil 5W-30', category: 'Oils', costPrice: 18.00, sellPrice: 32.00, quantity: 60, minStock: 15, supplierId: allSuppliers[0].id },
      { partNumber: 'FIL-001', name: 'Oil Filter Universal', category: 'Filters', costPrice: 5.00, sellPrice: 12.00, quantity: 100, minStock: 20, supplierId: allSuppliers[1].id },
      { partNumber: 'AIR-001', name: 'Air Filter Standard', category: 'Filters', costPrice: 8.00, sellPrice: 18.00, quantity: 35, minStock: 10, supplierId: allSuppliers[1].id },
      { partNumber: 'SPK-001', name: 'Spark Plug Set (4pc)', category: 'Ignition', costPrice: 15.00, sellPrice: 28.00, quantity: 25, minStock: 8, supplierId: allSuppliers[0].id },
      { partNumber: 'BEL-001', name: 'Serpentine Belt', category: 'Belts', costPrice: 12.00, sellPrice: 25.00, quantity: 3, minStock: 5, supplierId: allSuppliers[2].id },
      { partNumber: 'BRK-002', name: 'Rear Brake Pad Set', category: 'Brakes', costPrice: 22.00, sellPrice: 40.00, quantity: 30, minStock: 8, supplierId: allSuppliers[0].id },
      { partNumber: 'CLT-001', name: 'Engine Coolant 5L', category: 'Fluids', costPrice: 10.00, sellPrice: 20.00, quantity: 40, minStock: 10, supplierId: allSuppliers[1].id },
      { partNumber: 'BAT-001', name: 'Car Battery 12V 60Ah', category: 'Electrical', costPrice: 80.00, sellPrice: 140.00, quantity: 8, minStock: 3, supplierId: allSuppliers[2].id },
      { partNumber: 'TRD-001', name: 'All-Season Tire 205/55R16', category: 'Tires', costPrice: 60.00, sellPrice: 110.00, quantity: 20, minStock: 8, supplierId: allSuppliers[2].id },
      { partNumber: 'WPR-001', name: 'Wiper Blade Set', category: 'Accessories', costPrice: 10.00, sellPrice: 22.00, quantity: 2, minStock: 5, supplierId: allSuppliers[1].id },
      { partNumber: 'LGT-001', name: 'Headlight Bulb H7', category: 'Electrical', costPrice: 8.00, sellPrice: 18.00, quantity: 45, minStock: 10, supplierId: allSuppliers[0].id },
    ]
  })
  const allParts = await db.sparePart.findMany()

  // ---- Customers ----
  const customers = await db.customer.createMany({
    data: [
      { name: 'Robert Johnson', email: 'robert@email.com', phone: '555-2001', address: '12 Oak Street, Springfield' },
      { name: 'Maria Garcia', email: 'maria@email.com', phone: '555-2002', address: '34 Pine Avenue, Shelbyville' },
      { name: 'David Kim', email: 'david.kim@email.com', phone: '555-2003', address: '56 Elm Drive, Capital City' },
      { name: 'Susan O\'Brien', email: 'susan.obrien@email.com', phone: '555-2004', address: '78 Maple Court, Ogdenville' },
      { name: 'Ahmed Hassan', email: 'ahmed@email.com', phone: '555-2005', address: '90 Cedar Lane, North Haverbrook' },
      { name: 'Linda Chen', email: 'linda.chen@email.com', phone: '555-2006', address: '22 Birch Road, Brockway' },
      { name: 'James Wilson', email: 'jwilson@email.com', phone: '555-2007', address: '44 Walnut Way, Shelbyville' },
      { name: 'Priya Patel', email: 'priya@email.com', phone: '555-2008', address: '66 Spruce Circle, Springfield' },
    ]
  })
  const allCustomers = await db.customer.findMany()

  // ---- Vehicles ----
  const vehicles = await db.vehicle.createMany({
    data: [
      { customerId: allCustomers[0].id, make: 'Toyota', model: 'Camry', year: 2021, color: 'Silver', plateNumber: 'ABC-1234', vin: '1HGCM82633A004352', mileage: 35000 },
      { customerId: allCustomers[0].id, make: 'Honda', model: 'CR-V', year: 2022, color: 'Blue', plateNumber: 'ABC-5678', vin: '2HGES268X3H123456', mileage: 12000 },
      { customerId: allCustomers[1].id, make: 'Ford', model: 'F-150', year: 2020, color: 'Black', plateNumber: 'DEF-9012', vin: '1FTFW1ET5DF123456', mileage: 55000 },
      { customerId: allCustomers[2].id, make: 'BMW', model: 'X5', year: 2023, color: 'White', plateNumber: 'GHI-3456', vin: '5UXCR6C50P9123456', mileage: 8000 },
      { customerId: allCustomers[3].id, make: 'Mercedes', model: 'C-Class', year: 2021, color: 'Gray', plateNumber: 'JKL-7890', vin: 'W1KWF8DB3MR123456', mileage: 28000 },
      { customerId: allCustomers[4].id, make: 'Hyundai', model: 'Tucson', year: 2022, color: 'Red', plateNumber: 'MNO-1234', vin: 'KM8J3CA46NU123456', mileage: 18000 },
      { customerId: allCustomers[5].id, make: 'Audi', model: 'A4', year: 2020, color: 'Black', plateNumber: 'PQR-5678', vin: 'WAUENAF46JN123456', mileage: 42000 },
      { customerId: allCustomers[5].id, make: 'Volkswagen', model: 'Golf', year: 2023, color: 'Green', plateNumber: 'PQR-9012', vin: 'WVWZZZAUZJW123456', mileage: 5000 },
      { customerId: allCustomers[6].id, make: 'Nissan', model: 'Altima', year: 2021, color: 'White', plateNumber: 'STU-3456', vin: '1N4BL4CV9MN123456', mileage: 30000 },
      { customerId: allCustomers[7].id, make: 'Lexus', model: 'RX 350', year: 2023, color: 'Pearl White', plateNumber: 'VWX-7890', vin: '2T2AZMD1XNC123456', mileage: 6000 },
    ]
  })
  const allVehicles = await db.vehicle.findMany()

  // ---- Job Cards ----
  const techStaff = allStaff.filter(s => s.role === Role.TECHNICIAN)
  const jobCards = await db.jobCard.createMany({
    data: [
      { jobNumber: 'JC-2024-001', customerId: allCustomers[0].id, vehicleId: allVehicles[0].id, technicianId: techStaff[0].id, description: 'Full brake pad replacement - front and rear', status: JobStatus.COMPLETED, priority: 3, estimatedCost: 350.00, actualCost: 340.00, startedAt: new Date('2024-01-15'), completedAt: new Date('2024-01-15'), approvedAt: new Date('2024-01-16'), approvedBy: allStaff[0].id },
      { jobNumber: 'JC-2024-002', customerId: allCustomers[1].id, vehicleId: allVehicles[2].id, technicianId: techStaff[1].id, description: 'Engine oil change and filter replacement', status: JobStatus.INVOICED, priority: 1, estimatedCost: 80.00, actualCost: 75.00, startedAt: new Date('2024-01-16'), completedAt: new Date('2024-01-16') },
      { jobNumber: 'JC-2024-003', customerId: allCustomers[2].id, vehicleId: allVehicles[3].id, technicianId: techStaff[0].id, description: 'Annual service - comprehensive checkup', status: JobStatus.IN_PROGRESS, priority: 2, estimatedCost: 500.00, startedAt: new Date('2024-01-17') },
      { jobNumber: 'JC-2024-004', customerId: allCustomers[3].id, vehicleId: allVehicles[4].id, technicianId: techStaff[2].id, description: 'Transmission fluid flush and filter', status: JobStatus.WAITING_PARTS, priority: 2, estimatedCost: 280.00, startedAt: new Date('2024-01-18') },
      { jobNumber: 'JC-2024-005', customerId: allCustomers[4].id, vehicleId: allVehicles[5].id, technicianId: techStaff[1].id, description: 'Battery replacement and charging system check', status: JobStatus.PENDING, priority: 1, estimatedCost: 200.00 },
      { jobNumber: 'JC-2024-006', customerId: allCustomers[5].id, vehicleId: allVehicles[6].id, technicianId: techStaff[0].id, description: 'Suspension inspection and strut replacement', status: JobStatus.IN_PROGRESS, priority: 3, estimatedCost: 650.00, startedAt: new Date('2024-01-19') },
      { jobNumber: 'JC-2024-007', customerId: allCustomers[0].id, vehicleId: allVehicles[1].id, technicianId: techStaff[2].id, description: 'AC recharge and compressor check', status: JobStatus.PENDING, priority: 1, estimatedCost: 180.00 },
      { jobNumber: 'JC-2024-008', customerId: allCustomers[6].id, vehicleId: allVehicles[8].id, technicianId: techStaff[1].id, description: 'Tire rotation and wheel alignment', status: JobStatus.APPROVED, priority: 1, estimatedCost: 120.00, actualCost: 115.00, startedAt: new Date('2024-01-20'), completedAt: new Date('2024-01-20'), approvedAt: new Date('2024-01-20'), approvedBy: allStaff[1].id },
      { jobNumber: 'JC-2024-009', customerId: allCustomers[7].id, vehicleId: allVehicles[9].id, technicianId: techStaff[0].id, description: 'Headlight bulb replacement - both sides', status: JobStatus.COMPLETED, priority: 1, estimatedCost: 60.00, actualCost: 55.00, startedAt: new Date('2024-01-21'), completedAt: new Date('2024-01-21') },
      { jobNumber: 'JC-2024-010', customerId: allCustomers[3].id, vehicleId: allVehicles[4].id, technicianId: techStaff[2].id, description: 'Spark plug replacement and ignition check', status: JobStatus.CANCELLED, priority: 1, estimatedCost: 150.00 },
    ]
  })
  const allJobCards = await db.jobCard.findMany()

  // ---- Job Tasks ----
  const tasks = [
    { jobCardId: allJobCards[0].id, taskName: 'Remove front wheels', completed: true, laborHrs: 0.5 },
    { jobCardId: allJobCards[0].id, taskName: 'Replace front brake pads', completed: true, laborHrs: 1.0 },
    { jobCardId: allJobCards[0].id, taskName: 'Remove rear wheels', completed: true, laborHrs: 0.5 },
    { jobCardId: allJobCards[0].id, taskName: 'Replace rear brake pads', completed: true, laborHrs: 1.0 },
    { jobCardId: allJobCards[2].id, taskName: 'Drain engine oil', completed: true, laborHrs: 0.25 },
    { jobCardId: allJobCards[2].id, taskName: 'Replace oil filter', completed: true, laborHrs: 0.15 },
    { jobCardId: allJobCards[2].id, taskName: 'Fill with synthetic oil', completed: true, laborHrs: 0.25 },
    { jobCardId: allJobCards[2].id, taskName: 'Check air filter', completed: false, laborHrs: 0.1 },
    { jobCardId: allJobCards[2].id, taskName: 'Inspect brake fluid', completed: false, laborHrs: 0.1 },
    { jobCardId: allJobCards[2].id, taskName: 'Check coolant level', completed: false, laborHrs: 0.1 },
    { jobCardId: allJobCards[5].id, taskName: 'Inspect suspension components', completed: true, laborHrs: 1.0 },
    { jobCardId: allJobCards[5].id, taskName: 'Replace front struts', completed: false, laborHrs: 2.5 },
    { jobCardId: allJobCards[5].id, taskName: 'Wheel alignment check', completed: false, laborHrs: 0.5 },
    { jobCardId: allJobCards[8].id, taskName: 'Remove headlight assemblies', completed: true, laborHrs: 0.5 },
    { jobCardId: allJobCards[8].id, taskName: 'Replace H7 bulbs', completed: true, laborHrs: 0.25 },
    { jobCardId: allJobCards[8].id, taskName: 'Test headlight operation', completed: true, laborHrs: 0.25 },
  ]
  await db.jobTask.createMany({ data: tasks })

  // ---- Labour Entries ----
  const labourEntries = [
    { jobCardId: allJobCards[0].id, staffId: techStaff[0].id, hours: 3.0, rate: 45.00, date: new Date('2024-01-15') },
    { jobCardId: allJobCards[1].id, staffId: techStaff[1].id, hours: 0.5, rate: 45.00, date: new Date('2024-01-16') },
    { jobCardId: allJobCards[2].id, staffId: techStaff[0].id, hours: 1.5, rate: 45.00, date: new Date('2024-01-17') },
    { jobCardId: allJobCards[5].id, staffId: techStaff[0].id, hours: 2.0, rate: 45.00, date: new Date('2024-01-19') },
    { jobCardId: allJobCards[7].id, staffId: techStaff[1].id, hours: 1.0, rate: 45.00, date: new Date('2024-01-20') },
    { jobCardId: allJobCards[8].id, staffId: techStaff[0].id, hours: 1.0, rate: 45.00, date: new Date('2024-01-21') },
  ]
  await db.labourEntry.createMany({ data: labourEntries })

  // ---- Parts Used ----
  const partsUsed = [
    { jobCardId: allJobCards[0].id, sparePartId: allParts[0].id, quantity: 1, unitPrice: 45.00 },
    { jobCardId: allJobCards[0].id, sparePartId: allParts[6].id, quantity: 1, unitPrice: 40.00 },
    { jobCardId: allJobCards[1].id, sparePartId: allParts[1].id, quantity: 1, unitPrice: 32.00 },
    { jobCardId: allJobCards[1].id, sparePartId: allParts[2].id, quantity: 1, unitPrice: 12.00 },
    { jobCardId: allJobCards[2].id, sparePartId: allParts[1].id, quantity: 1, unitPrice: 32.00 },
    { jobCardId: allJobCards[5].id, sparePartId: allParts[5].id, quantity: 1, unitPrice: 25.00 },
    { jobCardId: allJobCards[8].id, sparePartId: allParts[11].id, quantity: 2, unitPrice: 18.00 },
  ]
  await db.partsUsed.createMany({ data: partsUsed })

  // ---- Invoices ----
  const invoices = await db.invoice.createMany({
    data: [
      { invoiceNumber: 'INV-2024-001', customerId: allCustomers[0].id, jobCardId: allJobCards[0].id, status: InvoiceStatus.PAID, subtotal: 310.00, tax: 30.10, discount: 0, total: 340.10, paidAmount: 340.10, dueDate: new Date('2024-02-15'), paidAt: new Date('2024-01-20') },
      { invoiceNumber: 'INV-2024-002', customerId: allCustomers[1].id, jobCardId: allJobCards[1].id, status: InvoiceStatus.PAID, subtotal: 75.00, tax: 7.50, discount: 0, total: 82.50, paidAmount: 82.50, dueDate: new Date('2024-02-16'), paidAt: new Date('2024-01-22') },
      { invoiceNumber: 'INV-2024-003', customerId: allCustomers[6].id, jobCardId: allJobCards[7].id, status: InvoiceStatus.PAID, subtotal: 115.00, tax: 11.50, discount: 0, total: 126.50, paidAmount: 126.50, dueDate: new Date('2024-02-20'), paidAt: new Date('2024-01-25') },
      { invoiceNumber: 'INV-2024-004', customerId: allCustomers[7].id, jobCardId: allJobCards[8].id, status: InvoiceStatus.SENT, subtotal: 55.00, tax: 5.50, discount: 0, total: 60.50, paidAmount: 0, dueDate: new Date('2024-02-21') },
      { invoiceNumber: 'INV-2024-005', customerId: allCustomers[2].id, status: InvoiceStatus.DRAFT, subtotal: 500.00, tax: 50.00, discount: 25.00, total: 525.00, paidAmount: 0, dueDate: new Date('2024-02-28') },
      { invoiceNumber: 'INV-2024-006', customerId: allCustomers[5].id, status: InvoiceStatus.OVERDUE, subtotal: 650.00, tax: 65.00, discount: 0, total: 715.00, paidAmount: 200.00, dueDate: new Date('2024-01-10') },
    ]
  })
  const allInvoices = await db.invoice.findMany()

  // ---- Invoice Items ----
  const invoiceItems = [
    { invoiceId: allInvoices[0].id, description: 'Front Brake Pad Replacement', quantity: 1, unitPrice: 130.00, total: 130.00 },
    { invoiceId: allInvoices[0].id, description: 'Rear Brake Pad Replacement', quantity: 1, unitPrice: 110.00, total: 110.00 },
    { invoiceId: allInvoices[0].id, description: 'Labour (3 hours)', quantity: 1, unitPrice: 45.00, total: 135.00 },
    { invoiceId: allInvoices[0].id, description: 'Brake Fluid Top-Up', quantity: 1, unitPrice: 35.00, total: 35.00 },
    { invoiceId: allInvoices[1].id, description: 'Synthetic Engine Oil 5W-30', quantity: 1, unitPrice: 32.00, total: 32.00 },
    { invoiceId: allInvoices[1].id, description: 'Oil Filter', quantity: 1, unitPrice: 12.00, total: 12.00 },
    { invoiceId: allInvoices[1].id, description: 'Labour (0.5 hours)', quantity: 1, unitPrice: 45.00, total: 22.50 },
    { invoiceId: allInvoices[3].id, description: 'H7 Headlight Bulbs (x2)', quantity: 2, unitPrice: 18.00, total: 36.00 },
    { invoiceId: allInvoices[3].id, description: 'Labour (1 hour)', quantity: 1, unitPrice: 45.00, total: 45.00 },
  ]
  await db.invoiceItem.createMany({ data: invoiceItems })

  // ---- Payments ----
  const payments = [
    { invoiceId: allInvoices[0].id, amount: 340.10, method: 'Credit Card', reference: 'CC-12345' },
    { invoiceId: allInvoices[1].id, amount: 82.50, method: 'Cash', reference: 'CASH-001' },
    { invoiceId: allInvoices[2].id, amount: 126.50, method: 'Bank Transfer', reference: 'BT-23456' },
    { invoiceId: allInvoices[5].id, amount: 200.00, method: 'Cash', reference: 'CASH-002' },
  ]
  await db.payment.createMany({ data: payments })

  // ---- Purchase Orders ----
  const pos = await db.purchaseOrder.createMany({
    data: [
      { poNumber: 'PO-2024-001', supplierId: allSuppliers[0].id, status: POStatus.RECEIVED, totalAmount: 850.00, orderedAt: new Date('2024-01-10'), receivedAt: new Date('2024-01-13') },
      { poNumber: 'PO-2024-002', supplierId: allSuppliers[1].id, status: POStatus.SENT, totalAmount: 420.00, orderedAt: new Date('2024-01-18') },
      { poNumber: 'PO-2024-003', supplierId: allSuppliers[2].id, status: POStatus.DRAFT, totalAmount: 1200.00 },
    ]
  })
  const allPOs = await db.purchaseOrder.findMany()

  // ---- Purchase Order Items ----
  const poItems = [
    { purchaseOrderId: allPOs[0].id, sparePartId: allParts[0].id, quantity: 10, unitCost: 25.00, total: 250.00 },
    { purchaseOrderId: allPOs[0].id, sparePartId: allParts[6].id, quantity: 10, unitCost: 22.00, total: 220.00 },
    { purchaseOrderId: allPOs[0].id, sparePartId: allParts[4].id, quantity: 15, unitCost: 15.00, total: 225.00 },
    { purchaseOrderId: allPOs[0].id, sparePartId: allParts[11].id, quantity: 8, unitCost: 8.00, total: 64.00 },
    { purchaseOrderId: allPOs[1].id, sparePartId: allParts[2].id, quantity: 20, unitCost: 5.00, total: 100.00 },
    { purchaseOrderId: allPOs[1].id, sparePartId: allParts[3].id, quantity: 10, unitCost: 8.00, total: 80.00 },
    { purchaseOrderId: allPOs[1].id, sparePartId: allParts[7].id, quantity: 10, unitCost: 10.00, total: 100.00 },
    { purchaseOrderId: allPOs[1].id, sparePartId: allParts[10].id, quantity: 10, unitCost: 10.00, total: 100.00 },
    { purchaseOrderId: allPOs[2].id, sparePartId: allParts[8].id, quantity: 5, unitCost: 80.00, total: 400.00 },
    { purchaseOrderId: allPOs[2].id, sparePartId: allParts[9].id, quantity: 8, unitCost: 60.00, total: 480.00 },
  ]
  await db.purchaseOrderItem.createMany({ data: poItems })

  // ---- Service Reminders ----
  const reminders = await db.serviceReminder.createMany({
    data: [
      { customerId: allCustomers[0].id, vehicleId: allVehicles[0].id, type: 'Oil Change', description: 'Next oil change due at 40,000 miles', dueDate: new Date('2024-03-15'), status: ReminderStatus.PENDING, channel: ReminderChannel.SMS },
      { customerId: allCustomers[2].id, vehicleId: allVehicles[3].id, type: 'Annual Service', description: 'Annual comprehensive service', dueDate: new Date('2024-06-01'), status: ReminderStatus.PENDING, channel: ReminderChannel.WHATSAPP },
      { customerId: allCustomers[5].id, vehicleId: allVehicles[6].id, type: 'Brake Inspection', description: 'Brake pads check after 50,000 miles', dueDate: new Date('2024-04-20'), status: ReminderStatus.SENT, sentAt: new Date('2024-01-20'), channel: ReminderChannel.EMAIL },
      { customerId: allCustomers[7].id, vehicleId: allVehicles[9].id, type: 'Tire Rotation', description: 'Tire rotation due every 10,000 miles', dueDate: new Date('2024-02-15'), status: ReminderStatus.COMPLETED, sentAt: new Date('2024-01-10'), channel: ReminderChannel.SMS },
      { customerId: allCustomers[3].id, vehicleId: allVehicles[4].id, type: 'Timing Belt', description: 'Timing belt replacement at 60,000 miles', dueDate: new Date('2024-08-10'), status: ReminderStatus.PENDING, channel: ReminderChannel.WHATSAPP },
    ]
  })

  console.log('✅ Seeding complete!')
  console.log(`  Staff: 8`)
  console.log(`  Customers: 8`)
  console.log(`  Vehicles: 10`)
  console.log(`  Job Cards: 10`)
  console.log(`  Spare Parts: 12`)
  console.log(`  Suppliers: 3`)
  console.log(`  Invoices: 6`)
  console.log(`  Service Reminders: 5`)
  console.log(`  Purchase Orders: 3`)
}

seed()
  .catch(console.error)
  .finally(() => db.$disconnect())
