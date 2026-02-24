export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-light px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-10 w-10 rounded-xl bg-tag-teal flex items-center justify-center">
            <span className="text-white font-bold text-lg">SP</span>
          </div>
          <span className="text-xl font-bold text-text-primary">SitePilot</span>
        </div>

        {/* Auth Card */}
        <div className="bg-bg-white rounded-2xl border border-border-light shadow-sm p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
