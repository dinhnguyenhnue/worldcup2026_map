// Dữ liệu ban đầu cho World Cup 2026 (48 đội, 12 bảng đấu)
const INITIAL_TEAMS = {
    // Bảng A
    "MEX": { id: "MEX", name: "Mexico", flag: "🇲🇽", group: "A", iso: "mx" },
    "RSA": { id: "RSA", name: "Nam Phi", flag: "🇿🇦", group: "A", iso: "za" },
    "KOR": { id: "KOR", name: "Hàn Quốc", flag: "🇰🇷", group: "A", iso: "kr" },
    "CZE": { id: "CZE", name: "CH Séc", flag: "🇨🇿", group: "A", iso: "cz" },
    // Bảng B
    "CAN": { id: "CAN", name: "Canada", flag: "🇨🇦", group: "B", iso: "ca" },
    "BIH": { id: "BIH", name: "Bosnia & Herzegovina", flag: "🇧🇦", group: "B", iso: "ba" },
    "QAT": { id: "QAT", name: "Qatar", flag: "🇶🇦", group: "B", iso: "qa" },
    "SUI": { id: "SUI", name: "Thụy Sĩ", flag: "🇨🇭", group: "B", iso: "ch" },
    // Bảng C
    "BRA": { id: "BRA", name: "Brazil", flag: "🇧🇷", group: "C", iso: "br" },
    "MAR": { id: "MAR", name: "Maroc", flag: "🇲🇦", group: "C", iso: "ma" },
    "HAI": { id: "HAI", name: "Haiti", flag: "🇭🇹", group: "C", iso: "ht" },
    "SCO": { id: "SCO", name: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "C", iso: "gb-sct" },
    // Bảng D
    "USA": { id: "USA", name: "Mỹ", flag: "🇺🇸", group: "D", iso: "us" },
    "PAR": { id: "PAR", name: "Paraguay", flag: "🇵🇾", group: "D", iso: "py" },
    "AUS": { id: "AUS", name: "Úc", flag: "🇦🇺", group: "D", iso: "au" },
    "TUR": { id: "TUR", name: "Thổ Nhĩ Kỳ", flag: "🇹🇷", group: "D", iso: "tr" },
    // Bảng E
    "GER": { id: "GER", name: "Đức", flag: "🇩🇪", group: "E", iso: "de" },
    "CUW": { id: "CUW", name: "Curaçao", flag: "🇨🇼", group: "E", iso: "cw" },
    "CIV": { id: "CIV", name: "Bờ Biển Ngà", flag: "🇨🇮", group: "E", iso: "ci" },
    "ECU": { id: "ECU", name: "Ecuador", flag: "🇪🇨", group: "E", iso: "ec" },
    // Bảng F
    "NED": { id: "NED", name: "Hà Lan", flag: "🇳🇱", group: "F", iso: "nl" },
    "JPN": { id: "JPN", name: "Nhật Bản", flag: "🇯🇵", group: "F", iso: "jp" },
    "SWE": { id: "SWE", name: "Thụy Điển", flag: "🇸🇪", group: "F", iso: "se" },
    "TUN": { id: "TUN", name: "Tunisia", flag: "🇹🇳", group: "F", iso: "tn" },
    // Bảng G
    "BEL": { id: "BEL", name: "Bỉ", flag: "🇧🇪", group: "G", iso: "be" },
    "EGY": { id: "EGY", name: "Ai Cập", flag: "🇪🇬", group: "G", iso: "eg" },
    "IRN": { id: "IRN", name: "Iran", flag: "🇮🇷", group: "G", iso: "ir" },
    "NZL": { id: "NZL", name: "New Zealand", flag: "🇳🇿", group: "G", iso: "nz" },
    // Bảng H
    "ESP": { id: "ESP", name: "Tây Ban Nha", flag: "🇪🇸", group: "H", iso: "es" },
    "CPV": { id: "CPV", name: "Cape Verde", flag: "🇨🇻", group: "H", iso: "cv" },
    "KSA": { id: "KSA", name: "Ả Rập Xê Út", flag: "🇸🇦", group: "H", iso: "sa" },
    "URU": { id: "URU", name: "Uruguay", flag: "🇺🇾", group: "H", iso: "uy" },
    // Bảng I
    "FRA": { id: "FRA", name: "Pháp", flag: "🇫🇷", group: "I", iso: "fr" },
    "SEN": { id: "SEN", name: "Senegal", flag: "🇸🇳", group: "I", iso: "sn" },
    "IRQ": { id: "IRQ", name: "Iraq", flag: "🇮🇶", group: "I", iso: "iq" },
    "NOR": { id: "NOR", name: "Na Uy", flag: "🇳🇴", group: "I", iso: "no" },
    // Bảng J
    "ARG": { id: "ARG", name: "Argentina", flag: "🇦🇷", group: "J", iso: "ar" },
    "ALG": { id: "ALG", name: "Algeria", flag: "🇩🇿", group: "J", iso: "dz" },
    "AUT": { id: "AUT", name: "Áo", flag: "🇦🇹", group: "J", iso: "at" },
    "JOR": { id: "JOR", name: "Jordan", flag: "🇯🇴", group: "J", iso: "jo" },
    // Bảng K
    "POR": { id: "POR", name: "Bồ Đào Nha", flag: "🇵🇹", group: "K", iso: "pt" },
    "COD": { id: "COD", name: "CHDC Congo", flag: "🇨🇩", group: "K", iso: "cd" },
    "UZB": { id: "UZB", name: "Uzbekistan", flag: "🇺🇿", group: "K", iso: "uz" },
    "COL": { id: "COL", name: "Colombia", flag: "🇨🇴", group: "K", iso: "co" },
    // Bảng L
    "ENG": { id: "ENG", name: "Anh", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "L", iso: "gb-eng" },
    "CRO": { id: "CRO", name: "Croatia", flag: "🇭🇷", group: "L", iso: "hr" },
    "GHA": { id: "GHA", name: "Ghana", flag: "🇬🇭", group: "L", iso: "gh" },
    "PAN": { id: "PAN", name: "Panama", flag: "🇵🇦", group: "L", iso: "pa" }
};

