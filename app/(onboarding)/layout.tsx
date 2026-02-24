export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-light">
      {/* Minimal top bar */}
      <header className="flex items-center justify-center h-16 border-b border-border-light bg-bg-white">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-tag-teal flex items-center justify-center">
            <span className="text-white font-bold text-sm">SP</span>
          </div>
          <span className="text-base font-bold text-text-primary">SitePilot</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        {children}
      </main>
    </div>
  );
}
