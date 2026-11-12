import { friends } from "@/lib/data";
import Screen from "./Screen";

// Every id is known up front, so the whole prototype can be exported as static files.
export function generateStaticParams() {
  return (() => {
    const ids = friends.map((f) => f.id).sort();
    const out = ids.map((id) => ({ id }));
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++) out.push({ id: `${ids[i]}-${ids[j]}` });
    return out;
  })();
}

export default function Page() {
  return <Screen />;
}
