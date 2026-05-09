// JSON-LD Structured Data for SEO
// Renders SoftwareApplication + Organization + FAQPage schemas
// These enable rich results in Google Search (ratings, FAQ dropdowns, etc.)

const BASE_URL = "https://finventree.com";

const softwareApplicationSchema = {
  "@type": "SoftwareApplication",
  "@id": `${BASE_URL}/#software`,
  name: "Finventree",
  url: BASE_URL,
  description:
    "Finventree is India's paperless inventory management, GST billing, and IMEI tracking platform for smartphone resellers, retailers, wholesalers, and dealers.",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "InventoryManagement",
  operatingSystem: "Web, Android, iOS",
  offers: [
    {
      "@type": "Offer",
      name: "Starter Plan",
      price: "999",
      priceCurrency: "INR",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "999",
        priceCurrency: "INR",
        unitCode: "MON",
      },
    },
    {
      "@type": "Offer",
      name: "Professional Plan",
      price: "2499",
      priceCurrency: "INR",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "2499",
        priceCurrency: "INR",
        unitCode: "MON",
      },
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "500",
    bestRating: "5",
    worstRating: "1",
  },
  featureList: [
    "Real-time inventory tracking",
    "IMEI scanning and tracking",
    "GST-compliant billing and invoicing",
    "Financial ledger and customer wallets",
    "Business intelligence and analytics",
    "Multi-store management",
    "Purchase order management",
    "Role-based access control",
  ],
  inLanguage: "en-IN",
  availableCountry: {
    "@type": "Country",
    name: "India",
  },
};

const organizationSchema = {
  "@type": "Organization",
  "@id": `${BASE_URL}/#organization`,
  name: "Finventree",
  url: BASE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${BASE_URL}/logo.svg`,
    width: 512,
    height: 512,
  },
  description:
    "Finventree provides paperless inventory management and billing software exclusively for India's smartphone trade ecosystem.",
  areaServed: {
    "@type": "Country",
    name: "India",
  },
  contactPoint: {
    "@type": "ContactPoint",
    email: "hello@finventree.com",
    contactType: "customer support",
    availableLanguage: ["English", "Hindi"],
  },
  sameAs: [],
};

const faqSchema = {
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Finventree?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Finventree is India's paperless inventory management, GST billing, and IMEI tracking platform built exclusively for smartphone resellers, retailers, wholesalers, and dealers. The name combines Finance + Inventory + Tree, reflecting our commitment to going 100% digital and eco-friendly.",
      },
    },
    {
      "@type": "Question",
      name: "Does Finventree support GST billing?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Finventree generates fully GST-compliant paperless invoices with automatic tax calculation, GSTIN validation, and e-way bill support. Share invoices via WhatsApp instantly — no printing required.",
      },
    },
    {
      "@type": "Question",
      name: "Can I track IMEI numbers with Finventree?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Finventree lets you scan, log, and trace every device by its IMEI number. You get full chain-of-custody records from purchase to sale, which is critical for warranty claims and anti-theft protection.",
      },
    },
    {
      "@type": "Question",
      name: "Does Finventree work for multiple stores?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The Professional plan supports multi-store management. You can view inventory, sales, and payments across all your locations from a single dashboard.",
      },
    },
    {
      "@type": "Question",
      name: "How much does Finventree cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Finventree offers a Starter plan at ₹999/month for single-store retailers, and a Professional plan at ₹2,499/month for growing businesses with multi-store support. Enterprise pricing is available for large-scale wholesale operations. All plans include a 14-day free trial.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a free trial available?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Finventree offers a 14-day free trial with no credit card required. You can get started in under 5 minutes.",
      },
    },
    {
      "@type": "Question",
      name: "Is Finventree available on mobile?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Finventree is accessible on web browsers and has a dedicated Android app available on Google Play, optimized for on-the-go inventory and billing at your shop.",
      },
    },
    {
      "@type": "Question",
      name: "Why is Finventree called paperless?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Finventree is built paperless from the ground up. All invoices are digital, all records are cloud-stored, and all workflows are mobile-first. The 'Tree' in Finventree represents our eco-friendly mission: every business that switches to Finventree eliminates paper from their operations.",
      },
    },
  ],
};

const webSiteSchema = {
  "@type": "WebSite",
  "@id": `${BASE_URL}/#website`,
  url: BASE_URL,
  name: "Finventree",
  description:
    "India's paperless inventory & billing platform for the smartphone trade",
  publisher: { "@id": `${BASE_URL}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
  inLanguage: "en-IN",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    webSiteSchema,
    organizationSchema,
    softwareApplicationSchema,
    faqSchema,
  ],
};

export default function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
