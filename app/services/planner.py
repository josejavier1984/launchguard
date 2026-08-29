import os
from typing import Literal

from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel, Field


load_dotenv()


class DNSChange(BaseModel):
    type: Literal[
        "A",
        "AAAA",
        "CNAME",
        "MX",
        "TXT",
        "SRV",
        "NS",
        "CAA",
    ]

    host: str
    answer: str

    ttl: int = Field(
        default=300,
        ge=300,
    )

    priority: int | None = None


class DNSPlan(BaseModel):
    summary: str

    risk_level: Literal[
        "low",
        "medium",
        "high",
    ]

    changes: list[DNSChange]

    def to_dict(self):
        return self.model_dump()


def generate_dns_plan(domain, intent):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is missing from the environment."
        )

    client = genai.Client(
        api_key=api_key,
    )

    prompt = f"""
You are the DNS planning engine for LaunchGuard.

LaunchGuard is a safety-oriented DomainOps application.
Your job is ONLY to convert the user's deployment intent
into a proposed DNS configuration plan.

DOMAIN:
{domain}

USER INTENT:
{intent}

RULES:

1. Never execute anything.
2. Never claim that DNS changes have already been applied.
3. Only propose DNS records.
4. Allowed record types:
   A, AAAA, CNAME, MX, TXT, SRV, NS, CAA.
5. TTL must never be lower than 300 seconds.
6. Represent the root domain host as an empty string.
7. Use "www" as the host when the user explicitly asks
   for the www hostname.
8. Do not invent unrelated DNS changes.
9. Prefer the smallest set of DNS changes necessary.
10. Assign a risk level:
    - low: additive, straightforward change
    - medium: replacement or potentially disruptive change
    - high: likely to affect email, delegation, or critical DNS
11. Your output must conform exactly to the provided schema.

Example:

User intent:
Point my website to 192.0.2.50 and make www work.

Expected conceptual plan:

A      root    192.0.2.50
CNAME  www     {domain}

Generate the proposed LaunchGuard DNS plan.
"""

    interaction = client.interactions.create(
        model="gemini-3.6-flash",
        input=prompt,
        response_format=[
            {
                "type": "text",
                "mime_type": "application/json",
                "schema": DNSPlan.model_json_schema(),
            }
        ],
    )

    return DNSPlan.model_validate_json(
        interaction.output_text
    )