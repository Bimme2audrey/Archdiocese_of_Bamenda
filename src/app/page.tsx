import Link from "next/link";
import { ShieldCheck, Church, Database, CalendarClock } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-sand">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-burgundy flex items-center justify-center text-gold-light shadow-sm">
            <Church size={20} />
          </div>
          <div>
            <p className="font-semibold tracking-tight">ADP Clergy Profile System</p>
            <p className="text-xs text-stone-warm">Association of Diocesan Priests</p>
          </div>
        </div>
        <Link href="/login" className="btn-primary">Sign In</Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-gold/15 text-gold px-4 py-1.5 text-xs font-medium mb-7">
          <ShieldCheck size={14} /> Centralized Clergy Records
        </div>
        <h1 className="max-w-3xl text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
          Digital Profiles &amp; Historical Records
          <span className="block text-burgundy">for Every Priest of the Archdiocese</span>
        </h1>
        <p className="max-w-2xl text-lg text-stone-warm mt-6 leading-relaxed">
          A centralized repository for biographical information, pastoral assignments,
          academic formation, and ministry history — securely managed and always in sync.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mt-12 max-w-3xl w-full">
          {[
            {
              icon: Database,
              title: "Structured Questionnaires",
              desc: "Priests complete guided forms covering all aspects of their journey.",
            },
            {
              icon: ShieldCheck,
              title: "Admin Review & Approval",
              desc: "Profiles become active only after review and approval by ADP administrators.",
            },
            {
              icon: CalendarClock,
              title: "Offline-Ready & Synced",
              desc: "Data entry works offline and synchronizes automatically when online.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card card-shadow p-6 text-left">
              <div className="w-10 h-10 rounded-lg bg-burgundy/10 flex items-center justify-center text-burgundy mb-4">
                <Icon size={19} />
              </div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-stone-warm mt-2 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 mt-12">
          <Link href="/login" className="btn-primary">Login to Dashboard</Link>
          <Link href="/register" className="btn-secondary">I Received An Invitation</Link>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-stone-warm border-t border-sand">
        © {new Date().getFullYear()} ADP Clergy Profile System · Archdiocese of Diocese of Priests
      </footer>
    </div>
  );
}
