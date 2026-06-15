import json
import ssl
import sys
import urllib.request
import urllib.parse
import re
import random
from datetime import datetime, timedelta
from functools import cmp_to_key

# Cấu hình UTF-8 cho stdout trên Windows
sys.stdout.reconfigure(encoding='utf-8')

# Cấu hình API Football-Data
API_KEY = "5fba62b7a7824eafb952125230f5e7e5"
COMPETITION_URL = "https://api.football-data.org/v4/competitions/WC/matches"
DATA_JSON_PATH = "d:/test/World_cup2026/data.json"

STAGE_MAPPING = {
    'LAST_32': 'round_32',
    'LAST_16': 'round_16',
    'QUARTER_FINALS': 'quarter',
    'SEMI_FINALS': 'semi',
    'THIRD_PLACE': 'third_place',
    'FINAL': 'final'
}

def load_local_state():
    try:
        with open(DATA_JSON_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Lỗi tải file {DATA_JSON_PATH}: {e}")
        return None

def save_local_state(state):
    try:
        with open(DATA_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(state, f, indent=2, ensure_ascii=False)
        print("Đã lưu trạng thái mới vào data.json thành công!")
    except Exception as e:
        print(f"Lỗi ghi file {DATA_JSON_PATH}: {e}")

def fetch_api_matches():
    req = urllib.request.Request(COMPETITION_URL, headers={'X-Auth-Token': API_KEY})
    context = ssl._create_unverified_context()
    try:
        with urllib.request.urlopen(req, context=context, timeout=15) as response:
            data = response.read().decode('utf-8')
            return json.loads(data).get('matches', [])
    except Exception as e:
        print(f"Lỗi kết nối tới Football-Data API: {e}")
        return None

def convert_utc_to_gmt7(utc_str):
    # Định dạng của utcDate: "2026-06-11T19:00:00Z"
    try:
        dt = datetime.strptime(utc_str, "%Y-%m-%dT%H:%M:%SZ")
        dt_gmt7 = dt + timedelta(hours=7)
        return dt_gmt7.strftime("%Y-%m-%d"), dt_gmt7.strftime("%H:%M")
    except Exception:
        # Fallback nếu định dạng khác biệt
        if 'T' in utc_str:
            parts = utc_str.split('T')
            date_part = parts[0]
            time_part = parts[1][:5]
            return date_part, time_part
        return utc_str, "20:00"

def get_youtube_highlight(home_name, away_name):
    query = f"FIFA World Cup 2026 Highlight {home_name} vs {away_name}"
    url = "https://www.youtube.com/results?search_query=" + urllib.parse.quote(query)
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    req = urllib.request.Request(url, headers=headers)
    context = ssl._create_unverified_context()
    try:
        with urllib.request.urlopen(req, context=context, timeout=8) as response:
            html = response.read().decode('utf-8')
            video_ids = re.findall(r'/watch\?v=([a-zA-Z0-9_-]{11})', html)
            if video_ids:
                return f"https://www.youtube.com/watch?v={video_ids[0]}"
    except Exception as e:
        print(f"Lỗi tìm kiếm YouTube highlight cho {home_name} vs {away_name}: {e}")
    return None

def distribute_player_goals(state, match):
    if not match.get('home') or not match.get('away') or match.get('homeScore') is None:
        return
    if match.get('hasGoalsRecorded'):
        return
        
    home_score = match['homeScore']
    away_score = match['awayScore']
    
    # Đội nhà
    home_players = [p for p in state['players'] if p['team'] == match['home']]
    if home_players and home_score > 0:
        remaining = home_score
        while remaining > 0:
            p = random.choice(home_players)
            p['goals'] = p.get('goals', 0) + 1
            if random.random() > 0.5:
                assists = [ap for ap in home_players if ap['name'] != p['name']]
                if assists:
                    ap = random.choice(assists)
                    ap['assists'] = ap.get('assists', 0) + 1
            remaining -= 1
            
    # Đội khách
    away_players = [p for p in state['players'] if p['team'] == match['away']]
    if away_players and away_score > 0:
        remaining = away_score
        while remaining > 0:
            p = random.choice(away_players)
            p['goals'] = p.get('goals', 0) + 1
            if random.random() > 0.5:
                assists = [ap for ap in away_players if ap['name'] != p['name']]
                if assists:
                    ap = random.choice(assists)
                    ap['assists'] = ap.get('assists', 0) + 1
            remaining -= 1
            
    match['hasGoalsRecorded'] = True
    print(f"  -> Đã cập nhật bàn thắng giả lập cho trận {match['id']}")

def calculate_group_standings(state, group_name):
    group_teams = [t for t in state['teams'].values() if t['group'] == group_name]
    standings = []
    for team in group_teams:
        standings.append({
            'id': team['id'],
            'name': team['name'],
            'flag': team['flag'],
            'group': team['group'],
            'iso': team.get('iso', ''),
            'played': 0,
            'won': 0,
            'drawn': 0,
            'lost': 0,
            'gf': 0,
            'ga': 0,
            'gd': 0,
            'pts': 0
        })
        
    group_matches = [m for m in state['matches'] if m['group'] == group_name and m['status'] == 'completed']
    
    for match in group_matches:
        home = next((t for t in standings if t['id'] == match['home']), None)
        away = next((t for t in standings if t['id'] == match['away']), None)
        if home and away:
            home['played'] += 1
            away['played'] += 1
            home['gf'] += match['homeScore']
            home['ga'] += match['awayScore']
            away['gf'] += match['awayScore']
            away['ga'] += match['homeScore']
            
            if match['homeScore'] > match['awayScore']:
                home['won'] += 1
                home['pts'] += 3
                away['lost'] += 1
            elif match['homeScore'] < match['awayScore']:
                away['won'] += 1
                away['pts'] += 3
                home['lost'] += 1
            else:
                home['drawn'] += 1
                away['drawn'] += 1
                home['pts'] += 1
                away['pts'] += 1
                
    for t in standings:
        t['gd'] = t['gf'] - t['ga']
        
    def compare_teams(a, b):
        if b['pts'] != a['pts']:
            return b['pts'] - a['pts']
        if b['gd'] != a['gd']:
            return b['gd'] - a['gd']
        if b['gf'] != a['gf']:
            return b['gf'] - a['gf']
        if a['name'] < b['name']:
            return -1
        elif a['name'] > b['name']:
            return 1
        return 0
        
    standings.sort(key=cmp_to_key(compare_teams))
    return standings

def calculate_best_third_placed_teams(state):
    groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
    third_placed = []
    for g in groups:
        standings = calculate_group_standings(state, g)
        if len(standings) >= 3:
            third = standings[2].copy()
            third['groupOrigin'] = g
            third_placed.append(third)
            
    def compare_thirds(a, b):
        if b['pts'] != a['pts']:
            return b['pts'] - a['pts']
        if b['gd'] != a['gd']:
            return b['gd'] - a['gd']
        if b['gf'] != a['gf']:
            return b['gf'] - a['gf']
        if b['won'] != a['won']:
            return b['won'] - a['won']
        if a['name'] < b['name']:
            return -1
        elif a['name'] > b['name']:
            return 1
        return 0
        
    third_placed.sort(key=cmp_to_key(compare_thirds))
    return third_placed

def clear_subsequent_rounds(state):
    stages = ["round_16", "quarter", "semi", "third_place", "final"]
    for stage in stages:
        for m in state['knockout'][stage]:
            m['home'] = None
            m['away'] = None
            m['homeScore'] = None
            m['awayScore'] = None
            m['status'] = "scheduled"
            m['winner'] = None
            m['penalty'] = None
def update_knockout_bracket_pairings(state):
    groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
    group_winners = {}
    group_runners_up = {}
    
    for g in groups:
        standings = calculate_group_standings(state, g)
        group_winners[g] = standings[0]['id']
        group_runners_up[g] = standings[1]['id']
        
    best_thirds = [t['id'] for t in calculate_best_third_placed_teams(state)[:8]]
    
    pairing_rules = [
        ("K1", group_winners["A"], best_thirds[7] if len(best_thirds) > 7 else None),
        ("K2", group_runners_up["A"], group_runners_up["B"]),
        ("K3", group_winners["B"], best_thirds[6] if len(best_thirds) > 6 else None),
        ("K4", group_runners_up["C"], group_runners_up["D"]),
        ("K5", group_winners["C"], best_thirds[5] if len(best_thirds) > 5 else None),
        ("K6", group_runners_up["E"], group_runners_up["F"]),
        ("K7", group_winners["D"], best_thirds[4] if len(best_thirds) > 4 else None),
        ("K8", group_runners_up["G"], group_runners_up["H"]),
        ("K9", group_winners["E"], best_thirds[3] if len(best_thirds) > 3 else None),
        ("K10", group_runners_up["I"], group_runners_up["J"]),
        ("K11", group_winners["F"], best_thirds[2] if len(best_thirds) > 2 else None),
        ("K12", group_runners_up["K"], group_runners_up["L"]),
        ("K13", group_winners["G"], best_thirds[1] if len(best_thirds) > 1 else None),
        ("K14", group_winners["H"], group_winners["I"]),
        ("K15", group_winners["J"], best_thirds[0] if len(best_thirds) > 0 else None),
        ("K16", group_winners["K"], group_winners["L"])
    ]
    
    for match_id, home, away in pairing_rules:
        match = next((m for m in state['knockout']['round_32'] if m['id'] == match_id), None)
        if match:
            match['home'] = home
            match['away'] = away

def propagate_knockout_winners(state):
    # Vòng 32 -> Vòng 16
    for i in range(8):
        match1 = state['knockout']['round_32'][i * 2]
        match2 = state['knockout']['round_32'][i * 2 + 1]
        next_match = state['knockout']['round_16'][i]
        
        next_match['home'] = match1['winner'] if match1['status'] == 'completed' else None
        next_match['away'] = match2['winner'] if match2['status'] == 'completed' else None
        
        if not next_match['home'] or not next_match['away']:
            next_match['status'] = 'scheduled'
            next_match['homeScore'] = None
            next_match['awayScore'] = None
            next_match['winner'] = None
            next_match['penalty'] = None
            
    # Vòng 16 -> Tứ kết
    for i in range(4):
        match1 = state['knockout']['round_16'][i * 2]
        match2 = state['knockout']['round_16'][i * 2 + 1]
        next_match = state['knockout']['quarter'][i]
        
        next_match['home'] = match1['winner'] if match1['status'] == 'completed' else None
        next_match['away'] = match2['winner'] if match2['status'] == 'completed' else None
        
        if not next_match['home'] or not next_match['away']:
            next_match['status'] = 'scheduled'
            next_match['homeScore'] = None
            next_match['awayScore'] = None
            next_match['winner'] = None
            next_match['penalty'] = None
            
    # Tứ kết -> Bán kết
    for i in range(2):
        match1 = state['knockout']['quarter'][i * 2]
        match2 = state['knockout']['quarter'][i * 2 + 1]
        next_match = state['knockout']['semi'][i]
        
        next_match['home'] = match1['winner'] if match1['status'] == 'completed' else None
        next_match['away'] = match2['winner'] if match2['status'] == 'completed' else None
        
        if not next_match['home'] or not next_match['away']:
            next_match['status'] = 'scheduled'
            next_match['homeScore'] = None
            next_match['awayScore'] = None
            next_match['winner'] = None
            next_match['penalty'] = None
            
    # Bán kết -> Chung kết & Tranh hạng ba
    semi1 = state['knockout']['semi'][0]
    semi2 = state['knockout']['semi'][1]
    final_match = state['knockout']['final'][0]
    third_place_match = state['knockout']['third_place'][0]
    
    final_match['home'] = semi1['winner'] if semi1['status'] == 'completed' else None
    final_match['away'] = semi2['winner'] if semi2['status'] == 'completed' else None
    
    if not final_match['home'] or not final_match['away']:
        final_match['status'] = 'scheduled'
        final_match['homeScore'] = None
        final_match['awayScore'] = None
        final_match['winner'] = None
        final_match['penalty'] = None
        
    if semi1['status'] == 'completed' and semi2['status'] == 'completed':
        third_place_match['home'] = semi1['away'] if semi1['winner'] == semi1['home'] else semi1['home']
        third_place_match['away'] = semi2['away'] if semi2['winner'] == semi2['home'] else semi2['home']
    else:
        third_place_match['home'] = None
        third_place_match['away'] = None
        third_place_match['status'] = 'scheduled'
        third_place_match['homeScore'] = None
        third_place_match['awayScore'] = None
        third_place_match['winner'] = None
        third_place_match['penalty'] = None

def sync_data():
    print("Bắt đầu đồng bộ dữ liệu World Cup 2026...")
    
    # 1. Tải trạng thái local
    state = load_local_state()
    if not state:
        print("Không thể tiếp tục vì không tải được dữ liệu local.")
        return
        
    # 2. Tải các trận đấu từ API
    api_matches = fetch_api_matches()
    if not api_matches:
        print("Không tải được các trận đấu từ API, kết thúc.")
        return
        
    print(f"Tổng số trận đấu nhận từ API: {len(api_matches)}")
    
    # 3. Đồng bộ kết quả vòng bảng
    api_group_matches = [m for m in api_matches if m.get('stage') == 'GROUP_STAGE']
    updated_group_count = 0
    
    for api_m in api_group_matches:
        home_tla = api_m.get('homeTeam', {}).get('tla')
        away_tla = api_m.get('awayTeam', {}).get('tla')
        if not home_tla or not away_tla:
            continue
            
        # Tìm trận đấu tương ứng trong local
        local_m = next((m for m in state['matches'] if (m['home'] == home_tla and m['away'] == away_tla) or (m['home'] == away_tla and m['away'] == home_tla)), None)
        
        if local_m:
            # Swap nếu thứ tự nhà/khách khác biệt
            local_m['home'] = home_tla
            local_m['away'] = away_tla
            
            # Cập nhật thời gian
            date_gmt7, time_gmt7 = convert_utc_to_gmt7(api_m['utcDate'])
            local_m['date'] = date_gmt7
            local_m['time'] = time_gmt7
            
            # Cập nhật tỉ số
            status = api_m.get('status', '').upper()
            if status == 'FINISHED':
                score = api_m.get('score', {})
                full_time = score.get('fullTime', {})
                home_score = full_time.get('home')
                away_score = full_time.get('away')
                
                if home_score is not None and away_score is not None:
                    # Kiểm tra xem trận đấu có phải mới hoàn thành không
                    is_newly_completed = (local_m['status'] != 'completed') or (local_m['homeScore'] is None)
                    
                    local_m['homeScore'] = home_score
                    local_m['awayScore'] = away_score
                    local_m['status'] = 'completed'
                    
                    if home_score > away_score:
                        local_m['winner'] = home_tla
                    elif home_score < away_score:
                        local_m['winner'] = away_tla
                    else:
                        local_m['winner'] = None
                        
                    # Phân bổ bàn thắng cầu thủ
                    if is_newly_completed:
                        distribute_player_goals(state, local_m)
                        
                    # Tìm kiếm Highlight nếu chưa có
                    if not local_m.get('highlight'):
                        home_name = state['teams'].get(home_tla, {}).get('name', home_tla)
                        away_name = state['teams'].get(away_tla, {}).get('name', away_tla)
                        print(f"Đang tìm highlight cho trận {local_m['id']}: {home_name} vs {away_name}...")
                        yt_link = get_youtube_highlight(home_name, away_name)
                        if yt_link:
                            local_m['highlight'] = yt_link
                            print(f"  -> Đã tìm thấy: {yt_link}")
                            
                    updated_group_count += 1
            else:
                # Nếu chưa đá hoặc đang đá
                local_m['status'] = 'scheduled'
                local_m['homeScore'] = None
                local_m['awayScore'] = None
                local_m['winner'] = None
                local_m['penalty'] = None
                
    print(f"Đã cập nhật/đồng bộ {updated_group_count} trận vòng bảng đã kết thúc.")
    
    # 4. Tính toán bảng xếp hạng và ghép cặp Round of 32
    update_knockout_bracket_pairings(state)
    
    # 5. Đồng bộ kết quả các vòng knockout
    stages_order = ['round_32', 'round_16', 'quarter', 'semi', 'third_place', 'final']
    
    for client_stage in stages_order:
        # Lấy api stage tương ứng
        api_stage = next(k for k, v in STAGE_MAPPING.items() if v == client_stage)
        
        # Lấy và sắp xếp các trận đấu của vòng đấu đó từ API
        api_stage_matches = sorted(
            [m for m in api_matches if m.get('stage') == api_stage],
            key=lambda x: (x.get('utcDate', ''), x.get('id', 0))
        )
        
        for idx, api_m in enumerate(api_stage_matches):
            if idx >= len(state['knockout'][client_stage]):
                break
                
            local_m = state['knockout'][client_stage][idx]
            
            api_home_tla = api_m.get('homeTeam', {}).get('tla')
            api_away_tla = api_m.get('awayTeam', {}).get('tla')
            
            # Ghi đè thông tin đội nếu đã xác định trong API
            if api_home_tla and api_away_tla:
                local_m['home'] = api_home_tla
                local_m['away'] = api_away_tla
                
                # Cập nhật thời gian
                date_gmt7, time_gmt7 = convert_utc_to_gmt7(api_m['utcDate'])
                local_m['date'] = date_gmt7
                local_m['time'] = time_gmt7
                
            # Cập nhật kết quả nếu đã kết thúc
            status = api_m.get('status', '').upper()
            if status == 'FINISHED' and api_home_tla and api_away_tla:
                score = api_m.get('score', {})
                full_time = score.get('fullTime', {})
                home_score = full_time.get('home')
                away_score = full_time.get('away')
                
                if home_score is not None and away_score is not None:
                    is_newly_completed = (local_m['status'] != 'completed') or (local_m['homeScore'] is None)
                    
                    local_m['homeScore'] = home_score
                    local_m['awayScore'] = away_score
                    local_m['status'] = 'completed'
                    
                    # Xử lý Penalty
                    if score.get('duration') == 'PENALTY_SHOOTOUT':
                        penalties = score.get('penalties', {})
                        pen_home = penalties.get('home')
                        pen_away = penalties.get('away')
                        if pen_home is not None and pen_away is not None:
                            local_m['penalty'] = {'home': pen_home, 'away': pen_away}
                            local_m['winner'] = api_home_tla if pen_home > pen_away else api_away_tla
                    else:
                        local_m['penalty'] = None
                        if home_score > away_score:
                            local_m['winner'] = api_home_tla
                        elif home_score < away_score:
                            local_m['winner'] = api_away_tla
                            
                    # Bàn thắng cầu thủ
                    if is_newly_completed:
                        distribute_player_goals(state, local_m)
                        
                    # Tìm Highlight YouTube
                    if not local_m.get('highlight'):
                        home_name = state['teams'].get(api_home_tla, {}).get('name', api_home_tla)
                        away_name = state['teams'].get(api_away_tla, {}).get('name', api_away_tla)
                        print(f"Đang tìm highlight cho trận knockout {local_m['id']}: {home_name} vs {away_name}...")
                        yt_link = get_youtube_highlight(home_name, away_name)
                        if yt_link:
                            local_m['highlight'] = yt_link
                            print(f"  -> Đã tìm thấy: {yt_link}")
                            
        # Lan truyền kết quả của vòng đấu hiện tại
        propagate_knockout_winners(state)
        
    print("Đồng bộ vòng Knockout và lan truyền kết quả hoàn tất.")
    
    # 6. Ghi đè lại data.json
    save_local_state(state)

if __name__ == "__main__":
    sync_data()
