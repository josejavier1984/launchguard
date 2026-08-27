def _record_key(record):
    return (
        record.get("type"),
        record.get("host", ""),
        record.get("answer"),
        record.get("ttl", 300),
        record.get("priority"),
    )


def compare_dns_states(current_records, snapshot_records):
    current_map = {
        _record_key(record): record
        for record in current_records
    }

    snapshot_map = {
        _record_key(record): record
        for record in snapshot_records
    }

    to_delete = [
        record
        for key, record in current_map.items()
        if key not in snapshot_map
    ]

    to_create = [
        record
        for key, record in snapshot_map.items()
        if key not in current_map
    ]

    return {
        "to_delete": to_delete,
        "to_create": to_create,
    }

def execute_rollback(client, domain, snapshot_records):
    current_records = client.list_dns_records(domain)["records"]

    plan = compare_dns_states(
        current_records,
        snapshot_records,
    )

    deleted = []
    created = []

    for record in plan["to_delete"]:
        client.delete_dns_record(
            domain,
            record["id"],
        )

        deleted.append(record)

    for record in plan["to_create"]:
        created_record = client.create_dns_record(
            domain=domain,
            record_type=record["type"],
            host=record.get("host", ""),
            answer=record["answer"],
            ttl=record.get("ttl", 300),
            priority=record.get("priority"),
        )

        created.append(created_record)

    return {
        "deleted": deleted,
        "created": created,
    }