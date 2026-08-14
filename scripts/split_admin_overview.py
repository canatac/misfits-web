#!/usr/bin/env python3
"""Boucle 5 — split AdminOverviewSections.tsx en sub-components.

Le fichier original a 7 blocs `{(activeTab === ...) && (<section...>...</section>)}` :
  S1 (L150-215) : AssistantSection
  S2 (L216-237) : SummaryCardsSection
  S3 (L238-436) : DiagnosticsGridSection (3 articles: Sécurité/Délivrabilité/Supervision)
  S4 (L437-515) : ProvidersBouncesSection
  S5 (L516-592) : AlertsIncidentsSection
  S6 (L593-617) : MonitoringLiveStreamSection
  S7 (L618-651) : SecurityLiveStreamSection

Ce script :
1. Lit le fichier original.
2. Extrait le JSX de chaque section (indenté 2 espaces → transformé en `return (…)` de sub-component).
3. Génère chaque fichier avec ses imports et son interface Props.
4. Ré-écrit AdminOverviewSections.tsx comme orchestrateur (juste les <SectionX ... />).
"""
import re
from pathlib import Path

SRC = Path("/root/misfits-web/src/components/admin/tabs/AdminOverviewSections.tsx")
OUT_DIR = Path("/root/misfits-web/src/components/admin/tabs/overview-sections")

lines = SRC.read_text().splitlines()

# Ranges (1-indexed inclusif) après inspection du fichier
sections = [
    ("AssistantSection", 150, 215, [
        "activeTab", "assistantLoading", "assistantPrompt", "setAssistantPrompt",
        "assistantAnswer", "assistantError", "askHermesForAdminPlan",
    ]),
    ("SummaryCardsSection", 216, 237, ["activeTab", "summaryCards"]),
    ("DiagnosticsGridSection", 238, 424, [
        "activeTab", "securityPosture", "deliverability", "observability",
    ]),
    ("ProvidersBouncesSection", 437, 515, [
        "activeTab", "monitoringProviders", "monitoringBounces",
    ]),
    ("AlertsIncidentsSection", 516, 592, [
        "activeTab", "securityActiveAlerts", "securityIncidents",
    ]),
    ("MonitoringLiveStreamSection", 593, 617, ["activeTab", "monitoringLive"]),
    ("SecurityLiveStreamSection", 618, 645, ["activeTab", "securityLive"]),
]

# Types disponibles depuis ./types.ts
PROP_TYPES = {
    "activeTab": "ActiveTabScope",
    "assistantLoading": "boolean",
    "assistantPrompt": "string",
    "setAssistantPrompt": "(v: string) => void",
    "assistantAnswer": "string",
    "assistantError": "string | null",
    "askHermesForAdminPlan": "() => void",
    "summaryCards": "readonly SummaryCard[]",
    "securityPosture": "LocalSecurityPosture | null",
    "deliverability": "LocalDeliverabilityDiag | null",
    "observability": "LocalObservabilityOverview | null",
    "monitoringProviders": "MonitoringProvider[]",
    "monitoringBounces": "SmtpEvent[]",
    "securityActiveAlerts": "SecurityAlert[]",
    "securityIncidents": "SecurityAlert[]",
    "monitoringLive": "MonitoringLive | undefined",
    "securityLive": "SecurityLive",
}

# Imports nécessaires par section (basé sur usage helpers/types)
SECTION_IMPORTS = {
    "AssistantSection": ['import { cn } from "@/lib/utils";', 'import { Badge } from "../../shared";'],
    "SummaryCardsSection": ['import { Badge } from "../../shared";'],
    "DiagnosticsGridSection": ['import { asInt, percent } from "../../shared";'],
    "ProvidersBouncesSection": ['import { Badge, asInt } from "../../shared";'],
    "AlertsIncidentsSection": ['import { Badge, asDate } from "../../shared";'],
    "MonitoringLiveStreamSection": ['import { Badge, asDate } from "../../shared";'],
    "SecurityLiveStreamSection": ['import { Badge, asDate } from "../../shared";'],
}

