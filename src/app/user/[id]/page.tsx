import { friends } from "@/lib/data";
import Screen from "./Screen";

// Every id is known up front, so the whole prototype can be exported as static files.
export function generateStaticParams() {
  return friends.map((p) => ({ id: p.id }));
}

export default function Page() {
  return <Screen />;
}
