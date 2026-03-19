import Link from "next/link";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ───── Nav ───── */}
      <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/marketing" className="flex items-center gap-2.5">
            <BedrockLogo className="h-7 w-7" />
            <span className="text-lg font-bold text-zinc-900">Bedrock</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 md:flex">
            <a href="#features" className="hover:text-zinc-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-zinc-900 transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-zinc-900 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-zinc-900 transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors sm:inline-block"
            >
              Sign In
            </Link>
            <Link
              href="#waitlist"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
            >
              Get Early Access
            </Link>
          </div>
        </div>
      </header>

      {/* ───── Hero ───── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-white to-blue-50/30" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-medium text-zinc-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Now accepting early access signups
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
              The recruiting platform{" "}
              <span className="text-zinc-400">built for growing firms</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-zinc-600 sm:text-xl">
              Stop juggling spreadsheets, emails, and disconnected tools.
              Bedrock gives your team one system for candidates, jobs, clients,
              and placements — so you can fill roles faster and grow with confidence.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a
                href="#waitlist"
                className="w-full rounded-lg bg-zinc-900 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-zinc-900/10 hover:bg-zinc-800 transition-colors sm:w-auto"
              >
                Request a Demo
              </a>
              <a
                href="#features"
                className="w-full rounded-lg border border-zinc-200 bg-white px-8 py-3.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors sm:w-auto"
              >
                See Features
              </a>
            </div>
            <p className="mt-6 text-xs text-zinc-400">
              No credit card required &middot; Free for teams under 3 users
            </p>
          </div>
        </div>
      </section>

      {/* ───── Social proof bar ───── */}
      <section className="border-y border-zinc-100 bg-zinc-50/50 py-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <Stat value="10x" label="faster candidate tracking" />
            <Stat value="100%" label="pipeline visibility" />
            <Stat value="0" label="spreadsheets needed" />
            <Stat value="1" label="system for everything" />
          </div>
        </div>
      </section>

      {/* ───── Features grid ───── */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Everything your staffing firm needs
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              From first contact to placement — Bedrock covers the full
              recruiting lifecycle in one clean interface.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon={<UsersIcon />}
              title="Candidate Pipeline"
              description="Track every candidate from first contact through placement. Skills, experience, salary expectations, and full activity history in one place."
            />
            <Feature
              icon={<BriefcaseIcon />}
              title="Job Management"
              description="Create and manage open positions with priority levels, pay ranges, and employment types. Match candidates to jobs with smart submissions."
            />
            <Feature
              icon={<BuildingIcon />}
              title="Client Management"
              description="Organize client companies with contacts, follow-up dates, and engagement status. Never lose track of a relationship."
            />
            <Feature
              icon={<LinkIcon />}
              title="Client Portal"
              description="Give clients a branded portal to review candidate submissions, leave feedback, and track progress — without email back-and-forth."
            />
            <Feature
              icon={<ChartIcon />}
              title="Revenue Tracking"
              description="Track placements, fees, and revenue by client. See your pipeline value and forecast with real-time reporting dashboards."
            />
            <Feature
              icon={<ShieldIcon />}
              title="Team & Permissions"
              description="Role-based access for admins, recruiters, and clients. Full audit trail and row-level security keep your data safe."
            />
            <Feature
              icon={<ClipboardIcon />}
              title="Tasks & Follow-ups"
              description="Built-in task management with priorities, due dates, and overdue tracking. Never miss a follow-up again."
            />
            <Feature
              icon={<UploadIcon />}
              title="CSV Import & Export"
              description="Bring your existing data with you. Import candidates, companies, and jobs from CSV. Export anything for reporting."
            />
            <Feature
              icon={<ZapIcon />}
              title="Automation"
              description="Auto-assign stale follow-ups, flag aging submissions, and surface data hygiene issues — so your team stays proactive."
            />
          </div>
        </div>
      </section>

      {/* ───── How it works ───── */}
      <section id="how-it-works" className="border-t border-zinc-100 bg-zinc-50/50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Up and running in minutes
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              No implementation consultants. No six-month rollouts. Just sign up
              and start recruiting.
            </p>
          </div>
          <div className="mt-16 grid gap-12 sm:grid-cols-3">
            <Step
              number="1"
              title="Set up your team"
              description="Create your account, invite your recruiters, and configure roles. Takes about 5 minutes."
            />
            <Step
              number="2"
              title="Import your data"
              description="Bring in your existing candidates, companies, and jobs via CSV — or start fresh with demo data."
            />
            <Step
              number="3"
              title="Start filling roles"
              description="Create jobs, submit candidates, track placements, and invite clients to their portal. You're live."
            />
          </div>
        </div>
      </section>

      {/* ───── Use cases ───── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Built for teams like yours
            </h2>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            <UseCase
              title="Staffing Firms"
              description="Run your entire agency from one system. Manage multiple clients, track recruiter performance, and report on revenue — without enterprise complexity."
              tags={["Multi-client", "Revenue tracking", "Team management"]}
            />
            <UseCase
              title="Trade & HVAC Recruiters"
              description="Purpose-built for hands-on industries. Track skilled trades candidates, manage contractor placements, and handle hourly vs. salary roles with ease."
              tags={["Hourly & salary", "Contractor tracking", "Field-ready"]}
            />
            <UseCase
              title="Internal Recruiting Teams"
              description="Give your HR team a lightweight ATS without the bloat. Track candidates, coordinate with hiring managers, and keep every role on schedule."
              tags={["Hiring manager portal", "Simple workflow", "No bloat"]}
            />
          </div>
        </div>
      </section>

      {/* ───── Pricing ───── */}
      <section id="pricing" className="border-t border-zinc-100 bg-zinc-50/50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              Start free. Upgrade when you&apos;re ready.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            <PricingCard
              name="Starter"
              price="Free"
              period=""
              description="For solo recruiters and small teams getting started."
              features={[
                "Up to 3 users",
                "Unlimited candidates & jobs",
                "Client portal",
                "CSV import/export",
                "Email notifications",
              ]}
              cta="Get Started Free"
              ctaHref="/signup"
              highlighted={false}
            />
            <PricingCard
              name="Professional"
              price="$49"
              period="/user/mo"
              description="For growing firms that need automation and reporting."
              features={[
                "Everything in Starter",
                "Unlimited users",
                "Automation rules",
                "Advanced reporting",
                "Custom saved views",
                "Audit trail",
                "Priority support",
              ]}
              cta="Request Demo"
              ctaHref="#waitlist"
              highlighted={true}
            />
            <PricingCard
              name="Enterprise"
              price="Custom"
              period=""
              description="For large firms needing dedicated support and SLAs."
              features={[
                "Everything in Professional",
                "Dedicated account manager",
                "Custom integrations",
                "SSO / SAML",
                "SLA guarantee",
                "On-premise option",
                "Custom training",
              ]}
              cta="Contact Sales"
              ctaHref="#waitlist"
              highlighted={false}
            />
          </div>
        </div>
      </section>

      {/* ───── FAQ ───── */}
      <section id="faq" className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Frequently asked questions
          </h2>
          <div className="mt-12 space-y-8">
            <FaqItem
              question="Who is Bedrock Staffing built for?"
              answer="Bedrock is built for staffing agencies, recruiting firms, and internal HR teams that need a clean, modern system to manage candidates, jobs, clients, and placements. It's especially popular with trade recruiters (HVAC, electrical, plumbing) and small-to-mid-size staffing firms."
            />
            <FaqItem
              question="How is Bedrock different from Bullhorn, JobAdder, etc.?"
              answer="Bedrock is simpler, faster, and more affordable. There's no 6-month implementation, no per-module pricing, and no consultant required. You sign up, import your data, and start recruiting the same day."
            />
            <FaqItem
              question="Can my clients see candidate submissions?"
              answer="Yes. Each client gets a branded portal where they can review submitted candidates, leave feedback, and track progress. No more email chains or shared spreadsheets."
            />
            <FaqItem
              question="Is my data secure?"
              answer="Yes. Bedrock uses row-level security (RLS), role-based access control, and a full audit trail. Your data is encrypted in transit and at rest. We never share or sell your data."
            />
            <FaqItem
              question="Can I import my existing data?"
              answer="Absolutely. Bedrock supports CSV import for candidates, companies, and jobs. You can also export any data set to CSV at any time."
            />
            <FaqItem
              question="What if I need help getting set up?"
              answer="Professional and Enterprise plans include priority support. We also offer guided onboarding sessions to get your team productive on day one."
            />
          </div>
        </div>
      </section>

      {/* ───── Waitlist / CTA ───── */}
      <section id="waitlist" className="border-t border-zinc-100 bg-zinc-900 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <BedrockLogo className="mx-auto mb-6 h-10 w-10 text-white" />
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to modernize your recruiting?
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Join the waitlist for early access. We&apos;ll reach out with a personalized
            demo and get you set up.
          </p>
          <form className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="you@company.com"
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              Join Waitlist
            </button>
          </form>
          <p className="mt-4 text-xs text-zinc-500">
            No spam. We&apos;ll only email you about your early access.
          </p>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-zinc-100 bg-white py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <BedrockLogo className="h-5 w-5" />
              <span className="text-sm font-semibold text-zinc-900">Bedrock Staffing</span>
            </div>
            <p className="text-xs text-zinc-400">
              &copy; {new Date().getFullYear()} Bedrock Staffing. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs text-zinc-500">
              <a href="#" className="hover:text-zinc-900 transition-colors">Privacy</a>
              <a href="#" className="hover:text-zinc-900 transition-colors">Terms</a>
              <a href="#" className="hover:text-zinc-900 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ───── Sub-components ───── */

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-zinc-900 sm:text-3xl">{value}</p>
      <p className="mt-1 text-sm text-zinc-500">{label}</p>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white">
        {number}
      </div>
      <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{description}</p>
    </div>
  );
}

