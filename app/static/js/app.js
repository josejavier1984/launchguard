document.addEventListener("DOMContentLoaded", () => {
    const domainSearchInput = document.getElementById(
        "domain-search-input"
    );

    const domainSearchButton = document.getElementById(
        "domain-search-button"
    );

    const domainSearchResult = document.getElementById(
        "domain-search-result"
    );

    const domainInput = document.getElementById(
        "domain"
    );

    const intentInput = document.getElementById(
        "intent"
    );

    const planButton = document.querySelector(
        ".primary-button"
    );

    const deploymentResult = document.getElementById(
        "deployment-result"
    );

    let currentPlan = null;
    let currentDomain = null;


    /*
     * Domain Discovery
     */

    domainSearchButton.addEventListener(
        "click",
        async () => {
            await checkDomainAvailability(
                domainSearchInput,
                domainSearchButton,
                domainSearchResult,
                domainInput
            );
        }
    );


    domainSearchInput.addEventListener(
        "keydown",
        async (event) => {
            if (event.key !== "Enter") {
                return;
            }

            event.preventDefault();

            if (domainSearchButton.disabled) {
                return;
            }

            await checkDomainAvailability(
                domainSearchInput,
                domainSearchButton,
                domainSearchResult,
                domainInput
            );
        }
    );


    /*
     * AI DNS Planning
     */

    planButton.addEventListener(
        "click",
        async () => {
            const domain =
                domainInput.value.trim();

            const intent =
                intentInput.value.trim();

            currentPlan = null;
            currentDomain = null;

            planButton.disabled = true;

            planButton.textContent =
                "Generating...";

            deploymentResult.innerHTML = `
                <div class="operation-progress">
                    <span
                        class="working-spinner"
                    ></span>

                    <div>
                        <strong>
                            Generating AI plan...
                        </strong>

                        <p>
                            Gemini is analyzing the
                            requested DNS configuration.
                        </p>
                    </div>
                </div>
            `;

            scrollToElement(
                deploymentResult,
                "start"
            );

            try {
                const response = await fetch(
                    "/api/plan",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            domain,
                            intent,
                        }),
                    }
                );

                const data =
                    await response.json();

                if (!response.ok) {
                    deploymentResult.innerHTML = `
                        <div class="empty-icon">
                            !
                        </div>

                        <div>
                            <strong>
                                Unable to generate plan
                            </strong>

                            <p>
                                ${escapeHtml(
                                    data.error ||
                                    "Unknown error."
                                )}
                            </p>
                        </div>
                    `;

                    scrollToElement(
                        deploymentResult,
                        "start"
                    );

                    return;
                }

                const plan =
                    data.plan;

                const validation =
                    data.validation;

                currentPlan =
                    plan;

                currentDomain =
                    domain;

                const recordsHtml =
                    plan.changes
                        .map(
                            (change) => {
                                const host =
                                    change.host ||
                                    "@";

                                return `
                                    <div
                                        class="plan-record"
                                    >
                                        <span
                                            class="record-type"
                                        >
                                            ${escapeHtml(
                                                change.type
                                            )}
                                        </span>

                                        <span
                                            class="record-host"
                                        >
                                            ${escapeHtml(
                                                host
                                            )}
                                        </span>

                                        <span
                                            class="record-arrow"
                                        >
                                            →
                                        </span>

                                        <span
                                            class="record-answer"
                                        >
                                            ${escapeHtml(
                                                change.answer
                                            )}
                                        </span>

                                        <span
                                            class="record-ttl"
                                        >
                                            TTL
                                            ${escapeHtml(
                                                change.ttl
                                            )}
                                        </span>
                                    </div>
                                `;
                            }
                        )
                        .join("");

                const validationHtml =
                    validation.valid
                        ? `
                            <div
                                class="
                                    timeline-status
                                    success-text
                                "
                            >
                                ✓ Validation passed
                            </div>
                        `
                        : `
                            <div
                                class="
                                    timeline-status
                                    danger-text
                                "
                            >
                                ✕ Validation failed
                            </div>
                        `;

                const approvalHtml =
                    validation.valid
                        ? `
                            <div
                                class="plan-approval"
                            >
                                <div>
                                    <strong>
                                        Human approval
                                        required
                                    </strong>

                                    <p>
                                        Review the DNS plan
                                        before allowing
                                        LaunchGuard to
                                        modify Name.com.
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

                        <div
                            class="plan-result-header"
                        >
                            <div>
                                <span
                                    class="plan-kicker"
                                >
                                    AI PLAN GENERATED
                                </span>

                                <h3>
                                    ${escapeHtml(
                                        plan.summary
                                    )}
                                </h3>
                            </div>

                            <span
                                class="
                                    risk-badge
                                    risk-${escapeHtml(
                                        plan.risk_level
                                    )}
                                "
                            >
                                ${escapeHtml(
                                    plan.risk_level
                                )}
                            </span>
                        </div>

                        <div class="plan-records">
                            ${recordsHtml}
                        </div>

                        <div class="plan-footer">
                            <div
                                class="
                                    timeline-status
                                    success-text
                                "
                            >
                                ✓ Gemini plan generated
                            </div>

                            ${validationHtml}

                            <div
                                class="
                                    timeline-status
                                    muted-text
                                "
                            >
                                No DNS changes have
                                been applied.
                            </div>
                        </div>

                        ${approvalHtml}

                    </div>
                `;

                scrollToElement(
                    deploymentResult,
                    "start"
                );

                if (validation.valid) {
                    const deployButton =
                        document.getElementById(
                            "approve-deploy-button"
                        );

                    deployButton.addEventListener(
                        "click",
                        async () => {
                            await deployApprovedPlan(
                                currentDomain,
                                currentPlan,
                                deployButton,
                                deploymentResult
                            );
                        }
                    );
                }

            } catch (error) {
                console.error(error);

                deploymentResult.innerHTML = `
                    <div class="empty-icon">
                        !
                    </div>

                    <div>
                        <strong>
                            Connection error
                        </strong>

                        <p>
                            LaunchGuard could not
                            reach the server.
                        </p>
                    </div>
                `;

                scrollToElement(
                    deploymentResult,
                    "start"
                );

            } finally {
                planButton.disabled = false;

                planButton.textContent =
                    "Generate safe plan";
            }
        }
    );
});


