const articleProsePattern = /(<div class="article-prose"[^>]*>)([\s\S]*?)(<\/div>\s*(?=<aside class="sources"|<footer class="article-footer"))/u;

export function getHtmlAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "iu"));
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

export function getArticleProseHtml(html) {
  return html.match(articleProsePattern)?.[2] ?? null;
}

export function isExternalHttpHref(href, siteUrl) {
  let destination;
  try {
    destination = new URL(href, siteUrl);
  } catch {
    return false;
  }

  return /^https?:$/u.test(destination.protocol) && destination.origin !== new URL(siteUrl).origin;
}

function setHtmlAttribute(tag, name, value) {
  const pattern = new RegExp(`\\s${name}\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+)`, "iu");
  if (pattern.test(tag)) return tag.replace(pattern, ` ${name}="${value}"`);
  return tag.replace(/>$/u, ` ${name}="${value}">`);
}

export function transformExternalArticleLinks(html, siteUrl) {
  let externalLinkCount = 0;
  const match = html.match(articleProsePattern);
  if (!match) return { html, articleProseFound: false, externalLinkCount };

  const transformedProse = match[2].replace(/<a\b[^>]*>/giu, (tag) => {
    const href = getHtmlAttribute(tag, "href");
    if (!href || !isExternalHttpHref(href, siteUrl)) return tag;

    const existingRel = (getHtmlAttribute(tag, "rel") ?? "").split(/\s+/u).filter(Boolean);
    const rel = [...new Set([...existingRel, "noopener", "noreferrer"])].join(" ");
    externalLinkCount += 1;

    return setHtmlAttribute(setHtmlAttribute(tag, "target", "_blank"), "rel", rel);
  });

  return {
    html: html.replace(articleProsePattern, (_block, openingTag, _prose, closingTag) => (
      `${openingTag}${transformedProse}${closingTag}`
    )),
    articleProseFound: true,
    externalLinkCount
  };
}
