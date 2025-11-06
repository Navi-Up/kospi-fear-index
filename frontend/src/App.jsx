import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Chart from "react-apexcharts";
import "./App.css"; // 새로 만든 CSS 파일 임포트

function App() {
  const [indexData, setIndexData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // (신규) 마지막 업데이트 시간
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 배포용 API 주소 (Vercel 환경변수 || 로컬)
        const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
        const response = await axios.get(`${API_URL}/api/index`);

        setIndexData(response.data);
        setLastUpdated(new Date()); // (신규) 데이터 로드 성공 시, 현재 시간 저장
      } catch (err) {
        console.error("API 호출 중 에러 발생:", err);
        let errorMessage = "데이터를 불러오는 데 실패했습니다.";
        if (err.code === "ERR_NETWORK") {
          errorMessage += " 백엔드 서버가 실행 중인지 확인해주세요.";
        }
        setError(errorMessage);
        setIndexData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // 5분마다 자동 새로고침 (이건 네가 1분으로 바꿔도 돼)
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // (수정) CSS 클래스 이름 변경
  const getStatusInfo = useMemo(
    () => (score) => {
      if (score < 20)
        return { text: "극단적 공포", class: "status-extreme-fear" };
      if (score < 45) return { text: "공포", class: "status-fear" };
      if (score < 55) return { text: "중립", class: "status-neutral" };
      if (score < 80) return { text: "탐욕", class: "status-greed" };
      return { text: "극단적 탐욕", class: "status-extreme-greed" };
    },
    []
  );

  // 차트 옵션 (수정 - 다크 모드에 맞게)
  const chartOptions = {
    chart: {
      type: "radialBar",
      offsetY: -20,
      sparkline: { enabled: true },
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        track: {
          background: "#333", // (수정) 트랙 배경
          strokeWidth: "97%",
          margin: 5,
        },
        dataLabels: {
          name: {
            show: false, // 상단 레이블 숨김 (CSS로 따로 표시)
          },
          value: {
            offsetY: 0,
            fontSize: "48px", // (수정) 점수 폰트 크기
            fontWeight: "700",
            color: "#ffffff", // (수정) 점수 글자색
            formatter: function (val) {
              return val.toFixed(0);
            }, // (수정) 소수점 제거
          },
        },
      },
    },
    grid: { padding: { top: -10 } },
    fill: {
      // (수정) 트렌디한 그라데이션 색상
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "horizontal",
        shadeIntensity: 0.5,
        gradientToColors: ["#ff6b6b", "#ffb86c", "#50fa7b"],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 50, 100],
      },
    },
  };

  // --- 렌더링 로직 ---

  if (loading && !indexData) {
    // 첫 로딩
    return (
      <div className="App">
        <div className="loading-message">
          <h1>KOSPI 공포탐욕지수 로딩 중...</h1>
          <p>데이터를 수집하고 계산하고 있습니다. 잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  if (error) {
    // 에러
    return (
      <div className="App">
        <div className="error-message">
          <h1>오류 발생!</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!indexData) {
    // 데이터 없음
    return (
      <div className="App">
        <div className="error-message">
          <h1>데이터 없음</h1>
          <p>초기 데이터를 불러오는 데 실패했습니다.</p>
        </div>
      </div>
    );
  }

  // 데이터 로드 성공
  const finalStatus = getStatusInfo(indexData.final_index);

  return (
    <div className="App">
      <header className="App-header">
        <h1>KOSPI 공포탐욕지수</h1>
        <p>과거 1년 데이터 대비 현재 시장의 심리를 분석합니다.</p>
        {/* (신규) 마지막 업데이트 시간 표시 */}
        {lastUpdated && (
          <p className="last-updated">
            Last Updated: {lastUpdated.toLocaleString()}
            {loading && " (새로고침 중...)"}
          </p>
        )}
      </header>

      <section className="index-section">
        {/* (수정) CSS 클래스를 동적으로 적용 */}
        <h2 className={`current-status ${finalStatus.class}`}>
          {finalStatus.text}
        </h2>
        <Chart
          options={chartOptions}
          series={[indexData.final_index]}
          type="radialBar"
          width="450"
        />
        {/* 점수는 차트 안에 표시되므로 밖에서는 삭제 (디자인 단순화) */}
      </section>

      {/* 각 지표별 상세 정보 */}
      <section className="metrics-grid">
        {/* 1. KOSPI 모멘텀 */}
        <div className="metric-card">
          <h3>1. KOSPI 모멘텀</h3>
          <p>
            <strong>오늘의 비율:</strong>{" "}
            {(indexData.raw_data.metric_1_momentum.latest_ratio * 100).toFixed(
              1
            )}
            %
          </p>
          <p>KOSPI 지수와 120일 이동평균선의 비율입니다.</p>
          <div className="metric-score">
            백분위 점수: {indexData.scores.momentum.toFixed(1)}점
            <span
              className={`status ${
                getStatusInfo(indexData.scores.momentum).class
              }`}
            >
              {getStatusInfo(indexData.scores.momentum).text}
            </span>
          </div>
        </div>

        {/* 5. 미국 장단기 금리차 (스프레드) */}
        <div className="metric-card">
          <h3>2. 장단기 금리차 (미국)</h3>
          <p>
            <strong>오늘의 스프레드:</strong>{" "}
            {indexData.raw_data.metric_5_bond_spread.latest_spread_US.toFixed(
              2
            )}
            %p
          </p>
          <p>미국 10년물과 3개월물 금리차. KOSPI에 큰 영향을 줍니다.</p>
          <div className="metric-score">
            백분위 점수: {indexData.scores.bond_spread.toFixed(1)}점
            <span
              className={`status ${
                getStatusInfo(indexData.scores.bond_spread).class
              }`}
            >
              {getStatusInfo(indexData.scores.bond_spread).text}
            </span>
          </div>
        </div>

        {/* 7. 안전 자산 수요 */}
        <div className="metric-card">
          <h3>3. 안전 자산 수요</h3>
          <p>
            <strong>오늘의 수익률 차이:</strong>{" "}
            {(indexData.raw_data.metric_7_safe_haven.latest_diff * 100).toFixed(
              2
            )}
            %p
          </p>
          <p>KOSPI와 국채 ETF의 20일 수익률 차이입니다.</p>
          <div className="metric-score">
            백분위 점수: {indexData.scores.safe_haven.toFixed(1)}점
            <span
              className={`status ${
                getStatusInfo(indexData.scores.safe_haven).class
              }`}
            >
              {getStatusInfo(indexData.scores.safe_haven).text}
            </span>
          </div>
        </div>
      </section>

      {/* 원본 데이터 표시 (디버깅용 - 배포 시에는 삭제해도 됨) */}
      <pre className="raw-data">
        <code>{JSON.stringify(indexData, null, 2)}</code>
      </pre>
    </div>
  );
}

export default App;
