/**
 * Properties that will be passed to each page component.
 *
 * @example
 * export function Page({ searchQuery }: PageProps) {
 *  return <div>{searchQuery}</div>;
 * }
 */
export interface PageProps {
  searchQuery: Record<string, string | null | boolean>;
  params: Record<string, string>;
}
