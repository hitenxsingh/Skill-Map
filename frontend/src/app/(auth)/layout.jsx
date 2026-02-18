'use client';

const LogoSvg = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 200 200" fill="none">
    <rect width="200" height="200" rx="40" fill="hsl(199, 89%, 48%)" />
    <path d="M100 40L160 75V145L100 180L40 145V75L100 40Z" fill="white" fillOpacity="0.2" />
    <path d="M100 60L145 82V128L100 150L55 128V82L100 60Z" fill="white" fillOpacity="0.35" />
    <path d="M100 80L125 94V118L100 132L75 118V94L100 80Z" fill="white" />
  </svg>
);

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-115 xl:w-130 relative overflow-hidden bg-[hsl(222,47%,7%)] flex-col justify-between p-10">
        {/* Subtle gradient orbs */}
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-[hsl(199,89%,48%)] opacity-[0.06] blur-[80px]" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-[hsl(160,84%,39%)] opacity-[0.04] blur-[80px]" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <LogoSvg />
          <span className="text-xl font-bold tracking-tight text-white">SkillMap</span>
        </div>

        {/* Copy */}
        <div className="relative z-10 space-y-5">
          <h1 className="text-3xl xl:text-4xl font-bold leading-tight text-white tracking-tight">
            Map, measure
            <br />& <span className="text-[hsl(199,89%,48%)]">grow</span> your
            <br />team&apos;s skills.
          </h1>
          <p className="text-[hsl(215,16%,50%)] max-w-sm text-sm leading-relaxed">
            AI-powered skill intelligence platform. Identify gaps, build learning paths, and discover internal talent.
          </p>

          <div className="flex gap-8 pt-3">
            {[
              { val: '500+', label: 'Employees' },
              { val: '16+', label: 'Skills' },
              { val: 'AI', label: 'Powered' },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-xl font-bold text-white">{s.val}</p>
                <p className="text-[11px] text-[hsl(215,16%,50%)]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[11px] text-[hsl(215,16%,40%)]">
          © 2026 SkillMap — Workforce Intelligence
        </p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-background">
        <div className="w-full max-w-100">{children}</div>
      </div>
    </div>
  );
}
