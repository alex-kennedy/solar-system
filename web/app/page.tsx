import { ClientOnly } from "@/app/client";

import "@/app/page.css";

export function generateStaticParams() {
  return [{ slug: [""] }];
}

export default function Page() {
  return <ClientOnly />;
}
