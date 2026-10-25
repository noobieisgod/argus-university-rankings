# Build and publication validation

ARGUS distinguishes local data validation from checks that can run in a public clone.

## Local checks

The finalized private dataset contains 237 institutions. The generated website contains 249 pages. The sitemap contains 248 indexable routes and excludes the comparison tool. Category pages preserve full-universe ranks: Prestige 228, Outcomes 234, Student Experience 231 and Learning Environment 231 ranked institutions. Thirteen institutions are Overall NR; their profiles remain included. Specialty membership follows the finalized eligibility records rather than Overall rank.

Before release, local checks compare the unchanged four exported JSON files with the saved master workbook, validate exact ranks, scores, ties and NR membership, and test deterministic output. The master is read without saving or recalculating it.

Project-path checks verify the same site beneath `/argus-university-rankings/`, including all internal links and local photographs. Browser checks cover sorting, combined filters, keyboard selection, comparison, responsive layout and representative image crops. Local checks do not establish that a public deployment works.

## Public checks

The reviewed source package will provide portable syntax and synthetic interaction tests. Full numerical reproduction is unavailable from the public repository because raw publisher inputs remain private.

A publication artifact must contain exactly the reviewed pages and assets. A checksum manifest binds approval to the actual bytes. Extra files, missing assets, altered HTML or an incorrect approval hash fail validation. Generated HTML belongs on `gh-pages`, not `main`.

Deployment is manually dispatched for the exact approved publication commit. After deployment, every public route and photograph must be fetched and checked, and browser interactions must be inspected on the actual public URL. A critical first-release defect disables Pages pending correction.

## Rights and operational gates

Technical test success is not permission to publish third-party material. Each photograph needs a source, credit, applicable permission, required notices, modification record and reviewed checksum. Underlying artwork rights must be considered separately from a photographer's license where relevant.

Publisher-data exposures, including derived results, need documented review before launch. Source citations do not clear redistribution rights. The linked Scribd reproduction is not included in this repository.

Unattended execution is verified only after an actual scheduled GitHub push and a later scheduled checkpoint recovery. A human-triggered push, private bare-Git test or mocked network check cannot satisfy that gate.
