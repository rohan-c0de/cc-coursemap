import Link from "next/link";

interface ProductCalloutProps {
  text: string;
  href: string;
  label: string;
}

export default function ProductCallout({ text, href, label }: ProductCalloutProps) {
  return (
    <div className="not-prose my-8 rounded-xl border border-teal-200 bg-teal-50 px-5 py-4">
      <p className="mb-3 text-sm text-teal-900">{text}</p>
      <Link
        href={href}
        className="inline-flex items-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
      >
        {label}
        <svg
          className="ml-2 h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
          />
        </svg>
      </Link>
    </div>
  );
}
