"use client";

import { Modal } from "@/components/modal";
import { ContactGroupForm } from "@/components/contacts/contact-group-form";

interface CreateContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateContactDialog({ isOpen, onClose, onSuccess }: CreateContactDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Neue Kontaktgruppe erstellen"
      size="xl"
    >
      <ContactGroupForm
        mode="create"
        onSuccess={onSuccess}
        onCancel={onClose}
      />
    </Modal>
  );
}