function UseCase({
  title,
  description,
  tags,
}: {
  title: string;
  description: string;
  tags: string[];
}) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  ctaHref,
  highlighted,
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted: boolean;
}) {
  return (
    <div
      className={`relative rounded-xl border p-8 shadow-sm ${
        highlighted
          ? "border-zinc-900 ring-1 ring-zinc-900 bg-white"
          : "border-zinc-100 bg-white"
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-3 py-0.5 text-xs font-semibold text-white">
          Most Popular
        </div>
      )}
      <h3 className="text-lg font-semibold text-zinc-900">{name}</h3>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-bold text-zinc-900">{price}</span>
        {period && <span className="text-sm text-zinc-500">{period}</span>}
      </div>
      <p className="mt-3 text-sm text-zinc-600">{description}</p>
      <a
        href={ctaHref}
        className={`mt-6 block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
          highlighted
            ? "bg-zinc-900 text-white hover:bg-zinc-800"
            : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
        }`}
      >
        {cta}
      </a>
      <ul className="mt-6 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-zinc-600">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-zinc-900">{question}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{answer}</p>
    </div>
  );
}

/* ───── Icons ───── */

function BedrockLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      <rect x="4" y="20" width="24" height="5" rx="1.5" fill="#18181b" />
      <rect x="7" y="14" width="18" height="5" rx="1.5" fill="#3f3f46" />
      <rect x="10" y="8" width="12" height="5" rx="1.5" fill="#71717a" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L5.25 8.25" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}
