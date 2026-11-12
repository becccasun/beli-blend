import { challenges } from "@/lib/team-data";
import Screen from "./Screen";

// Every id is known up front, so the whole prototype can be exported as static files.
export function generateStaticParams() {
  return challenges.map((c) => ({ id: c.id }));
}

export default function Page() {
  return <Screen />;
}
