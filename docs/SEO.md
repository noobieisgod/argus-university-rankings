# Search and analytics

Production uses explicit ARGUS_SITE_ORIGIN, ARGUS_BASE_PATH, ARGUS_CLOUDFLARE_TOKEN and ARGUS_GOOGLE_SITE_VERIFICATION build settings. Tokens embedded in HTML are public site identifiers, not account API credentials. Local origins never load analytics.

The 249 HTML pages have unique metadata. The 248-URL sitemap excludes the noindex comparison tool. Four category pages render published category ranks without JavaScript; legacy sort query links still work and canonicalize to their clean page path. Breadcrumbs use microdata.

Cloudflare tracks aggregate page views and performance, not custom events or form selections. SPA navigation tracking is disabled. Privacy details are on the methodology page. Original image bytes and rankings are unchanged.

Full builds and dataset-dependent checks require private hash-pinned inputs and remain local. Public CI runs portable syntax and synthetic interaction checks; deployment validates the exact approved static manifest. Search Console ownership uses a persistent homepage HTML tag, and the project sitemap is submitted separately. Search indexing and analytics reporting are not immediate or guaranteed.
