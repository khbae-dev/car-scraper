# 차량 데이터 크롤링 스크립트

이 프로젝트는 Puppeteer를 활용하여 **보배드림** 웹사이트에서 차량 데이터를 자동으로 크롤링하는 스크립트를 포함합니다. 이 스크립트는 특정 조건에 맞는 중고차 데이터를 수집하고 이를 JSON 형식으로 저장합니다.

## 주요 기능

1. **메뉴 버튼 분석**

   - 페이지의 메뉴 버튼을 탐색하고, 각 버튼의 이름 및 클릭 이벤트 정보를 수집합니다.
   - 이를 통해 차량 데이터를 카테고리별로 수집할 수 있습니다.

2. **데이터 크롤링**

   - 선택된 메뉴(카테고리)별로 차량 데이터를 반복적으로 요청하고 크롤링합니다.
   - 수집되는 데이터는 다음을 포함합니다:
     - 차량 제목
     - 연식
     - 연료 종류
     - 주행 거리
     - 가격
     - 판매자 이름
     - 위치 정보

3. **페이지 네비게이션**

   - 각 카테고리 내에서 여러 페이지를 순회하며 데이터를 수집합니다.
   - 다음 페이지가 없으면 자동으로 종료됩니다.

4. **JSON 데이터 저장**
   - 수집된 데이터를 `cars.json` 파일로 저장하여 후속 분석 및 활용이 가능하도록 합니다.

## 실행 방법

1. **환경 설정**

   - Node.js와 Puppeteer가 설치되어 있어야 합니다.
   - 프로젝트 디렉토리에서 다음 명령어로 필요한 모듈을 설치합니다:
     ```bash
     npm install puppeteer
     ```

2. **스크립트 실행**

   - 다음 명령어를 통해 index.js를 실행합니다:
     ```bash
     node index.js
     ```
   - 실행 후, `cars.json` 파일에 크롤링된 데이터가 저장됩니다.

3. **결과 파일**
   - `cars.json` 파일에는 카테고리별로 정리된 중고차 데이터가 저장됩니다.

## 기술 스택

- **Node.js**: 스크립트 실행 환경.
- **Puppeteer**: 크롬 기반의 웹 크롤링 라이브러리.
- **JSON**: 수집된 데이터를 저장하는 형식.

## 주의사항

- 크롤링 대상 웹사이트의 정책을 준수하세요.
- 서버 부하를 줄이기 위해 요청 간 대기 시간을 포함했습니다.
- 네트워크 상태나 웹사이트의 구조 변경에 따라 오류가 발생할 수 있으니 필요한 경우 코드를 수정하세요.
