import { VisitForm } from "@/components/VisitForm";
import { useNewVisitScreen } from "@/hooks/useNewVisitScreen";
import { Stack } from "expo-router";

export default function NewVisitScreen() {
  const { handleSubmit } = useNewVisitScreen();

  return (
    <>
      <Stack.Screen options={{ title: "Schedule Visit" }} />
      <VisitForm onSubmit={handleSubmit} submitLabel="Schedule Visit" />
    </>
  );
}
