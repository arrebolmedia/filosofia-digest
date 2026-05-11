export interface EditionItem {
  badge: string;
  badgeColor: string;
  source: string;
  title: string;
  paragraphs: string[];
  keywords: string[];
}

export interface ParsedEdition {
  issue: string;
  date: string;
  module: string;
  editorial: string[];
  items: EditionItem[];
}

const stripTags = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .trim();

export function parseEditionHtml(html: string): ParsedEdition {
  const issue = html.match(/<p class="issue">(#\d+)<\/p>/)?.[1] ?? "";
  const date = html.match(/<p class="date">([^<]+)<\/p>/)?.[1] ?? "";
  const module = html.match(/<p class="module-label">([^<]+)<\/p>/)?.[1] ?? "";

  // Editorial block — use [\s\S] instead of dotAll flag
  const editorialBlock =
    html.match(/<div class="editorial">([\s\S]*?)<\/div>/)?.[1] ?? "";
  const editorial = [...editorialBlock.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(
    (m) => stripTags(m[1])
  );

  // Items — split on opening tag, no regex needed
  const parts = html.split('<div class="item">').slice(1);
  const items: EditionItem[] = parts.map((part) => {
    const badgeMatch = part.match(
      /<span class="badge"[^>]*style="color:([^"]+)"[^>]*>([^<]+)<\/span>/
    );
    const sourceMatch = part.match(/<span class="source">([^<]+)<\/span>/);
    const titleMatch = part.match(/<h2 class="item-title">([^<]+)<\/h2>/);
    const paras = [
      ...part.matchAll(/<p class="syn-para">([\s\S]*?)<\/p>/g),
    ].map((m) => stripTags(m[1]));
    const kws = [...part.matchAll(/<span class="kw">([^<]+)<\/span>/g)].map(
      (m) => m[1].trim()
    );

    return {
      badge: badgeMatch?.[2]?.trim() ?? "",
      badgeColor: badgeMatch?.[1]?.trim() ?? "#8A8580",
      source: sourceMatch?.[1]?.trim() ?? "",
      title: titleMatch?.[1]?.trim() ?? "",
      paragraphs: paras,
      keywords: kws,
    };
  });

  return { issue, date, module, editorial, items };
}
