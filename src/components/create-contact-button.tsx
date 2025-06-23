"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { CreateContactDialog } from "./create-contact-dialog";
import { Button } from "@/components/ui/button";

export function CreateContactButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
      >
        <UserPlus className="w-4 h-4" />
        Neuer Kontakt
      </Button>

      <CreateContactDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={() => {
          setIsDialogOpen(false);
          // Seite neu laden um die Liste zu aktualisieren
          window.location.reload();
        }}
      />
    </>
  );
}