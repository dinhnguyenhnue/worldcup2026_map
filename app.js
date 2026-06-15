// ==========================================
// BỘ NÃO XỬ LÝ LOGIC ỨNG DỤNG WORLD CUP 2026
// ==========================================

(function () {
    // 1. Quản lý trạng thái giải đấu (State)
    let state = {
        teams: {},
        players: [],
        matches: [],
        knockout: {},
        activeTab: "group-stage",
        zoomLevel: 1.0,
        theme: "dark"
    };

    // Khởi động ứng dụng
    async function init() {
        await loadData();
        setupEventListeners();
        renderActiveTab();
        updateTournamentProgressBar();
        applyTheme();
        
        // Áp dụng zoom level sau khi load xong data
        const zoomArea = document.getElementById("bracket-zoom-area");
        if (zoomArea) {
            zoomArea.style.transform = `scale(${state.zoomLevel})`;
        }
    }

    // Tải dữ liệu từ data.json, localStorage hoặc dữ liệu mẫu ban đầu
    async function loadData() {
        // Thử fetch data.json (được cập nhật tự động bởi GitHub Actions)
        try {
            const response = await fetch("data.json");
            if (response.ok) {
                const apiData = await response.json();
                state.teams = apiData.teams;
                state.players = apiData.players;
                state.matches = apiData.matches;
                state.knockout = apiData.knockout;
                state.theme = localStorage.getItem("WC2026_THEME") || "dark";
                state.zoomLevel = parseFloat(localStorage.getItem("WC2026_ZOOM")) || 1.0;
                saveData();
                return;
            }
        } catch (e) {
            console.log("Không tìm thấy data.json hoặc lỗi tải, sử dụng localStorage/dữ liệu mẫu.");
        }

        const savedData = localStorage.getItem("WC2026_STATE");
        if (savedData) {
            try {
                state = JSON.parse(savedData);
                state.zoomLevel = state.zoomLevel || 1.0;
                state.theme = state.theme || "dark";
            } catch (e) {
                console.error("Lỗi đọc dữ liệu từ localStorage, khởi tạo lại:", e);
                resetToDefault();
            }
        } else {
            resetToDefault();
        }
    }

    // Áp dụng chủ đề sáng/tối
    function applyTheme() {
        const themeIcon = document.getElementById("theme-icon");
        if (state.theme === "light") {
            document.body.classList.add("light-theme");
            if (themeIcon) themeIcon.innerText = "☀️";
        } else {
            document.body.classList.remove("light-theme");
            if (themeIcon) themeIcon.innerText = "🌙";
        }
    }

    // Reset dữ liệu về mặc định ban đầu
    function resetToDefault() {
        const initialData = window.WC_INITIAL_DATA;
        state.teams = JSON.parse(JSON.stringify(initialData.teams));
        state.players = JSON.parse(JSON.stringify(initialData.players));
        state.matches = initialData.generateGroupMatches();
        state.knockout = initialData.initializeKnockoutStages();
        state.activeTab = "group-stage";
        state.zoomLevel = 1.0;
        saveData();
    }

    // Lưu dữ liệu vào localStorage
    function saveData() {
        localStorage.setItem("WC2026_STATE", JSON.stringify(state));
    }

    // ==========================================
    // LOGIC TÍNH TOÁN BẢNG XẾP HẠNG & XÉT ĐỘI XẾP THỨ BA
    // ==========================================

    // Tính toán bảng xếp hạng của một bảng cụ thể
    function calculateGroupStandings(groupName) {
        const groupTeams = Object.values(state.teams).filter(t => t.group === groupName);
        const standings = groupTeams.map(team => {
            return {
                ...team,
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                gf: 0, // Bàn thắng ghi được
                ga: 0, // Bàn thua phải nhận
                gd: 0, // Hiệu số bàn thắng bại
                pts: 0  // Điểm số
            };
        });

        // Lấy tất cả các trận đấu của bảng đó
        const groupMatches = state.matches.filter(m => m.group === groupName && m.status === "completed");

        groupMatches.forEach(match => {
            const home = standings.find(t => t.id === match.home);
            const away = standings.find(t => t.id === match.away);

            if (home && away) {
                home.played++;
                away.played++;
                home.gf += match.homeScore;
                home.ga += match.awayScore;
                away.gf += match.awayScore;
                away.ga += match.homeScore;

                if (match.homeScore > match.awayScore) {
                    home.won++;
                    home.pts += 3;
                    away.lost++;
                } else if (match.homeScore < match.awayScore) {
                    away.won++;
                    away.pts += 3;
                    home.lost++;
                } else {
                    home.drawn++;
                    away.drawn++;
                    home.pts += 1;
                    away.pts += 1;
                }
            }
        });

        // Tính hiệu số bàn thắng bại
        standings.forEach(t => {
            t.gd = t.gf - t.ga;
        });

        // Sắp xếp thứ hạng bảng đấu theo luật FIFA:
        // 1. Điểm số (pts)
        // 2. Hiệu số bàn thắng bại (gd)
        // 3. Số bàn thắng ghi được (gf)
        // 4. Tên đội bóng (sắp xếp bảng ổn định làm fallback)
        return standings.sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;
            if (b.gd !== a.gd) return b.gd - a.gd;
            if (b.gf !== a.gf) return b.gf - a.gf;
            return a.name.localeCompare(b.name);
        });
    }

    // Tính toán và tìm ra 8 đội xếp thứ ba có thành tích tốt nhất trong số 12 bảng đấu
    function calculateBestThirdPlacedTeams() {
        const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
        const thirdPlacedTeams = [];

        groups.forEach(groupName => {
            const standings = calculateGroupStandings(groupName);
            if (standings.length >= 3) {
                // Đội xếp thứ 3 trong bảng
                thirdPlacedTeams.push({
                    ...standings[2],
                    groupOrigin: groupName
                });
            }
        });

        // Sắp xếp 12 đội xếp thứ ba theo:
        // 1. Điểm số (pts)
        // 2. Hiệu số bàn thắng bại (gd)
        // 3. Số bàn thắng ghi được (gf)
        // 4. Số trận thắng
        return thirdPlacedTeams.sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;
            if (b.gd !== a.gd) return b.gd - a.gd;
            if (b.gf !== a.gf) return b.gf - a.gf;
            if (b.won !== a.won) return b.won - a.won;
            return a.name.localeCompare(b.name);
        });
    }

    // ==========================================
    // LOGIC PHÂN PHỐI NHÁNH ĐẤU KNOCK-OUT
    // ==========================================

    // Tự động phân nhánh đấu knockout khi có kết quả
    function updateKnockoutBracket() {
        // Kiểm tra xem tất cả các trận đấu vòng bảng đã hoàn thành chưa
        const allGroupMatchesCompleted = state.matches.every(m => m.status === "completed");

        if (!allGroupMatchesCompleted) {
            // Nếu chưa xong vòng bảng, dọn dẹp các đội trong vòng 32 đội
            state.knockout.round_32.forEach(m => {
                m.home = null;
                m.away = null;
                m.homeScore = null;
                m.awayScore = null;
                m.status = "scheduled";
                m.winner = null;
                m.penalty = null;
            });
            clearSubsequentRounds();
            saveData();
            return;
        }

        // 1. Lấy kết quả vòng bảng
        const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
        const groupWinners = {};
        const groupRunnersUp = {};

        groups.forEach(groupName => {
            const standings = calculateGroupStandings(groupName);
            groupWinners[groupName] = standings[0].id;
            groupRunnersUp[groupName] = standings[1].id;
        });

        // 2. Lấy 8 đội thứ ba tốt nhất
        const bestThirds = calculateBestThirdPlacedTeams().slice(0, 8).map(t => t.id);

        // 3. Phân bổ vào 16 trận đấu của vòng 32 đội (K1 -> K16)
        // Cặp đấu được thiết kế để phân phối đều bảng đấu và tránh đội cùng bảng gặp lại quá sớm
        const pairingRules = [
            { id: "K1", home: groupWinners["A"], away: bestThirds[7] || null }, // 1A vs 3rd_8
            { id: "K2", home: groupRunnersUp["A"], away: groupRunnersUp["B"] }, // 2A vs 2B
            { id: "K3", home: groupWinners["B"], away: bestThirds[6] || null }, // 1B vs 3rd_7
            { id: "K4", home: groupRunnersUp["C"], away: groupRunnersUp["D"] }, // 2C vs 2D
            { id: "K5", home: groupWinners["C"], away: bestThirds[5] || null }, // 1C vs 3rd_6
            { id: "K6", home: groupRunnersUp["E"], away: groupRunnersUp["F"] }, // 2E vs 2F
            { id: "K7", home: groupWinners["D"], away: bestThirds[4] || null }, // 1D vs 3rd_5
            { id: "K8", home: groupRunnersUp["G"], away: groupRunnersUp["H"] }, // 2G vs 2H
            { id: "K9", home: groupWinners["E"], away: bestThirds[3] || null }, // 1E vs 3rd_4
            { id: "K10", home: groupRunnersUp["I"], away: groupRunnersUp["J"] }, // 2I vs 2J
            { id: "K11", home: groupWinners["F"], away: bestThirds[2] || null }, // 1F vs 3rd_3
            { id: "K12", home: groupRunnersUp["K"], away: groupRunnersUp["L"] }, // 2K vs 2L
            { id: "K13", home: groupWinners["G"], away: bestThirds[1] || null }, // 1G vs 3rd_2
            { id: "K14", home: groupWinners["H"], away: groupWinners["I"] },     // 1H vs 1I
            { id: "K15", home: groupWinners["J"], away: bestThirds[0] || null }, // 1J vs 3rd_1
            { id: "K16", home: groupWinners["K"], away: groupWinners["L"] }      // 1K vs 1L
        ];

        pairingRules.forEach(rule => {
            const match = state.knockout.round_32.find(m => m.id === rule.id);
            if (match) {
                match.home = rule.home;
                match.away = rule.away;
            }
        });

        // 4. Đẩy tiếp các đội thắng từ vòng 32 đội lên các vòng sau
        propagateKnockoutWinners();
        saveData();
    }

    // Hàm đệ quy/tuần tự đẩy các đội thắng lên vòng tiếp theo
    function propagateKnockoutWinners() {
        // Vòng 32 -> Vòng 16
        // K17 đấu: Thắng K1 vs Thắng K2
        // K18 đấu: Thắng K3 vs Thắng K4, vv.
        for (let i = 0; i < 8; i++) {
            const match1 = state.knockout.round_32[i * 2];
            const match2 = state.knockout.round_32[i * 2 + 1];
            const nextMatch = state.knockout.round_16[i];

            nextMatch.home = (match1.status === "completed") ? match1.winner : null;
            nextMatch.away = (match2.status === "completed") ? match2.winner : null;

            // Nếu đội bị rút do thay đổi kết quả vòng trước
            if (!nextMatch.home || !nextMatch.away) {
                nextMatch.status = "scheduled";
                nextMatch.homeScore = null;
                nextMatch.awayScore = null;
                nextMatch.winner = null;
                nextMatch.penalty = null;
            }
        }

        // Vòng 16 -> Tứ kết
        for (let i = 0; i < 4; i++) {
            const match1 = state.knockout.round_16[i * 2];
            const match2 = state.knockout.round_16[i * 2 + 1];
            const nextMatch = state.knockout.quarter[i];

            nextMatch.home = (match1.status === "completed") ? match1.winner : null;
            nextMatch.away = (match2.status === "completed") ? match2.winner : null;

            if (!nextMatch.home || !nextMatch.away) {
                nextMatch.status = "scheduled";
                nextMatch.homeScore = null;
                nextMatch.awayScore = null;
                nextMatch.winner = null;
                nextMatch.penalty = null;
            }
        }

        // Tứ kết -> Bán kết
        for (let i = 0; i < 2; i++) {
            const match1 = state.knockout.quarter[i * 2];
            const match2 = state.knockout.quarter[i * 2 + 1];
            const nextMatch = state.knockout.semi[i];

            nextMatch.home = (match1.status === "completed") ? match1.winner : null;
            nextMatch.away = (match2.status === "completed") ? match2.winner : null;

            if (!nextMatch.home || !nextMatch.away) {
                nextMatch.status = "scheduled";
                nextMatch.homeScore = null;
                nextMatch.awayScore = null;
                nextMatch.winner = null;
                nextMatch.penalty = null;
            }
        }

        // Bán kết -> Chung kết & Tranh hạng ba
        const semi1 = state.knockout.semi[0];
        const semi2 = state.knockout.semi[1];
        
        const finalMatch = state.knockout.final[0];
        const thirdPlaceMatch = state.knockout.third_place[0];

        // Chung kết
        finalMatch.home = (semi1.status === "completed") ? semi1.winner : null;
        finalMatch.away = (semi2.status === "completed") ? semi2.winner : null;

        if (!finalMatch.home || !finalMatch.away) {
            finalMatch.status = "scheduled";
            finalMatch.homeScore = null;
            finalMatch.awayScore = null;
            finalMatch.winner = null;
            finalMatch.penalty = null;
        }

        // Tranh hạng ba
        if (semi1.status === "completed" && semi2.status === "completed") {
            // Lấy đội thua bán kết
            thirdPlaceMatch.home = (semi1.winner === semi1.home) ? semi1.away : semi1.home;
            thirdPlaceMatch.away = (semi2.winner === semi2.home) ? semi2.away : semi2.home;
        } else {
            thirdPlaceMatch.home = null;
            thirdPlaceMatch.away = null;
            thirdPlaceMatch.status = "scheduled";
            thirdPlaceMatch.homeScore = null;
            thirdPlaceMatch.awayScore = null;
            thirdPlaceMatch.winner = null;
            thirdPlaceMatch.penalty = null;
        }
    }

    // Dọn sạch dữ liệu các vòng sau nếu kết quả vòng bảng bị làm mới
    function clearSubsequentRounds() {
        const stages = ["round_16", "quarter", "semi", "third_place", "final"];
        stages.forEach(stage => {
            state.knockout[stage].forEach(m => {
                m.home = null;
                m.away = null;
                m.homeScore = null;
                m.awayScore = null;
                m.status = "scheduled";
                m.winner = null;
                m.penalty = null;
            });
        });
    }

    // ==========================================
    // GẮN VIDEO HIGHLIGHT TỰ ĐỘNG
    // ==========================================

    // Tạo link tìm kiếm highlight tự động nếu không có link thủ công
    function getMatchHighlightUrl(match) {
        if (match.highlight) {
            return match.highlight;
        }
        
        const homeName = state.teams[match.home]?.name || match.placeholderHome || "Đội A";
        const awayName = state.teams[match.away]?.name || match.placeholderAway || "Đội B";
        const query = encodeURIComponent(`FIFA World Cup 2026 Highlight ${homeName} vs ${awayName}`);
        return `https://www.youtube.com/results?search_query=${query}`;
    }

    // ==========================================
    // RENDER GIAO DIỆN CỦA TỪNG TAB
    // ==========================================

    // Gọi hàm render tương ứng với Tab đang mở
    function renderActiveTab() {
        // Cập nhật class active cho các nút tab
        document.querySelectorAll(".tab-btn").forEach(btn => {
            const isTarget = btn.getAttribute("data-tab") === state.activeTab;
            btn.classList.toggle("active", isTarget);
            btn.setAttribute("aria-selected", isTarget ? "true" : "false");
        });

        // Cập nhật class active cho các phần nội dung tab
        document.querySelectorAll(".tab-content").forEach(content => {
            content.classList.toggle("active", content.id === `${state.activeTab}-tab`);
        });

        // Render nội dung chi tiết
        if (state.activeTab === "group-stage") {
            renderGroupStageTab();
        } else if (state.activeTab === "knockout-bracket") {
            renderKnockoutTab();
        } else if (state.activeTab === "tournament-stats") {
            renderStatsTab();
        } else if (state.activeTab === "admin-panel") {
            renderAdminTab();
        }
    }

    // TAB 1: Render Vòng bảng & Bảng xếp hạng
    function renderGroupStageTab() {
        const groupsGrid = document.getElementById("groups-grid");
        groupsGrid.innerHTML = "";

        const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

        // 1. Tính toán 8 đội thứ ba tốt nhất để đánh dấu màu sắc
        const bestThirds = calculateBestThirdPlacedTeams().slice(0, 8).map(t => t.id);

        groups.forEach(groupName => {
            const standings = calculateGroupStandings(groupName);
            const groupCard = document.createElement("div");
            groupCard.className = "group-card";

            let tableRowsHtml = "";
            standings.forEach((team, index) => {
                const isBestThird = index === 2 && bestThirds.includes(team.id);
                const rowClass = index < 2 ? "qualified" : (isBestThird ? "best-third" : "");
                
                tableRowsHtml += `
                    <tr class="${rowClass}">
                        <td class="team-col">
                            <span class="team-flag">${team.flag}</span>
                            <span class="team-name" title="${team.name}">${team.name}</span>
                        </td>
                        <td>${team.played}</td>
                        <td>${team.won}</td>
                        <td>${team.drawn}</td>
                        <td>${team.lost}</td>
                        <td>${team.gf}:${team.ga}</td>
                        <td>${team.gd >= 0 ? "+" + team.gd : team.gd}</td>
                        <td class="pts-col">${team.pts}</td>
                    </tr>
                `;
            });

            groupCard.innerHTML = `
                <div class="group-card-header">
                    <span>Bảng ${groupName}</span>
                </div>
                <table class="standings-table">
                    <thead>
                        <tr>
                            <th class="team-col">Đội bóng</th>
                            <th title="Số trận đã chơi">Trận</th>
                            <th title="Thắng">T</th>
                            <th title="Hòa">H</th>
                            <th title="Thua">B</th>
                            <th title="Bàn thắng : Bàn thua">BT</th>
                            <th title="Hiệu số">HS</th>
                            <th title="Điểm số">Điểm</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                </table>
            `;
            groupsGrid.appendChild(groupCard);
        });

        // 2. Render danh sách trận đấu bên sidebar
        renderGroupMatchesSidebar();
    }

    // Render danh sách trận đấu vòng bảng
    function renderGroupMatchesSidebar() {
        const filterVal = document.getElementById("group-filter").value;
        const matchesContainer = document.getElementById("group-matches-list");
        matchesContainer.innerHTML = "";

        let filteredMatches = state.matches;
        if (filterVal !== "all") {
            filteredMatches = state.matches.filter(m => m.group === filterVal);
        }

        if (filteredMatches.length === 0) {
            matchesContainer.innerHTML = `<p style="color: var(--color-text-secondary); text-align: center; margin-top: 20px;">Không tìm thấy trận đấu nào.</p>`;
            return;
        }

        filteredMatches.forEach(match => {
            const homeTeam = state.teams[match.home];
            const awayTeam = state.teams[match.away];
            const isCompleted = match.status === "completed";
            
            const matchCard = document.createElement("div");
            matchCard.className = "match-item-card";

            let scoreDisplay = "vs";
            if (isCompleted) {
                scoreDisplay = `${match.homeScore} - ${match.awayScore}`;
            }

            matchCard.innerHTML = `
                <div class="match-meta-info">
                    <span class="match-group-badge">Bảng ${match.group} • Lượt ${match.round}</span>
                    <span>${formatDate(match.date)} ${match.time}</span>
                </div>
                <div class="match-teams-grid">
                    <div class="match-team-row home">
                        <span class="team-name" title="${homeTeam.name}">${homeTeam.name}</span>
                        <span class="team-flag">${homeTeam.flag}</span>
                    </div>
                    <div class="match-score-box">${scoreDisplay}</div>
                    <div class="match-team-row away">
                        <span class="team-flag">${awayTeam.flag}</span>
                        <span class="team-name" title="${awayTeam.name}">${awayTeam.name}</span>
                    </div>
                </div>
                <div class="match-actions-footer">
                    <span class="stadium-text" title="${match.stadium}">🏟️ ${match.stadium}</span>
                    ${isCompleted ? `
                        <button class="btn-highlight" data-match-id="${match.id}">
                            🎥 Highlight
                        </button>
                    ` : `<span style="color: var(--color-text-muted);">Sắp diễn ra</span>`}
                </div>
            `;

            // Gắn sự kiện xem highlight
            const btnHighlight = matchCard.querySelector(".btn-highlight");
            if (btnHighlight) {
                btnHighlight.addEventListener("click", () => showHighlightModal(match));
            }

            matchesContainer.appendChild(matchCard);
        });
    }

    // TAB 2: Render Sơ đồ nhánh đấu loại trực tiếp (Knockout Bracket)
    function renderKnockoutTab() {
        // Cánh trái (K1-K8, K17-K20, K25-K26, K29)
        const left32 = document.getElementById("matches-l-r32");
        const left16 = document.getElementById("matches-l-r16");
        const leftQuarter = document.getElementById("matches-l-quarter");
        const leftSemi = document.getElementById("matches-l-semi");

        left32.innerHTML = "";
        left16.innerHTML = "";
        leftQuarter.innerHTML = "";
        leftSemi.innerHTML = "";

        // Render cánh trái
        state.knockout.round_32.slice(0, 8).forEach(m => left32.appendChild(createKnockoutMatchCard(m)));
        state.knockout.round_16.slice(0, 4).forEach(m => left16.appendChild(createKnockoutMatchCard(m)));
        state.knockout.quarter.slice(0, 2).forEach(m => leftQuarter.appendChild(createKnockoutMatchCard(m)));
        leftSemi.appendChild(createKnockoutMatchCard(state.knockout.semi[0]));

        // Cánh phải (K9-K16, K21-K24, K27-K28, K30)
        const right32 = document.getElementById("matches-r-r32");
        const right16 = document.getElementById("matches-r-r16");
        const rightQuarter = document.getElementById("matches-r-quarter");
        const rightSemi = document.getElementById("matches-r-semi");

        right32.innerHTML = "";
        right16.innerHTML = "";
        rightQuarter.innerHTML = "";
        rightSemi.innerHTML = "";

        // Render cánh phải
        state.knockout.round_32.slice(8, 16).forEach(m => right32.appendChild(createKnockoutMatchCard(m)));
        state.knockout.round_16.slice(4, 8).forEach(m => right16.appendChild(createKnockoutMatchCard(m)));
        state.knockout.quarter.slice(2, 4).forEach(m => rightQuarter.appendChild(createKnockoutMatchCard(m)));
        rightSemi.appendChild(createKnockoutMatchCard(state.knockout.semi[1]));

        // Cột trung tâm (Chung kết K32, Tranh hạng ba K31)
        const finalsContainer = document.getElementById("matches-finals");
        const thirdPlaceContainer = document.getElementById("matches-third-place");

        finalsContainer.innerHTML = "";
        thirdPlaceContainer.innerHTML = "";

        finalsContainer.appendChild(createKnockoutMatchCard(state.knockout.final[0], "Chung kết"));
        thirdPlaceContainer.appendChild(createKnockoutMatchCard(state.knockout.third_place[0], "Tranh hạng ba"));
    }

    // Hàm tạo thẻ trận đấu Knockout
    function createKnockoutMatchCard(match, titleOverride = null) {
        const card = document.createElement("div");
        const isCompleted = match.status === "completed";
        card.className = `knockout-match-card ${isCompleted ? "completed" : ""}`;
        if (isCompleted) card.classList.add("completed");

        const homeTeam = state.teams[match.home];
        const awayTeam = state.teams[match.away];

        const homeName = homeTeam ? homeTeam.name : (match.placeholderHome || "Chưa xác định");
        const homeFlag = homeTeam ? homeTeam.flag : `<span style="font-size:1.15rem;">🏳️</span>`;
        const awayName = awayTeam ? awayTeam.name : (match.placeholderAway || "Chưa xác định");
        const awayFlag = awayTeam ? awayTeam.flag : `<span style="font-size:1.15rem;">🏳️</span>`;

        const homeScoreVal = isCompleted ? match.homeScore : "-";
        const awayScoreVal = isCompleted ? match.awayScore : "-";

        let homePenHtml = "";
        let awayPenHtml = "";
        if (isCompleted && match.penalty) {
            homePenHtml = `<span class="penalty-score">(${match.penalty.home})</span>`;
            awayPenHtml = `<span class="penalty-score">(${match.penalty.away})</span>`;
        }

        const isHomeWinner = isCompleted && match.winner === match.home;
        const isAwayWinner = isCompleted && match.winner === match.away;

        card.innerHTML = `
            <div class="match-info-header">
                <span class="match-id-badge">${titleOverride || match.id}</span>
                <span>${formatDate(match.date)}</span>
            </div>
            <div class="knockout-team-row ${isHomeWinner ? "winner" : (isCompleted ? "loser" : "")}">
                <div class="knockout-team-info">
                    <span class="team-flag">${homeFlag}</span>
                    <span class="${!homeTeam ? "placeholder-team" : ""}">${homeName}</span>
                </div>
                <div class="knockout-score">
                    ${homeScoreVal}${homePenHtml}
                </div>
            </div>
            <div class="knockout-team-row ${isAwayWinner ? "winner" : (isCompleted ? "loser" : "")}">
                <div class="knockout-team-info">
                    <span class="team-flag">${awayFlag}</span>
                    <span class="${!awayTeam ? "placeholder-team" : ""}">${awayName}</span>
                </div>
                <div class="knockout-score">
                    ${awayScoreVal}${awayPenHtml}
                </div>
            </div>
            <div class="knockout-card-footer">
                <span class="stadium-text-small" title="${match.stadium}">🏟️ ${match.stadium}</span>
                ${isCompleted ? `
                    <button class="btn-highlight" style="font-size: 0.65rem; padding: 1px 5px;" data-match-id="${match.id}">
                        🎥 Video
                    </button>
                ` : `<span>${match.time}</span>`}
            </div>
        `;

        const btnHighlight = card.querySelector(".btn-highlight");
        if (btnHighlight) {
            btnHighlight.addEventListener("click", (e) => {
                e.stopPropagation();
                showHighlightModal(match);
            });
        }

        return card;
    }

    // TAB 3: Render Thống kê giải đấu
    function renderStatsTab() {
        // 1. Tính toán số liệu tổng quan
        const completedMatches = state.matches.filter(m => m.status === "completed")
            .concat(Object.values(state.knockout).flat().filter(m => m.status === "completed"));

        const playedCount = completedMatches.length;
        document.getElementById("stat-matches-played").innerText = playedCount;

        let totalGoals = 0;
        const teamGoals = {}; // Thống kê xem đội nào ghi bàn nhiều nhất
        const cleanSheets = {}; // Thống kê giữ sạch lưới

        completedMatches.forEach(m => {
            totalGoals += (m.homeScore + m.awayScore);
            
            if (m.home) {
                teamGoals[m.home] = (teamGoals[m.home] || 0) + m.homeScore;
                if (m.awayScore === 0) cleanSheets[m.home] = (cleanSheets[m.home] || 0) + 1;
            }
            if (m.away) {
                teamGoals[m.away] = (teamGoals[m.away] || 0) + m.awayScore;
                if (m.homeScore === 0) cleanSheets[m.away] = (cleanSheets[m.away] || 0) + 1;
            }
        });

        document.getElementById("stat-total-goals").innerText = totalGoals;
        document.getElementById("stat-avg-goals").innerText = playedCount > 0 ? (totalGoals / playedCount).toFixed(2) : "0.0";

        // Tìm đội ghi nhiều bàn nhất
        let topGoalTeam = "-";
        let maxGoals = 0;
        Object.entries(teamGoals).forEach(([teamId, goals]) => {
            if (goals > maxGoals) {
                maxGoals = goals;
                const flagHtml = state.teams[teamId] ? `<span style="margin-right:5px;">${state.teams[teamId].flag}</span>` : "";
                topGoalTeam = `${flagHtml} ${state.teams[teamId]?.name || teamId} (${goals} bàn)`;
            }
        });
        document.getElementById("stat-top-team").innerHTML = topGoalTeam;

        // 2. Render Vua phá lưới (Top Scorers) và Kiến tạo từ danh sách players
        // Sắp xếp cầu thủ theo bàn thắng giảm dần
        const topScorers = [...state.players].sort((a, b) => b.goals - a.goals).slice(0, 5);
        const scorersList = document.getElementById("scorers-list");
        scorersList.innerHTML = "";

        topScorers.forEach((p, idx) => {
            const team = state.teams[p.team];
            const flagHtml = team ? `<span style="margin-right:5px;">${team.flag}</span>` : "";
            const item = document.createElement("div");
            item.className = "stats-item";
            item.innerHTML = `
                <span class="stats-rank">${idx + 1}</span>
                <div class="stats-player-info">
                    <span class="stats-player-name">${p.name}</span>
                    <span class="stats-player-team">${flagHtml} ${team ? team.name : p.team}</span>
                </div>
                <span class="stats-value">${p.goals} ⚽</span>
            `;
            scorersList.appendChild(item);
        });

        // Kiến tạo nhiều nhất
        const topAssists = [...state.players].sort((a, b) => b.assists - a.assists).slice(0, 5);
        const assistsList = document.getElementById("assists-list");
        assistsList.innerHTML = "";

        topAssists.forEach((p, idx) => {
            const team = state.teams[p.team];
            const flagHtml = team ? `<span style="margin-right:5px;">${team.flag}</span>` : "";
            const item = document.createElement("div");
            item.className = "stats-item";
            item.innerHTML = `
                <span class="stats-rank">${idx + 1}</span>
                <div class="stats-player-info">
                    <span class="stats-player-name">${p.name}</span>
                    <span class="stats-player-team">${flagHtml} ${team ? team.name : p.team}</span>
                </div>
                <span class="stats-value">${p.assists} 👟</span>
            `;
            assistsList.appendChild(item);
        });

        // 3. Render giữ sạch lưới (Hàng thủ tốt nhất)
        const sortedDefenders = Object.entries(cleanSheets).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const defendersList = document.getElementById("defenders-list");
        defendersList.innerHTML = "";

        if (sortedDefenders.length === 0) {
            defendersList.innerHTML = `<p style="color: var(--color-text-muted); font-size: 0.85rem; padding: 10px;">Chưa có thống kê.</p>`;
        } else {
            sortedDefenders.forEach(([teamId, count], idx) => {
                const team = state.teams[teamId];
                const flagHtml = team ? `<span style="margin-right:5px;">${team.flag}</span>` : "";
                const item = document.createElement("div");
                item.className = "stats-item";
                item.innerHTML = `
                    <span class="stats-rank">${idx + 1}</span>
                    <div class="stats-player-info">
                        <span class="stats-player-name" style="font-weight: 600;">Hàng thủ ${team?.name || teamId}</span>
                        <span class="stats-player-team">${flagHtml}</span>
                    </div>
                    <span class="stats-value">${count} trận sạch lưới</span>
                `;
                defendersList.appendChild(item);
            });
        }
    }

    // TAB 4: Render Bảng điều khiển admin
    function renderAdminTab() {
        const matchSelect = document.getElementById("admin-match-select");
        
        // Lưu giữ giá trị được chọn trước đó
        const prevSelectedVal = matchSelect.value;
        
        matchSelect.innerHTML = `<option value="" disabled ${!prevSelectedVal ? "selected" : ""}>Vui lòng chọn trận đấu bên phải hoặc tại đây...</option>`;

        // Gom tất cả các trận đấu gồm cả group và knockout
        const allMatches = [];
        state.matches.forEach(m => allMatches.push(m));
        
        // Đưa các trận knockout vào
        const knockoutStages = ["round_32", "round_16", "quarter", "semi", "third_place", "final"];
        knockoutStages.forEach(stage => {
            state.knockout[stage].forEach(m => {
                allMatches.push(m);
            });
        });

        allMatches.forEach(match => {
            const homeName = state.teams[match.home]?.name || match.placeholderHome || "Chưa xác định";
            const awayName = state.teams[match.away]?.name || match.placeholderAway || "Chưa xác định";
            const statusStr = match.status === "completed" ? "Kết thúc" : "Chưa đá";
            const label = `[${match.type === "group" ? "Bảng " + match.group : getStageLabel(match.stage)}] ${match.id}: ${homeName} vs ${awayName} (${statusStr})`;
            
            const option = document.createElement("option");
            option.value = match.id;
            option.innerText = label;
            if (prevSelectedVal === match.id) {
                option.selected = true;
            }
            matchSelect.appendChild(option);
        });

        // Render danh sách trận đấu ở khung bên phải
        renderAdminMatchesList(allMatches);
    }

    // Render danh sách trận đấu bên phải trong Admin Panel
    function renderAdminMatchesList(allMatches) {
        const container = document.getElementById("admin-matches-list");
        container.innerHTML = "";

        allMatches.forEach(match => {
            const homeTeam = state.teams[match.home];
            const awayTeam = state.teams[match.away];
            const isCompleted = match.status === "completed";
            
            const row = document.createElement("div");
            row.className = "admin-match-row";
            
            // Highlight trận đấu đang được chọn trong form
            const selectEl = document.getElementById("admin-match-select");
            if (selectEl.value === match.id) {
                row.classList.add("selected");
            }

            const homeName = homeTeam ? homeTeam.name : (match.placeholderHome || "Chưa xác định");
            const homeFlag = homeTeam ? homeTeam.flag : `🏳️`;
            const awayName = awayTeam ? awayTeam.name : (match.placeholderAway || "Chưa xác định");
            const awayFlag = awayTeam ? awayTeam.flag : `🏳️`;

            let scoreText = "vs";
            if (isCompleted) {
                scoreText = `${match.homeScore} - ${match.awayScore}`;
                if (match.penalty) {
                    scoreText += ` (${match.penalty.home} - ${match.penalty.away} Pen)`;
                }
            }

            row.innerHTML = `
                <div style="font-size: 0.8rem; color: var(--color-text-secondary);">
                    <strong>${match.id}</strong> • ${match.type === "group" ? "Bảng " + match.group : getStageLabel(match.stage)}
                </div>
                <div style="display: flex; align-items: center; gap: 8px; font-weight: 500;">
                    <span>${homeFlag} ${homeName}</span>
                    <span style="font-family: var(--font-mono); font-weight: bold; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px;">${scoreText}</span>
                    <span>${awayName} ${awayFlag}</span>
                </div>
            `;

            row.addEventListener("click", () => {
                document.getElementById("admin-match-select").value = match.id;
                handleMatchSelectionChange(match.id);
                renderAdminTab(); // Re-render để cập nhật class selected
            });

            container.appendChild(row);
        });
    }

    // Nhãn hiển thị tiếng Việt cho các vòng đấu knockout
    function getStageLabel(stage) {
        switch (stage) {
            case "round_32": return "Vòng 32";
            case "round_16": return "Vòng 16";
            case "quarter": return "Tứ kết";
            case "semi": return "Bán kết";
            case "third_place": return "Hạng ba";
            case "final": return "Chung kết";
            default: return stage;
        }
    }

    // Xử lý sự kiện khi chọn một trận đấu trong danh sách Admin
    function handleMatchSelectionChange(matchId) {
        let match = state.matches.find(m => m.id === matchId);
        if (!match) {
            // Tìm trong knockout
            const stages = ["round_32", "round_16", "quarter", "semi", "third_place", "final"];
            for (let stage of stages) {
                match = state.knockout[stage].find(m => m.id === matchId);
                if (match) break;
            }
        }

        if (!match) return;

        // Cập nhật tên hiển thị
        const homeTeam = state.teams[match.home];
        const awayTeam = state.teams[match.away];

        document.getElementById("admin-home-name").innerText = homeTeam ? homeTeam.name : (match.placeholderHome || "Chưa xác định");
        document.getElementById("admin-home-flag").innerHTML = homeTeam ? homeTeam.flag : "🏳️";
        document.getElementById("admin-away-name").innerText = awayTeam ? awayTeam.name : (match.placeholderAway || "Chưa xác định");
        document.getElementById("admin-away-flag").innerHTML = awayTeam ? awayTeam.flag : "🏳️";

        // Hiển thị các khối nhập liệu
        document.getElementById("team-vs-display").style.display = "block";
        document.getElementById("score-inputs-container").style.display = "flex";
        document.getElementById("highlight-input-container").style.display = "block";
        document.getElementById("btn-save-match").style.display = "block";

        // Đổ điểm số hiện tại nếu có
        document.getElementById("admin-home-score").value = match.homeScore !== null ? match.homeScore : "";
        document.getElementById("admin-away-score").value = match.awayScore !== null ? match.awayScore : "";
        document.getElementById("admin-highlight-url").value = match.highlight || "";

        // Nếu là trận đấu loại trực tiếp (Knockout), hiển thị phần sút luân lưu
        const penContainer = document.getElementById("penalty-inputs-container");
        if (match.type === "knockout") {
            penContainer.style.display = "block";
            document.getElementById("admin-home-pen").value = match.penalty ? match.penalty.home : "";
            document.getElementById("admin-away-pen").value = match.penalty ? match.penalty.away : "";
        } else {
            penContainer.style.display = "none";
        }

        // Cập nhật danh sách ghi bàn (nếu có cầu thủ cho 2 đội)
        setupScorersInputs(match);
    }

    // Thiết lập giao diện nhập cầu thủ ghi bàn
    function setupScorersInputs(match) {
        const scorersContainer = document.getElementById("scorers-input-container");
        const select = document.getElementById("admin-scorers-select");
        const tempScorersDiv = document.getElementById("temp-match-scorers");
        
        tempScorersDiv.innerHTML = "";
        select.innerHTML = `<option value="" disabled selected>Chọn cầu thủ...</option>`;

        // Chỉ cho phép cập nhật khi cả hai đội đã được xác định
        if (!match.home || !match.away) {
            scorersContainer.style.display = "none";
            return;
        }

        scorersContainer.style.display = "block";

        // Lấy danh sách cầu thủ của 2 đội
        const matchPlayers = state.players.filter(p => p.team === match.home || p.team === match.away);
        
        matchPlayers.forEach(p => {
            const option = document.createElement("option");
            option.value = p.name;
            option.innerText = `${p.name} (${state.teams[p.team]?.flag} ${state.teams[p.team]?.name})`;
            select.appendChild(option);
        });

        // Thiết lập sự kiện nút thêm bàn thắng tạm thời cho trận đấu
        // Ở đây chúng ta chỉ cập nhật chỉ số của player trực tiếp khi lưu kết quả trận đấu
    }

    // ==========================================
    // XỬ LÝ SỰ KIỆN CẬP NHẬT KẾT QUẢ & MÔ PHỎNG
    // ==========================================

    // Cập nhật thủ công kết quả trận đấu từ Form
    function updateMatchResult(matchId, homeScore, awayScore, penHome, penAway, highlightUrl) {
        let match = state.matches.find(m => m.id === matchId);
        let isKnockout = false;
        
        if (!match) {
            // Tìm trong knockout
            const stages = ["round_32", "round_16", "quarter", "semi", "third_place", "final"];
            for (let stage of stages) {
                match = state.knockout[stage].find(m => m.id === matchId);
                if (match) {
                    isKnockout = true;
                    break;
                }
            }
        }

        if (!match) {
            showToast("Không tìm thấy trận đấu!", "error");
            return;
        }

        // Đảm bảo đội bóng đã được xác định đối với knockout
        if (isKnockout && (!match.home || !match.away)) {
            showToast("Trận đấu chưa xác định đủ hai đội!", "error");
            return;
        }

        // 1. Cập nhật tỷ số cơ bản
        match.homeScore = homeScore;
        match.awayScore = awayScore;
        match.status = "completed";
        match.highlight = highlightUrl || null;

        // 2. Xử lý sút luân lưu cho knockout nếu hòa nhau
        if (isKnockout) {
            if (homeScore === awayScore) {
                if (penHome === null || penAway === null || penHome === penAway) {
                    showToast("Trận đấu hòa ở vòng knock-out phải có kết quả luân lưu (không được bằng nhau)!", "error");
                    match.status = "scheduled"; // Reset trạng thái
                    return;
                }
                match.penalty = { home: penHome, away: penAway };
                match.winner = penHome > penAway ? match.home : match.away;
            } else {
                match.penalty = null;
                match.winner = homeScore > awayScore ? match.home : match.away;
            }
        } else {
            // Vòng bảng không có penalty, winner được xác định bình thường
            if (homeScore > awayScore) match.winner = match.home;
            else if (homeScore < awayScore) match.winner = match.away;
            else match.winner = null;
        }

        // 3. Thêm bàn thắng ngẫu nhiên cho một số cầu thủ thuộc đội bóng đó để thống kê sinh động
        distributePlayerGoals(match);

        // 4. Cập nhật lại toàn bộ sơ đồ phân nhánh và bảng xếp hạng
        updateKnockoutBracket();
        updateTournamentProgressBar();
        saveData();
        
        showToast(`Cập nhật thành công trận ${matchId}!`, "success");
        renderActiveTab();
    }

    // Tự động phân chia bàn thắng cho các cầu thủ để thống kê phong phú
    function distributePlayerGoals(match) {
        if (!match.home || !match.away || match.homeScore === null) return;

        // Giới hạn chỉ cộng điểm một lần cho mỗi trận (được lưu vết bằng cờ hasGoalsRecorded)
        if (match.hasGoalsRecorded) return;

        // Chọn ngẫu nhiên cầu thủ của đội nhà để cộng bàn thắng
        const homePlayers = state.players.filter(p => p.team === match.home);
        if (homePlayers.length > 0) {
            let remainingGoals = match.homeScore;
            while (remainingGoals > 0) {
                const randomPlayer = homePlayers[Math.floor(Math.random() * homePlayers.length)];
                randomPlayer.goals++;
                // 50% cơ hội có một cầu thủ khác kiến tạo
                if (Math.random() > 0.5) {
                    const assistPlayer = homePlayers.find(p => p.name !== randomPlayer.name);
                    if (assistPlayer) assistPlayer.assists++;
                }
                remainingGoals--;
            }
        }

        // Chọn ngẫu nhiên cầu thủ của đội khách để cộng bàn thắng
        const awayPlayers = state.players.filter(p => p.team === match.away);
        if (awayPlayers.length > 0) {
            let remainingGoals = match.awayScore;
            while (remainingGoals > 0) {
                const randomPlayer = awayPlayers[Math.floor(Math.random() * awayPlayers.length)];
                randomPlayer.goals++;
                if (Math.random() > 0.5) {
                    const assistPlayer = awayPlayers.find(p => p.name !== randomPlayer.name);
                    if (assistPlayer) assistPlayer.assists++;
                }
                remainingGoals--;
            }
        }

        match.hasGoalsRecorded = true;
    }

    // Mô phỏng ngẫu nhiên kết quả 1 trận đấu
    function simulateMatch(match) {
        if (!match.home || !match.away) return;

        // Tạo tỉ số ngẫu nhiên nhưng thực tế (thường là 0 đến 3 bàn)
        const homeScore = Math.floor(Math.random() * 4);
        const awayScore = Math.floor(Math.random() * 4);
        
        match.homeScore = homeScore;
        match.awayScore = awayScore;
        match.status = "completed";

        if (match.type === "knockout") {
            if (homeScore === awayScore) {
                // Sút luân lưu ngẫu nhiên (phải có thắng thua)
                const penHome = Math.floor(Math.random() * 5) + 3;
                let penAway = Math.floor(Math.random() * 5) + 3;
                while (penHome === penAway) {
                    penAway = Math.floor(Math.random() * 5) + 3;
                }
                match.penalty = { home: penHome, away: penAway };
                match.winner = penHome > penAway ? match.home : match.away;
            } else {
                match.penalty = null;
                match.winner = homeScore > awayScore ? match.home : match.away;
            }
        } else {
            if (homeScore > awayScore) match.winner = match.home;
            else if (homeScore < awayScore) match.winner = match.away;
            else match.winner = null;
        }

        distributePlayerGoals(match);
    }

    // Mô phỏng 1 ngày thi đấu
    function simulateOneDay() {
        // Tìm ngày chưa hoàn thành trận đấu đầu tiên
        let allMatches = [...state.matches];
        const stages = ["round_32", "round_16", "quarter", "semi", "third_place", "final"];
        stages.forEach(stage => {
            state.knockout[stage].forEach(m => allMatches.push(m));
        });

        const firstUnplayedMatch = allMatches.find(m => m.status === "scheduled" && m.home && m.away);
        if (!firstUnplayedMatch) {
            showToast("Tất cả các trận đấu hiện tại đã hoàn tất hoặc chưa xác định đội!", "info");
            return;
        }

        const targetDate = firstUnplayedMatch.date;
        const matchesToPlay = allMatches.filter(m => m.date === targetDate && m.status === "scheduled" && m.home && m.away);

        matchesToPlay.forEach(m => simulateMatch(m));

        updateKnockoutBracket();
        updateTournamentProgressBar();
        saveData();
        showToast(`Đã mô phỏng xong ${matchesToPlay.length} trận đấu của ngày ${formatDate(targetDate)}!`, "success");
        renderActiveTab();
    }

    // Mô phỏng toàn bộ vòng bảng
    function simulateAllGroupMatches() {
        const unplayedGroupMatches = state.matches.filter(m => m.status === "scheduled");
        
        if (unplayedGroupMatches.length === 0) {
            showToast("Vòng bảng đã hoàn thành từ trước!", "info");
            return;
        }

        unplayedGroupMatches.forEach(m => simulateMatch(m));

        updateKnockoutBracket();
        updateTournamentProgressBar();
        saveData();
        showToast("Đã mô phỏng hoàn tất toàn bộ vòng bảng!", "success");
        renderActiveTab();
    }

    // Mô phỏng toàn bộ giải đấu (Vòng bảng và Knock-out)
    function simulateEntireTournament() {
        // 1. Mô phỏng vòng bảng
        const unplayedGroup = state.matches.filter(m => m.status === "scheduled");
        unplayedGroup.forEach(m => simulateMatch(m));
        updateKnockoutBracket();

        // 2. Mô phỏng tuần tự các vòng knockout (phải cập nhật bracket sau mỗi vòng để có đội đi tiếp)
        const stages = ["round_32", "round_16", "quarter", "semi", "third_place", "final"];
        
        stages.forEach(stage => {
            // Chạy nhiều lần để đẩy đội đi tiếp
            updateKnockoutBracket();
            const unplayedKnockout = state.knockout[stage].filter(m => m.status === "scheduled" && m.home && m.away);
            unplayedKnockout.forEach(m => simulateMatch(m));
        });

        updateKnockoutBracket();
        updateTournamentProgressBar();
        saveData();

        // Tìm nhà vô địch
        const finalMatch = state.knockout.final[0];
        let championText = "";
        if (finalMatch.status === "completed") {
            const champion = state.teams[finalMatch.winner];
            championText = `🏆 Nhà vô địch World Cup 2026: ${champion?.flag} ${champion?.name}!`;
        }

        showToast(`Giải đấu đã được mô phỏng xong! ${championText}`, "success");
        renderActiveTab();
    }

    // ==========================================
    // GIAO DIỆN TƯƠNG TÁC (MODALS, TOASTS, DÉCOR)
    // ==========================================

    // Cập nhật thanh tiến trình giải đấu
    function updateTournamentProgressBar() {
        const completedGroup = state.matches.filter(m => m.status === "completed").length;
        
        let completedKnockout = 0;
        const stages = ["round_32", "round_16", "quarter", "semi", "third_place", "final"];
        stages.forEach(stage => {
            completedKnockout += state.knockout[stage].filter(m => m.status === "completed").length;
        });

        const totalCompleted = completedGroup + completedKnockout;
        document.getElementById("played-matches-count").innerText = totalCompleted;

        // Cập nhật trạng thái hoạt động của các bước
        const stepGroup = document.getElementById("step-group");
        const stepR32 = document.getElementById("step-r32");
        const stepR16 = document.getElementById("step-r16");
        const stepQuarter = document.getElementById("step-quarter");
        const stepSemi = document.getElementById("step-semi");
        const stepFinal = document.getElementById("step-final");

        // Gỡ bỏ class active trước
        [stepGroup, stepR32, stepR16, stepQuarter, stepSemi, stepFinal].forEach(el => el.classList.remove("active"));

        if (totalCompleted === 104) {
            stepFinal.classList.add("active");
        } else if (totalCompleted >= 102) {
            stepFinal.classList.add("active");
        } else if (totalCompleted >= 96) {
            stepSemi.classList.add("active");
        } else if (totalCompleted >= 88) {
            stepQuarter.classList.add("active");
        } else if (totalCompleted >= 72) {
            stepR16.classList.add("active");
        } else if (totalCompleted > 0) {
            stepR32.classList.add("active");
        } else {
            stepGroup.classList.add("active");
        }
    }

    // Hiển thị hộp thoại xem highlight
    function showHighlightModal(match) {
        const modal = document.getElementById("video-modal");
        const playerContainer = document.getElementById("video-player-container");
        const matchDesc = document.getElementById("video-match-desc");
        const btnWatchYoutube = document.getElementById("btn-watch-youtube");

        const homeTeam = state.teams[match.home];
        const awayTeam = state.teams[match.away];
        const title = `${homeTeam.flag} ${homeTeam.name} ${match.homeScore} - ${match.awayScore} ${awayTeam.name} ${awayTeam.flag}`;
        
        document.getElementById("video-modal-title").innerText = `Highlight: ${homeTeam.name} vs ${awayTeam.name}`;
        matchDesc.innerText = `Trận đấu diễn ra tại sân vận động ${match.stadium} ngày ${formatDate(match.date)}.`;

        const videoUrl = getMatchHighlightUrl(match);
        btnWatchYoutube.href = videoUrl;

        // Phân tích xem có phải link YouTube để nhúng iframe được không
        let embedUrl = "";
        let isEmbeddable = false;

        // Biểu thức chính quy trích xuất video ID từ link YouTube
        const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const matchYt = videoUrl.match(ytRegex);

        if (matchYt && matchYt[1]) {
            embedUrl = `https://www.youtube.com/embed/${matchYt[1]}`;
            isEmbeddable = true;
        }

        if (isEmbeddable) {
            playerContainer.innerHTML = `
                <iframe src="${embedUrl}?autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            `;
        } else {
            playerContainer.innerHTML = `
                <div class="video-fallback-box">
                    <div class="video-fallback-icon">🎥</div>
                    <div class="video-fallback-title">Đã chuẩn bị sẵn link highlight YouTube!</div>
                    <p style="font-size: 0.85rem; margin-bottom: 15px;">Hệ thống tự động tìm kiếm kết quả highlight cho trận đấu này trên YouTube do không có nguồn nhúng trực tiếp.</p>
                    <a href="${videoUrl}" target="_blank" class="btn-primary" style="display:inline-block; width:auto;">Mở YouTube xem ngay</a>
                </div>
            `;
        }

        modal.classList.add("active");
    }

    // Đóng modal xem highlight
    function closeModal() {
        const modal = document.getElementById("video-modal");
        const playerContainer = document.getElementById("video-player-container");
        playerContainer.innerHTML = ""; // Xóa iframe để dừng phát nhạc ẩn
        modal.classList.remove("active");
    }

    // Hiển thị thông báo Toast
    function showToast(message, type = "success") {
        const container = document.getElementById("toast-container");
        const toast = document.createElement("div");
        toast.className = `toast-message ${type}`;

        let icon = "🔔";
        if (type === "success") icon = "✅";
        else if (type === "error") icon = "❌";
        else if (type === "info") icon = "ℹ️";

        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        container.appendChild(toast);

        // Tự động biến mất sau 4 giây
        setTimeout(() => {
            toast.style.animation = "slideInLeft 0.3s ease reverse forwards";
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    }

    // Định dạng ngày tháng
    function formatDate(dateStr) {
        if (!dateStr) return "";
        const parts = dateStr.split("-");
        if (parts.length !== 3) return dateStr;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    // ==========================================
    // THIẾT LẬP CÁC LẮNG NGHE SỰ KIỆN (EVENTS)
    // ==========================================
    function setupEventListeners() {
        // 1. Sự kiện chuyển Tab
        document.querySelectorAll(".tab-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                state.activeTab = btn.getAttribute("data-tab");
                saveData();
                renderActiveTab();
            });
        });

        // Sự kiện chuyển đổi Theme sáng/tối
        document.getElementById("theme-toggle").addEventListener("click", () => {
            state.theme = state.theme === "dark" ? "light" : "dark";
            saveData();
            applyTheme();
            showToast(`Đã chuyển sang giao diện ${state.theme === "dark" ? "tối" : "sáng"}!`, "info");
        });

        // Nhấp vào thanh tiến trình để chuyển đổi nhanh vòng thi đấu và cuộn đến cột tương ứng
        const stepsMap = {
            "step-group": { tab: "group-stage", colId: null },
            "step-r32": { tab: "knockout-bracket", colId: "col-l-r32", cols: ["col-l-r32", "col-r-r32"] },
            "step-r16": { tab: "knockout-bracket", colId: "col-l-r16", cols: ["col-l-r16", "col-r-r16"] },
            "step-quarter": { tab: "knockout-bracket", colId: "col-l-quarter", cols: ["col-l-quarter", "col-r-quarter"] },
            "step-semi": { tab: "knockout-bracket", colId: "col-l-semi", cols: ["col-l-semi", "col-r-semi"] },
            "step-final": { tab: "knockout-bracket", colId: "col-finals", cols: ["col-finals"] }
        };

        Object.entries(stepsMap).forEach(([stepId, target]) => {
            const stepEl = document.getElementById(stepId);
            if (stepEl) {
                stepEl.addEventListener("click", () => {
                    // Chuyển tab
                    state.activeTab = target.tab;
                    saveData();
                    renderActiveTab();

                    // Nếu là knockout, cuộn và nhấp nháy phát sáng cột tương ứng
                    if (target.colId) {
                        setTimeout(() => {
                            const wrapper = document.getElementById("bracket-wrapper");
                            const mainCol = document.getElementById(target.colId);
                            if (mainCol && wrapper) {
                                // Cuộn tới cột tương ứng
                                mainCol.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                                
                                // Tạo hiệu ứng nhấp nháy phát sáng cho cột tương ứng
                                target.cols.forEach(id => {
                                    const col = document.getElementById(id);
                                    if (col) {
                                        col.classList.remove("highlight-pulse");
                                        void col.offsetWidth; // Trigger reflow
                                        col.classList.add("highlight-pulse");
                                        setTimeout(() => col.classList.remove("highlight-pulse"), 1300);
                                    }
                                });
                            }
                        }, 100);
                    }
                });
            }
        });

        // 2. Sự kiện bộ lọc bảng đấu bên sidebar
        document.getElementById("group-filter").addEventListener("change", () => {
            renderGroupMatchesSidebar();
        });

        // 3. Zoom sơ đồ nhánh đấu knockout
        const zoomArea = document.getElementById("bracket-zoom-area");
        document.getElementById("btn-zoom-in").addEventListener("click", () => {
            state.zoomLevel = Math.min(state.zoomLevel + 0.1, 1.5);
            zoomArea.style.transform = `scale(${state.zoomLevel})`;
            saveData();
        });

        document.getElementById("btn-zoom-out").addEventListener("click", () => {
            state.zoomLevel = Math.max(state.zoomLevel - 0.1, 0.6);
            zoomArea.style.transform = `scale(${state.zoomLevel})`;
            saveData();
        });

        document.getElementById("btn-zoom-reset").addEventListener("click", () => {
            state.zoomLevel = 1.0;
            zoomArea.style.transform = `scale(1.0)`;
            saveData();
        });

        // Hỗ trợ kéo thả (drag) để cuộn sơ đồ knockout
        const wrapper = document.getElementById("bracket-wrapper");
        let isDown = false;
        let startX;
        let scrollLeft;
        let startY;
        let scrollTop;

        wrapper.addEventListener("mousedown", (e) => {
            isDown = true;
            wrapper.style.cursor = "grabbing";
            startX = e.pageX - wrapper.offsetLeft;
            startY = e.pageY - wrapper.offsetTop;
            scrollLeft = wrapper.scrollLeft;
            scrollTop = wrapper.scrollTop;
        });

        wrapper.addEventListener("mouseleave", () => {
            isDown = false;
            wrapper.style.cursor = "grab";
        });

        wrapper.addEventListener("mouseup", () => {
            isDown = false;
            wrapper.style.cursor = "grab";
        });

        wrapper.addEventListener("mousemove", (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - wrapper.offsetLeft;
            const y = e.pageY - wrapper.offsetTop;
            const walkX = (x - startX) * 1.5; // Tốc độ cuộn
            const walkY = (y - startY) * 1.5;
            wrapper.scrollLeft = scrollLeft - walkX;
            wrapper.scrollTop = scrollTop - walkY;
        });

        // 4. Sự kiện form cập nhật trận đấu admin
        const matchSelect = document.getElementById("admin-match-select");
        matchSelect.addEventListener("change", (e) => {
            handleMatchSelectionChange(e.target.value);
        });

        const updateForm = document.getElementById("match-update-form");
        updateForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const matchId = matchSelect.value;
            const homeScore = parseInt(document.getElementById("admin-home-score").value);
            const awayScore = parseInt(document.getElementById("admin-away-score").value);
            
            const penHomeVal = document.getElementById("admin-home-pen").value;
            const penAwayVal = document.getElementById("admin-away-pen").value;
            const penHome = penHomeVal !== "" ? parseInt(penHomeVal) : null;
            const penAway = penAwayVal !== "" ? parseInt(penAwayVal) : null;
            
            const highlightUrl = document.getElementById("admin-highlight-url").value;

            updateMatchResult(matchId, homeScore, awayScore, penHome, penAway, highlightUrl);
        });

        // 5. Nút bấm mô phỏng admin
        document.getElementById("btn-sim-day").addEventListener("click", () => simulateOneDay());
        document.getElementById("btn-sim-group").addEventListener("click", () => simulateAllGroupMatches());
        document.getElementById("btn-sim-all").addEventListener("click", () => simulateEntireTournament());
        document.getElementById("btn-reset-all").addEventListener("click", () => {
            if (confirm("Bạn có chắc chắn muốn đặt lại toàn bộ giải đấu và xóa hết các kết quả đã lưu?")) {
                resetToDefault();
                updateTournamentProgressBar();
                renderActiveTab();
                showToast("Đã thiết lập lại toàn bộ dữ liệu giải đấu thành công!", "success");
            }
        });

        // 6. Đóng Modal
        document.getElementById("btn-close-modal").addEventListener("click", closeModal);
        window.addEventListener("click", (e) => {
            if (e.target === document.getElementById("video-modal")) {
                closeModal();
            }
        });
    }

    // Kích hoạt ứng dụng khi trang đã tải
    window.addEventListener("DOMContentLoaded", () => {
        init();
    });
})();
