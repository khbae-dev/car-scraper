const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// 📅 현재 날짜 및 시간으로 파일명 생성 함수
function getCurrentTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

// 🔧 km 값을 숫자로 변환하는 함수
function parseKm(kmStr) {
  if (!kmStr) return 0;
  const num = parseFloat(kmStr.replace(/[^0-9.]/g, ''));
  return kmStr.includes('만') ? num * 10000 : num;
}

// JSON 파일 저장 경로 수정
const saveDataToFile = (data) => {
  const dirPath = '/shared-data';
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true }); // 디렉토리 생성
    console.log(`📂 디렉토리가 생성되었습니다: ${dirPath}`);
  }

  const fileName = path.join(dirPath, `cars_${getCurrentTimestamp()}.json`);
  fs.writeFileSync(fileName, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ 데이터가 저장되었습니다: ${fileName}`);
};

// Puppeteer 크롤러 실행
(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // User-Agent 설정
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36'
  );

  const baseUrl = 'https://www.bobaedream.co.kr/mycar/mycar_list.php?gubun=K&ot=second';
  console.log('Visiting main page:', baseUrl);
  await page.goto(baseUrl, { waitUntil: 'networkidle2' });

  const menuButtons = await page.$$eval('.slide.fir button', (buttons) =>
    buttons.map((button) => ({
      name: button.querySelector('.txt')?.innerText.trim() || 'Unnamed',
      onclick: button.getAttribute('onclick'),
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
        await page.goto(
          `${baseUrl}&carriage=${encodeURIComponent(menu.name)}&page=${currentPage}&order=S11&view_size=20`,
          { waitUntil: 'networkidle2', timeout: 30000 }
        );

        const productItems = await page.$$('li.product-item');
        if (productItems.length === 0) {
          console.log(`No more items found for menu ${menu.name} on page ${currentPage}.`);
          break;
        }

        const cars = await page.$$eval('li.product-item', (items) => {
          // 🔧 parseKm 함수 정의
          function parseKm(kmStr) {
            if (!kmStr) return 0;
            const num = parseFloat(kmStr.replace(/[^0-9.]/g, ''));
            return kmStr.includes('만') ? num * 10000 : num;
          }

          return items.map((item) => {
            const titleEl = item.querySelector('.title .tit a');
            const title = titleEl ? titleEl.innerText.trim() : '';
            const yearEl = item.querySelector('.year .text');
            const year = yearEl ? yearEl.innerText.replace(/\n.*$/, '').trim() : '';
            const fuelEl = item.querySelector('.fuel .text');
            const fuel = fuelEl ? fuelEl.innerText.trim() : '';
            const kmEl = item.querySelector('.km .text');
            let km = kmEl ? kmEl.innerText.trim() : '';
            km = parseKm(km); // 🔧 parseKm 함수 사용
            const priceEl = item.querySelector('.price b em');
            let price = priceEl ? priceEl.innerText.replace(/[^0-9]/g, '') : '';
            price = price ? parseInt(price, 10) : 0;

            const sellerNameEl = item.querySelector('.seller .seller-name .text');
            const sellerName = sellerNameEl ? sellerNameEl.innerText.trim() : '';
            const locationItem = item.querySelector('.seller .content-list .content-item span.text');
            const location = locationItem ? locationItem.innerText.trim() : '';

            return {
              title,
              year,
              fuel,
              km,
              price,
              unit: '만원', // 🔧 단위 속성 추가
              sellerName,
              location,
            };
          });
        });

        menuResults.push(...cars);

        const hasNextPage = await page.evaluate(() => {
          const currentPageEl = document.querySelector('.paging-inner strong');
          const nextPageEl = currentPageEl?.nextElementSibling;
          return nextPageEl && nextPageEl.tagName === 'A' ? true : false;
        });

        if (!hasNextPage) {
          console.log(`No more pages for menu ${menu.name}.`);
          break;
        }

        currentPage++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error on ${menu.name} - Page ${currentPage}:`, error);
        break;
      }
    }

    allResults[menu.name] = menuResults;
  }

  saveDataToFile(allResults);

  await browser.close();
})();