async function checkDomainAvailability(
    domainSearchInput,
    domainSearchButton,
    domainSearchResult,
    domainInput
) {
    const domain =
        domainSearchInput.value
            .trim()
            .toLowerCase();

    if (!domain) {
        domainSearchResult.innerHTML = `
            <span class="domain-result-error">
                Enter a domain name first.
            </span>
        `;

        scrollToElement(
            domainSearchResult,
            "center"
        );

        return;
    }

    domainSearchButton.disabled = true;

    domainSearchButton.textContent =
        "Checking...";

    domainSearchResult.innerHTML = `
        <div class="operation-progress">
            <span
                class="working-spinner"
            ></span>

            <div>
                <strong>
                    Checking
                    ${escapeHtml(domain)}
                </strong>

                <p>
                    Querying Name.com
                    availability and pricing.
                </p>
            </div>
        </div>
    `;

    scrollToElement(
        domainSearchResult,
        "center"
    );

    try {
        const response = await fetch(
            "/api/domain-availability",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                },
                body: JSON.stringify({
                    domain,
                }),
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            domainSearchResult.innerHTML = `
                <div
                    class="domain-result-error"
                >
                    <strong>
                        Unable to check domain
                    </strong>

                    <span>
                        ${escapeHtml(
                            data.error ||
                            "Name.com availability check failed."
                        )}
                    </span>
                </div>
            `;

            scrollToElement(
                domainSearchResult,
                "center"
            );

            return;
        }

        if (data.purchasable) {
            const purchasePrice =
                formatPrice(
                    data.purchase_price
                );

            const renewalPrice =
                formatPrice(
                    data.renewal_price
                );

            const premiumLabel =
                data.premium
                    ? `
                        <span
                            class="
                                domain-premium-badge
                            "
                        >
                            Premium
                        </span>
                    `
                    : "";

            domainSearchResult.innerHTML = `
                <div
                    class="
                        domain-result-available
                    "
                >
                    <div
                        class="domain-result-main"
                    >
                        <span
                            class="
                                domain-availability-icon
                            "
                        >
                            ✓
                        </span>

                        <div>
                            <strong>
                                ${escapeHtml(
                                    data.domain
                                )}
                                is available
                            </strong>

                            <span>
                                Available for registration
                                through Name.com.
                            </span>
                        </div>
                    </div>

                    <div
                        class="
                            domain-result-pricing
                        "
                    >
                        ${premiumLabel}

                        <span>
                            Registration
                            <strong>
                                ${escapeHtml(
                                    purchasePrice
                                )}
                            </strong>
                        </span>

                        <span>
                            Renewal
                            <strong>
                                ${escapeHtml(
                                    renewalPrice
                                )}
                            </strong>
                        </span>

                        <button
                            id="register-domain-button"
                            class="
                                domain-register-button
                            "
                            type="button"
                        >
                            Register in Name.com Sandbox
                        </button>
                    </div>
                </div>
            `;

            const registerButton =
                document.getElementById(
                    "register-domain-button"
                );

            registerButton.addEventListener(
                "click",
                async () => {
                    await registerDomainInSandbox(
                        data.domain,
                        registerButton,
                        domainSearchResult,
                        domainInput
                    );
                }
            );

            scrollToElement(
                domainSearchResult,
                "center"
            );

            return;
        }

        domainSearchResult.innerHTML = `
            <div
                class="
                    domain-result-unavailable
                "
            >
                <span
                    class="
                        domain-availability-icon
                    "
                >
                    ×
                </span>

                <div>
                    <strong>
                        ${escapeHtml(
                            data.domain
                        )}
                        is not available
                    </strong>

                    <span>
                        Try another domain name.
                    </span>
                </div>
            </div>
        `;

        scrollToElement(
            domainSearchResult,
            "center"
        );

    } catch (error) {
        console.error(error);

        domainSearchResult.innerHTML = `
            <div
                class="domain-result-error"
            >
                <strong>
                    Connection error
                </strong>

                <span>
                    LaunchGuard could not
                    reach the availability
                    service.
                </span>
            </div>
        `;

        scrollToElement(
            domainSearchResult,
            "center"
        );

    } finally {
        domainSearchButton.disabled = false;

        domainSearchButton.textContent =
            "Check availability";
    }
}