const STADIUMS = [
    "MetLife Stadium (New York/New Jersey)",
    "SoFi Stadium (Los Angeles)",
    "Mercedes-Benz Stadium (Atlanta)",
    "AT&T Stadium (Dallas)",
    "Gillette Stadium (Boston)",
    "Lincoln Financial Field (Philadelphia)",
    "Lumen Field (Seattle)",
    "Levi's Stadium (San Francisco)",
    "Hard Rock Stadium (Miami)",
    "Arrowhead Stadium (Kansas City)",
    "NRG Stadium (Houston)",
    "BC Place (Vancouver)",
    "BMO Field (Toronto)",
    "Estadio Azteca (Mexico City)",
    "Estadio BBVA (Monterrey)",
    "Estadio Akron (Guadalajara)"
];

const INITIAL_PLAYERS = [
    { name: "Lionel Messi", team: "ARG", goals: 0, assists: 0 },
    { name: "Kylian Mbappé", team: "FRA", goals: 0, assists: 0 },
    { name: "Erling Haaland", team: "NOR", goals: 0, assists: 0 },
    { name: "Cristiano Ronaldo", team: "POR", goals: 0, assists: 0 },
    { name: "Jude Bellingham", team: "ENG", goals: 0, assists: 0 },
    { name: "Vinícius Júnior", team: "BRA", goals: 0, assists: 0 },
    { name: "Lamine Yamal", team: "ESP", goals: 0, assists: 0 },
    { name: "Harry Kane", team: "ENG", goals: 0, assists: 0 },
    { name: "Mohamed Salah", team: "EGY", goals: 0, assists: 0 },
    { name: "Kevin De Bruyne", team: "BEL", goals: 0, assists: 0 },
    { name: "Luka Modrić", team: "CRO", goals: 0, assists: 0 },
    { name: "Lautaro Martínez", team: "ARG", goals: 0, assists: 0 },
    { name: "Jamal Musiala", team: "GER", goals: 0, assists: 0 },
    { name: "Florian Wirtz", team: "GER", goals: 0, assists: 0 },
    { name: "Heung-min Son", team: "KOR", goals: 0, assists: 0 },
    { name: "Luis Díaz", team: "COL", goals: 0, assists: 0 }
];

