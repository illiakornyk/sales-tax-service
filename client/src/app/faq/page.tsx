import { PageShell } from '@/components/PageShell';

const FAQ_ITEMS = [
  {
    question: 'What does this app do?',
    answer:
      'This app helps you look up US sales tax by ZIP code and date. It also lets admins add new tax-rate versions without overwriting history.',
  },
  {
    question: 'How is total tax calculated?',
    answer:
      'For a ZIP code, the service gets the active State rate, active County rate, and active City rates. Total is State + County + highest City rate for cities linked to that ZIP.',
  },
  {
    question: 'Why do I need to provide a date/time for lookup?',
    answer:
      'Rates are versioned over time. The app picks the latest rate where start_time is less than or equal to your requested timestamp, so you can query past or future effective dates.',
  },
  {
    question: 'What is the difference between Geography and Tax Lookup?',
    answer:
      'Geography helps you browse ZIP and city mapping data. Tax Lookup performs tax calculation for one ZIP at a specific time and shows the full breakdown.',
  },
  {
    question: 'Who can create or update tax rates?',
    answer:
      'Only admin users with the admin API key can add rate versions. Public/client pages are read-only and do not require admin permissions.',
  },
  {
    question: 'Why can a city have many ZIP codes?',
    answer:
      'A single city can map to multiple ZIP codes. On the Current Rates page, ZIP lists are summarized and you can open a modal to view all ZIP codes for a city.',
  },
];

export default function FaqPage() {
  return (
    <PageShell mainClassName="max-w-4xl">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">
          Help
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">FAQ</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Simple explanation of how the sales tax app works.
        </p>
      </header>

      <div className="space-y-4">
        {FAQ_ITEMS.map((item, index) => (
          <details
            key={item.question}
            className="group [&_summary::-webkit-details-marker]:hidden"
            open={index === 0}
          >
            <summary className="flex items-center justify-between gap-1.5 rounded-md border border-gray-100 bg-gray-50 p-4 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <h2 className="text-lg font-medium">{item.question}</h2>

              <svg
                className="size-5 shrink-0 transition-transform duration-300 group-open:-rotate-180"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>

            <p className="px-4 pt-4 text-gray-900 dark:text-white">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </PageShell>
  );
}