async function registerDomainInSandbox(
    domain,
    registerButton,
    domainSearchResult,
    domainInput
) {
    registerButton.disabled = true;

    registerButton.textContent =
        "Registering...";

    domainSearchResult.innerHTML = `
        <div
            class="
                operation-progress
                domain-registration-progress
            "
        >
            <span
                class="working-spinner"
            ></span>

            <div>
                <strong>
                    Registering
                    ${escapeHtml(domain)}
                </strong>

                <p>
                    LaunchGuard is verifying
                    availability again and
                    registering the domain
                    in the Name.com sandbox.
                </p>
            </div>
        </div>
    `;

    scrollToElement(
        domainSearchResult,
        "center"
    );

    try {
        const response = await fetch(
            "/api/domain-register",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                },
                body: JSON.stringify({
                    domain,
                    confirm_registration:
                        true,
                }),
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            domainSearchResult.innerHTML = `
                <div
                    class="
                        domain-registration-error
                    "
                >
                    <strong>
                        Registration blocked
                    </strong>

                    <span>
                        ${escapeHtml(
                            data.error ||
                            "Unable to register domain."
                        )}
                    </span>
                </div>
            `;

            scrollToElement(
                domainSearchResult,
                "center"
            );

            return;
        }

        domainInput.value =
            data.domain;

        domainSearchResult.innerHTML = `
            <div
                class="
                    domain-registration-success
                "
            >
                <div
                    class="
                        domain-registration-main
                    "
                >
                    <span
                        class="
                            domain-availability-icon
                        "
                    >
                        ✓
                    </span>

                    <div>
                        <strong>
                            ${escapeHtml(
                                data.domain
                            )}
                            registered
                        </strong>

                        <span>
                            Name.com sandbox
                            registration completed
                            successfully.
                        </span>
                    </div>
                </div>

                <div
                    class="
                        domain-registration-details
                    "
                >
                    <span>
                        Registration
                        <strong>
                            ${escapeHtml(
                                formatPrice(
                                    data.purchase_price
                                )
                            )}
                        </strong>
                    </span>

                    <span>
                        Renewal
                        <strong>
                            ${escapeHtml(
                                formatPrice(
                                    data.renewal_price
                                )
                            )}
                        </strong>
                    </span>

                    <span
                        class="
                            domain-ready-badge
                        "
                    >
                        Ready for DNS
                    </span>
                </div>

                <p
                    class="
                        domain-registration-hint
                    "
                >
                    The registered domain has
                    been copied automatically
                    to Safe DNS change.
                </p>
            </div>
        `;

        scrollToElement(
    domainSearchResult,
    "center"
);

const deployPanel =
    domainInput.closest(
        ".deploy-panel"
    );

window.setTimeout(
    () => {
        scrollToElement(
            deployPanel || domainInput,
            "start"
        );

        domainInput.focus({
            preventScroll: true,
        });
    },
    700
);

    } catch (error) {
        console.error(error);

        domainSearchResult.innerHTML = `
            <div
                class="
                    domain-registration-error
                "
            >
                <strong>
                    Connection error
                </strong>

                <span>
                    LaunchGuard could not
                    complete the sandbox
                    registration.
                </span>
            </div>
        `;

        scrollToElement(
            domainSearchResult,
            "center"
        );
    }
}


