import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Chart from "react-apexcharts";
import "./App.css";

function App() {
  const [indexData, setIndexData] = useState(null);
  const [loading, setLoading] = useState(true); // API 요청 중 여부
  const [initialLoadComplete, setInitialLoadComplete] = useState(false); // 첫 로딩 완료 여부
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // API 요청 시작
      setError(null);
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
        const response = await axios.get(`${API_URL}/api/index`);

        setIndexData(response.data);
        setLastUpdated(new Date());
      } catch (err) {
        console.error("API 호출 중 에러 발생:", err);
        let errorMessage = "데이터를 불러오는 데 실패했습니다.";
        if (err.code === "ERR_NETWORK") {
          errorMessage += " 백엔드 서버가 실행 중인지 확인해주세요.";
        }
        setError(errorMessage);
        setIndexData(null); // 에러 발생 시 데이터 초기화
      } finally {
        setLoading(false); // API 요청 완료
        setInitialLoadComplete(true); // 첫 로딩 완료
      }
    };

    fetchData();

    // 5분마다 자동 새로고침 (필요시 1분으로 변경)
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
          background: "#333",
          strokeWidth: "97%",
          margin: 5,
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            offsetY: 0,
            fontSize: "48px",
            fontWeight: "700",
            color: "#ffffff",
            formatter: function (val) {
              return val.toFixed(0);
            },
          },
        },
      },
    },
    grid: { padding: { top: -10 } },
    fill: {
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

  // (수정) 에러 발생 시에만 전체 에러 화면을 보여줌
  if (error && initialLoadComplete) {
    return (
      <div className="App">
        <div className="error-message">
          <h1>오류 발생!</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // (수정) 첫 로딩 완료 전 (또는 데이터가 없는 상태)에도 UI는 미리 렌더링
  const finalIndex = indexData ? indexData.final_index : 50; // 데이터 없으면 기본 50 (중립)
  const finalStatus = getStatusInfo(finalIndex);

  return (
    <div className="App">
      <header className="App-header">
        <h1>KOSPI 공포탐욕지수</h1>
        <p>과거 1년 데이터 대비 현재 시장의 심리를 분석합니다.</p>
        {lastUpdated ? (
          <p className="last-updated">
            Last Updated: {lastUpdated.toLocaleString()}
            {loading && " (새로고침 중...)"}
          </p>
        ) : (
          <p className="last-updated">
            {loading ? "데이터 로딩 중..." : "데이터 없음"}
          </p>
        )}
      </header>

      <section className="index-section">
        <h2 className={`current-status ${finalStatus.class}`}>
          {indexData ? finalStatus.text : "데이터 로딩 중..."}
        </h2>
        {/* (수정) 데이터 없어도 차트 표시 (기본값으로) */}
        <Chart
          options={chartOptions}
          series={[finalIndex]}
          type="radialBar"
          width="450"
        />
      </section>

      <section className="metrics-grid">
        {/* 각 지표 카드 (데이터가 있을 때만 렌더링) */}
        {indexData ? (
          <>
            <div className="metric-card">
              <h3>1. KOSPI 모멘텀</h3>
              <p>
                <strong>오늘의 비율:</strong>{" "}
                {(
                  indexData.raw_data.metric_1_momentum.latest_ratio * 100
                ).toFixed(1)}
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

            <div className="metric-card">
              <h3>3. 안전 자산 수요</h3>
              <p>
                <strong>오늘의 수익률 차이:</strong>{" "}
                {(
                  indexData.raw_data.metric_7_safe_haven.latest_diff * 100
                ).toFixed(2)}
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
          </>
        ) : (
          // (신규) 데이터 없을 때 보여줄 플레이스홀더 (블록 같은 느낌 없앰)
          <div className="loading-metrics-placeholder">
            <p className="last-updated">지표 데이터 로딩 중...</p>
            {/* 실제 카드처럼 보이도록 빈 카드 템플릿을 만들 수도 있음 */}
          </div>
        )}
      </section>

      {/* 원본 데이터 표시 (디버깅용 - 배포 시에는 삭제해도 됨) */}
      {indexData && ( // 데이터 있을 때만 표시
        <pre className="raw-data">
          <code>{JSON.stringify(indexData, null, 2)}</code>
        </pre>
      )}
    </div>
  );
}

export default App;
