// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AN Salon | अन सैलून – Kharadi, Pune",
    template: "%s | AN Salon – Kharadi, Pune",
  },
  description:
    "AN Salon (अन सैलून) is a luxury unisex beauty parlour in Kharadi, Pune. Book appointments online for hair, beauty, skin care, makeup, nail care, and wellness services.",
  keywords: ["AN Salon", "salon Kharadi Pune", "beauty parlour Pune", "hair salon Pune", "book salon appointment"],
  openGraph: {
    title: "AN Salon | अन सैलून – Kharadi, Pune",
    description: "Luxury beauty & wellness. Book appointments online.",
    url: "https://www.ansalon.in",
    siteName: "AN Salon",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BeautySalon",
              name: "AN Salon",
              alternateName: "अन सैलून",
              url: "https://www.ansalon.in",
              telephone: "+918064526928",
              address: {
                "@type": "PostalAddress",
                streetAddress:
                  "Shop No. 13, Global High Street Building, Global Precioso Road, below Malaka Spice",
                addressLocality: "Kharadi",
                addressRegion: "Pune, Maharashtra",
                postalCode: "411014",
                addressCountry: "IN",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: 18.55737013599763,
                longitude: 73.9521989846588,
              },
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