async function deployApprovedPlan(
    domain,
    plan,
    deployButton,
    deploymentResult
) {
    deployButton.disabled = true;

    deployButton.textContent =
        "Deploying safely...";

    const planResult =
        deploymentResult.querySelector(
            ".plan-result"
        );

    planResult.insertAdjacentHTML(
        "beforeend",
        `
            <div
                id="deployment-progress"
                class="operation-progress"
            >
                <span
                    class="working-spinner"
                ></span>

                <div>
                    <strong>
                        LaunchGuard is working...
                    </strong>

                    <p>
                        Creating a safety
                        snapshot and applying
                        the approved DNS plan.
                    </p>
                </div>
            </div>
        `
    );

    const deploymentProgress =
        document.getElementById(
            "deployment-progress"
        );

    scrollToElement(
        deploymentProgress,
        "center"
    );

    try {
        const response = await fetch(
            "/api/deploy",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                },
                body: JSON.stringify({
                    domain,
                    changes:
                        plan.changes,
                }),
            }
        );

        const data =
            await response.json();

        removeElement(
            "deployment-progress"
        );

        if (!response.ok) {
            deployButton.disabled = false;

            deployButton.textContent =
                "Approve & deploy safely";

            planResult.insertAdjacentHTML(
                "beforeend",
                `
                    <div
                        class="
                            deployment-message
                            deployment-error
                        "
                    >
                        <strong>
                            Deployment blocked
                        </strong>

                        <p>
                            ${escapeHtml(
                                data.error ||
                                "DNS deployment failed."
                            )}
                        </p>
                    </div>
                `
            );

            scrollToLastMessage(
                planResult
            );

            return;
        }

        if (!data.deployed) {
            planResult.insertAdjacentHTML(
                "beforeend",
                `
                    <div
                        class="
                            deployment-message
                            deployment-success
                        "
                    >
                        <strong>
                            ✓ No changes required
                        </strong>

                        <p>
                            The current DNS
                            configuration already
                            matches the approved
                            plan.
                        </p>
                    </div>
                `
            );

            deployButton.textContent =
                "Already deployed";

            scrollToLastMessage(
                planResult
            );

            return;
        }

        const snapshotId =
            data.result &&
            data.result.snapshot
                ? data.result.snapshot.id
                : null;

        const createdCount =
            data.result &&
            Array.isArray(
                data.result.created
            )
                ? data.result.created.length
                : 0;

        const verified =
            data.result &&
            data.result.verified === true;

        const rollbackHtml =
            snapshotId !== null
                ? `
                    <div
                        class="rollback-action"
                    >
                        <button
                            id="rollback-button"
                            class="
                                rollback-button
                            "
                            type="button"
                        >
                            Rollback to Snapshot
                            #${escapeHtml(
                                snapshotId
                            )}
                        </button>
                    </div>
                `
                : "";

        planResult.insertAdjacentHTML(
            "beforeend",
            `
                <div
                    class="
                        deployment-message
                        deployment-success
                    "
                >
                    <strong>
                        ✓ Safe deployment
                        completed
                    </strong>

                    <p>
                        ${
                            snapshotId !== null
                                ? `Snapshot #${escapeHtml(
                                    snapshotId
                                )} created before deployment.`
                                : "Pre-deployment snapshot created."
                        }
                    </p>

                    <p>
                        ${createdCount}
                        DNS change${
                            createdCount === 1
                                ? ""
                                : "s"
                        }
                        applied.
                    </p>

                    <p>
                        Verification:
                        <strong>
                            ${
                                verified
                                    ? "Passed"
                                    : "Needs review"
                            }
                        </strong>
                    </p>

                    ${rollbackHtml}
                </div>
            `
        );

        if (snapshotId !== null) {
            const rollbackButton =
                document.getElementById(
                    "rollback-button"
                );

            rollbackButton.addEventListener(
                "click",
                async () => {
                    await rollbackToSnapshot(
                        domain,
                        snapshotId,
                        rollbackButton,
                        deploymentResult
                    );
                }
            );

            scrollToElement(
                rollbackButton,
                "center"
            );
        } else {
            scrollToLastMessage(
                planResult
            );
        }

        deployButton.textContent =
            "Deployment complete";

    } catch (error) {
        console.error(error);

        removeElement(
            "deployment-progress"
        );

        deployButton.disabled = false;

        deployButton.textContent =
            "Approve & deploy safely";

        planResult.insertAdjacentHTML(
            "beforeend",
            `
                <div
                    class="
                        deployment-message
                        deployment-error
                    "
                >
                    <strong>
                        Connection error
                    </strong>

                    <p>
                        LaunchGuard could not
                        complete the deployment.
                    </p>
                </div>
            `
        );

        scrollToLastMessage(
            planResult
        );
    }
}


