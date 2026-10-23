(() => {
    const $ = (s) => document.querySelector(s);
    const safe = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]);
    const fmt = (n) => new Intl.NumberFormat("hy-AM").format(Number(n) || 0) + " ֏";
    const goSignIn = (role = "freelancer", jobId = "") => {
        const ret = jobId ? `/register?role=${role}&jobId=${encodeURIComponent(jobId)}` : `/register?role=${role}`;
        location.href = ret;
    };

    profile = null;
    localStorage.removeItem("hay_profile");
    const originalRenderJobs = renderJobs;

    function renderSharedJobs() {
        originalRenderJobs();
        document.querySelectorAll("[data-detail]").forEach((button) => {
            button.onclick = () => detailJob(button.dataset.detail);
        });
    }

    renderJobs = renderSharedJobs;
    detailJob = (id) => {
        const job = jobs.find((x) => String(x.id) === String(id));
        if (!job) return;
        openModal(`<div class="modal-head"><div><span class="pill">${safe(job.category)}</span><h2 style="margin-top:12px">${safe(job.title)}</h2><p>${safe(job.org || "Գործակ")} · ${t("posted")} ${job.posted || 0} ${t("days")}</p></div><button class="close">×</button></div><div class="detail-price">${fmt(job.price)} <small style="font-size:12px;color:#77827a;font-weight:500">· ${t("deadline")} ${Number(job.days) || 0} օր</small></div><p class="detail-block">${safe(job.desc)}</p><div class="tags">${(job.tags || []).map((x) => `<span class="tag">${safe(x)}</span>`).join("")}</div><div class="notice">Առաջադրանքի դիտումը բաց է բոլորի համար։ Դիմումը, հանձնման ֆայլերը և վճարման պայմանները պահվում են Գործակ-ում։ Հարթակից դուրս վճարման դեպքում կողմերն իրենք են կրում ռիսկը։</div><div class="modal-actions"><button class="btn btn-light" id="closeDetail">Փակել</button><button class="btn btn-green" id="applyNow">${job.sample ? "Օրինակային առաջադրանք" : t("apply")} ↗</button></div>`);
        $("#closeDetail").onclick = closeModal;
        $("#applyNow").onclick = () => {
            if (job.sample || String(job.id).startsWith("s")) {
                toast("Սա օրինակային առաջադրանք է։ Դիմելու համար ընտրիր գործատուի հրապարակած աշխատանք։");
                return;
            }
            if (!profile) {
                closeModal();
                goSignIn("freelancer", id);
                return;
            }
            if (profile.role !== "freelancer") {
                toast("Դիմելու համար մուտք գործիր ֆրիլանսերի պրոֆիլով։");
                return;
            }
            window.applyModal(id);
        };
    };

    applyModal = (id) => {
        const job = jobs.find((x) => String(x.id) === String(id));
        if (!job) return;
        openModal(`<div class="modal-head"><div><h2>Դիմել աշխատանքին</h2><p>${safe(job.title)}</p></div><button class="close">×</button></div><div class="field"><label>Առաջարկդ</label><textarea id="proposalText" placeholder="Ներկայացրու մոտեցումդ ու փորձդ"></textarea></div><div class="field"><label>Քո գինը (֏)</label><input id="bidInput" type="number" min="1" value="${Number(job.price) || 0}"></div><div class="notice">Դիմելն անվճար է։ Եթե գործատուն ընտրի առաջարկդ, հետագա պայմանավորվածություններն ու հաղորդագրությունները կշարունակվեն այս աշխատանքի էջի հետ կապված զրույցում։</div><div class="modal-actions"><button class="btn btn-light" id="cancelApply">Չեղարկել</button><button class="btn btn-green" id="sendProposal">Ուղարկել առաջարկը</button></div>`);
        $("#cancelApply").onclick = closeModal;
        $("#sendProposal").onclick = async () => {
            const proposal = $("#proposalText").value.trim();
            const bid = Number($("#bidInput").value);
            if (proposal.length < 8 || !bid) {
                toast("Լրացրու առաջարկդ և գինը։");
                return;
            }
            const res = await fetch("/api/applications", {
                method: "POST",
                headers: {"content-type": "application/json"},
                body: JSON.stringify({jobId: id, proposal, bid})
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast(data.error || "Չհաջողվեց ուղարկել առաջարկը։");
                return;
            }
            closeModal();
            toast("Առաջարկն ուղարկվեց։ Այժմ կարող եք գրել հարթակի ներսում։");
            location.href = "/messages";
        };
    };

    paymentStep = (post) => {
        openModal(`<div class="modal-head"><div><h2>Հրապարակման վճար</h2><p>Աշխատանքի տեղադրում</p></div><button class="close">×</button></div><div class="escrow"><strong>Հարթակի հրապարակման վճար <span style="float:right">500 ֏</span></strong><p>${safe(post.title)}</p></div><div class="notice warn">Վճարման իրական գանձում այս տարբերակում միացված չէ։ Հրապարակումը հիմա փորձնական է։</div><div class="modal-actions"><button class="btn btn-light" id="cancelPay">Չեղարկել</button><button class="btn btn-green" id="publishJob">Փորձնական հրապարակել</button></div>`);
        $("#cancelPay").onclick = closeModal;
        $("#publishJob").onclick = async () => {
            const res = await fetch("/api/jobs", {
                method: "POST",
                headers: {"content-type": "application/json"},
                body: JSON.stringify({
                    title: post.title,
                    desc: post.desc,
                    price: post.price,
                    category: post.category,
                    days: post.days,
                    tags: post.tags
                })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast(data.error || "Չհաջողվեց հրապարակել։");
                return;
            }
            closeModal();
            toast("Աշխատանքը հրապարակվեց Գործակ-ում։");
            await loadJobs();
            document.querySelector("#jobs").scrollIntoView({behavior: "smooth"});
        };
    };

    const oldPostModal = postModal;
    postModal = () => {
        if (!profile) {
            goSignIn("employer");
            return;
        }
        if (profile.role !== "employer") {
            toast("Աշխատանք տեղադրելու համար անհրաժեշտ է գործատուի պրոֆիլ։");
            return;
        }
        oldPostModal();
    };
    $("#loginBtn").onclick = () => {
        location.href = "/login";
    };
    $("#postTop").onclick = postModal;
    $("#heroPost").onclick = postModal;
    $("#dashboardBtn").onclick = () => location.href = profile ? "/messages" : "/login?return_to=%2Fmessages";

    async function loadJobs() {
        try {
            const res = await fetch("/api/jobs", {cache: "no-store"});
            if (!res.ok) return;
            const data = await res.json();
            const examples = jobs.filter((j) => j.sample || String(j.id).startsWith("s"));
            const liveJobs = (data.jobs || []).map((j) => ({
                ...j,
                sample: Boolean(j.sample),
                verified: !j.sample,
                applies: Number(j.applies || 0)
            }));
            if (data.supabase && liveJobs.length && liveJobs.some((j) => j.sample)) jobs = liveJobs;
            else jobs = [...liveJobs, ...examples];
            renderJobs();
        } catch {
        }
    }

    async function init() {
        try {
            const res = await fetch("/api/me", {cache: "no-store"});
            if (res.ok) {
                const data = await res.json();

                if (data.profile) {
                    profile = {
                        name: data.profile.display_name,
                        email: data.profile.email,
                        role: data.profile.role
                    };
                }
            }

            const accountButton = document.querySelector("#loginBtn");

            if (profile && accountButton) {
                accountButton.textContent = "Իմ պրոֆիլը";
                accountButton.removeAttribute("data-i");
                accountButton.onclick = () => {
                    window.location.href = "/messages";
                };
            }
        } catch {
        }
        const msg = document.createElement("a");
        msg.href = profile ? "/messages" : "/login?return_to=%2Fmessages";
        msg.className = "btn btn-light btn-sm";
        msg.textContent = "Հաղորդագրություններ";
        const right = document.querySelector(".navright");
        if (right) right.insertBefore(msg, $("#postTop"));
        await loadJobs();
        const applyId = new URLSearchParams(location.search).get("apply");
        if (applyId) {
            history.replaceState({}, "", "/market.html");
            setTimeout(() => applyModal(applyId), 300);
        }
    }

    void init();
})();
