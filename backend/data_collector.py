import requests
from bs4 import BeautifulSoup
import yfinance as yf 
from datetime import datetime
import pandas as pd 

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'}

def get_metric_1_momentum():
    """ 
    1. KOSPI 모멘텀 (수정)
    - 반환값: (오늘의 비율, 과거 1년치 비율 Series)
    """
    print(" [1/7] KOSPI 모멘텀 수집 시작 (yfinance)...")
    try:
        # 120일 이평선 + 252일(1년) = 약 372일. 넉넉하게 400일치
        ticker = yf.Ticker("^KS11") 
        hist = ticker.history(period="400d")
        closes = hist['Close']
        
        # 120일 이동평균
        ma_120 = closes.rolling(window=120).mean()
        
        # (신규) KOSPI / 120일선 '비율'의 시계열 데이터
        ratio_series = (closes / ma_120).dropna() # NaN 값 제거
        
        # (신규) 가장 최근 값
        latest_ratio = ratio_series.iloc[-1]
        
        print(f"  > 성공: 1번 (오늘 비율 {latest_ratio:.2f})")
        return (latest_ratio, ratio_series)
    
    except Exception as e:
        print(f"  > 실패: KOSPI 모멘텀(yfinance) 수집 중 오류 발생 ({e})")
        return (None, None)

def get_metric_5_bond_spread():
    """
    5. 채권 스프레드 (한국 장단기 금리차) (수정)
    - 반환값: (오늘의 스프레드, 과거 1년치 스프레드 Series)
    """
    print(" [5/7] 채권 스프레드 수집 시작 (Investing.com, 한국)...")
    try:
        # (신규) Investing.com에서 '과거 데이터'를 가져오는 로직은 매우 복잡함.
        # 대신 yfinance의 미국 장단기 금리차로 대체 (이게 더 안정적)
        
        # 1. 미국 국채 10년물 금리 티커
        ten_year_ticker = yf.Ticker("^TNX")
        # 2. 미국 국채 3개월물(13-week) 금리 티커
        three_month_ticker = yf.Ticker("^IRX") 
        
        # 과거 1년치(약 252일) 데이터
        ten_year_hist = ten_year_ticker.history(period="252d")
        three_month_hist = three_month_ticker.history(period="252d")
        
        # (신규) 금리차(스프레드) 시계열 데이터
        spread_series = (ten_year_hist['Close'] - three_month_hist['Close']).dropna()
        
        # (신규) 가장 최근 값
        latest_spread = spread_series.iloc[-1]
        
        print(f"  > 성공: 5번 (오늘 스프레드 {latest_spread:.2f})")
        return (latest_spread, spread_series)

    except Exception as e:
        print(f"  > 실패: 채권 스프레드(yfinance US) 수집 중 오류 발생 ({e})")
        return (None, None)

def get_metric_7_safe_haven():
    """ 
    7. 안전 자산 수요 (수정)
    - 반환값: (오늘의 수익률 차이, 과거 1년치 수익률 차이 Series)
    """
    print(" [7/7] 안전 자산 수요 수집 시작 (yfinance)...")
    try:
        # 1년(252일) + 21일 = 약 273일. 넉넉하게 300일치
        stock_ticker = yf.Ticker("^KS11")
        bond_ticker = yf.Ticker("102780.KS") # KODEX 3년 국채 ETF
        
        stock_hist = stock_ticker.history(period="300d")['Close']
        bond_hist = bond_ticker.history(period="300d")['Close']
        
        # (신규) 20일간의 '수익률' 시계열 데이터
        stock_return_20d = (stock_hist / stock_hist.shift(20)) - 1
        bond_return_20d = (bond_hist / bond_hist.shift(20)) - 1
        
        # (신규) 주식 수익률 - 채권 수익률 '차이' 시계열 데이터
        diff_series = (stock_return_20d - bond_return_20d).dropna()
        
        # (신규) 가장 최근 값
        latest_diff = diff_series.iloc[-1]
        
        print(f"  > 성공: 7번 (오늘 수익률 차이 {latest_diff*100:.2f}%)")
        return (latest_diff, diff_series)
    
    except Exception as e:
        print(f"  > 실패: 안전 자산 수요(yfinance) 수집 중 오류 발생 ({e})")
        return (None, None)

# --- 나머지 4개 함수 (보류) ---
def get_metric_2_strength(): return (None, None)
def get_metric_3_breadth(): return (None, None)
def get_metric_4_put_call_ratio(): return (None, None)
def get_metric_6_vkospi(): return (None, None)