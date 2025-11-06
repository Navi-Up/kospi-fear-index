import "./globals.css";

// (신규) SEO를 위한 metadata!
export const metadata = {
  title: "KOSPI 공포탐욕지수",
  description:
    "SSR로 구현된 KOSPI 공포탐욕지수입니다. 시장의 심리를 실시간으로 분석합니다.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      {" "}
      {/* (신규) SEO를 위해 언어 설정 */}
      <head>
        {/* Pretendard 폰트 링크 */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <meta
          name="google-site-verification"
          content="GeQ5GYbmXtThavbBMigUt4zsRTagrlmrZYfACiHTwpA"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
