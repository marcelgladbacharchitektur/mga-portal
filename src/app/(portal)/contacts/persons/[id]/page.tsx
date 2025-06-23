import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, MapPin, Building2, User, Briefcase, Edit } from 'lucide-react'

async function getPerson(id: string) {
  const person = await prisma.person.findUnique({
    where: { id },
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
    notFound()
  }

  return person
}

export default async function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await getPerson(id)

  const primaryEmail = person.EmailAddress.find(e => e.isPrimary) || person.EmailAddress[0]
  const primaryPhone = person.PhoneNumber.find(p => p.isPrimary) || person.PhoneNumber[0]
  const primaryAddress = person.Address.find(a => a.isPrimary) || person.Address[0]

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/contacts"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold">
            {person.title && `${person.title} `}
            {person.firstName} {person.lastName}
          </h1>
        </div>
        <Link
          href={`/contacts/persons/${person.id}/edit`}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Edit className="h-4 w-4" />
          <span>Bearbeiten</span>
        </Link>
      </div>

      {/* Main Content Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <User className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">
                {person.title && `${person.title} `}
                {person.firstName} {person.lastName}
              </h2>
              {person.position && (
                <p className="text-blue-100 flex items-center mt-1">
                  <Briefcase className="h-4 w-4 mr-2" />
                  {person.position}
                  {person.department && ` · ${person.department}`}
                </p>
              )}
              {person.ContactGroup && (
                <Link 
                  href={`/contacts/groups/${person.ContactGroup.id}`}
                  className="text-blue-100 hover:text-white flex items-center mt-1 transition-colors"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  {person.ContactGroup.name}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="p-6 grid md:grid-cols-2 gap-6">
          {/* Email Addresses */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Mail className="h-5 w-5 mr-2 text-gray-500" />
              E-Mail-Adressen
            </h3>
            {person.EmailAddress.length > 0 ? (
              <div className="space-y-2">
                {person.EmailAddress.map((email) => (
                  <div key={email.id} className="flex items-center justify-between">
                    <a
                      href={`mailto:${email.email}`}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {email.email}
                    </a>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span className="capitalize">{email.emailType.toLowerCase()}</span>
                      {email.isPrimary && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                          Primär
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Keine E-Mail-Adressen hinterlegt</p>
            )}
          </div>

          {/* Phone Numbers */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Phone className="h-5 w-5 mr-2 text-gray-500" />
              Telefonnummern
            </h3>
            {person.PhoneNumber.length > 0 ? (
              <div className="space-y-2">
                {person.PhoneNumber.map((phone) => (
                  <div key={phone.id} className="flex items-center justify-between">
                    <a
                      href={`tel:${phone.number}`}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {phone.number}
                    </a>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span className="capitalize">{phone.phoneType.toLowerCase()}</span>
                      {phone.isPrimary && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                          Primär
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Keine Telefonnummern hinterlegt</p>
            )}
          </div>
        </div>

        {/* Addresses */}
        {person.Address.length > 0 && (
          <div className="border-t dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-gray-500" />
              Adressen
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {person.Address.map((address) => (
                <div 
                  key={address.id} 
                  className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium">{address.street} {address.streetNumber}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 capitalize">
                        {address.addressType.toLowerCase()}
                      </span>
                      {address.isPrimary && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                          Primär
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {address.postalCode} {address.city}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {address.country}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 text-sm text-gray-500">
          <div className="flex justify-between">
            <span>Erstellt am {new Date(person.createdAt).toLocaleDateString('de-DE')}</span>
            <span>Zuletzt aktualisiert am {new Date(person.updatedAt).toLocaleDateString('de-DE')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}