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
                <strong>Processing request...</strong>
                <p>LaunchGuard is preparing the deployment request.</p>
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
                        <strong>Request rejected</strong>
                        <p>${data.error || "Unable to generate plan."}</p>
                    </div>
                `;

                return;
            }

            deploymentResult.innerHTML = `
                <div class="empty-icon">
                    ✓
                </div>

                <div>
                    <strong>Deployment request received</strong>
                    <p>
                        Domain: ${escapeHtml(data.domain)}
                        <br>
                        Intent: ${escapeHtml(data.intent)}
                    </p>
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
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}