from flask import Blueprint, jsonify, render_template, request


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

    return jsonify(
        {
            "ok": True,
            "domain": domain,
            "intent": intent,
            "message": "LaunchGuard received the deployment request.",
        }
    )