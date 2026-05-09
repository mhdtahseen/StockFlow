import Link from "next/link";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Changelog", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "mailto:hello@finventree.in" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Refund Policy", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <img
                src="/logo.svg"
                alt="Finventree logo"
                width={36}
                height={36}
                className="rounded-xl shadow-md"
              />
              <span className="text-lg font-semibold tracking-tight">
                Finven<span className="text-emerald-500">tree</span>
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] max-w-xs leading-relaxed">
              India&apos;s paperless platform for the smartphone trade. Finance +
              Inventory + Tree — because going digital means going green.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors duration-200 cursor-pointer"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-[var(--color-border)] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--color-text-muted)]">
            &copy; {new Date().getFullYear()} Finventree. All rights reserved.
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Paperless · Profitable · Planet-friendly 🌱 Made in India 🇮🇳
          </p>
        </div>
      </div>
    </footer>
  );
}
