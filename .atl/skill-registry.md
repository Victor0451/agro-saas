# Skill Registry — AgroERP (Gentle AI)

> This registry is the **index** of available skills for SDD and non-SDD tasks.
> Sub-agents receive exact `SKILL.md` paths — read the source file, not this summary.

## Project Info

- **Project**: agro-saas
- **Registry version**: 1.0.0
- **Updated**: 2026-06-19
- **Source of truth**: This file (`.atl/skill-registry.md`) and Engram `skill-registry` observation

---

## SDD Skills (global — opencode)

| Name | Trigger | Scope | Path |
|---|---|---|---|
| sdd-init | `sdd init`, `openspec init`, `iniciar sdd` | global | `/home/vlongo/.config/opencode/skills/sdd-init/SKILL.md` |
| sdd-explore | orchestrator launches explore | global | `/home/vlongo/.config/opencode/skills/sdd-explore/SKILL.md` |
| sdd-propose | orchestrator launches proposal | global | `/home/vlongo/.config/opencode/skills/sdd-propose/SKILL.md` |
| sdd-spec | orchestrator launches spec | global | `/home/vlongo/.config/opencode/skills/sdd-spec/SKILL.md` |
| sdd-design | orchestrator launches design | global | `/home/vlongo/.config/opencode/skills/sdd-design/SKILL.md` |
| sdd-tasks | orchestrator launches tasks | global | `/home/vlongo/.config/opencode/skills/sdd-tasks/SKILL.md` |
| sdd-apply | orchestrator launches apply | global | `/home/vlongo/.config/opencode/skills/sdd-apply/SKILL.md` |
| sdd-verify | orchestrator launches verify | global | `/home/vlongo/.config/opencode/skills/sdd-verify/SKILL.md` |
| sdd-archive | orchestrator launches archive | global | `/home/vlongo/.config/opencode/skills/sdd-archive/SKILL.md` |
| sdd-onboard | orchestrator launches onboarding | global | `/home/vlongo/.config/opencode/skills/sdd-onboard/SKILL.md` |
| skill-registry | `actualizar skills`, skill changes | global | `/home/vlongo/.config/opencode/skills/skill-registry/SKILL.md` |
| skill-creator | new skills, agent instructions | global | `/home/vlongo/.config/opencode/skills/skill-creator/SKILL.md` |
| skill-improver | improve skills, audit skills | global | `/home/vlongo/.config/opencode/skills/skill-improver/SKILL.md` |
| judgment-day | dual review, adversarial review | global | `/home/vlongo/.config/opencode/skills/judgment-day/SKILL.md` |
| branch-pr | creating PRs, PR preparation | global | `/home/vlongo/.config/opencode/skills/branch-pr/SKILL.md` |
| chained-pr | oversized PRs, stacked PRs | global | `/home/vlongo/.config/opencode/skills/chained-pr/SKILL.md` |
| issue-creation | GitHub issues, bug reports | global | `/home/vlongo/.config/opencode/skills/issue-creation/SKILL.md` |
| comment-writer | PR feedback, reviews, comments | global | `/home/vlongo/.config/opencode/skills/comment-writer/SKILL.md` |
| work-unit-commits | commit splitting, chained PRs | global | `/home/vlongo/.config/opencode/skills/work-unit-commits/SKILL.md` |

## Project Skills (agro-saas — .agents/skills/)

| Name | Trigger | Scope | Path |
|---|---|---|---|
| next-best-practices | Next.js 16, App Router, RSC, async patterns, data fetching | project | `/run/media/vlongo/Archivos/Projectos/agro-saas/.agents/skills/next-best-practices/SKILL.md` |
| supabase-postgres-best-practices | Postgres queries, schema design, RLS, connection management, indexing | project | `/run/media/vlongo/Archivos/Projectos/agro-saas/.agents/skills/supabase-postgres-best-practices/SKILL.md` |
| typescript-advanced-types | Generics, conditional types, mapped types, type-safe APIs | project | `/run/media/vlongo/Archivos/Projectos/agro-saas/.agents/skills/typescript-advanced-types/SKILL.md` |
| vercel-react-best-practices | React performance, bundle optimization, re-renders, data fetching | project | `/run/media/vlongo/Archivos/Projectos/agro-saas/.agents/skills/vercel-react-best-practices/SKILL.md` |
| web-design-guidelines | UI review, accessibility, UX audit, design check | project | `/run/media/vlongo/Archivos/Projectos/agro-saas/.agents/skills/web-design-guidelines/SKILL.md` |

## Additional User Skills (global — opencode)

| Name | Trigger | Scope | Path |
|---|---|---|---|
| omarchy | Hyprland, window manager, waybar, Linux desktop config | user | `/home/vlongo/.claude/skills/omarchy/SKILL.md` |
| go-testing | Go tests, coverage, golden files | global | `/home/vlongo/.config/opencode/skills/go-testing/SKILL.md` |
| cognitive-doc-design | guides, READMEs, RFCs, architecture docs | global | `/home/vlongo/.config/opencode/skills/cognitive-doc-design/SKILL.md` |

## Skill Resolution Order

1. Session cache (if present in launch prompt)
2. Engram `skill-registry` observation
3. This file (`.atl/skill-registry.md`)
4. Global opencode skills at `~/.config/opencode/skills/`

## Notes

- Obsidian vault at `/run/media/vlongo/Archivos/obsidian/Projectos/AGRO-SAAS/` is the source of truth for human-facing documentation.
- Do NOT store human docs in OpenSpec — OpenSpec is for SDD artifacts only.
- SDD skills are loaded by the orchestrator; project skills should be loaded when relevant to the task context.
