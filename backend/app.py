from flask import Flask, jsonify
from flask_cors import CORS # <-- 1. 이거 한 줄 추가!
import data_collector # 우리가 완성한 data_collector.py

app = Flask(__name__)
CORS(app)

# -----------------------------------------------------------------
# (신규) 0~100점으로 변환(정규화)해주는 헬퍼 함수
# -----------------------------------------------------------------
def normalize(value, min_val, max_val):
    """
    값을 0~100 사이의 점수로 정규화 (Min-Max Scaling)
    value: 현재 값
    min_val: 이 지표의 '극단적 공포' 값 (과거 1년치 최저점 등)
    max_val: 이 지표의 '극단적 탐욕' 값 (과거 1년치 최고점 등)
    """
    
    # 0~100점 사이로 값을 고정시킴 (Clamping)
    value = max(min_val, min(value, max_val))
    
    # (현재값 - 최소값) / (최대값 - 최소값) * 100
    score = (value - min_val) / (max_val - min_val) * 100
    return score

# -----------------------------------------------------------------
# (신규) 각 지표의 '최소/최대값' (임시로 정함, 나중에 고도화 가능)
# -----------------------------------------------------------------
# 1. 모멘텀 (KOSPI / 120일선 비율)
#    - 최소 0.85 (이평선 대비 -15% 폭락) = 0점
#    - 최대 1.15 (이평선 대비 +15% 급등) = 100점
MOMENTUM_RATIO_MIN = 0.85
MOMENTUM_RATIO_MAX = 1.15

# 5. 채권 스프레드 (10년물 - 3년물 금리차)
#    - 최소 -0.5 (금리 역전, '극단적 공포') = 0점
#    - 최대 1.5 (정상, '극단적 탐욕') = 100점
SPREAD_MIN = -0.5
SPREAD_MAX = 1.5

# 7. 안전 자산 수요 (주식 수익률 - 채권 수익률 차이, 20일)
#    - 최소 -0.05 (-5%p 차이, '극단적 공포') = 0점
#    - 최대 0.05 (+5%p 차이, '극단적 탐욕') = 100점
RETURN_DIFF_MIN = -0.05 # -5%
RETURN_DIFF_MAX = 0.05  # +5%


@app.route('/api/index')
def get_fear_greed_index():
    print("--- API 요청: 공포탐욕지수 v1.0 계산 시작 ---")
    
    # 1. 3대 지표 데이터 수집
    data_1 = data_collector.get_metric_1_momentum()
    data_5 = data_collector.get_metric_5_bond_spread()
    data_7 = data_collector.get_metric_7_safe_haven()
    
    # 데이터 수집 실패 시 처리
    if not all([data_1, data_5, data_7]):
        print(" > 실패: 데이터 수집 중 오류 발생")
        return jsonify({'error': '데이터 수집 실패'}), 500
    
    # 2. 각 지표를 0~100점(score)으로 정규화
    
    # 1번 점수 계산
    raw_ratio = data_1['current_price'] / data_1['ma_120']
    score_1 = normalize(raw_ratio, MOMENTUM_RATIO_MIN, MOMENTUM_RATIO_MAX)
    
    # 5번 점수 계산
    raw_spread = data_5['spread']
    score_5 = normalize(raw_spread, SPREAD_MIN, SPREAD_MAX)
    
    # 7번 점수 계산
    raw_diff = data_7['diff']
    score_7 = normalize(raw_diff, RETURN_DIFF_MIN, RETURN_DIFF_MAX)
    
    # 3. 최종 점수 계산 (3개 점수의 평균)
    final_index = (score_1 + score_5 + score_7) / 3
    
    status = "Calculating..."
    if final_index < 20:
        status = "극단적 공포 (Extreme Fear)"
    elif final_index < 45:
        status = "공포 (Fear)"
    elif final_index < 55:
        status = "중립 (Neutral)"
    elif final_index < 80:
        status = "탐욕 (Greed)"
    else:
        status = "극단적 탐욕 (Extreme Greed)"
        
    print(f"--- 계산 완료: 최종 지수 = {final_index:.2f} ({status}) ---")

    # 4. JSON 형태로 브라우저에 반환
    result = {
        'final_index': round(final_index, 2), # 최종 점수
        'status': status,
        'scores': {
            'momentum': round(score_1, 2),
            'bond_spread': round(score_5, 2),
            'safe_haven': round(score_7, 2),
        },
        'raw_data': {
            'metric_1_momentum': data_1,
            'metric_5_bond_spread': data_5,
            'metric_7_safe_haven': data_7,
        }
    }
    return jsonify(result) # JSON 형식으로 데이터를 응답

if __name__ == '__main__':
    # 배포용 포트 설정 (Render가 주는 PORT 환경변수 사용)
    import os
    port = int(os.environ.get("PORT", 5000))
    # debug=True는 끄고, host='0.0.0.0' (모든 접속 허용)으로 변경
    app.run(host='0.0.0.0', port=port, debug=False)