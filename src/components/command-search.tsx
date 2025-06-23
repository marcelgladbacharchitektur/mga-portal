"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Search, FolderOpen, ListTodo, Users, Calendar, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CommandSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Suchen...</span>
        <span className="inline-flex lg:hidden">Suchen...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Suchen Sie nach Projekten, Aufgaben, Kontakten..." />
        <CommandList>
          <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/"))}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Dashboard
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/projects"))}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Projekte
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/tasks"))}
            >
              <ListTodo className="mr-2 h-4 w-4" />
              Aufgaben
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/contacts"))}
            >
              <Users className="mr-2 h-4 w-4" />
              Kontakte
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/calendar"))}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Kalender
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/time-tracking"))}
            >
              <Timer className="mr-2 h-4 w-4" />
              Zeiterfassung
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Aktionen">
            <CommandItem
              onSelect={() => {
                setOpen(false)
                // Trigger OmniCreate for new task
                document.dispatchEvent(new CustomEvent('open-omni-create', { detail: { type: 'task' } }))
              }}
            >
              <ListTodo className="mr-2 h-4 w-4" />
              Neue Aufgabe erstellen
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpen(false)
                // Trigger OmniCreate for new project
                document.dispatchEvent(new CustomEvent('open-omni-create', { detail: { type: 'project' } }))
              }}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Neues Projekt erstellen
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}