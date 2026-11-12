import { restaurants } from "@/lib/data";
import Screen from "./Screen";

// Every id is known up front, so the whole prototype can be exported as static files.
export function generateStaticParams() {
  return restaurants.map((r) => ({ id: r.id }));
}

export default function Page() {
  return <Screen />;
}
