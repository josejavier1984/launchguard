document.addEventListener("DOMContentLoaded", () => {
    const domainInput = document.getElementById("domain");
    const intentInput = document.getElementById("intent");
    const planButton = document.querySelector(".primary-button");

    planButton.addEventListener("click", async () => {
        const domain = domainInput.value.trim();
        const intent = intentInput.value.trim();

        planButton.disabled = true;
        planButton.textContent = "Generating...";

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
                alert(data.error || "Unable to generate plan.");
                return;
            }

            console.log("LaunchGuard response:", data);

            alert(data.message);
        } catch (error) {
            console.error(error);
            alert("LaunchGuard could not reach the server.");
        } finally {
            planButton.disabled = false;
            planButton.textContent = "Generate safe plan";
        }
    });
});