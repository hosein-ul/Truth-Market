/**
 * Market cover images mapped by market question
 * Each market gets a specific image based on its topic
 */

export const MARKET_IMAGES: Record<string, string> = {
  // Crypto
  "Will Bitcoin hit $150,000 before 2027?": "/images/markets/btc-150k.jpg",
  "Will Ethereum reach $10,000 in 2026?": "/images/markets/eth-10k.jpg",
  "Will Solana flip Ethereum by market cap in 2026?": "/images/markets/solana-flip.jpg",
  "Will a spot ETH ETF see $1B daily inflow in 2026?": "/images/markets/eth-etf.jpg",
  "Will Bitcoin dominance drop below 40% in 2026?": "/images/markets/btc-dominance.jpg",
  "Will Coinbase be listed on the S&P 500 by end of 2026?": "/images/markets/coinbase-sp500.jpg",
  "Will the total crypto market cap exceed $10 trillion in 2026?": "/images/markets/crypto-10t.jpg",
  "Will a major central bank hold Bitcoin on its balance sheet by 2027?": "/images/markets/cb-bitcoin.jpg",
  
  // Politics
  "Will Donald Trump be impeached before 2027?": "/images/markets/trump-impeach.jpg",
  "Will Gavin Newsom win the 2028 Democratic presidential nomination?": "/images/markets/newsom-2028.jpg",
  "Will the US-Iran nuclear deal be signed by end of 2026?": "/images/markets/iran-nuclear.jpg",
  "Will there be a US federal government shutdown in 2026?": "/images/markets/gov-shutdown.jpg",
  "Will Emmanuel Macron resign before end of 2026?": "/images/markets/macron-resign.jpg",
  "Will the UK rejoin the EU single market by 2028?": "/images/markets/uk-eu.jpg",
  "Will Elon Musk leave a US government role before 2027?": "/images/markets/elon-gov.jpg",
  
  // Sports
  "Will Real Madrid win the 2026 UEFA Champions League?": "/images/markets/real-madrid.jpg",
  "Will the 2026 FIFA World Cup be won by Brazil?": "/images/markets/brazil-wc.jpg",
  "Will Novak Djokovic win another Grand Slam in 2026?": "/images/markets/djokovic.jpg",
  "Will the New York Knicks win the 2026-27 NBA Championship?": "/images/markets/knicks-nba.jpg",
  "Will Jon Jones vs. Tom Aspinall fight happen in 2026?": "/images/markets/jones-aspinall.jpg",
  "Will Formula 1 have a new World Champion in 2026?": "/images/markets/f1-champion.jpg",
  
  // Science
  "Will OpenAI release GPT-5 before end of 2026?": "/images/markets/gpt5.jpg",
  "Will AGI be declared by any major lab before 2027?": "/images/markets/agi.jpg",
  "Will a human-rated commercial space station be operational by 2028?": "/images/markets/space-station.jpg",
  "Will Apple release an AI chip beating Nvidia H100 performance by 2027?": "/images/markets/apple-chip.jpg",
  
  // Finance
  "Will the US Federal Reserve cut rates 3+ times in 2026?": "/images/markets/fed-rates.jpg",
  "Will US inflation fall below 2% by Q4 2026?": "/images/markets/inflation.jpg",
  "Will gold hit $4,000/oz in 2026?": "/images/markets/gold-4000.jpg",
  
  // Other
  "Will GTA VI be released before end of 2026?": "/images/markets/gta6.jpg",
  "Will Taylor Swift announce a 2027 world tour?": "/images/markets/taylor-tour.jpg",
  
  // Demo Markets (using Unsplash CDN)
  "Will BTC close above $150,000 on June 30, 2026?": "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&q=80",
  "Will the Fed cut rates at the July 30, 2026 FOMC meeting?": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
  "Will SpaceX complete a crewed Starship orbital flight by Aug 31, 2026?": "https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=800&q=80",
  "Will Apple announce a foldable iPhone at the Sep 2026 event?": "https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&q=80",
  "Will ETH/BTC ratio close above 0.06 on July 15, 2026?": "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=800&q=80",
  "Will Manchester City win the 2026/27 Premier League title?": "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80",
  "Will ETH close above $5,000 on August 31, 2026?": "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&q=80",
  "Will a spot SOL ETF be approved in the US by December 31, 2026?": "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80",
  "Will Bitcoin dominance fall below 40% by Sep 30, 2026?": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
};

/**
 * Get the image path for a market question
 * Falls back to undefined if no image is mapped
 */
export function getMarketImage(question: string): string | undefined {
  return MARKET_IMAGES[question];
}
