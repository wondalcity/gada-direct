/**
 * GADA 도입문의 - Google Apps Script
 *
 * 설치 방법:
 * 1. https://docs.google.com/spreadsheets/d/1Gcne7DSuo77QA7NDre7476Y3O6mX08i21XO8609r6X0 열기
 * 2. 상단 메뉴 → 확장 프로그램 → Apps Script
 * 3. 이 코드 전체를 붙여넣기 (기존 코드 덮어쓰기)
 * 4. 저장 (Ctrl+S)
 * 5. 오른쪽 상단 '배포' → '새 배포' 클릭
 * 6. 유형: '웹 앱' 선택
 * 7. 설명: "GADA 도입문의 폼"
 * 8. 다음 사용자로 실행: 나(본인 계정)
 * 9. 액세스 권한: 모든 사용자
 * 10. '배포' 클릭 → 표시된 웹 앱 URL 복사
 * 11. inquiry.js 파일 첫 줄의 GADA_SCRIPT_URL 값에 붙여넣기
 */

var SHEET_ID = '1Gcne7DSuo77QA7NDre7476Y3O6mX08i21XO8609r6X0';

function doPost(e) {
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getActiveSheet();

    // 첫 행이 비어있으면 헤더 추가
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        '접수일시', '건설사 유형', '건설사명', '담당자명',
        '연락처', '이메일', '요구사항', '유입 페이지'
      ]);
      // 헤더 스타일
      var headerRange = sheet.getRange(1, 1, 1, 8);
      headerRange.setBackground('#0F172A');
      headerRange.setFontColor('#FFFFFF');
      headerRange.setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    var p = e.parameter;
    sheet.appendRow([
      p.submittedAt   || new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      p.companyType   || '',
      p.companyName   || '',
      p.contactName   || '',
      p.contactPhone  || '',
      p.contactEmail  || '',
      p.requirements  || '',
      p.source        || ''
    ]);

    // 새 행 교대 배경색
    var lastRow = sheet.getLastRow();
    if (lastRow % 2 === 0) {
      sheet.getRange(lastRow, 1, 1, 8).setBackground('#F8FAFC');
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('GADA Inquiry Endpoint OK');
}
