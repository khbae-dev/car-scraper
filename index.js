const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: true, // 화면 확인 필요시 false
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // 경차 매물 페이지로 이동
  await page.goto(
    'https://www.bobaedream.co.kr/mycar/mycar_list.php?gubun=K&ot=second&carriage=%EA%B2%BD%EC%B0%A8&page=1&order=S11&view_size=20',
    { waitUntil: 'networkidle2' }
  );

  // 매물 리스트 로딩 대기
  await page.waitForSelector('li.product-item');

  // 매물 정보 추출
  // 각 매물(li.product-item)별로 제목, 연식, 연료, 주행거리, 가격, 지역/판매자 정보를 추출
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

      // 판매자 및 지역 정보 추출
      // 판매자 정보는 .seller .seller-content 안에 있음
      const sellerNameEl = item.querySelector('.seller .seller-name .text');
      const sellerName = sellerNameEl ? sellerNameEl.innerText.trim() : '';

      // 지역 정보는 .seller .content-item 중 첫 번째 나타나는 곳에 있음
      const locationItem = item.querySelector('.seller .content-list .content-item span.text');
      const location = locationItem ? locationItem.innerText.trim() : '';

      return {
        title,
        year,
        fuel,
        km,
        price: price + '만원', // 가격 단위가 만원 기준으로 되어 있으므로 만원 단위 추가
        sellerName,
        location
      };
    });
  });

  // JSON 형태로 콘솔 출력
  console.log(JSON.stringify(cars, null, 2));

  // JSON 파일로 저장하고 싶다면 주석 해제
  // fs.writeFileSync('cars.json', JSON.stringify(cars, null, 2), 'utf-8');

  await browser.close();
})();