/**
 * GADA 도입문의 모달 + 미팅 예약
 * Supabase: 리드 저장 / Apps Script: 캘린더 예약
 */
var SUPABASE_URL  = 'https://evaddagjpjiekbhsmgxh.supabase.co';
var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2YWRkYWdqcGppZWtiaHNtZ3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0ODc0MzYsImV4cCI6MjA5MDA2MzQzNn0.kC9rIBMvvScgfZyrlNhM6M7GKynQjagbJUN-VX6wmsM';
var BOOKING_URL   = 'https://script.google.com/macros/s/AKfycbxVOT-BAnQsBQmNQY-Pgk3PrtZspg-NR6DubH0-qXxCnyLcpjQ-YyWT2MYH9J0mXktLLw/exec';

(function () {
  /* ── CSS ─────────────────────────────────────────── */
  var css = `
    .inq-overlay {
      display: none; position: fixed; inset: 0; z-index: 9000;
      background: rgba(0,0,0,.65); backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      align-items: center; justify-content: center;
      padding: 20px;
    }
    .inq-overlay.open { display: flex; }

    .inq-modal {
      background: #0F172A;
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 20px;
      width: 100%; max-width: 480px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 36px 32px 32px;
      position: relative;
      box-shadow: 0 24px 80px rgba(0,0,0,.6);
      animation: inqSlideUp .28s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes inqSlideUp {
      from { opacity: 0; transform: translateY(28px) scale(.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .inq-close {
      position: absolute; top: 16px; right: 16px;
      width: 32px; height: 32px; border-radius: 50%;
      background: rgba(255,255,255,.08); border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: rgba(255,255,255,.5); font-size: 18px; line-height: 1;
      transition: background .15s, color .15s;
    }
    .inq-close:hover { background: rgba(255,255,255,.14); color: #fff; }

    .inq-badge {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(0,184,122,.12); border: 1px solid rgba(0,184,122,.3);
      color: #4DFFA8; font-size: 11px; font-weight: 800;
      padding: 4px 10px; border-radius: 99px; letter-spacing: .04em;
      margin-bottom: 12px;
    }
    .inq-badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #00B87A; }

    .inq-modal h3 {
      font-size: 20px; font-weight: 900; color: #fff;
      line-height: 1.3; letter-spacing: -.02em; margin-bottom: 6px;
    }
    .inq-modal .inq-sub {
      font-size: 13px; color: rgba(255,255,255,.45); line-height: 1.6; margin-bottom: 24px;
    }

    .inq-form { display: flex; flex-direction: column; gap: 14px; }

    .inq-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

    .inq-field { display: flex; flex-direction: column; gap: 5px; }
    .inq-field label {
      font-size: 11px; font-weight: 700; color: rgba(255,255,255,.45);
      letter-spacing: .06em; text-transform: uppercase;
    }
    .inq-field label .req { color: #00B87A; margin-left: 2px; }

    .inq-field select,
    .inq-field input,
    .inq-field textarea {
      background: rgba(255,255,255,.06);
      border: 1.5px solid rgba(255,255,255,.1);
      border-radius: 10px;
      color: #fff; font-size: 14px; font-weight: 500;
      padding: 11px 14px;
      outline: none;
      transition: border-color .15s, background .15s;
      font-family: 'Pretendard', sans-serif;
      width: 100%; box-sizing: border-box;
      -webkit-appearance: none;
    }
    .inq-field select option { background: #1e293b; color: #fff; }
    .inq-field select {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(255,255,255,.4)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 14px center;
      padding-right: 36px;
    }
    .inq-field textarea { resize: vertical; min-height: 88px; }

    .inq-field input:focus,
    .inq-field select:focus,
    .inq-field textarea:focus {
      border-color: #00B87A;
      background: rgba(0,184,122,.06);
    }
    .inq-field input::placeholder,
    .inq-field textarea::placeholder { color: rgba(255,255,255,.22); }

    .inq-field .err-msg {
      font-size: 11px; color: #FF6B6B; font-weight: 600;
      display: none;
    }
    .inq-field.has-err input,
    .inq-field.has-err select,
    .inq-field.has-err textarea { border-color: #FF6B6B; }
    .inq-field.has-err .err-msg { display: block; }

    .inq-submit {
      background: #00B87A; color: #fff;
      border: none; border-radius: 12px;
      padding: 15px; font-size: 15px; font-weight: 800;
      cursor: pointer; transition: background .15s, transform .15s, box-shadow .15s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      margin-top: 4px; font-family: 'Pretendard', sans-serif;
      letter-spacing: -.01em;
    }
    .inq-submit:hover { background: #00A06A; box-shadow: 0 8px 24px rgba(0,184,122,.35); transform: translateY(-1px); }
    .inq-submit:active { transform: none; }
    .inq-submit:disabled { background: rgba(255,255,255,.1); color: rgba(255,255,255,.3); cursor: not-allowed; transform: none; box-shadow: none; }

    .inq-spinner {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.3);
      border-top-color: #fff; border-radius: 50%;
      animation: inqSpin .6s linear infinite; display: none;
    }
    @keyframes inqSpin { to { transform: rotate(360deg); } }

    /* Success state */
    .inq-success {
      display: none; flex-direction: column; align-items: center;
      text-align: center; padding: 20px 0 8px;
    }
    .inq-success-icon {
      width: 64px; height: 64px; border-radius: 50%;
      background: rgba(0,184,122,.12); border: 2px solid rgba(0,184,122,.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; margin-bottom: 16px;
      animation: inqPop .4s cubic-bezier(.22,1,.36,1) .1s both;
    }
    @keyframes inqPop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .inq-success h4 { font-size: 20px; font-weight: 900; color: #fff; margin-bottom: 8px; }
    .inq-success p { font-size: 14px; color: rgba(255,255,255,.5); line-height: 1.7; }
    .inq-success-close {
      margin-top: 24px; background: rgba(255,255,255,.08);
      border: none; border-radius: 10px; color: rgba(255,255,255,.6);
      padding: 12px 28px; font-size: 14px; font-weight: 700;
      cursor: pointer; font-family: 'Pretendard', sans-serif;
      transition: background .15s; width: 100%;
    }
    .inq-success-close:hover { background: rgba(255,255,255,.13); color: #fff; }

    @media (max-width: 480px) {
      .inq-modal { padding: 28px 20px 24px; border-radius: 16px; }
      .inq-row { grid-template-columns: 1fr; }
    }

    /* ── Booking Steps ── */
    .bk-step { display: none; }
    .bk-step.active { display: block; }

    .bk-back {
      background: none; border: none; color: rgba(255,255,255,.4);
      font-size: 13px; font-weight: 700; cursor: pointer; padding: 0;
      font-family: 'Pretendard', sans-serif; margin-bottom: 16px;
      display: flex; align-items: center; gap: 4px; transition: color .15s;
    }
    .bk-back:hover { color: rgba(255,255,255,.75); }

    .bk-title { font-size: 18px; font-weight: 900; color: #fff; margin-bottom: 4px; }
    .bk-sub   { font-size: 13px; color: rgba(255,255,255,.4); margin-bottom: 20px; line-height: 1.5; }

    /* Calendar */
    .bk-cal-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 12px;
    }
    .bk-cal-month { font-size: 15px; font-weight: 800; }
    .bk-cal-nav {
      background: rgba(255,255,255,.08); border: none; color: rgba(255,255,255,.7);
      width: 28px; height: 28px; border-radius: 50%; cursor: pointer;
      font-size: 14px; display: flex; align-items: center; justify-content: center;
      transition: background .15s;
    }
    .bk-cal-nav:hover { background: rgba(255,255,255,.14); }

    .bk-cal-grid {
      display: grid; grid-template-columns: repeat(7, 1fr);
      gap: 4px; margin-bottom: 4px;
    }
    .bk-cal-dow {
      text-align: center; font-size: 10px; font-weight: 700;
      color: rgba(255,255,255,.3); letter-spacing: .04em;
      padding: 4px 0;
    }
    .bk-cal-day {
      text-align: center; font-size: 13px; font-weight: 600;
      padding: 8px 4px; border-radius: 8px; cursor: pointer;
      color: rgba(255,255,255,.75); transition: background .12s, color .12s;
      border: 1.5px solid transparent;
    }
    .bk-cal-day:hover:not(.disabled):not(.empty) { background: rgba(255,255,255,.08); }
    .bk-cal-day.today { color: #00B87A; font-weight: 900; }
    .bk-cal-day.selected { background: #00B87A; color: #fff; border-color: #00B87A; }
    .bk-cal-day.disabled { color: rgba(255,255,255,.18); cursor: default; }
    .bk-cal-day.empty { cursor: default; }

    /* Slots */
    .bk-slots-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
      margin-bottom: 20px;
    }
    .bk-slot {
      background: rgba(255,255,255,.06); border: 1.5px solid rgba(255,255,255,.1);
      border-radius: 10px; padding: 11px 8px; text-align: center;
      font-size: 14px; font-weight: 700; color: rgba(255,255,255,.8);
      cursor: pointer; transition: background .12s, border-color .12s, color .12s;
    }
    .bk-slot:hover  { background: rgba(0,184,122,.1); border-color: rgba(0,184,122,.4); color: #4DFFA8; }
    .bk-slot.active { background: #00B87A; border-color: #00B87A; color: #fff; }
    .bk-no-slots    { color: rgba(255,255,255,.4); font-size: 13px; text-align: center; padding: 24px 0; }
    .bk-loading     { color: rgba(255,255,255,.4); font-size: 13px; text-align: center; padding: 24px 0; }

    /* Confirm */
    .bk-confirm-box {
      background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08);
      border-radius: 12px; padding: 16px 18px; margin-bottom: 20px;
    }
    .bk-confirm-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
    .bk-confirm-row .lbl { color: rgba(255,255,255,.4); }
    .bk-confirm-row .val { color: #fff; font-weight: 700; }

    /* Book done */
    .bk-done { text-align: center; padding: 16px 0 8px; }
    .bk-done-icon {
      width: 64px; height: 64px; border-radius: 50%;
      background: rgba(0,184,122,.12); border: 2px solid rgba(0,184,122,.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; margin: 0 auto 16px;
    }
    .bk-done h4 { font-size: 20px; font-weight: 900; color: #fff; margin-bottom: 8px; }
    .bk-done p  { font-size: 13px; color: rgba(255,255,255,.5); line-height: 1.7; }
    .bk-done .meet-btn {
      display: inline-flex; align-items: center; gap: 6px;
      margin-top: 16px; background: rgba(0,184,122,.12);
      border: 1px solid rgba(0,184,122,.3); color: #4DFFA8;
      border-radius: 10px; padding: 10px 20px; font-size: 13px; font-weight: 700;
      text-decoration: none; transition: background .15s;
    }
    .bk-done .meet-btn:hover { background: rgba(0,184,122,.2); }

    .bk-skip-btn {
      background: none; border: none; color: rgba(255,255,255,.3);
      font-size: 12px; cursor: pointer; font-family: 'Pretendard', sans-serif;
      text-decoration: underline; width: 100%; text-align: center;
      margin-top: 12px; transition: color .15s;
    }
    .bk-skip-btn:hover { color: rgba(255,255,255,.55); }

    .bk-next-btn {
      width: 100%; background: #00B87A; color: #fff; border: none;
      border-radius: 12px; padding: 14px; font-size: 15px; font-weight: 800;
      cursor: pointer; font-family: 'Pretendard', sans-serif;
      transition: background .15s; margin-top: 4px;
    }
    .bk-next-btn:hover    { background: #00A06A; }
    .bk-next-btn:disabled { background: rgba(255,255,255,.1); color: rgba(255,255,255,.3); cursor: not-allowed; }
  `;
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── HTML ─────────────────────────────────────────── */
  var html = `
    <div class="inq-overlay" id="inqOverlay" onclick="inqOverlayClick(event)">
      <div class="inq-modal" role="dialog" aria-modal="true" aria-labelledby="inqTitle">
        <button class="inq-close" onclick="closeInquiry()" aria-label="닫기">✕</button>

        <div id="inqFormSection">
          <div class="inq-badge">도입 문의</div>
          <h3 id="inqTitle">무료 상담 신청</h3>
          <p class="inq-sub">담당자가 영업일 기준 1일 내 연락드립니다.<br>현장 규모와 상황에 맞춘 맞춤 제안을 드립니다.</p>

          <form class="inq-form" id="inqForm" novalidate>
            <div class="inq-field" id="f-type">
              <label>건설사 유형 <span class="req">*</span></label>
              <select name="companyType" id="inqCompanyType">
                <option value="">선택해주세요</option>
                <option value="원청사">원청사</option>
                <option value="종합건설사 (원도급)">종합건설사 (원도급)</option>
                <option value="전문건설사 (하도급)">전문건설사 (하도급)</option>
                <option value="재하도급">재하도급</option>
                <option value="기타">기타</option>
              </select>
              <span class="err-msg">건설사 유형을 선택해주세요.</span>
            </div>

            <div class="inq-row">
              <div class="inq-field" id="f-company">
                <label>건설사명 <span class="req">*</span></label>
                <input type="text" name="companyName" id="inqCompanyName" placeholder="(주)건설회사" />
                <span class="err-msg">건설사명을 입력해주세요.</span>
              </div>
              <div class="inq-field" id="f-name">
                <label>담당자명 <span class="req">*</span></label>
                <input type="text" name="contactName" id="inqContactName" placeholder="홍길동" />
                <span class="err-msg">담당자명을 입력해주세요.</span>
              </div>
            </div>

            <div class="inq-row">
              <div class="inq-field" id="f-phone">
                <label>연락처 <span class="req">*</span></label>
                <input type="tel" name="contactPhone" id="inqContactPhone" placeholder="010-0000-0000" />
                <span class="err-msg">연락처를 입력해주세요.</span>
              </div>
              <div class="inq-field" id="f-email">
                <label>이메일</label>
                <input type="email" name="contactEmail" id="inqContactEmail" placeholder="name@company.com" />
              </div>
            </div>

            <div class="inq-field" id="f-req">
              <label>요구사항 / 현장 규모</label>
              <textarea name="requirements" id="inqRequirements" placeholder="예: 하도급 현장 3개소, 일용직 50명 규모. 직접지급 시스템 도입 검토 중"></textarea>
            </div>

            <button type="submit" class="inq-submit" id="inqSubmitBtn">
              <div class="inq-spinner" id="inqSpinner"></div>
              <span id="inqBtnText">무료 상담 신청하기 →</span>
            </button>
          </form>
        </div>

        <!-- Step 2: 날짜 선택 -->
        <div class="bk-step" id="bkStepDate">
          <button class="bk-back" onclick="bkShowForm()">← 문의 내용으로</button>
          <div class="inq-badge">미팅 예약</div>
          <div class="bk-title">미팅 날짜를 선택해주세요</div>
          <div class="bk-sub">담당자와 1:1 미팅을 예약합니다. (1시간)</div>
          <div class="bk-cal-header">
            <button class="bk-cal-nav" onclick="bkPrevMonth()">‹</button>
            <div class="bk-cal-month" id="bkCalMonth"></div>
            <button class="bk-cal-nav" onclick="bkNextMonth()">›</button>
          </div>
          <div class="bk-cal-grid" id="bkCalGrid"></div>
          <button class="bk-skip-btn" onclick="bkSkip()">지금은 예약하지 않을게요</button>
        </div>

        <!-- Step 3: 시간 슬롯 선택 -->
        <div class="bk-step" id="bkStepSlot">
          <button class="bk-back" onclick="bkShowDate()">← 날짜 선택으로</button>
          <div class="inq-badge">미팅 예약</div>
          <div class="bk-title" id="bkSlotTitle">시간을 선택해주세요</div>
          <div class="bk-sub">가능한 시간대를 선택해 주세요.</div>
          <div id="bkSlotsWrap"></div>
          <button class="bk-next-btn" id="bkSlotNext" onclick="bkShowConfirm()" disabled>다음</button>
        </div>

        <!-- Step 4: 예약 확인 -->
        <div class="bk-step" id="bkStepConfirm">
          <button class="bk-back" onclick="bkShowSlot()">← 시간 선택으로</button>
          <div class="inq-badge">예약 확인</div>
          <div class="bk-title">미팅을 확정할까요?</div>
          <div class="bk-sub">아래 내용으로 미팅이 예약됩니다.</div>
          <div class="bk-confirm-box">
            <div class="bk-confirm-row"><span class="lbl">날짜</span><span class="val" id="cfDate"></span></div>
            <div class="bk-confirm-row"><span class="lbl">시간</span><span class="val" id="cfTime"></span></div>
            <div class="bk-confirm-row"><span class="lbl">참석자</span><span class="val" id="cfName"></span></div>
            <div class="bk-confirm-row"><span class="lbl">건설사</span><span class="val" id="cfCompany"></span></div>
          </div>
          <button class="bk-next-btn" id="bkConfirmBtn" onclick="bkConfirm()">미팅 예약 확정</button>
        </div>

        <!-- Step 5: 예약 완료 -->
        <div class="bk-step" id="bkStepDone">
          <div class="bk-done">
            <div class="bk-done-icon">📅</div>
            <h4>미팅이 예약되었습니다!</h4>
            <p id="bkDoneText">캘린더 초대장을 이메일로 발송했습니다.<br>예약 시간에 뵙겠습니다.</p>
            <div id="bkMeetLinkWrap" style="display:none;">
              <a class="meet-btn" id="bkMeetLink" href="#" target="_blank">🎥 Google Meet 참여하기</a>
            </div>
            <button class="inq-success-close" onclick="closeInquiry()" style="margin-top:20px;">닫기</button>
          </div>
        </div>

        <!-- 문의만 완료 (예약 스킵) -->
        <div class="inq-success" id="inqSuccess">
          <div class="inq-success-icon">✓</div>
          <h4>신청이 완료되었습니다!</h4>
          <p>담당자가 영업일 기준 1일 내 연락드리겠습니다.<br>감사합니다.</p>
          <button class="inq-success-close" onclick="closeInquiry()">닫기</button>
        </div>
      </div>
    </div>
  `;

  var container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);

  /* ── Logic ─────────────────────────────────────────── */
  window.openInquiry = function (source) {
    var overlay = document.getElementById('inqOverlay');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    // Reset to form state
    document.getElementById('inqFormSection').style.display = '';
    document.getElementById('inqSuccess').style.display = '';
    document.getElementById('inqSuccess').style.display = 'none';
    document.getElementById('inqForm').reset();
    clearErrors();
    if (source) {
      // optionally pre-fill or adjust title based on source page
    }
  };

  window.closeInquiry = function () {
    var overlay = document.getElementById('inqOverlay');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  window.inqOverlayClick = function (e) {
    if (e.target.id === 'inqOverlay') closeInquiry();
  };

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeInquiry();
  });

  // URL 해시 #inquiry 또는 ?inquiry 로 접근 시 자동 오픈
  window.addEventListener('load', function () {
    if (location.hash === '#inquiry' || location.search.indexOf('inquiry') !== -1) {
      setTimeout(function () { openInquiry(location.pathname); }, 300);
    }
  });

  function clearErrors() {
    ['f-type', 'f-company', 'f-name', 'f-phone'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.remove('has-err');
    });
  }

  function validate() {
    var ok = true;
    function check(fieldId, inputId) {
      var val = document.getElementById(inputId).value.trim();
      if (!val) {
        document.getElementById(fieldId).classList.add('has-err');
        ok = false;
      } else {
        document.getElementById(fieldId).classList.remove('has-err');
      }
    }
    check('f-type', 'inqCompanyType');
    check('f-company', 'inqCompanyName');
    check('f-name', 'inqContactName');
    check('f-phone', 'inqContactPhone');
    return ok;
  }

  document.getElementById('inqForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    var btn = document.getElementById('inqSubmitBtn');
    var spinner = document.getElementById('inqSpinner');
    var btnText = document.getElementById('inqBtnText');

    btn.disabled = true;
    spinner.style.display = 'block';
    btnText.textContent = '전송 중...';

    var payload = {
      company_type:  document.getElementById('inqCompanyType').value,
      company_name:  document.getElementById('inqCompanyName').value.trim(),
      contact_name:  document.getElementById('inqContactName').value.trim(),
      contact_phone: document.getElementById('inqContactPhone').value.trim(),
      contact_email: document.getElementById('inqContactEmail').value.trim(),
      requirements:  document.getElementById('inqRequirements').value.trim(),
      source:        window.location.pathname || 'direct'
    };

    if (SUPABASE_ANON === 'YOUR_SUPABASE_ANON_KEY_HERE') {
      console.warn('[GADA] Supabase anon key가 설정되지 않았습니다. inquiry.js의 SUPABASE_ANON을 업데이트하세요.');
      setTimeout(showSuccess, 800);
      return;
    }

    fetch(SUPABASE_URL + '/rest/v1/rpc/submit_lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON,
        'Authorization': 'Bearer ' + SUPABASE_ANON
      },
      body: JSON.stringify({
        p_company_type:  payload.company_type,
        p_company_name:  payload.company_name,
        p_contact_name:  payload.contact_name,
        p_contact_phone: payload.contact_phone,
        p_contact_email: payload.contact_email,
        p_requirements:  payload.requirements,
        p_source:        payload.source
      })
    }).then(function (res) {
      if (res.ok) {
        showSuccess();
      } else {
        return res.text().then(function (txt) {
          console.error('[GADA] Supabase 오류:', res.status, txt);
          showSuccess(); // UX 유지
        });
      }
    }).catch(function (err) {
      console.error('[GADA] 네트워크 오류:', err);
      showSuccess(); // UX 유지
    });
  });

  function showSuccess() {
    document.getElementById('inqFormSection').style.display = 'none';
    // BOOKING_URL 설정 시 예약 플로우, 미설정 시 기존 완료 화면
    if (BOOKING_URL) {
      bkShowDate();
    } else {
      var s = document.getElementById('inqSuccess');
      s.style.display = 'flex';
    }
  }

  /* ── Booking State ────────────────────────────────────── */
  var bk = {
    year: 0, month: 0,  // 현재 보이는 달
    selDate: '',        // 선택된 날짜 'YYYY-MM-DD'
    selTime: '',        // 선택된 시간 'HH:00'
    leadName: '', leadEmail: '', leadCompany: '', leadPhone: ''
  };

  var KR_MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  var KR_DAYS   = ['일','월','화','수','목','금','토'];

  function bkAllSteps() {
    return ['bkStepDate','bkStepSlot','bkStepConfirm','bkStepDone','inqSuccess'];
  }
  function bkShow(id) {
    bkAllSteps().forEach(function (s) {
      var el = document.getElementById(s);
      if (el) el.style.display = 'none';
      if (el) el.classList.remove('active');
    });
    document.getElementById('inqFormSection').style.display = 'none';
    var target = document.getElementById(id);
    if (target) {
      target.style.display = 'block';
      target.classList.add('active');
    }
  }

  function bkShowForm() {
    bkAllSteps().forEach(function (s) {
      var el = document.getElementById(s);
      if (el) { el.style.display = 'none'; el.classList.remove('active'); }
    });
    document.getElementById('inqFormSection').style.display = '';
  }

  function bkShowDate() {
    // 리드 정보 저장
    bk.leadName    = document.getElementById('inqContactName')  ? document.getElementById('inqContactName').value.trim()  : '';
    bk.leadEmail   = document.getElementById('inqContactEmail') ? document.getElementById('inqContactEmail').value.trim() : '';
    bk.leadCompany = document.getElementById('inqCompanyName')  ? document.getElementById('inqCompanyName').value.trim()  : '';
    bk.leadPhone   = document.getElementById('inqContactPhone') ? document.getElementById('inqContactPhone').value.trim() : '';

    var now = new Date();
    bk.year  = now.getFullYear();
    bk.month = now.getMonth();
    bkRenderCal();
    bkShow('bkStepDate');
  }

  function bkPrevMonth() {
    bk.month--;
    if (bk.month < 0) { bk.month = 11; bk.year--; }
    bkRenderCal();
  }
  function bkNextMonth() {
    bk.month++;
    if (bk.month > 11) { bk.month = 0; bk.year++; }
    bkRenderCal();
  }

  function bkRenderCal() {
    document.getElementById('bkCalMonth').textContent = bk.year + '년 ' + KR_MONTHS[bk.month];
    var grid = document.getElementById('bkCalGrid');
    grid.innerHTML = '';

    // 요일 헤더
    KR_DAYS.forEach(function (d) {
      var cell = document.createElement('div');
      cell.className = 'bk-cal-dow';
      cell.textContent = d;
      grid.appendChild(cell);
    });

    var today    = new Date(); today.setHours(0,0,0,0);
    var firstDay = new Date(bk.year, bk.month, 1).getDay();
    var daysInMonth = new Date(bk.year, bk.month + 1, 0).getDate();
    var maxDate  = new Date(today); maxDate.setDate(maxDate.getDate() + 30);

    // 빈칸
    for (var i = 0; i < firstDay; i++) {
      var emp = document.createElement('div');
      emp.className = 'bk-cal-day empty';
      grid.appendChild(emp);
    }

    for (var d2 = 1; d2 <= daysInMonth; d2++) {
      var cell2  = document.createElement('div');
      var thisDate = new Date(bk.year, bk.month, d2);
      var dateStr  = bk.year + '-' + pad2bk(bk.month + 1) + '-' + pad2bk(d2);
      var dow      = thisDate.getDay();
      var isPast   = thisDate < today;
      var isFuture = thisDate > maxDate;
      var isWeekend = (dow === 0 || dow === 6);

      cell2.className = 'bk-cal-day';
      cell2.textContent = d2;

      if (isPast || isFuture || isWeekend) {
        cell2.classList.add('disabled');
      } else {
        if (thisDate.toDateString() === today.toDateString()) cell2.classList.add('today');
        if (dateStr === bk.selDate) cell2.classList.add('selected');
        cell2.onclick = (function (ds) { return function () { bkSelectDate(ds); }; })(dateStr);
      }
      grid.appendChild(cell2);
    }
  }

  function bkSelectDate(dateStr) {
    bk.selDate = dateStr;
    bk.selTime = '';
    bkRenderCal();
    bkShowSlot();
  }

  function bkShowDate2() { bkRenderCal(); bkShow('bkStepDate'); }

  function bkShowSlot() {
    var parts = bk.selDate.split('-');
    document.getElementById('bkSlotTitle').textContent =
      parts[0] + '년 ' + parseInt(parts[1]) + '월 ' + parseInt(parts[2]) + '일 가능 시간';
    document.getElementById('bkSlotsWrap').innerHTML = '<div class="bk-loading">시간 확인 중...</div>';
    document.getElementById('bkSlotNext').disabled = true;
    bkShow('bkStepSlot');

    fetch(BOOKING_URL + '?action=slots&date=' + bk.selDate, { redirect: 'follow' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var wrap = document.getElementById('bkSlotsWrap');
        if (!res.slots || res.slots.length === 0) {
          wrap.innerHTML = '<div class="bk-no-slots">해당 날짜에 가능한 시간이 없습니다.<br>다른 날짜를 선택해주세요.</div>';
          return;
        }
        wrap.innerHTML = '<div class="bk-slots-grid">' +
          res.slots.map(function (s) {
            return '<div class="bk-slot' + (s === bk.selTime ? ' active' : '') + '" onclick="bkSelectSlot(\'' + s + '\')">' + s + '</div>';
          }).join('') + '</div>';
      })
      .catch(function () {
        document.getElementById('bkSlotsWrap').innerHTML = '<div class="bk-no-slots">슬롯을 불러올 수 없습니다.</div>';
      });
  }

  function bkSelectSlot(time) {
    bk.selTime = time;
    document.querySelectorAll('.bk-slot').forEach(function (el) {
      el.classList.toggle('active', el.textContent === time);
    });
    document.getElementById('bkSlotNext').disabled = false;
  }

  function bkShowConfirm() {
    if (!bk.selTime) return;
    var parts = bk.selDate.split('-');
    document.getElementById('cfDate').textContent = parts[0] + '년 ' + parseInt(parts[1]) + '월 ' + parseInt(parts[2]) + '일';
    document.getElementById('cfTime').textContent = bk.selTime + ' (1시간)';
    document.getElementById('cfName').textContent = bk.leadName || '-';
    document.getElementById('cfCompany').textContent = bk.leadCompany || '-';
    bkShow('bkStepConfirm');
  }

  function bkConfirm() {
    var btn = document.getElementById('bkConfirmBtn');
    btn.disabled = true;
    btn.textContent = '예약 중...';

    fetch(BOOKING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({
        action:   'book',
        date:     bk.selDate,
        time:     bk.selTime,
        name:     bk.leadName,
        email:    bk.leadEmail,
        company:  bk.leadCompany,
        phone:    bk.leadPhone
      })
    })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (res.error === 'slot_unavailable') {
        alert('선택한 시간이 이미 예약되었습니다. 다른 시간을 선택해주세요.');
        btn.disabled = false;
        btn.textContent = '미팅 예약 확정';
        bkShowSlot();
        return;
      }
      // 완료 화면
      bkShow('bkStepDone');
      var parts = bk.selDate.split('-');
      document.getElementById('bkDoneText').innerHTML =
        parts[0] + '년 ' + parseInt(parts[1]) + '월 ' + parseInt(parts[2]) + '일 ' + bk.selTime + ' 미팅이 확정되었습니다.'
        + (bk.leadEmail ? '<br>캘린더 초대장을 이메일로 발송했습니다.' : '');
      if (res.meetLink) {
        document.getElementById('bkMeetLinkWrap').style.display = 'block';
        document.getElementById('bkMeetLink').href = res.meetLink;
      }
    })
    .catch(function () {
      alert('예약 중 오류가 발생했습니다. 다시 시도해주세요.');
      btn.disabled = false;
      btn.textContent = '미팅 예약 확정';
    });
  }

  function bkSkip() {
    bkShow('inqSuccess');
  }

  function pad2bk(n) { return n < 10 ? '0' + n : '' + n; }

  // onclick 속성에서 호출되는 함수들을 전역으로 노출
  window.bkPrevMonth   = bkPrevMonth;
  window.bkNextMonth   = bkNextMonth;
  window.bkShowForm    = bkShowForm;
  window.bkShowDate    = bkShowDate;
  window.bkShowSlot    = bkShowSlot;
  window.bkShowConfirm = bkShowConfirm;
  window.bkSelectSlot  = bkSelectSlot;
  window.bkConfirm     = bkConfirm;
  window.bkSkip        = bkSkip;
})();