async function rollbackToSnapshot(
    domain,
    snapshotId,
    rollbackButton,
    deploymentResult
) {
    rollbackButton.disabled = true;

    rollbackButton.textContent =
        "Rolling back...";

    const planResult =
        deploymentResult.querySelector(
            ".plan-result"
        );

    planResult.insertAdjacentHTML(
        "beforeend",
        `
            <div
                id="rollback-progress"
                class="operation-progress"
            >
                <span
                    class="working-spinner"
                ></span>

                <div>
                    <strong>
                        Restoring snapshot
                        #${escapeHtml(
                            snapshotId
                        )}...
                    </strong>

                    <p>
                        LaunchGuard is comparing
                        the current DNS state and
                        restoring the saved
                        configuration.
                    </p>
                </div>
            </div>
        `
    );

    const rollbackProgress =
        document.getElementById(
            "rollback-progress"
        );

    scrollToElement(
        rollbackProgress,
        "center"
    );

    try {
        const response = await fetch(
            "/api/rollback",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                },
                body: JSON.stringify({
                    domain,
                    snapshot_id:
                        Number(snapshotId),
                }),
            }
        );

        const data =
            await response.json();

        removeElement(
            "rollback-progress"
        );

        if (!response.ok) {
            rollbackButton.disabled =
                false;

            rollbackButton.textContent =
                `Rollback to Snapshot #${snapshotId}`;

            planResult.insertAdjacentHTML(
                "beforeend",
                `
                    <div
                        class="
                            deployment-message
                            deployment-error
                        "
                    >
                        <strong>
                            Rollback failed
                        </strong>

                        <p>
                            ${escapeHtml(
                                data.error ||
                                "Unable to restore snapshot."
                            )}
                        </p>
                    </div>
                `
            );

            scrollToLastMessage(
                planResult
            );

            return;
        }

        const deletedCount =
            Array.isArray(
                data.deleted
            )
                ? data.deleted.length
                : 0;

        const createdCount =
            Array.isArray(
                data.created
            )
                ? data.created.length
                : 0;

        planResult.insertAdjacentHTML(
            "beforeend",
            `
                <div
                    class="
                        deployment-message
                        rollback-success
                    "
                >
                    <strong>
                        ✓ Snapshot
                        #${escapeHtml(
                            snapshotId
                        )}
                        restored
                    </strong>

                    <p>
                        ${deletedCount}
                        DNS record${
                            deletedCount === 1
                                ? ""
                                : "s"
                        }
                        removed and
                        ${createdCount}
                        restored.
                    </p>

                    <p>
                        Verification:
                        <strong>
                            ${
                                data.verified
                                    ? "Passed"
                                    : "Needs review"
                            }
                        </strong>
                    </p>
                </div>
            `
        );

        rollbackButton.textContent =
            "Rollback complete";

        scrollToLastMessage(
            planResult
        );

    } catch (error) {
        console.error(error);

        removeElement(
            "rollback-progress"
        );

        rollbackButton.disabled = false;

        rollbackButton.textContent =
            `Rollback to Snapshot #${snapshotId}`;

        planResult.insertAdjacentHTML(
            "beforeend",
            `
                <div
                    class="
                        deployment-message
                        deployment-error
                    "
                >
                    <strong>
                        Connection error
                    </strong>

                    <p>
                        LaunchGuard could not
                        complete the rollback.
                    </p>
                </div>
            `
        );

        scrollToLastMessage(
            planResult
        );
    }
}


function scrollToLastMessage(
    parentElement
) {
    if (!parentElement) {
        return;
    }

    const messages =
        parentElement.querySelectorAll(
            ".deployment-message"
        );

    if (!messages.length) {
        return;
    }

    scrollToElement(
        messages[
            messages.length - 1
        ],
        "center"
    );
}


function removeElement(elementId) {
    const element =
        document.getElementById(
            elementId
        );

    if (element) {
        element.remove();
    }
}


function scrollToElement(
    element,
    block = "center"
) {
    if (!element) {
        return;
    }

    window.setTimeout(
        () => {
            element.scrollIntoView({
                behavior: "smooth",
                block,
            });
        },
        120
    );
}


function formatPrice(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    const numericValue =
        Number(value);

    if (
        Number.isNaN(
            numericValue
        )
    ) {
        return String(value);
    }

    return `$${numericValue.toFixed(2)}`;
}


function escapeHtml(value) {
    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}