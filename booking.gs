/**
 * GADA 미팅 예약 시스템 - Google Apps Script Backend
 * 배포: Apps Script → 배포 → 웹 앱 → 액세스: 모든 사용자
 *
 * 설정:
 *   - CAL_ID: 캘린더 소유자 이메일
 *   - ADMIN_PW: 어드민 비밀번호
 */

var CAL_ID    = 'kyle@worksmate.co.kr';
var ADMIN_PW  = 'admin1234';
var SS_NAME   = 'GADA_예약관리';

// ── 기본 가용 설정 ──────────────────────────────────────────
var DEFAULT_CFG = {
  workDays:  [1, 2, 3, 4, 5],   // 1=월 … 5=금 (0=일, 6=토)
  startHour: 9,                  // 09:00
  endHour:   18,                 // 18:00 (마지막 슬롯 17:00)
  slotMin:   60,                 // 1시간 단위
  maxDaysAhead: 30               // 오늘로부터 예약 가능 기간
};

// ── CORS 헬퍼 ──────────────────────────────────────────────
function cors(output) {
  return output
    .setMimeType(ContentService.MimeType.JSON)
    .addHeader('Access-Control-Allow-Origin', '*')
    .addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .addHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(data) {
  return cors(ContentService.createTextOutput(JSON.stringify(data)));
}

// ── GET 라우터 ─────────────────────────────────────────────
function doGet(e) {
  var action = e.parameter.action || '';

  if (action === 'slots') {
    return handleGetSlots(e.parameter.date);
  }
  if (action === 'config') {
    if (e.parameter.pw !== ADMIN_PW) return json({ error: 'unauthorized' });
    return json(getConfig());
  }
  if (action === 'bookings') {
    if (e.parameter.pw !== ADMIN_PW) return json({ error: 'unauthorized' });
    return json(getBookings());
  }
  if (action === 'blocked') {
    if (e.parameter.pw !== ADMIN_PW) return json({ error: 'unauthorized' });
    return json(getBlockedDates());
  }

  return json({ ok: true, service: 'GADA Booking API' });
}

// ── POST 라우터 ────────────────────────────────────────────
function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (_) {}

  var action = body.action || '';

  if (action === 'book')         return handleBook(body);
  if (action === 'updateConfig') {
    if (body.pw !== ADMIN_PW) return json({ error: 'unauthorized' });
    return handleUpdateConfig(body.config);
  }
  if (action === 'blockDate') {
    if (body.pw !== ADMIN_PW) return json({ error: 'unauthorized' });
    return handleBlockDate(body.date, body.block);
  }

  return json({ error: 'unknown action' });
}

// ── 슬롯 조회 ─────────────────────────────────────────────
function handleGetSlots(dateStr) {
  if (!dateStr) return json({ error: 'date required' });

  var cfg  = getConfig();
  var date = new Date(dateStr + 'T00:00:00+09:00');
  var dow  = date.getDay(); // 0=일

  // 주말 / 비가용 요일 체크
  if (cfg.workDays.indexOf(dow) === -1) {
    return json({ slots: [], reason: 'unavailable_day' });
  }

  // 차단 날짜 체크
  if (isBlocked(dateStr)) {
    return json({ slots: [], reason: 'blocked' });
  }

  // 오늘 이전 / maxDaysAhead 초과 체크
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var targetDay = new Date(date);
  targetDay.setHours(0, 0, 0, 0);
  var diff = Math.round((targetDay - today) / 86400000);
  if (diff < 0 || diff > cfg.maxDaysAhead) {
    return json({ slots: [], reason: 'out_of_range' });
  }

  // 캘린더 busy 조회
  var startOfDay = new Date(dateStr + 'T00:00:00+09:00');
  var endOfDay   = new Date(dateStr + 'T23:59:59+09:00');
  var cal        = CalendarApp.getCalendarById(CAL_ID) || CalendarApp.getDefaultCalendar();
  var events     = cal.getEvents(startOfDay, endOfDay);

  // busy 구간 수집 (분 단위)
  var busy = events.map(function (ev) {
    return {
      start: ev.getStartTime().getHours() * 60 + ev.getStartTime().getMinutes(),
      end:   ev.getEndTime().getHours()   * 60 + ev.getEndTime().getMinutes()
    };
  });

  // 슬롯 생성
  var slots = [];
  for (var h = cfg.startHour; h < cfg.endHour; h++) {
    var slotStart = h * 60;
    var slotEnd   = slotStart + cfg.slotMin;
    var overlap   = busy.some(function (b) {
      return slotStart < b.end && slotEnd > b.start;
    });
    // 오늘이면 현재 시각 이후만
    var now = new Date();
    if (diff === 0 && slotStart <= now.getHours() * 60 + now.getMinutes()) continue;

    if (!overlap) {
      slots.push(pad2(h) + ':00');
    }
  }

  return json({ slots: slots, date: dateStr });
}