// Hàm tạo lịch thi đấu vòng bảng tự động (72 trận)
function generateGroupMatches(teams) {
    const matches = [];
    const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
    let matchIdCount = 1;
    let baseDate = new Date("2026-06-11");

    groups.forEach((groupName, gIdx) => {
        // Lấy danh sách 4 đội trong bảng
        const groupTeams = Object.values(teams).filter(t => t.group === groupName);
        
        // Sơ đồ thi đấu vòng bảng (3 lượt trận, mỗi lượt 2 trận)
        // Lượt 1: T1 vs T2, T3 vs T4
        // Lượt 2: T1 vs T3, T2 vs T4
        // Lượt 3: T1 vs T4, T2 vs T3
        const roundRobin = [
            [[0, 1], [2, 3]],
            [[0, 2], [1, 3]],
            [[0, 3], [1, 2]]
        ];

        roundRobin.forEach((round, rIdx) => {
            round.forEach(([homeIdx, awayIdx], mIdx) => {
                const home = groupTeams[homeIdx];
                const away = groupTeams[awayIdx];
                
                // Phân phối ngày thi đấu cách đều nhau từ ngày khai mạc
                // Mỗi ngày có từ 3 đến 4 trận vòng bảng
                const daysOffset = Math.floor((gIdx * 3 + rIdx) * 0.5);
                const matchDate = new Date(baseDate);
                matchDate.setDate(baseDate.getDate() + daysOffset);

                const dateString = matchDate.toISOString().split("T")[0];
                const timeString = mIdx === 0 ? "17:00" : "20:00";
                const stadium = STADIUMS[(matchIdCount - 1) % STADIUMS.length];

                matches.push({
                    id: `M${matchIdCount}`,
                    type: "group",
                    group: groupName,
                    stage: "group",
                    round: rIdx + 1,
                    home: home.id,
                    away: away.id,
                    homeScore: null,
                    awayScore: null,
                    date: dateString,
                    time: timeString,
                    stadium: stadium,
                    highlight: null,
                    status: "scheduled",
                    winner: null,
                    penalty: null
                });
                matchIdCount++;
            });
        });
    });

    // Sắp xếp các trận đấu theo thời gian để dễ hiển thị
    return matches.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
    });
}

