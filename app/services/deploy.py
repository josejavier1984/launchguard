from app.services.snapshots import SnapshotStore


def safe_deploy(client, domain, changes):
    current_records = client.list_dns_records(domain)["records"]

    snapshot = SnapshotStore().create_snapshot(
        domain,
        current_records,
    )

    created = []

    for change in changes:
        created_record = client.create_dns_record(
            domain=domain,
            record_type=change["type"],
            host=change.get("host", ""),
            answer=change["answer"],
            ttl=change.get("ttl", 300),
            priority=change.get("priority"),
        )

        created.append(created_record)

    resulting_records = client.list_dns_records(domain)["records"]

    resulting_ids = {
        record.get("id")
        for record in resulting_records
    }

    verification = []

    for record in created:
        verified = record.get("id") in resulting_ids

        verification.append(
            {
                "id": record.get("id"),
                "type": record.get("type"),
                "host": record.get("host", ""),
                "answer": record.get("answer"),
                "verified": verified,
            }
        )

    all_verified = all(
        item["verified"]
        for item in verification
    )

    return {
        "snapshot": snapshot,
        "created": created,
        "verification": verification,
        "verified": all_verified,
    }