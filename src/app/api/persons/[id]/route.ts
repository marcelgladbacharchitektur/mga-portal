import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const person = await prisma.person.findUnique({
      where: { id: params.id },
      include: {
        ContactGroup: true,
        EmailAddress: {
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'asc' }
          ]
        },
        PhoneNumber: {
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'asc' }
          ]
        },
        Address: {
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'asc' }
          ]
        }
      }
    })

    if (!person) {
      return NextResponse.json({ error: 'Person nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json(person)
  } catch (error: any) {
    console.error('Error fetching person:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Person' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const data = await request.json()
    const { firstName, lastName, title, position, department, contactGroupId, emails, phones, addresses } = data

    // Update person in a transaction
    const updatedPerson = await prisma.$transaction(async (tx) => {
      // Update basic person data
      const person = await tx.person.update({
        where: { id: params.id },
        data: {
          firstName,
          lastName,
          title: title || null,
          position: position || null,
          department: department || null,
          contactGroupId: contactGroupId || undefined,
          updatedAt: new Date()
        }
      })

      // Handle emails
      // Delete existing emails not in the new list
      const existingEmails = await tx.emailAddress.findMany({
        where: { personId: params.id }
      })
      
      const emailIdsToKeep = emails.filter((e: any) => e.id).map((e: any) => e.id)
      await tx.emailAddress.deleteMany({
        where: {
          personId: params.id,
          id: { notIn: emailIdsToKeep }
        }
      })

      // Update or create emails
      for (const email of emails) {
        if (email.id) {
          await tx.emailAddress.update({
            where: { id: email.id },
            data: {
              email: email.email,
              emailType: email.emailType,
              isPrimary: email.isPrimary
            }
          })
        } else {
          await tx.emailAddress.create({
            data: {
              id: crypto.randomUUID(),
              email: email.email,
              emailType: email.emailType,
              isPrimary: email.isPrimary,
              personId: params.id
            }
          })
        }
      }

      // Handle phones
      const phoneIdsToKeep = phones.filter((p: any) => p.id).map((p: any) => p.id)
      await tx.phoneNumber.deleteMany({
        where: {
          personId: params.id,
          id: { notIn: phoneIdsToKeep }
        }
      })

      for (const phone of phones) {
        if (phone.id) {
          await tx.phoneNumber.update({
            where: { id: phone.id },
            data: {
              number: phone.number,
              phoneType: phone.phoneType,
              isPrimary: phone.isPrimary
            }
          })
        } else {
          await tx.phoneNumber.create({
            data: {
              id: crypto.randomUUID(),
              number: phone.number,
              phoneType: phone.phoneType,
              isPrimary: phone.isPrimary,
              personId: params.id
            }
          })
        }
      }

      // Handle addresses
      const addressIdsToKeep = addresses.filter((a: any) => a.id).map((a: any) => a.id)
      await tx.address.deleteMany({
        where: {
          personId: params.id,
          id: { notIn: addressIdsToKeep }
        }
      })

      for (const address of addresses) {
        if (address.id) {
          await tx.address.update({
            where: { id: address.id },
            data: {
              street: address.street,
              streetNumber: address.streetNumber,
              postalCode: address.postalCode,
              city: address.city,
              country: address.country,
              addressType: address.addressType,
              isPrimary: address.isPrimary
            }
          })
        } else {
          await tx.address.create({
            data: {
              id: crypto.randomUUID(),
              street: address.street,
              streetNumber: address.streetNumber,
              postalCode: address.postalCode,
              city: address.city,
              country: address.country,
              addressType: address.addressType,
              isPrimary: address.isPrimary,
              personId: params.id
            }
          })
        }
      }

      return person
    })

    // Fetch the updated person with all relations
    const updatedPersonWithRelations = await prisma.person.findUnique({
      where: { id: params.id },
      include: {
        ContactGroup: true,
        EmailAddress: true,
        PhoneNumber: true,
        Address: true
      }
    })

    return NextResponse.json(updatedPersonWithRelations)
  } catch (error: any) {
    console.error('Error updating person:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Person' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // Delete person (cascades to related records)
    await prisma.person.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting person:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Person' },
      { status: 500 }
    )
  }
}