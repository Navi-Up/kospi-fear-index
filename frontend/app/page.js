"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import "./globals.css";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function Home() {
  const [indexData, setIndexData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
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
        setIndexData(null);
      } finally {
        setLoading(false);
        setInitialLoadComplete(true);
      }
    };

    fetchData();

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

  if (error && initialLoadComplete) {
    return (
      <main className="App">
        <div className="error-message">
          <h1>오류 발생!</h1>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  const finalIndex = indexData ? indexData.final_index : 50;
  const finalStatus = getStatusInfo(finalIndex);

  return (
    <main className="App">
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
        {/* (수정) 차트 컨테이너에 클래스 추가 */}
        <div className="chart-container">
          <Chart
            options={chartOptions}
            series={[finalIndex]}
            type="radialBar"
            width="100%"
          />
        </div>
      </section>

      <section className="metrics-grid">
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
                <span className="score-value">
                  백분위 점수: {indexData.scores.momentum.toFixed(1)}점
                </span>
                <span
                  className={`status-pill ${
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
                <span className="score-value">
                  백분위 점수: {indexData.scores.bond_spread.toFixed(1)}점
                </span>
                <span
                  className={`status-pill ${
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
                <span className="score-value">
                  백분위 점수: {indexData.scores.safe_haven.toFixed(1)}점
                </span>
                <span
                  className={`status-pill ${
                    getStatusInfo(indexData.scores.safe_haven).class
                  }`}
                >
                  {getStatusInfo(indexData.scores.safe_haven).text}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="loading-metrics-placeholder">
            <p className="last-updated">지표 데이터 로딩 중...</p>
          </div>
        )}
      </section>
    </main>
  );
}
