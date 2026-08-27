import os

import requests
from dotenv import load_dotenv


load_dotenv()


class NameComClient:
    def __init__(self):
        self.username = os.getenv("NAMECOM_USERNAME")
        self.token = os.getenv("NAMECOM_TOKEN")
        self.base_url = os.getenv(
            "NAMECOM_BASE_URL",
            "https://api.dev.name.com",
        )

        if not self.username or not self.token:
            raise RuntimeError(
                "Name.com credentials are missing from the environment."
            )

    def hello(self):
        response = requests.get(
            f"{self.base_url}/core/v1/hello",
            auth=(self.username, self.token),
            timeout=20,
        )

        response.raise_for_status()
        return response.json()

    def check_availability(self, domain):
        response = requests.post(
            f"{self.base_url}/core/v1/domains:checkAvailability",
            auth=(self.username, self.token),
            json={
                "domainNames": [domain],
                "purchaseType": "registration",
            },
            timeout=20,
        )

        response.raise_for_status()
        return response.json()

    def register_domain(self, domain, years=1):
        response = requests.post(
            f"{self.base_url}/core/v1/domains",
            auth=(self.username, self.token),
            headers={
                "X-Idempotency-Key": f"launchguard-{domain}-{years}",
            },
            json={
                "domain": {
                    "domainName": domain,
                    "autorenewEnabled": True,
                    "locked": True,
                    "privacyEnabled": True,
                },
                "years": years,
                "purchaseType": "registration",
            },
            timeout=30,
        )

        response.raise_for_status()
        return response.json()

    def list_dns_records(self, domain):
        response = requests.get(
            f"{self.base_url}/core/v1/domains/{domain}/records",
            auth=(self.username, self.token),
            timeout=20,
        )

        response.raise_for_status()
        return response.json()

    def create_dns_record(self, domain, record_type, host, answer, ttl=300, priority=None):
        payload = {
            "type": record_type,
            "host": host,
            "answer": answer,
            "ttl": ttl,
        }

        if priority is not None:
            payload["priority"] = priority

        response = requests.post(
            f"{self.base_url}/core/v1/domains/{domain}/records",
            auth=(self.username, self.token),
            json=payload,
            timeout=20,
        )

        response.raise_for_status()
        return response.json()