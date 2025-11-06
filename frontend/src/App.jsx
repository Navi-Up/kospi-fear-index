import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Chart from "react-apexcharts";
import "./App.css"; // 새로 만든 CSS 파일 임포트

function App() {
  const [indexData, setIndexData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // (수정!) Vercel에 등록한 환경 변수를 사용
        const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";
        const response = await axios.get(`${API_URL}/api/index`);
        setIndexData(response.data);
      } catch (err) {
        console.error("API 호출 중 에러 발생:", err);
        // 네트워크 에러 메시지를 좀 더 친절하게
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
    // 5분마다 자동 새로고침 (선택 사항)
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval); // 컴포넌트 언마운트 시 클리어
  }, []);

  // 지수 점수에 따른 상태 텍스트와 CSS 클래스를 반환하는 헬퍼 함수
  const getStatusInfo = useMemo(
    () => (score) => {
      if (score < 20) return { text: "극단적 공포", class: "extreme-fear" };
      if (score < 45) return { text: "공포", class: "fear" };
      if (score < 55) return { text: "중립", class: "neutral" };
      if (score < 80) return { text: "탐욕", class: "greed" };
      return { text: "극단적 탐욕", class: "extreme-greed" };
    },
    []
  );

  // 차트 옵션 설정
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
          background: "#e7e7e7",
          strokeWidth: "97%",
          margin: 5,
        },
        dataLabels: {
          name: {
            show: false, // 상단 레이블 숨김 (CSS로 따로 표시)
          },
          value: {
            offsetY: 0, // 점수 위치 조정
            fontSize: "30px",
            fontWeight: "bold",
            color: "#1a1a1a", // 점수 글자색
            formatter: function (val) {
              return val.toFixed(2);
            }, // 소수점 두 자리까지
          },
        },
      },
    },
    grid: { padding: { top: -10 } },
    fill: {
      // 그라데이션 색상
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "horizontal",
        shadeIntensity: 0.5,
        gradientToColors: ["#EB1212", "#FF8F00", "#00D100"],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 50, 100],
      },
    },
    // labels: [indexData ? indexData.status : 'Loading...'], // ApexCharts 기본 레이블 대신 CSS로 직접 표시
  };

  if (loading) {
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
    return (
      <div className="App">
        <div className="error-message">
          <h1>오류 발생!</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // 데이터가 성공적으로 로드된 후
  const finalStatus = getStatusInfo(indexData.final_index);

  return (
    <div className="App">
      <header className="App-header">
        <h1>KOSPI 공포탐욕지수 (v1.0)</h1>
        <p>현재 시장의 공포와 탐욕 수준을 3가지 핵심 지표로 분석합니다.</p>
      </header>

      <section className="index-section">
        {/* CNN처럼 차트 위에 상태 텍스트를 크게 표시 */}
        <h2 className={`current-status ${finalStatus.class}`}>
          {finalStatus.text}
        </h2>
        {/* 차트 */}
        {indexData && (
          <Chart
            options={chartOptions}
            series={[indexData.final_index]}
            type="radialBar"
            width="450" // 차트 크기 약간 줄임
          />
        )}
        <p className="current-score">
          현재 지수: {indexData.final_index.toFixed(2)}
        </p>
      </section>

      {/* 각 지표별 상세 정보 */}
      <section className="metrics-grid">
        {/* 1. KOSPI 모멘텀 */}
        <div className="metric-card">
          <h3>1. KOSPI 모멘텀</h3>
          <p>
            <strong>KOSPI:</strong>{" "}
            {indexData.raw_data.metric_1_momentum.current_price.toFixed(2)}
          </p>
          <p>
            <strong>120일 이동평균선:</strong>{" "}
            {indexData.raw_data.metric_1_momentum.ma_120.toFixed(2)}
          </p>
          <p>KOSPI가 120일 이평선 위에 있으면 탐욕, 아래면 공포.</p>
          <div className="metric-score">
            점수: {indexData.scores.momentum.toFixed(2)}
            <span
              className={`status ${
                getStatusInfo(indexData.scores.momentum).class
              }`}
            >
              {getStatusInfo(indexData.scores.momentum).text}
            </span>
          </div>
        </div>

        {/* 5. 한국 장단기 금리차 (스프레드) */}
        <div className="metric-card">
          <h3>2. 한국 장단기 금리차</h3>
          <p>
            <strong>한국 10년물 금리:</strong>{" "}
            {indexData.raw_data.metric_5_bond_spread["10y_yield"].toFixed(2)}%
          </p>
          <p>
            <strong>한국 3년물 금리:</strong>{" "}
            {indexData.raw_data.metric_5_bond_spread["3y_yield"].toFixed(2)}%
          </p>
          <p>장단기 금리차가 작거나 역전되면 공포(경기 침체 우려).</p>
          <div className="metric-score">
            점수: {indexData.scores.bond_spread.toFixed(2)}
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
            <strong>20일 주식 수익률:</strong>{" "}
            {(
              indexData.raw_data.metric_7_safe_haven.stock_return_20d * 100
            ).toFixed(2)}
            %
          </p>
          <p>
            <strong>20일 채권 수익률:</strong>{" "}
            {(
              indexData.raw_data.metric_7_safe_haven.bond_return_20d * 100
            ).toFixed(2)}
            %
          </p>
          <p>주식 수익률이 채권보다 높으면 탐욕.</p>
          <div className="metric-score">
            점수: {indexData.scores.safe_haven.toFixed(2)}
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
    </div>
  );
}

export default App;