// Khởi tạo sơ đồ nhánh đấu knockout (ban đầu rỗng)
function initializeKnockoutStages() {
    const stages = {
        "round_32": [], // 16 trận
        "round_16": [], // 8 trận
        "quarter": [],  // 4 trận
        "semi": [],     // 2 trận
        "third_place": [], // 1 trận
        "final": []     // 1 trận
    };

    // Vòng 32 đội: Tạo 16 trận đấu rỗng với ID từ K1 đến K16
    let date = new Date("2026-06-29");
    for (let i = 1; i <= 16; i++) {
        const matchDate = new Date(date);
        matchDate.setDate(date.getDate() + Math.floor((i - 1) / 4)); // 4 trận mỗi ngày

        stages.round_32.push({
            id: `K${i}`,
            type: "knockout",
            stage: "round_32",
            home: null, // Sẽ được cập nhật từ vòng bảng
            away: null,
            homeScore: null,
            awayScore: null,
            date: matchDate.toISOString().split("T")[0],
            time: (i % 2 === 0) ? "17:00" : "21:00",
            stadium: STADIUMS[(i - 1) % STADIUMS.length],
            highlight: null,
            status: "scheduled",
            winner: null,
            penalty: null,
            placeholderHome: `Đội ${i}A`, // Gợi ý hiển thị
            placeholderAway: `Đội ${i}B`
        });
    }

    // Vòng 16 đội: 8 trận (K17 đến K24)
    date = new Date("2026-07-04");
    for (let i = 17; i <= 24; i++) {
        const matchDate = new Date(date);
        matchDate.setDate(date.getDate() + Math.floor((i - 17) / 2)); // 2 trận mỗi ngày

        stages.round_16.push({
            id: `K${i}`,
            type: "knockout",
            stage: "round_16",
            home: null,
            away: null,
            homeScore: null,
            awayScore: null,
            date: matchDate.toISOString().split("T")[0],
            time: (i % 2 === 0) ? "17:00" : "21:00",
            stadium: STADIUMS[(i - 17) % STADIUMS.length],
            highlight: null,
            status: "scheduled",
            winner: null,
            penalty: null,
            placeholderHome: `Thắng K${(i - 17) * 2 + 1}`,
            placeholderAway: `Thắng K${(i - 17) * 2 + 2}`
        });
    }

    // Tứ kết: 4 trận (K25 đến K28)
    date = new Date("2026-07-09");
    for (let i = 25; i <= 28; i++) {
        const matchDate = new Date(date);
        matchDate.setDate(date.getDate() + Math.floor((i - 25) / 2));

        stages.quarter.push({
            id: `K${i}`,
            type: "knockout",
            stage: "quarter",
            home: null,
            away: null,
            homeScore: null,
            awayScore: null,
            date: matchDate.toISOString().split("T")[0],
            time: (i % 2 === 0) ? "17:00" : "21:00",
            stadium: STADIUMS[(i - 25) % STADIUMS.length],
            highlight: null,
            status: "scheduled",
            winner: null,
            penalty: null,
            placeholderHome: `Thắng K${(i - 25) * 2 + 17}`,
            placeholderAway: `Thắng K${(i - 25) * 2 + 18}`
        });
    }

    // Bán kết: 2 trận (K29 và K30)
    date = new Date("2026-07-14");
    for (let i = 29; i <= 30; i++) {
        const matchDate = new Date(date);
        matchDate.setDate(date.getDate() + (i - 29));

        stages.semi.push({
            id: `K${i}`,
            type: "knockout",
            stage: "semi",
            home: null,
            away: null,
            homeScore: null,
            awayScore: null,
            date: matchDate.toISOString().split("T")[0],
            time: "20:00",
            stadium: STADIUMS[i % STADIUMS.length],
            highlight: null,
            status: "scheduled",
            winner: null,
            penalty: null,
            placeholderHome: `Thắng K${(i - 29) * 2 + 25}`,
            placeholderAway: `Thắng K${(i - 29) * 2 + 26}`
        });
    }

    // Trận tranh hạng ba (K31)
    stages.third_place.push({
        id: "K31",
        type: "knockout",
        stage: "third_place",
        home: null,
        away: null,
        homeScore: null,
        awayScore: null,
        date: "2026-07-18",
        time: "16:00",
        stadium: STADIUMS[4],
        highlight: null,
        status: "scheduled",
        winner: null,
        penalty: null,
        placeholderHome: "Thua K29",
        placeholderAway: "Thua K30"
    });

    // Trận chung kết (K32)
    stages.final.push({
        id: "K32",
        type: "knockout",
        stage: "final",
        home: null,
        away: null,
        homeScore: null,
        awayScore: null,
        date: "2026-07-19",
        time: "19:00",
        stadium: "MetLife Stadium (New York/New Jersey)",
        highlight: null,
        status: "scheduled",
        winner: null,
        penalty: null,
        placeholderHome: "Thắng K29",
        placeholderAway: "Thắng K30"
    });

    return stages;
}

// Xuất các biến toàn cục để sử dụng trong app.js
window.WC_INITIAL_DATA = {
    teams: INITIAL_TEAMS,
    players: INITIAL_PLAYERS,
    generateGroupMatches: () => generateGroupMatches(INITIAL_TEAMS),
    initializeKnockoutStages: initializeKnockoutStages
};
