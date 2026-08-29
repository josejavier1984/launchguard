document.addEventListener("DOMContentLoaded", () => {
    const domainInput = document.getElementById("domain");
    const intentInput = document.getElementById("intent");
    const planButton = document.querySelector(".primary-button");
    const deploymentResult = document.getElementById("deployment-result");

    let currentPlan = null;
    let currentDomain = null;

    planButton.addEventListener("click", async () => {
        const domain = domainInput.value.trim();
        const intent = intentInput.value.trim();

        currentPlan = null;
        currentDomain = null;

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

            currentPlan = plan;
            currentDomain = domain;

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

            const approvalHtml = validation.valid
                ? `
                    <div class="plan-approval">
                        <div>
                            <strong>Human approval required</strong>
                            <p>
                                Review the DNS plan before allowing
                                LaunchGuard to modify Name.com.
                            </p>
                        </div>

                        <button
                            id="approve-deploy-button"
                            class="deploy-button"
                            type="button"
                        >
                            Approve & deploy safely
                        </button>
                    </div>
                `
                : "";

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

                    ${approvalHtml}

                </div>
            `;

            if (validation.valid) {
                const deployButton = document.getElementById(
                    "approve-deploy-button"
                );

                deployButton.addEventListener("click", async () => {
                    await deployApprovedPlan(
                        currentDomain,
                        currentPlan,
                        deployButton,
                        deploymentResult
                    );
                });
            }
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


async function deployApprovedPlan(
    domain,
    plan,
    deployButton,
    deploymentResult
) {
    deployButton.disabled = true;
    deployButton.textContent = "Deploying safely...";

    try {
        const response = await fetch("/api/deploy", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                domain,
                changes: plan.changes,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            deployButton.disabled = false;
            deployButton.textContent = "Approve & deploy safely";

            deploymentResult.querySelector(".plan-result").insertAdjacentHTML(
                "beforeend",
                `
                    <div class="deployment-message deployment-error">
                        <strong>Deployment blocked</strong>
                        <p>
                            ${escapeHtml(
                                data.error || "DNS deployment failed."
                            )}
                        </p>
                    </div>
                `
            );

            return;
        }

        if (!data.deployed) {
            deploymentResult.querySelector(".plan-result").insertAdjacentHTML(
                "beforeend",
                `
                    <div class="deployment-message deployment-success">
                        <strong>✓ No changes required</strong>
                        <p>
                            The current DNS configuration already matches
                            the approved plan.
                        </p>
                    </div>
                `
            );

            deployButton.textContent = "Already deployed";
            return;
        }

        const snapshotId =
            data.result &&
            data.result.snapshot
                ? data.result.snapshot.id
                : "—";

        const createdCount =
            data.result &&
            Array.isArray(data.result.created)
                ? data.result.created.length
                : 0;

        const verified =
            data.result &&
            data.result.verified === true;

        deploymentResult.querySelector(".plan-result").insertAdjacentHTML(
            "beforeend",
            `
                <div class="deployment-message deployment-success">
                    <strong>✓ Safe deployment completed</strong>

                    <p>
                        Snapshot #${escapeHtml(snapshotId)}
                        created before deployment.
                    </p>

                    <p>
                        ${createdCount}
                        DNS change${createdCount === 1 ? "" : "s"}
                        applied.
                    </p>

                    <p>
                        Verification:
                        <strong>
                            ${verified ? "Passed" : "Needs review"}
                        </strong>
                    </p>
                </div>
            `
        );

        deployButton.textContent = "Deployment complete";

    } catch (error) {
        console.error(error);

        deployButton.disabled = false;
        deployButton.textContent = "Approve & deploy safely";

        deploymentResult.querySelector(".plan-result").insertAdjacentHTML(
            "beforeend",
            `
                <div class="deployment-message deployment-error">
                    <strong>Connection error</strong>
                    <p>
                        LaunchGuard could not complete the deployment.
                    </p>
                </div>
            `
        );
    }
}


function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}