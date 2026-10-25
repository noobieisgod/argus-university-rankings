# ARGUS

Aggregate Ranking of General University Standing (ARGUS) combines published institution-level inputs into its own Overall and specialty rankings.

## Publication status
[Visit the ARGUS website](https://noobieisgod.github.io/argus-university-rankings/). The published website covers 237 institutions, with 224 Overall-ranked and 13 Overall NR institutions.

Some inputs remain private and request only due to copyright. This repository contains website source and licensed campus photographs. Full data-dependent reproduction requires the private inputs and is not available from a public clone alone.

See the [website source instructions](site/README.md) for public checks and private build prerequisites. The [external WSJ research citation](THIRD_PARTY_NOTICES.md#external-source-reference) is a link only due to copyright. See "Reduced public view and data requests" section at the bottom to read more about this.

## Overall methodology

| Category | Overall weight |
| --- | ---: |
| Career Outcomes | 35% |
| Prestige | 20% |
| Student Experience | 35% |
| Learning Environment | 10% |

### Career Outcomes

Base component weights within Career are College Scorecard earnings 31.25%, PayScale bachelor's-only mid-career pay 25%, WSJ Salary Impact 25%, and WSJ Preparation for Career 18.75%. Earnings use fixed benchmark-based logarithmic transformations, not target-list percentiles. Convert earnings and benchmarks to the documented common dollar year. Missing-input redistribution is allowed only within Career: both earnings inputs must exist, or one earnings input must exist together with both WSJ career scores. Rescale available components proportionally. Otherwise Career is unsupported. The earnings curve is `clamp(50 + 40 * log2(earnings / benchmark), 0, 100)`. The frozen Scorecard benchmark is 82056; the PayScale benchmark is 87000 in 2024 dollars, or 89289.20363799814 in common 2025 dollars. Scorecard earnings are originally 2022 dollars. Preserve the finalized CPI conversion factors rather than updating them during a website build.

### Prestige

Within Prestige, historical actual/estimated U.S. News standing contributes 40%, acceptance score 30%, and pooled IPEDS yield score 30%. History uses the 2027/2026/2025 edition window with intended weights of 60%/25%/15%. Use each observation's actual National/Regional category and redistribute over supported editions within that window, with at least one supported observation. Do not invent National ranks for Regional institutions. National standing uses the frozen National curve; eligible Regional University ranks 1–30 use the frozen experimental bridge. Its documented uncertainty is not a prediction interval. National rank/score anchors are `1:100, 5:96, 10:92, 20:84, 30:76, 40:70, 50:64, 75:52, 100:40`, interpolated linearly. Above rank 100, use `max(0, 40 - 0.48 * (rank - 100))`. Regional estimates retain the frozen intercept 49.819083943184204 and log slope -15.621603224331466, range 1–30, and original experimental/rejection evidence; they are not actual National rankings. Acceptance score is `100 * (1 - sqrt(acceptance rate))`. Yield score is `100 * sqrt(sum(enrollees) / sum(admits))`.

Prefer each institution's latest available Common Data Set acceptance figure, including reviewed CDS-derived summaries where permitted by the evidence policy. When CDS acceptance is unavailable, the approved fallback is U.S. News undergraduate acceptance with its own provenance and edition/cohort when known. Do not relabel it CDS or infer a publisher edition. The Caltech, Duke and Pittsburgh fallback rates were supplied by the user and have **not been independently verified**; ordinary U.S. News website links do not upgrade that evidence state. Yield alone uses pooled campus-specific IPEDS 2022/2023/2024 counts. Pool counts rather than averaging percentages. No older-CDS field backfill or IPEDS substitution for active acceptance is allowed.

### Student Experience

First priority is an actual Princeton Review Quality of Life rating and WSJ Recommendation, weighted 56.25%/43.75%. If PR is missing, the approved Niche Campus grade can pair with WSJ Recommendation at those weights. If WSJ Recommendation is missing, actual PR can pair with Campus at those weights. Campus alone is insufficient. It is an observed proxy, not a predicted PR rating.

### Learning Environment

A complete WSJ Learning Opportunities/Facilities pair contributes 60%/40%. If either is missing, substitute the whole approved Niche Academics/Professors pair at 60%/40%; do not mix WSJ and Niche components. Missing required proxies produce NR. Niche Professors is not a physical-facilities measure.

## Specialty rankings

- **STEM:** Engineering 30%, Computer Science 30%, Chemistry 10%, Mathematics 10%, Physics 10%, Biology 10%. Engineering and CS require primary or approved corresponding Niche fallback support. Renormalize available field weights, then deduct two points per science missing from both source routes, at most eight points; clamp at zero. Unresolved evidence is not confirmed absence.
- **Business:** eligible owned full-time MBA unit and designated U.S. News MBA rank; no undergraduate-business or professional Niche fallback.
- **Law:** eligible owned JD unit and designated U.S. News law rank; Princeton Review and LawHub do not score. LawHub outcomes are contextual only.
- **Medical:** qualifying owned MD/DO programs use the designated Admit MD/DO source and frozen campus-mapping/aggregation rules. Do not transfer ranks from independent institutions.

Specialties use the frozen specialty rank-to-score anchors, not the steeper Overall National-standing curve. Numerical rank bands use their midpoint. Legitimate zeroes count as observed data. No candidate-list min/max scaling, percentile conversion or z-score normalization is introduced. Specialty rank/score anchors are `1:100, 5:98, 10:96, 20:92, 30:88, 40:85, 50:82, 75:76, 100:70, 200:50, 300:35, 500:15, 1000:5, 2000:0`. Interpolate linearly between anchors and clamp at zero beyond rank 2000.

## Missing data, ties and scope

Scope includes supported National and Regional Universities, not Liberal Arts Colleges or Regional Colleges. Overall requires every category's support/eligibility gates. No redistribution across Overall categories is allowed. NR is not zero and does not assert poor quality. Retain the recorded missing/eligibility reason. Category ranks include every candidate with a supported category score, including Overall NR institutions. Coverage measures intended source availability, not a statistical confidence interval. Sort by unrounded scores. Each tie group spans at most 0.50 points from its highest-scoring member, with competition ranks and no chained ties. Positions can change when membership changes; fixed input versions and parameters preserve numerical scores.

## Admissions display and website corrections

SAT and high-school GPA have zero scoring weight. Missing website values display as Not Reported; preserve detailed original evidence states. Do not assume a GPA scale or weighting. Reported SAT composites take priority. Otherwise compatible Math and Reading/Writing statistics may be summed for display and labeled derived, not a reported composite statistic. A single available section remains explicitly labeled Math or R&W. Do not combine incompatible statistics. Website-only SAT/GPA corrections are recorded separately from the frozen export, currently including MIT's official CDS recheck. They do not modify scores or ranks. The exported methodology and website display rules must be distinguished rather than silently conflated.

## Code, sources and rights

Source editions are retained in the private evidence records and reviewed public citations. Publisher versions can differ by metric; this is not a real-time admissions feed. Source attribution is not a redistribution license. ARGUS-derived results also require publication review when based on third-party data. The existing MIT LICENSE applies to ARGUS-authored code and documentation, not third-party photographs or publisher data. See [third-party notices](THIRD_PARTY_NOTICES.md) and the [publication process](docs/PUBLICATION.md). Photo licenses and required credits remain attached to each approved image; share-alike conditions apply to relevant photo adaptations. No publisher or university endorsement is implied.

## Reduced public view and data requests

The public release uses `ARGUS_PUBLICATION_PROFILE=minimal`: ARGUS results, institutional CDS facts, locations and citations, without publisher input tables, raw ratings or original JSON downloads. The three supplied acceptance rates above remain unverified privately; their public admissions values are withheld rather than labeled Not Reported. Calculations and rankings are unchanged. [Underlying data requests](docs/DATA_ACCESS.md) are reviewed individually and fulfilled only where redistribution is permitted; otherwise source/access instructions are provided. Request-only access is not a license. Third-party rights are distinct from the repository's code license.
