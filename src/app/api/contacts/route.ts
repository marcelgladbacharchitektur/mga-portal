import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return Response.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // Parse Query-Parameter
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''

    // Baue Where-Klausel
    let whereClause: any = {}

    // Füge Such-Filter hinzu
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Füge Kategorie-Filter hinzu
    if (category) {
      whereClause.category = category
    }

    const contacts = await prisma.contact.findMany({
      where: whereClause,
      include: { contactGroup: true },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    })

    return Response.json(contacts)
  } catch (error: any) {
    console.error('Error fetching contacts:', error)
    return Response.json(
      { 
        error: 'Fehler beim Laden der Kontakte',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return Response.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const data = await request.json()
    const { firstName, lastName, title, position, company, department, notes, emails, phones, addresses } = data

    if (!firstName || !lastName) {
      return Response.json(
        { error: 'Vor- und Nachname sind erforderlich' },
        { status: 400 }
      )
    }

    // Erstelle den Kontakt mit den Grunddaten
    const contact = await prisma.contact.create({
      data: {
        id: randomUUID(),
        firstName,
        lastName,
        // Falls erweiterte Felder im Schema existieren:
        // title: title || null,
        // position: position || null,
        // department: department || null,
        company: company || null,
        notes: notes || null,
        email: emails && emails.length > 0 ? emails.find((e: any) => e.isPrimary)?.email || emails[0].email : null,
        phone: phones && phones.length > 0 ? phones.find((p: any) => p.isPrimary)?.number || phones[0].number : null,
        updatedAt: new Date()
      },
      include: { contactGroup: true }
    })

    // TODO: Wenn das Schema erweitert wird, hier E-Mails, Telefonnummern und Adressen als separate Einträge speichern

    return Response.json(contact)
  } catch (error) {
    console.error('Error creating contact:', error)
    return Response.json(
      { error: 'Fehler beim Erstellen des Kontakts' },
      { status: 500 }
    )
  }
}