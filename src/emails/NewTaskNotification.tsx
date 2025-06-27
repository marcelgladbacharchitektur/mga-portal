import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { emailStyles } from "@/lib/email";

interface NewTaskNotificationProps {
  taskTitle: string;
  taskDescription?: string;
  projectName: string;
  projectNumber: string;
  assignedTo?: string;
  createdBy: string;
  dueDate?: string;
  priority?: string;
  taskUrl: string;
  projectUrl: string;
}

export const NewTaskNotification = ({
  taskTitle,
  taskDescription,
  projectName,
  projectNumber,
  assignedTo,
  createdBy,
  dueDate,
  priority,
  taskUrl,
  projectUrl,
}: NewTaskNotificationProps) => {
  const previewText = `Neue Aufgabe: ${taskTitle} - ${projectName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={emailStyles.main}>
        <Container style={emailStyles.container}>
          <Section style={emailStyles.logoSection}>
            <Heading style={emailStyles.h1}>MGA Portal</Heading>
            <Text style={emailStyles.subtitle}>Marcel Gladbach Architektur</Text>
          </Section>

          <Hr style={emailStyles.hr} />

          <Section style={emailStyles.contentSection}>
            <Heading style={emailStyles.h2}>Neue Aufgabe erstellt</Heading>

            <Text style={emailStyles.paragraph}>
              Im Projekt <strong>{projectName}</strong> ({projectNumber}) wurde eine neue Aufgabe erstellt:
            </Text>

            <Section style={taskBox}>
              <Heading style={taskTitle}>{taskTitle}</Heading>
              
              {taskDescription && (
                <Text style={taskDescriptionStyle}>{taskDescription}</Text>
              )}

              <Section style={taskDetails}>
                {assignedTo && (
                  <Text style={detailItem}>
                    <strong>Zugewiesen an:</strong> {assignedTo}
                  </Text>
                )}
                
                <Text style={detailItem}>
                  <strong>Erstellt von:</strong> {createdBy}
                </Text>

                {dueDate && (
                  <Text style={detailItem}>
                    <strong>Fälligkeitsdatum:</strong> {dueDate}
                  </Text>
                )}

                {priority && (
                  <Text style={detailItem}>
                    <strong>Priorität:</strong> {getPriorityLabel(priority)}
                  </Text>
                )}
              </Section>
            </Section>

            <Section style={emailStyles.buttonContainer}>
              <Button style={emailStyles.button} href={taskUrl}>
                Aufgabe anzeigen
              </Button>
            </Section>

            <Text style={linkText}>
              Oder öffnen Sie das <Link href={projectUrl} style={link}>Projekt {projectName}</Link> im MGA Portal.
            </Text>

            <Hr style={emailStyles.hr} />

            <Text style={emailStyles.footer}>
              Diese E-Mail wurde automatisch vom MGA Portal generiert.<br />
              Marcel Gladbach Architektur
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Zusätzliche Styles für die Aufgaben-Benachrichtigung
const taskBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  border: "1px solid #e5e7eb",
};

const taskTitle = {
  color: "#111827",
  fontSize: "20px",
  fontWeight: "600",
  margin: "0 0 12px 0",
};

const taskDescriptionStyle = {
  color: "#4b5563",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
};

const taskDetails = {
  borderTop: "1px solid #e5e7eb",
  paddingTop: "16px",
  marginTop: "16px",
};

const detailItem = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
};

const linkText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "16px 0",
  textAlign: "center" as const,
};

const link = {
  color: "#4f46e5",
  textDecoration: "underline",
};

// Helper-Funktion für Prioritäts-Labels
function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    high: "Hoch",
    medium: "Mittel",
    low: "Niedrig",
  };
  return labels[priority] || priority;
}

// Export default für React Email Preview
export default NewTaskNotification;