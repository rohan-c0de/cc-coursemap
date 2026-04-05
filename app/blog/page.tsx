import Link from "next/link";
import type { Metadata } from "next";
import {
  getAllArticles,
  getArticlesByCategory,
  getArticlesByState,
  categoryLabel,
  stateLabel,
  CATEGORIES,
} from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — CC CourseMap",
  description:
    "Practical guides for community college course planning, transfer credits, scheduling, and senior tuition waivers.",
};

type Props = {
  searchParams: Promise<{ category?: string; state?: string }>;
};

export default async function BlogIndexPage({ searchParams }: Props) {
  const { category, state } = await searchParams;

  let articles = getAllArticles();
  let filterLabel: string | null = null;

  if (category && CATEGORIES[category]) {
    articles = getArticlesByCategory(category);
    filterLabel = categoryLabel(category);
  } else if (state) {
    articles = getArticlesByState(state);
    filterLabel = stateLabel(state);
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://cc-coursemap.vercel.app";

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      { "@type": "ListItem", position: 2, name: "Blog" },
    ],
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Blog</h1>
      <p className="text-gray-600 mb-8">
        Practical guides for transfer credits, course planning, and community
        college navigation.
      </p>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/blog"
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            !category && !state
              ? "bg-teal-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All
        </Link>
        {Object.entries(CATEGORIES).map(([key, label]) => (
          <Link
            key={key}
            href={`/blog?category=${key}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              category === key
                ? "bg-teal-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Active filter indicator */}
      {filterLabel && (
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <span>
            Showing: <strong className="text-gray-900">{filterLabel}</strong>
          </span>
          <Link
            href="/blog"
            className="text-teal-600 hover:underline"
          >
            Clear
          </Link>
        </div>
      )}

      {/* Article list */}
      {articles.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-600">No articles yet in this category.</p>
          <Link
            href="/blog"
            className="mt-2 inline-block text-sm text-teal-600 hover:underline"
          >
            View all articles
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {articles.map((article) => (
            <article
              key={article.slug}
              className="group rounded-lg border border-gray-200 p-5 transition hover:border-teal-300 hover:shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Link
                  href={`/blog?category=${article.category}`}
                  className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition"
                >
                  {categoryLabel(article.category)}
                </Link>
                {article.state && (
                  <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                    {stateLabel(article.state)}
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {new Date(article.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <Link href={`/blog/${article.slug}`}>
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">
                  {article.title}
                </h2>
              </Link>
              <p className="mt-1 text-sm text-gray-600">
                {article.description}
              </p>
              <Link
                href={`/blog/${article.slug}`}
                className="mt-3 inline-block text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
              >
                Read more &rarr;
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
