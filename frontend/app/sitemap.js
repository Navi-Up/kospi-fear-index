export default function sitemap() {
  const baseUrl = "https://kospi-fear-index.vercel.app";

  return [
    {
      url: baseUrl, // 메인 페이지
      lastModified: new Date(), // 항상 최신 날짜
      changeFrequency: "daily", // 얼마나 자주 바뀌나 (매일)
      priority: 1, // 중요도 (제일 높음)
    },
  ];
}
