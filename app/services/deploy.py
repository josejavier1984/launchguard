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

    return {
        "snapshot": snapshot,
        "created": created,
    }