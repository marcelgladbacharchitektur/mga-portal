import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, MapPin, Users, Globe, FileText, Edit, User } from 'lucide-react'

async function getContactGroup(id: string) {
  const group = await prisma.contactGroup.findUnique({
    where: { id },
    include: {
      Person: {
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' }
        ]
      },
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
      },
      ProjectParticipant: {
        include: {
          Project: true
        }
      }
    }
  })

  if (!group) {
    notFound()
  }

  return group
}

const categoryColors = {
  BAUHERR: 'from-green-600 to-green-700',
  PLANER: 'from-purple-600 to-purple-700',
  HANDWERKER: 'from-orange-600 to-orange-700',
  BEHOERDE: 'from-red-600 to-red-700',
  SONSTIGE: 'from-gray-600 to-gray-700'
}

export default async function ContactGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const group = await getContactGroup(id)
  const gradientColor = categoryColors[group.category as keyof typeof categoryColors] || categoryColors.SONSTIGE

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/contacts"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold">{group.name}</h1>
        </div>
        <Link
          href={`/contacts/groups/${group.id}/edit`}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Edit className="h-4 w-4" />
          <span>Bearbeiten</span>
        </Link>
      </div>

      {/* Main Content Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className={`bg-gradient-to-r ${gradientColor} text-white p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{group.name}</h2>
              <p className="text-white/80 mt-1">{group.category}</p>
              {group.website && (
                <a
                  href={group.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white flex items-center mt-2 transition-colors"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {group.website}
                </a>
              )}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{group.Person.length}</p>
              <p className="text-white/80">Kontakte</p>
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
            {group.EmailAddress.length > 0 ? (
              <div className="space-y-2">
                {group.EmailAddress.map((email) => (
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
            {group.PhoneNumber.length > 0 ? (
              <div className="space-y-2">
                {group.PhoneNumber.map((phone) => (
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
        {group.Address.length > 0 && (
          <div className="border-t dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-gray-500" />
              Adressen
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {group.Address.map((address) => (
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

        {/* Notes */}
        {group.notes && (
          <div className="border-t dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-gray-500" />
              Notizen
            </h3>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{group.notes}</p>
          </div>
        )}

        {/* Associated Persons */}
        {group.Person.length > 0 && (
          <div className="border-t dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Users className="h-5 w-5 mr-2 text-gray-500" />
              Zugeordnete Personen
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {group.Person.map((person) => (
                <Link
                  key={person.id}
                  href={`/contacts/persons/${person.id}`}
                  className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {person.title && `${person.title} `}
                        {person.firstName} {person.lastName}
                      </p>
                      {person.position && (
                        <p className="text-sm text-gray-500">{person.position}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Associated Projects */}
        {group.ProjectParticipant.length > 0 && (
          <div className="border-t dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-3">Projektbeteiligungen</h3>
            <div className="space-y-2">
              {group.ProjectParticipant.map((participant) => (
                <Link
                  key={participant.id}
                  href={`/projects/${participant.Project.id}`}
                  className="block p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{participant.Project.name}</p>
                      <p className="text-sm text-gray-500">
                        {participant.Project.projectNumber} · {participant.role}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      participant.Project.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      participant.Project.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                      participant.Project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {participant.Project.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 text-sm text-gray-500">
          <div className="flex justify-between">
            <span>Erstellt am {new Date(group.createdAt).toLocaleDateString('de-DE')}</span>
            <span>Zuletzt aktualisiert am {new Date(group.updatedAt).toLocaleDateString('de-DE')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}