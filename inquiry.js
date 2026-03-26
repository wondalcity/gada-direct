/**
 * GADA 도입문의 모달
 * Supabase 설정: Project Settings → API → anon public key
 */
var SUPABASE_URL  = 'https://evaddagjpjiekbhsmgxh.supabase.co';
var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2YWRkYWdqcGppZWtiaHNtZ3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0ODc0MzYsImV4cCI6MjA5MDA2MzQzNn0.kC9rIBMvvScgfZyrlNhM6M7GKynQjagbJUN-VX6wmsM';

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
    var s = document.getElementById('inqSuccess');
    s.style.display = 'flex';
    s.style.animation = 'none';
    s.offsetHeight; // reflow
    s.style.animation = '';
  }
})();
