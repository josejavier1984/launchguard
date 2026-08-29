from dataclasses import dataclass, asdict
from typing import Optional


@dataclass
class DNSChange:
    type: str
    host: str
    answer: str
    ttl: int = 300
    priority: Optional[int] = None

    def to_dict(self):
        return asdict(self)


@dataclass
class DNSPlan:
    summary: str
    risk_level: str
    changes: list[DNSChange]

    def to_dict(self):
        return {
            "summary": self.summary,
            "risk_level": self.risk_level,
            "changes": [
                change.to_dict()
                for change in self.changes
            ],
        }