from flask import Blueprint, jsonify, render_template, request

from app.services.deploy import safe_deploy
from app.services.namecom import NameComClient
from app.services.planner import generate_dns_plan
from app.services.validator import validate_changes


main = Blueprint("main", __name__)


@main.route("/")
def index():
    return render_template("index.html")


@main.route("/api/plan", methods=["POST"])
def create_plan():
    data = request.get_json(silent=True) or {}

    domain = str(data.get("domain", "")).strip()
    intent = str(data.get("intent", "")).strip()

    if not domain:
        return jsonify(
            {
                "ok": False,
                "error": "Domain is required.",
            }
        ), 400

    if not intent:
        return jsonify(
            {
                "ok": False,
                "error": "Deployment intent is required.",
            }
        ), 400

    try:
        plan = generate_dns_plan(
            domain=domain,
            intent=intent,
        )

        plan_data = plan.to_dict()

        validation = validate_changes(
            plan_data["changes"]
        )

        return jsonify(
            {
                "ok": True,
                "domain": domain,
                "intent": intent,
                "plan": plan_data,
                "validation": validation,
            }
        )

    except Exception as exc:
        return jsonify(
            {
                "ok": False,
                "error": "Unable to generate DNS plan.",
                "details": str(exc),
            }
        ), 500


@main.route("/api/deploy", methods=["POST"])
def deploy_plan():
    data = request.get_json(silent=True) or {}

    domain = str(data.get("domain", "")).strip()
    changes = data.get("changes")

    if not domain:
        return jsonify(
            {
                "ok": False,
                "error": "Domain is required.",
            }
        ), 400

    if not isinstance(changes, list) or not changes:
        return jsonify(
            {
                "ok": False,
                "error": "At least one DNS change is required.",
            }
        ), 400

    validation = validate_changes(changes)

    if not validation["valid"]:
        return jsonify(
            {
                "ok": False,
                "error": "DNS plan failed validation.",
                "validation": validation,
            }
        ), 400

    try:
        client = NameComClient()

        current_records = client.list_dns_records(
            domain
        )["records"]

        current_keys = {
            (
                record.get("type"),
                record.get("host", ""),
                record.get("answer"),
                record.get("ttl", 300),
                record.get("priority"),
            )
            for record in current_records
        }

        pending_changes = []

        for change in changes:
            normalized_change = {
                "type": change["type"],
                "host": change.get("host", ""),
                "answer": change["answer"],
                "ttl": change.get("ttl", 300),
                "priority": change.get("priority"),
            }

            change_key = (
                normalized_change["type"],
                normalized_change["host"],
                normalized_change["answer"],
                normalized_change["ttl"],
                normalized_change["priority"],
            )

            if change_key not in current_keys:
                pending_changes.append(
                    normalized_change
                )

        if not pending_changes:
            return jsonify(
                {
                    "ok": True,
                    "message": "DNS already matches the approved plan.",
                    "already_present": len(changes),
                    "deployed": False,
                    "verified": True,
                }
            )

        result = safe_deploy(
            client=client,
            domain=domain,
            changes=pending_changes,
        )

        return jsonify(
            {
                "ok": True,
                "message": "Approved DNS changes deployed.",
                "already_present": (
                    len(changes) - len(pending_changes)
                ),
                "deployed": True,
                "result": result,
            }
        )

    except Exception as exc:
        return jsonify(
            {
                "ok": False,
                "error": "DNS deployment failed.",
                "details": str(exc),
            }
        ), 500