// Type definitions for client-side usage

export interface Project {
  id: string
  projectNumber: string
  name: string
  status: string
  projectType: string
  projectSector: string
  budget: number | null
  parcelNumber: string | null
  plotAddress: string | null
  plotArea: number | null
  cadastralCommunity: string | null
  landRegistry: string | null
  registrationNumber: string | null
  zoning: string | null
  plotNotes: string | null
  createdAt: string
  updatedAt: string
  lastActivityAt: string | null
  nextcloudPath: string | null
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  projectId: string | null
  dueDate: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  assignedToId: string | null
}

export interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  company: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  contactGroupId: string | null
}

export interface ContactGroup {
  id: string
  name: string
  category: string
  website: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface TimeEntry {
  id: string
  startTime: string
  endTime: string | null
  durationMinutes: number | null
  description: string
  isBillable: boolean
  projectId: string | null
  taskId: string | null
  userId: string
  createdAt: string
  updatedAt: string
  project?: Project
  task?: Task
}

export interface Appointment {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  location: string | null
  notes: string | null
  createdById: string
  createdAt: string
  updatedAt: string
  participants?: AppointmentParticipant[]
}

export interface AppointmentParticipant {
  id: string
  appointmentId: string
  participantType: string
  participantId: string
  createdAt: string
}

export interface ProjectParticipant {
  id: string
  projectId: string
  contactGroupId: string
  role: string
  createdAt: string
  updatedAt: string
  ContactGroup?: ContactGroup
}