def gen_section(name, start, end, props):
    body = "\n".join(lines[start-1:end])
    # Dédent : ces sections sont indentées de 2 espaces au minimum
    body = "\n".join(l[2:] if l.startswith("  ") else l for l in body.splitlines())

    imports_types = [p for p in props if p in ("activeTab","summaryCards","securityPosture","deliverability","observability","monitoringLive","securityLive")]
    types_needed = set()
    for p in props:
        t = PROP_TYPES[p].replace("| null","").replace("| undefined","").strip()
        # extract bare type name(s)
        for tok in re.findall(r"[A-Z][A-Za-z_]+", t):
            types_needed.add(tok)

    types_imports = sorted(t for t in types_needed if t in {
        "ActiveTabScope","SummaryCard","LocalSecurityPosture","LocalDeliverabilityDiag",
        "LocalObservabilityOverview","MonitoringProvider","SmtpEvent","SecurityAlert",
        "MonitoringLive","SecurityLive",
    })

    props_iface = "\n".join(f"  {p}: {PROP_TYPES[p]};" for p in props)
    props_destr = ",\n  ".join(props)

    tpl = f'''"use client";
import React from "react";
{chr(10).join(SECTION_IMPORTS[name])}
import type {{ {", ".join(types_imports)} }} from "./types";

interface {name}Props {{
{props_iface}
}}

export function {name}({{
  {props_destr},
}}: {name}Props) {{
  return (
    <>
{body}
    </>
  );
}}
'''
    (OUT_DIR / f"{name}.tsx").write_text(tpl)
    return name

names = [gen_section(*s) for s in sections]
print("Generated:", names)

# Réécrit AdminOverviewSections.tsx comme orchestrateur
header = "\n".join(lines[:148])  # jusqu'à la fin de la function signature + '{'

section_calls = []
prop_map = {s[0]: s[3] for s in sections}
for name in names:
    props = prop_map[name]
    prop_line = " ".join(f"{p}={{{p}}}" for p in props)
    section_calls.append(f"      <{name} {prop_line} />")

body = f'''  return (
    <>
{chr(10).join(section_calls)}
      {{adminDataLoading && (
        <p className="text-xs text-[#A1A1AA]">
          Chargement des données admin backend…
        </p>
      )}}
      {{adminDataError && (
        <p className="text-xs text-[#FCA5A5]">
          Erreur backend admin: {{adminDataError}}
        </p>
      )}}
    </>
  );
}}
'''

# Remplacer les imports (garder types nécessaires) - on remplace tout le fichier
# On garde types.ts pour tout, importés
new_header = f'''"use client";
import React from "react";
import type {{ SecurityAlert }} from "@/types/security";
import type {{ MonitoringProvider, SmtpEvent }} from "@/types/monitoring";
import type {{
  ActiveTabScope,
  SummaryCard,
  LocalSecurityPosture,
  LocalDeliverabilityDiag,
  LocalObservabilityOverview,
  MonitoringLive,
  SecurityLive,
}} from "./overview-sections/types";
{chr(10).join(f'import {{ {n} }} from "./overview-sections/{n}";' for n in names)}

// Re-exports pour maintenir la compat des call-sites externes
export type {{ LocalSecurityPosture, LocalObservabilityOverview }};

interface AdminOverviewSectionsProps {{
  activeTab: ActiveTabScope;
  observability: LocalObservabilityOverview | null;
  securityPosture: LocalSecurityPosture | null;
  deliverability: LocalDeliverabilityDiag | null;
  adminDataLoading: boolean;
  adminDataError: string | null;
  securityLive: SecurityLive;
  monitoringLive?: MonitoringLive;
  assistantLoading: boolean;
  assistantPrompt: string;
  setAssistantPrompt: (v: string) => void;
  assistantAnswer: string;
  assistantError: string | null;
  askHermesForAdminPlan: () => void;
  summaryCards: readonly SummaryCard[];
  monitoringProviders?: MonitoringProvider[];
  monitoringBounces?: SmtpEvent[];
  securityActiveAlerts?: SecurityAlert[];
  securityIncidents?: SecurityAlert[];
}}

export function AdminOverviewSections({{
  activeTab,
  observability,
  securityPosture,
  deliverability,
  adminDataLoading,
  adminDataError,
  securityLive,
  monitoringLive,
  assistantLoading,
  assistantPrompt,
  setAssistantPrompt,
  assistantAnswer,
  assistantError,
  askHermesForAdminPlan,
  summaryCards,
  monitoringProviders = [],
  monitoringBounces = [],
  securityActiveAlerts = [],
  securityIncidents = [],
}}: AdminOverviewSectionsProps) {{
'''

SRC.write_text(new_header + body)
print("Rewrote", SRC)
