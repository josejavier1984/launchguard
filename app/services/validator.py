import ipaddress


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

    if not isinstance(changes, list):
        return {
            "valid": False,
            "errors": [
                "DNS changes must be provided as a list."
            ],
        }

    if not changes:
        return {
            "valid": False,
            "errors": [
                "At least one DNS change is required."
            ],
        }

    seen_records = set()
    records_by_host = {}

    for index, change in enumerate(
        changes,
        start=1,
    ):
        if not isinstance(change, dict):
            errors.append(
                f"Change #{index}: DNS change must be an object."
            )
            continue

        record_type = str(
            change.get("type", "")
        ).strip().upper()

        host = str(
            change.get("host", "")
        ).strip()

        answer = str(
            change.get("answer", "")
        ).strip()

        ttl = change.get(
            "ttl",
            300,
        )

        priority = change.get(
            "priority"
        )

        if record_type not in ALLOWED_RECORD_TYPES:
            errors.append(
                f"Change #{index}: unsupported DNS record type "
                f"'{record_type}'."
            )

        if not answer:
            errors.append(
                f"Change #{index}: DNS answer is required."
            )

        if (
            not isinstance(ttl, int)
            or isinstance(ttl, bool)
            or ttl < 300
        ):
            errors.append(
                f"Change #{index}: TTL must be an integer "
                "of at least 300 seconds."
            )

        if not _valid_host(host):
            errors.append(
                f"Change #{index}: host contains invalid characters."
            )

        if record_type == "A":
            if not _valid_ip(
                answer,
                version=4,
            ):
                errors.append(
                    f"Change #{index}: A record must contain "
                    "a valid IPv4 address."
                )

        if record_type == "AAAA":
            if not _valid_ip(
                answer,
                version=6,
            ):
                errors.append(
                    f"Change #{index}: AAAA record must contain "
                    "a valid IPv6 address."
                )

        if record_type == "CNAME":
            if host == "":
                errors.append(
                    f"Change #{index}: CNAME cannot be created "
                    "at the root domain."
                )

        if record_type == "MX":
            if (
                not isinstance(priority, int)
                or isinstance(priority, bool)
                or priority < 0
                or priority > 65535
            ):
                errors.append(
                    f"Change #{index}: MX record requires "
                    "an integer priority between 0 and 65535."
                )

        record_key = (
            record_type,
            host,
            answer,
            ttl,
            priority,
        )

        if record_key in seen_records:
            errors.append(
                f"Change #{index}: duplicate DNS record "
                "already exists in this plan."
            )
        else:
            seen_records.add(
                record_key
            )

        if record_type:
            records_by_host.setdefault(
                host,
                set(),
            ).add(
                record_type
            )

    for host, record_types in records_by_host.items():
        if (
            "CNAME" in record_types
            and len(record_types) > 1
        ):
            display_host = (
                host
                if host
                else "@"
            )

            errors.append(
                f"Host '{display_host}' cannot contain a CNAME "
                "and another DNS record type in the same plan."
            )

    return {
        "valid": len(errors) == 0,
        "errors": errors,
    }


def _valid_ip(value, version):
    try:
        address = ipaddress.ip_address(
            value
        )

        return address.version == version

    except ValueError:
        return False


def _valid_host(host):
    if not isinstance(host, str):
        return False

    if host == "":
        return True

    if any(
        character.isspace()
        for character in host
    ):
        return False

    if "/" in host:
        return False

    if "://" in host:
        return False

    if len(host) > 253:
        return False

    return True