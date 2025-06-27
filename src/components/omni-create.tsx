"use client";

import { useState } from "react";
import { Plus, ListTodo, FolderOpen, Users, User, Calendar, Timer } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/modal";
import { TaskForm } from "@/components/tasks/task-form";
import { ProjectForm } from "@/components/projects/project-form";
import { PersonForm } from "@/components/contacts/person-form";
import { GroupForm } from "@/components/contacts/group-form";
import { TimeEntryForm } from "@/components/time-tracking/time-entry-form";
import { AppointmentForm } from "@/components/appointments/appointment-form";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

interface OmniCreateProps {
  className?: string;
  variant?: 'desktop' | 'mobile';
}

export function OmniCreate({ className = "", variant = 'desktop' }: OmniCreateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isTimeEntryModalOpen, setIsTimeEntryModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  
  // Nur ADMIN darf das OmniCreate Menü sehen
  if (!session?.user || session.user.role !== 'ADMIN') {
    return null;
  }
  
  // Extrahiere Projekt-ID aus der URL wenn auf Projekt-Detailseite
  const projectIdMatch = pathname.match(/\/projects\/([^\/]+)/);
  const currentProjectId = projectIdMatch ? projectIdMatch[1] : null;

  const menuItems = [
    {
      label: 'Neue Aufgabe',
      icon: ListTodo,
      onClick: () => setIsTaskModalOpen(true),
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
      disabled: false,
      comingSoon: false
    },
    {
      label: 'Neues Projekt',
      icon: FolderOpen,
      onClick: () => setIsProjectModalOpen(true),
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
      disabled: false,
      comingSoon: false
    },
    {
      label: 'Neue Person',
      icon: User,
      onClick: () => setIsPersonModalOpen(true),
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'hover:bg-green-50 dark:hover:bg-green-900/20',
      disabled: false,
      comingSoon: false
    },
    {
      label: 'Neue Gruppe',
      icon: Users,
      onClick: () => setIsGroupModalOpen(true),
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'hover:bg-teal-50 dark:hover:bg-teal-900/20',
      disabled: false,
      comingSoon: false
    },
    {
      label: 'Neuer Zeiteintrag',
      icon: Timer,
      onClick: () => setIsTimeEntryModalOpen(true),
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'hover:bg-cyan-50 dark:hover:bg-cyan-900/20',
      disabled: false,
      comingSoon: false
    },
    {
      label: 'Neuer Termin',
      icon: Calendar,
      onClick: () => setIsAppointmentModalOpen(true),
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
      disabled: false,
      comingSoon: false
    },
  ];

  function handleTaskCreated() {
    setIsTaskModalOpen(false);
    router.refresh();
  }


  function handlePersonCreated() {
    setIsPersonModalOpen(false);
    router.push('/contacts');
  }

  function handleGroupCreated() {
    setIsGroupModalOpen(false);
    router.push('/contacts');
  }

  function handleTimeEntryCreated() {
    setIsTimeEntryModalOpen(false);
    router.push('/time-tracking');
  }

  function handleAppointmentCreated() {
    setIsAppointmentModalOpen(false);
    router.push('/calendar');
  }

  const isCollapsed = className.includes("px-0");
  
  const buttonContent = variant === 'mobile' ? (
    <>
      <Plus className="w-6 h-6" />
      <span className="text-xs font-medium">Erstellen</span>
    </>
  ) : (
    <>
      <Plus className="w-5 h-5" />
      {variant === 'desktop' && !isCollapsed && <span className="font-medium">Erstellen</span>}
    </>
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant === 'mobile' ? 'default' : 'default'}
            size={variant === 'mobile' ? 'default' : 'default'}
            className={`
              ${variant === 'mobile' 
                ? 'flex flex-col items-center gap-1 p-3'
                : 'w-full justify-center'
              }
            `}
          >
            {buttonContent}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align={variant === 'mobile' ? 'end' : 'start'}
          className="w-56"
        >
          {menuItems.map((item) => (
            <DropdownMenuItem
              key={item.label}
              disabled={item.disabled}
              className={`cursor-pointer ${item.disabled ? 'opacity-50' : ''}`}
              onSelect={() => {
                if (!item.disabled) {
                  item.onClick();
                }
              }}
            >
              <item.icon className={`mr-2 h-4 w-4 ${item.color}`} />
              <span className="flex-1">{item.label}</span>
              {item.comingSoon && (
                <span className="text-xs text-muted-foreground">
                  Bald
                </span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Neue Aufgabe erstellen"
      >
        <TaskForm
          mode="create"
          defaultProjectId={currentProjectId}
          onSuccess={handleTaskCreated}
          onCancel={() => setIsTaskModalOpen(false)}
        />
      </Modal>

      {/* Project Modal */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title="Neues Projekt erstellen"
      >
        <div className="pb-4">
          <ProjectForm
            mode="create"
          />
        </div>
      </Modal>

      {/* Person Modal */}
      <Modal
        isOpen={isPersonModalOpen}
        onClose={() => setIsPersonModalOpen(false)}
        title="Neue Person erstellen"
      >
        <PersonForm
          onSuccess={handlePersonCreated}
          onCancel={() => setIsPersonModalOpen(false)}
        />
      </Modal>

      {/* Group Modal */}
      <Modal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        title="Neue Gruppe erstellen"
      >
        <GroupForm
          onSuccess={handleGroupCreated}
          onCancel={() => setIsGroupModalOpen(false)}
        />
      </Modal>

      {/* Time Entry Modal */}
      <Modal
        isOpen={isTimeEntryModalOpen}
        onClose={() => setIsTimeEntryModalOpen(false)}
        title="Neuer Zeiteintrag"
        size="xl"
      >
        <TimeEntryForm
          onSuccess={handleTimeEntryCreated}
          onCancel={() => setIsTimeEntryModalOpen(false)}
        />
      </Modal>

      {/* Appointment Modal */}
      <Modal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        title="Neuer Termin"
        size="xl"
      >
        <AppointmentForm
          onSuccess={handleAppointmentCreated}
          onCancel={() => setIsAppointmentModalOpen(false)}
        />
      </Modal>
    </>
  );
}