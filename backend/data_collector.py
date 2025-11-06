import requests
from bs4 import BeautifulSoup
import yfinance as yf 
from datetime import datetime
import pandas as pd 

# Investing.com 접속용 헤더
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'}


def get_metric_1_momentum():
    """ 1. KOSPI 모멘텀 (성공) """
    print(" [1/7] KOSPI 모멘텀 수집 시작 (yfinance)...")
    try:
        ticker = yf.Ticker("^KS11") 
        hist = ticker.history(period="150d")
        closes = hist['Close']
        ma_120 = closes.rolling(window=120).mean()
        latest_ma_120 = ma_120.iloc[-1]
        latest_close = closes.iloc[-1]
        
        print(f"  > 성공: 현재 KOSPI = {latest_close:.2f}")
        print(f"  > 성공: 120일 이평선 = {latest_ma_120:.2f}")
        return {'current_price': latest_close, 'ma_120': latest_ma_120}
    except Exception as e:
        print(f"  > 실패: KOSPI 모멘텀(yfinance) 수집 중 오류 발생 ({e})")
        return None

# --- 신규 수정된 함수 (Investing.com 금리 URL) ---
def get_metric_5_bond_spread():
    """
    5. 채권 스프레드 (한국 장단기 금리차)
    (수정 5: Investing.com 국채 '금리' 페이지 스크레이핑)
    """
    print(" [5/7] 채권 스프레드 수집 시작 (Investing.com, 한국)...")
    try:
        # 1. 한국 국채 10년물 금리 페이지
        url_10y = "https://kr.investing.com/rates-bonds/south-korea-10-year-bond-yield"
        response_10y = requests.get(url_10y, headers=HEADERS)
        response_10y.raise_for_status()
        soup_10y = BeautifulSoup(response_10y.text, 'html.parser')
        
        # 2. 한국 국채 3년물 금리 페이지
        url_3y = "https://kr.investing.com/rates-bonds/south-korea-3-year-bond-yield"
        response_3y = requests.get(url_3y, headers=HEADERS)
        response_3y.raise_for_status()
        soup_3y = BeautifulSoup(response_3y.text, 'html.parser')

        # Investing.com의 현재 값 CSS 선택자
        selector = 'div[data-test="instrument-price-last"]'
        
        # 3. 값 추출
        ten_year_yield_str = soup_10y.select_one(selector).get_text()
        three_year_yield_str = soup_3y.select_one(selector).get_text()
        
        # 4. 숫자로 변환
        ten_year_yield = float(ten_year_yield_str.replace(',', ''))
        three_year_yield = float(three_year_yield_str.replace(',', ''))
        
        # 5. 스프레드 계산 (장기 금리 - 단기 금리)
        spread = ten_year_yield - three_year_yield
        
        print(f"  > 성공: 한국 10년물 금리 = {ten_year_yield:.2f}%")
        print(f"  > 성공: 한국 3년물 금리 = {three_year_yield:.2f}%")
        print(f"  > 성공: 장단기 스프레드 = {spread:.2f}%p")
        
        return {'10y_yield': ten_year_yield, '3y_yield': three_year_yield, 'spread': spread}

    except Exception as e:
        print(f"  > 실패: 채권 스프레드(Investing) 수집 중 오류 발생 ({e})")
        return None

def get_metric_7_safe_haven():
    """ 7. 안전 자산 수요 (성공) """
    print(" [7/7] 안전 자산 수요 수집 시작 (yfinance)...")
    try:
        stock_ticker = yf.Ticker("^KS11")
        bond_ticker = yf.Ticker("102780.KS") # KODEX 3년 국채 ETF
        
        stock_hist = stock_ticker.history(period="21d")
        bond_hist = bond_ticker.history(period="21d")
        
        stock_return = (stock_hist['Close'].iloc[-1] / stock_hist['Close'].iloc[0]) - 1
        bond_return = (bond_hist['Close'].iloc[-1] / bond_hist['Close'].iloc[0]) - 1
        return_diff = stock_return - bond_return
        
        print(f"  > 성공: 20일 주식 수익률 = {stock_return * 100:.2f}%")
        print(f"  > 성공: 20일 채권 수익률 = {bond_return * 100:.2f}%")
        print(f"  > 성공: 수익률 차이 = {return_diff * 100:.2f}%p")
        
        return {'stock_return_20d': stock_return, 'bond_return_20d': bond_return, 'diff': return_diff}
    except Exception as e:
        print(f"  > 실패: 안전 자산 수요(yfinance) 수집 중 오류 발생 ({e})")
        return None

# --- 나머지 4개 함수 (보류) ---

def get_metric_2_strength():
    """ 2. (보류) """
    return None

def get_metric_3_breadth():
    """ 3. (보류) """
    return None

def get_metric_4_put_call_ratio():
    """ 4. (보류) """
    return None

def get_metric_6_vkospi():
    """ 6. (보류) """
    return None


# (수정) 1, 5, 7번을 테스트하도록 변경
if __name__ == "__main__":
    print("--- 데이터 수집기 단독 테스트 (v15 - Investing) ---")
    get_metric_1_momentum()
    print("-" * 20) # 구분선
    get_metric_5_bond_spread()
    print("-" * 20) # 구분선
    get_metric_7_safe_haven()
    print("---------------------------------------------")
    