from flask import Flask, jsonify
from flask_cors import CORS
import data_collector
from scipy.stats import percentileofscore # <-- 1. scipy 임포트!
import os

app = Flask(__name__)
CORS(app) 

# -----------------------------------------------------------------
# (삭제!) 
# def normalize(...) 함수, MOMENTUM_RATIO_MIN/MAX 등
# 고정값(Static) 변수들을 모두 삭제함!
# -----------------------------------------------------------------

@app.route('/api/index')
def get_fear_greed_index():
    print("--- API 요청: 공포탐욕지수 v2.0 (Percentile) 계산 시작 ---")
    
    # 1. 3대 지표 데이터 수집 (반환값이 (latest_val, series)로 바뀜)
    (latest_1, series_1) = data_collector.get_metric_1_momentum()
    (latest_5, series_5) = data_collector.get_metric_5_bond_spread()
    (latest_7, series_7) = data_collector.get_metric_7_safe_haven()
    
    # 데이터 수집 실패 시 처리
    if not all([latest_1 is not None, latest_5 is not None, latest_7 is not None]):
        print(" > 실패: 데이터 수집 중 오류 발생")
        return jsonify({'error': '데이터 수집 실패'}), 500
    
    # 2. (신규!) 각 지표를 0~100점(score)으로 정규화 (백분위수 사용)
    
    # percentileofscore(A, B): 
    # A(데이터 리스트) 중에서 B(오늘 값)가 몇 % 지점(0~100)에 있는지 계산
    
    # 1번 점수 계산 (높을수록 탐욕)
    score_1 = percentileofscore(series_1, latest_1)
    
    # 5번 점수 계산 (높을수록 탐욕)
    score_5 = percentileofscore(series_5, latest_5)
    
    # 7번 점수 계산 (높을수록 탐욕)
    score_7 = percentileofscore(series_7, latest_7)
    
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

    # 4. JSON 형태로 브라우저에 반환 (프론트엔드는 수정할 필요 없음)
    result = {
        'final_index': round(final_index, 2), # 최종 점수
        'status': status,
        'scores': {
            'momentum': round(score_1, 2),
            'bond_spread': round(score_5, 2),
            'safe_haven': round(score_7, 2),
        },
        # (수정) 원본 데이터가 너무 커져서(1년치) 간단한 값만 보냄
        'raw_data': {
            'metric_1_momentum': {'latest_ratio': latest_1},
            'metric_5_bond_spread': {'latest_spread_US': latest_5},
            'metric_7_safe_haven': {'latest_diff': latest_7},
        }
    }
    return jsonify(result)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)