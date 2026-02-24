import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-light">
      {/* Marketing Navbar */}
      <nav className="sticky top-0 z-50 bg-bg-white/80 backdrop-blur-md border-b border-border-light">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-tag-teal flex items-center justify-center">
              <span className="text-white font-bold text-sm">SP</span>
            </div>
            <span className="text-base font-bold text-text-primary">
              SitePilot
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/#features"
              className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
            >
              Features
            </Link>
            <Link
              href="/#pricing"
              className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/#contact"
              className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
            >
              Contact
            </Link>
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-text-primary hover:text-text-secondary transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center h-9 px-5 bg-btn-primary text-btn-primary-text text-sm font-semibold rounded-full hover:bg-[#222] transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      {children}

      {/* Footer */}
      <footer className="border-t border-border-light bg-bg-white">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-8 w-8 rounded-lg bg-tag-teal flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SP</span>
                </div>
                <span className="text-base font-bold text-text-primary">
                  SitePilot
                </span>
              </div>
              <p className="text-sm text-text-muted">
                Build beautiful websites with AI-powered tools.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-text-muted">
                <li><Link href="/#features" className="hover:text-text-primary transition-colors">Features</Link></li>
                <li><Link href="/#pricing" className="hover:text-text-primary transition-colors">Pricing</Link></li>
                <li><Link href="/register" className="hover:text-text-primary transition-colors">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-text-muted">
                <li><Link href="#" className="hover:text-text-primary transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-text-primary transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-text-primary transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text-primary mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-text-muted">
                <li><Link href="#" className="hover:text-text-primary transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-text-primary transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border-light text-center text-xs text-text-muted">
            &copy; {new Date().getFullYear()} SitePilot. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