// ── 예약 처리 ─────────────────────────────────────────────
function handleBook(body) {
  var dateStr  = body.date;    // 'YYYY-MM-DD'
  var timeStr  = body.time;    // 'HH:00'
  var name     = body.name     || '';
  var email    = body.email    || '';
  var company  = body.company  || '';
  var phone    = body.phone    || '';
  var note     = body.note     || '';

  if (!dateStr || !timeStr || !name || !phone) {
    return json({ error: 'required fields missing' });
  }

  // 슬롯 재확인
  var slotsRes = JSON.parse(handleGetSlots(dateStr).getContent());
  if (!slotsRes.slots || slotsRes.slots.indexOf(timeStr) === -1) {
    return json({ error: 'slot_unavailable' });
  }

  var hour   = parseInt(timeStr.split(':')[0], 10);
  var tzOff  = '+09:00';
  var start  = new Date(dateStr + 'T' + pad2(hour) + ':00:00' + tzOff);
  var end    = new Date(dateStr + 'T' + pad2(hour + 1) + ':00:00' + tzOff);

  // 캘린더 이벤트 생성
  var cal   = CalendarApp.getCalendarById(CAL_ID) || CalendarApp.getDefaultCalendar();
  var title = '[GADA 미팅] ' + company + ' · ' + name;
  var desc  = '건설사: ' + company + '\n담당자: ' + name + '\n연락처: ' + phone + (note ? '\n\n메모: ' + note : '');

  var event = cal.createEvent(title, start, end, {
    description: email ? desc + '\n이메일: ' + email : desc,
    guests:      email || '',
    sendInvites: !!email
  });

  var meetLink = '';
  try {
    // Google Meet 링크 추가 시도
    var resource = {
      conferenceData: {
        createRequest: {
          requestId: Utilities.getUuid(),
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    };
    var calId  = CAL_ID;
    var evId   = event.getId().replace('@google.com', '');
    var resp   = Calendar.Events.patch(resource, calId, evId, { conferenceDataVersion: 1 });
    meetLink   = (resp.conferenceData && resp.conferenceData.entryPoints)
      ? resp.conferenceData.entryPoints[0].uri : '';
  } catch (_) {}

  // 스프레드시트에 기록
  saveBooking({
    date: dateStr, time: timeStr, name: name, email: email,
    company: company, phone: phone, note: note,
    eventId: event.getId(), meetLink: meetLink,
    createdAt: Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss')
  });

  // 신청자 확인 이메일
  if (email) {
    var subject = '[GADA] 미팅 예약이 확정되었습니다';
    var body2   = name + '님 안녕하세요.\n\n아래 일정으로 미팅이 예약되었습니다.\n\n'
      + '일시: ' + dateStr + ' ' + timeStr + ' (1시간)\n'
      + '담당: GADA 영업팀\n'
      + (meetLink ? '미팅 링크: ' + meetLink + '\n' : '')
      + '\n일정 변경이 필요하시면 reply로 연락 주세요.\n\n감사합니다.\nGADA 팀';
    GmailApp.sendEmail(email, subject, body2, { name: 'GADA 팀' });
  }

  return json({
    ok: true,
    date: dateStr,
    time: timeStr,
    meetLink: meetLink,
    eventId: event.getId()
  });
}

// ── Config ─────────────────────────────────────────────────
function getConfig() {
  var props = PropertiesService.getScriptProperties();
  var raw   = props.getProperty('config');
  try { return raw ? JSON.parse(raw) : DEFAULT_CFG; } catch (_) { return DEFAULT_CFG; }
}

function handleUpdateConfig(cfg) {
  PropertiesService.getScriptProperties().setProperty('config', JSON.stringify(cfg));
  return json({ ok: true });
}

// ── Blocked Dates ──────────────────────────────────────────
function getBlockedDates() {
  var props = PropertiesService.getScriptProperties();
  var raw   = props.getProperty('blocked');
  try { return raw ? JSON.parse(raw) : []; } catch (_) { return []; }
}

function isBlocked(dateStr) {
  return getBlockedDates().indexOf(dateStr) !== -1;
}

function handleBlockDate(dateStr, block) {
  var blocked = getBlockedDates();
  if (block) {
    if (blocked.indexOf(dateStr) === -1) blocked.push(dateStr);
  } else {
    blocked = blocked.filter(function (d) { return d !== dateStr; });
  }
  PropertiesService.getScriptProperties().setProperty('blocked', JSON.stringify(blocked));
  return json({ ok: true, blocked: blocked });
}

// ── Spreadsheet 기록 ───────────────────────────────────────
function getSheet() {
  var ssList = SpreadsheetApp.getActiveSpreadsheet();
  var ss     = ssList || SpreadsheetApp.create(SS_NAME);
  var sh     = ss.getSheetByName('예약') || ss.insertSheet('예약');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['날짜', '시간', '건설사', '담당자', '연락처', '이메일', '메모', '이벤트ID', '미팅링크', '등록일시']);
  }
  return sh;
}

function saveBooking(b) {
  try {
    var sh = getSheet();
    sh.appendRow([b.date, b.time, b.company, b.name, b.phone, b.email, b.note, b.eventId, b.meetLink, b.createdAt]);
  } catch (e) {
    Logger.log('saveBooking error: ' + e);
  }
}

function getBookings() {
  try {
    var sh   = getSheet();
    var data = sh.getDataRange().getValues();
    var header = data[0];
    return data.slice(1).map(function (row) {
      var obj = {};
      header.forEach(function (h, i) { obj[h] = row[i]; });
      return obj;
    });
  } catch (_) { return []; }
}

// ── 유틸 ───────────────────────────────────────────────────
function pad2(n) { return n < 10 ? '0' + n : '' + n; }
