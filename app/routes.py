from flask import Blueprint, jsonify, render_template, request

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