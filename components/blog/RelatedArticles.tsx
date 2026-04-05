import Link from "next/link";
import type { ArticleMeta } from "@/lib/blog";
import { categoryLabel } from "@/lib/blog";

interface RelatedArticlesProps {
  articles: ArticleMeta[];
  currentSlug: string;
}

export default function RelatedArticles({
  articles,
  currentSlug,
}: RelatedArticlesProps) {
  const others = articles.filter((a) => a.slug !== currentSlug);
  if (others.length === 0) return null;

  return (
    <div className="mt-12 border-t border-gray-200 pt-8">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Related Articles
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {others.map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="group rounded-lg border border-gray-200 p-4 transition hover:border-teal-300 hover:bg-teal-50/50"
          >
            <span className="mb-1 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {categoryLabel(article.category)}
            </span>
            <h3 className="mt-1 text-sm font-semibold text-gray-900 group-hover:text-teal-700">
              {article.title}
            </h3>
            <p className="mt-1 text-xs text-gray-500 line-clamp-2">
              {article.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
