const SITE_URL = "https://drboitumelowellness.co.za";

const BOT_USER_AGENTS = [
  "facebookexternalhit",
  "Facebot",
  "Twitterbot",
  "WhatsApp",
  "LinkedInBot",
  "Slackbot",
  "TelegramBot",
  "Discordbot",
  "Pinterestbot",
  "Embedly",
  "Quora Link Preview",
  "Showyoubot",
  "vkShare",
  "Slurp",
  "redditbot",
  "Applebot",
  "ia_archiver",
];

function isBot(userAgent) {
  if (!userAgent) return false;
  return BOT_USER_AGENTS.some((bot) =>
    userAgent.toLowerCase().includes(bot.toLowerCase())
  );
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const config = {
  matcher: "/blog/:path*",
};

export default async function middleware(request) {
  const userAgent = request.headers.get("user-agent") || "";

  if (!isBot(userAgent)) {
    return;
  }

  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter(Boolean);

  if (pathParts.length !== 2 || pathParts[0] !== "blog") {
    return;
  }

  const slug = pathParts[1];
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_articles?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=title,excerpt,featured_image,author,category,published_at`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!response.ok) return;

    const articles = await response.json();
    if (!articles || articles.length === 0) return;

    const article = articles[0];
    const title = escapeHtml(article.title);
    const description = escapeHtml(article.excerpt || "Read this article on Dr. Boitumelo Wellness");
    const image = article.featured_image || `${SITE_URL}/Logo.png`;
    const articleUrl = `${SITE_URL}/blog/${slug}`;
    const author = escapeHtml(article.author || "Dr. Boitumelo Phetla");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | Dr. Boitumelo Wellness</title>
  <meta name="description" content="${description}" />
  <meta name="author" content="${author}" />

  <meta property="og:type" content="article" />
  <meta property="og:url" content="${articleUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Dr. Boitumelo Wellness" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${articleUrl}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />

  <meta http-equiv="refresh" content="0;url=${articleUrl}" />
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <p>By ${author}</p>
  <a href="${articleUrl}">Read full article</a>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=UTF-8",
        "cache-control": "public, max-age=300",
      },
    });
  } catch (error) {
    return;
  }
}
