import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import ProductCallout from "@/components/blog/ProductCallout";

export function useMDXComponents(
  components: MDXComponents
): MDXComponents {
  return {
    // Use Next.js Link for internal links, external links open in new tab
    a: ({ href, children, ...props }) => {
      if (href?.startsWith("/")) {
        return (
          <Link href={href} {...props}>
            {children}
          </Link>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    },
    // Custom blog components available in MDX files
    ProductCallout,
    ...components,
  };
}
