ALLOWED_RECORD_TYPES = {
    "A",
    "AAAA",
    "CNAME",
    "MX",
    "TXT",
    "SRV",
    "NS",
    "CAA",
}


def validate_changes(changes):
    errors = []

    for index, change in enumerate(changes, start=1):
        record_type = str(
            change.get("type", "")
        ).upper()

        ttl = change.get("ttl", 300)

        if record_type not in ALLOWED_RECORD_TYPES:
            errors.append(
                f"Change #{index}: unsupported DNS record type '{record_type}'."
            )

        if not isinstance(ttl, int) or ttl < 300:
            errors.append(
                f"Change #{index}: TTL must be an integer of at least 300 seconds."
            )

    return {
        "valid": len(errors) == 0,
        "errors": errors,
    }