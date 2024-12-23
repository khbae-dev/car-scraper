const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // User-Agent 설정
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36');

  const baseUrl = 'https://www.bobaedream.co.kr/mycar/mycar_list.php?gubun=K&ot=second';
  console.log('Visiting main page:', baseUrl);
  await page.goto(baseUrl, { waitUntil: 'networkidle2' });

  const menuButtons = await page.$$eval('.slide.fir button', buttons =>
    buttons.map(button => ({
      name: button.querySelector('.txt')?.innerText.trim() || 'Unnamed',
      onclick: button.getAttribute('onclick')
    }))
  );

  console.log('Menu buttons found:', menuButtons);

  const allResults = {};

  for (const menu of menuButtons) {
    console.log(`Processing menu: ${menu.name}`);

    const menuResults = [];
    let currentPage = 1;

    while (true) {
      console.log(`Visiting page ${currentPage} of menu ${menu.name}`);

      try {
        // URL 방문
        await page.goto(
          `${baseUrl}&carriage=${encodeURIComponent(menu.name)}&page=${currentPage}&order=S11&view_size=20`,
          { waitUntil: 'networkidle2', timeout: 30000 }
        );

        // 매물이 없으면 종료
        const productItems = await page.$$('li.product-item');
        if (productItems.length === 0) {
          console.log(`No more items found for menu ${menu.name} on page ${currentPage}.`);
          break;
        }

        // 데이터 크롤링
        const cars = await page.$$eval('li.product-item', items => {
          return items.map(item => {
            const titleEl = item.querySelector('.title .tit a');
            const title = titleEl ? titleEl.innerText.trim() : '';
            const yearEl = item.querySelector('.year .text');
            const year = yearEl ? yearEl.innerText.trim() : '';
            const fuelEl = item.querySelector('.fuel .text');
            const fuel = fuelEl ? fuelEl.innerText.trim() : '';
            const kmEl = item.querySelector('.km .text');
            const km = kmEl ? kmEl.innerText.trim() : '';
            const priceEl = item.querySelector('.price b em');
            const price = priceEl ? priceEl.innerText.trim() : '';
            const sellerNameEl = item.querySelector('.seller .seller-name .text');
            const sellerName = sellerNameEl ? sellerNameEl.innerText.trim() : '';
            const locationItem = item.querySelector('.seller .content-list .content-item span.text');
            const location = locationItem ? locationItem.innerText.trim() : '';

            return {
              title,
              year,
              fuel,
              km,
              price: price + '만원',
              sellerName,
              location
            };
          });
        });

        menuResults.push(...cars);

        // 다음 페이지 탐지 및 이동
        const hasNextPage = await page.evaluate(() => {
          const currentPageEl = document.querySelector('.paging-inner strong');
          const nextPageEl = currentPageEl?.nextElementSibling;
          return nextPageEl && nextPageEl.tagName === 'A' ? true : false;
        });

        if (!hasNextPage) {
          console.log(`No more pages for menu ${menu.name}.`);
          break;
        }

        // 다음 페이지로 이동
        currentPage++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // 요청 간 대기
      } catch (error) {
        console.error(`Error on ${menu.name} - Page ${currentPage}:`, error);
        break; // 에러 발생 시 순회 종료
      }
    }

    allResults[menu.name] = menuResults;
  }

  console.log('Crawling completed.');
  fs.writeFileSync('cars.json', JSON.stringify(allResults, null, 2), 'utf-8');

  await browser.close();
})();