document.addEventListener("DOMContentLoaded", () => {
    const domainInput = document.getElementById("domain");
    const intentInput = document.getElementById("intent");
    const planButton = document.querySelector(".primary-button");
    const deploymentResult = document.getElementById("deployment-result");

    planButton.addEventListener("click", async () => {
        const domain = domainInput.value.trim();
        const intent = intentInput.value.trim();

        planButton.disabled = true;
        planButton.textContent = "Generating...";

        deploymentResult.innerHTML = `
            <div class="empty-icon">
                LG
            </div>

            <div>
                <strong>Generating AI plan...</strong>
                <p>Gemini is analyzing the requested DNS configuration.</p>
            </div>
        `;

        try {
            const response = await fetch("/api/plan", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    domain,
                    intent,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                deploymentResult.innerHTML = `
                    <div class="empty-icon">
                        !
                    </div>

                    <div>
                        <strong>Unable to generate plan</strong>
                        <p>${escapeHtml(data.error || "Unknown error.")}</p>
                    </div>
                `;
                return;
            }

            const plan = data.plan;
            const validation = data.validation;

            const recordsHtml = plan.changes
                .map((change) => {
                    const host = change.host || "@";

                    return `
                        <div class="plan-record">
                            <span class="record-type">
                                ${escapeHtml(change.type)}
                            </span>

                            <span class="record-host">
                                ${escapeHtml(host)}
                            </span>

                            <span class="record-arrow">
                                →
                            </span>

                            <span class="record-answer">
                                ${escapeHtml(change.answer)}
                            </span>

                            <span class="record-ttl">
                                TTL ${change.ttl}
                            </span>
                        </div>
                    `;
                })
                .join("");

            const validationHtml = validation.valid
                ? `
                    <div class="timeline-status success-text">
                        ✓ Validation passed
                    </div>
                `
                : `
                    <div class="timeline-status danger-text">
                        ✕ Validation failed
                    </div>
                `;

            deploymentResult.innerHTML = `
                <div class="plan-result">

                    <div class="plan-result-header">
                        <div>
                            <span class="plan-kicker">
                                AI PLAN GENERATED
                            </span>

                            <h3>
                                ${escapeHtml(plan.summary)}
                            </h3>
                        </div>

                        <span class="risk-badge risk-${escapeHtml(plan.risk_level)}">
                            ${escapeHtml(plan.risk_level)}
                        </span>
                    </div>

                    <div class="plan-records">
                        ${recordsHtml}
                    </div>

                    <div class="plan-footer">
                        <div class="timeline-status success-text">
                            ✓ Gemini plan generated
                        </div>

                        ${validationHtml}

                        <div class="timeline-status muted-text">
                            No DNS changes have been applied.
                        </div>
                    </div>

                </div>
            `;
        } catch (error) {
            console.error(error);

            deploymentResult.innerHTML = `
                <div class="empty-icon">
                    !
                </div>

                <div>
                    <strong>Connection error</strong>
                    <p>LaunchGuard could not reach the server.</p>
                </div>
            `;
        } finally {
            planButton.disabled = false;
            planButton.textContent = "Generate safe plan";
        }
    });
});


function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}