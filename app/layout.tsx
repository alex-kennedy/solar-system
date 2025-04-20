import type { Metadata } from "next";

import "./src/assets/css/index.css";

export const metadata: Metadata = {
  title: "Solar System",
  description: "An open source solar system asteroid visualisation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#000000" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Roboto:300,400,500"
        />
      </head>
      <body>
        <noscript> You need to enable JavaScript to run this app. </noscript>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
