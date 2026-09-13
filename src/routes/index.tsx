import { createFileRoute } from "@tanstack/react-router";
import { Experience } from "@/components/experience";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <Experience />;
}
