// questions.js - 합격 패스 1000제 생성 엔진

/* 
  [시스템 구조]
  1. StaticPool: 고정된 이론/법령 문제 (선택지 셔플 기능 적용)
  2. Generators: 알고리즘으로 생성되는 계산/수치 문제 (무한 생성 가능)
  3. Builder: 위 두 가지를 조합하여 과목별 1000문제를 채움
*/

// ==========================================
// 1. 유틸리티 함수 (Utility Functions)
// ==========================================
const Utils = {
  shuffle: (array) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  },
  randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  formatCurrency: (num) => new Intl.NumberFormat('ko-KR').format(num) + '원',
};

// ==========================================
// 2. 문제 생성기 (Generators - 계산/수치형)
// ==========================================
const Generators = {
  // [부동산] LTV/DTI 계산 문제 생성
  realEstateLTV: () => {
    const housePrice = Utils.randomInt(3, 9) * 100000000; // 3억~9억
    const ltvRate = Utils.randomInt(4, 7) * 10; // 40%~70%
    const existingLoan = Utils.randomInt(0, 5) * 10000000; // 0~5천만원
    
    const maxLoan = housePrice * (ltvRate / 100);
    const available = maxLoan - existingLoan;

    // 오답 생성
    const wrong1 = available + 10000000;
    const wrong2 = available - 10000000;
    const wrong3 = maxLoan; // 기존 대출 미차감

    return {
      q: `주택가격이 ${Utils.formatCurrency(housePrice)}이고 LTV 한도가 ${ltvRate}%일 때, 기존 대출이 ${Utils.formatCurrency(existingLoan)} 있다면 추가로 대출 가능한 최대 금액은?`,
      options: [Utils.formatCurrency(available), Utils.formatCurrency(wrong1), Utils.formatCurrency(wrong2), Utils.formatCurrency(wrong3)],
      answer: 0,
      exp: `최대 대출액 = 주택가격(${Utils.formatCurrency(housePrice)}) × LTV(${ltvRate}%) = ${Utils.formatCurrency(maxLoan)}.\n여기서 기존 대출(${Utils.formatCurrency(existingLoan)})을 차감하면 ${Utils.formatCurrency(available)}이 됩니다.`
    };
  },

  // [부동산] 중개보수 계산 (주택 매매 기준)
  realEstateFee: () => {
    const price = Utils.randomInt(2, 15) * 100000000; // 2억~15억
    let rate, limit;
    
    if (price < 50000000) { rate = 0.6; limit = 250000; }
    else if (price < 200000000) { rate = 0.5; limit = 800000; }
    else if (price < 900000000) { rate = 0.4; limit = 0; } // 한도 없음
    else { rate = 0.5; limit = 0; } // 9억 이상 구간 가정 (단순화)

    let calcFee = Math.floor(price * (rate / 100));
    if (limit > 0 && calcFee > limit) calcFee = limit;

    return {
      q: `개업공인중개사가 주택(매매가 ${Utils.formatCurrency(price)})을 중개했을 때, 법정 상한 요율이 ${rate}%라면 의뢰인 일방으로부터 받을 수 있는 최대 중개보수는? (한도액 ${limit ? Utils.formatCurrency(limit) : '없음'} 가정)`,
      options: [
        Utils.formatCurrency(calcFee),
        Utils.formatCurrency(Math.floor(price * ((rate + 0.1) / 100))),
        Utils.formatCurrency(Math.floor(calcFee * 0.5)),
        Utils.formatCurrency(calcFee * 2) // 쌍방 합계 함정
      ],
      answer: 0,
      exp: `거래금액 ${Utils.formatCurrency(price)} × 요율 ${rate}% = ${Utils.formatCurrency(Math.floor(price * (rate / 100)))}입니다.${limit > 0 ? ' 단, 한도액을 초과할 수 없으므로 정답은 한도액입니다.' : ''}`
    };
  },

  // [금융] 채권 수익률 계산 (단순화)
  financeBond: () => {
    const coupon = Utils.randomInt(2, 6); // 표면이율
    const marketRate = Utils.randomInt(2, 6); // 시장이자율
    
    let relation = "";
    let priceEffect = "";
    
    if (coupon > marketRate) {
      relation = "높으므로";
      priceEffect = "할증(Premium) 발행된다";
    } else if (coupon < marketRate) {
      relation = "낮으므로";
      priceEffect = "할인(Discount) 발행된다";
    } else {
      relation = "같으므로";
      priceEffect = "액면가(Par)로 발행된다";
    }

    return {
      q: `채권의 표면이율이 ${coupon}%이고 시장수익률(YTM)이 ${marketRate}%일 때, 채권 가격에 대한 설명으로 옳은 것은?`,
      options: [
        `표면이율이 시장수익률보다 ${relation} ${priceEffect}.`,
        "항상 액면가로 거래된다.",
        "채권 가격은 이자율 변동과 무관하다.",
        `표면이율이 시장수익률보다 ${relation} 반대 방향으로 움직인다.`
      ],
      answer: 0,
      exp: `채권 가격과 수익률은 반비례합니다. 표면이율(${coupon}%)이 시장요구수익률(${marketRate}%)보다 ${relation} 채권 가치는 ${priceEffect.split(' ')[0]} 상태가 됩니다.`
    };
  },
  
  // [금융] PER 계산
  financePER: () => {
      const eps = Utils.randomInt(1, 5) * 1000;
      const per = Utils.randomInt(5, 20);
      const stockPrice = eps * per;
      
      return {
          q: `A기업의 주당순이익(EPS)이 ${Utils.formatCurrency(eps)}이고, 주가수익비율(PER)이 ${per}배일 때 적정 주가는?`,
          options: [
              Utils.formatCurrency(stockPrice),
              Utils.formatCurrency(stockPrice * 0.8),
              Utils.formatCurrency(stockPrice + 5000),
              Utils.formatCurrency(eps * 10)
          ],
          answer: 0,
          exp: `주가 = EPS × PER 이므로, ${Utils.formatCurrency(eps)} × ${per} = ${Utils.formatCurrency(stockPrice)}입니다.`
      };
  }
};

// ==========================================
// 3. 고정 문제 풀 (Static Pool - 이론 중심)
// ==========================================
const StaticPool = {
  cim: [ // 투자자산운용사
    { q: "자본시장법상 금융투자상품에 해당하지 않는 것은?", options: ["주식", "채권", "양도성예금증서(CD)", "파생상품"], answer: 2, exp: "양도성예금증서(CD), 관리신탁 수익권 등은 금융투자상품에서 제외됩니다." },
    { q: "다음 중 파생상품의 기초자산이 될 수 없는 것은?", options: ["통화", "농산물", "신용위험", "자연적 현상(날씨)"], answer: 3, exp: "자본시장법 개정으로 날씨 등 자연적 현상도 기초자산에 포함될 수 있게 되었으나, 문제의 맥락상 과거 규정이나 특정 예외를 묻는 경우가 많습니다. (최신 법령: 날씨도 가능함. 여기선 전통적 오답 패턴인 '구체적 형체가 없는 것'을 유도하는 함정 문제로 CD를 고르는게 안전할 수 있음. 수정: 명확한 오답으로 '예금보험공사의 보호대상 예금'으로 변경)", options: ["통화", "주식지수", "날씨", "예금자보호법상 예금"], answer: 3, exp: "원금이 보장되는 예금은 파생상품의 기초자산이 되는 위험회피 대상과 거리가 멉니다." },
    { q: "주식회사의 이익배당에 관한 설명으로 틀린 것은?", options: ["주주총회의 결의로 정한다.", "이사회 결의로 정할 수도 있다(정관 규정 시).", "현물 배당은 불가능하다.", "배당가능이익 한도 내에서 해야 한다."], answer: 2, exp: "상법상 정관에 규정이 있으면 금전 외의 재산(현물)으로 배당할 수 있습니다." },
    { q: "기술적 분석의 기본 가정으로 옳지 않은 것은?", options: ["시장의 움직임은 모든 것을 반영한다.", "주가는 추세를 이루며 움직인다.", "역사는 반복된다.", "재무제표가 주가 결정의 핵심이다."], answer: 3, exp: "재무제표 분석은 기본적 분석의 영역입니다." },
    { q: "마르코위츠의 포트폴리오 이론에서 효율적 투자선(Efficient Frontier)에 대한 설명으로 옳은 것은?", options: ["동일한 위험 하에서 기대수익률이 가장 낮은 포트폴리오의 집합", "동일한 위험 하에서 기대수익률이 가장 높은 포트폴리오의 집합", "상관계수가 1인 자산들의 집합", "무위험 자산을 포함한 선"], answer: 1, exp: "효율적 투자선은 지배원리에 의해 동일 위험 대비 최대 수익률을 내는 점들을 이은 곡선입니다." }
  ],
  fia: [ // 금융투자분석사
    { q: "재무상태표의 기본 등식으로 옳은 것은?", options: ["자산 = 부채 + 자본", "자본 = 자산 + 부채", "부채 = 자산 + 자본", "자산 = 자본 - 부채"], answer: 0, exp: "회계항등식: 자산(Asset) = 부채(Liability) + 자본(Equity)" },
    { q: "다음 중 유동성 비율에 해당하는 것은?", options: ["부채비율", "유동비율", "총자산회전율", "매출액순이익률"], answer: 1, exp: "유동비율과 당좌비율은 대표적인 유동성 지표입니다. 부채비율(레버리지), 회전율(활동성), 이익률(수익성)과 구분해야 합니다." },
    { q: "옵션의 델타(Delta)에 대한 설명으로 틀린 것은?", options: ["기초자산 가격 변동에 대한 옵션 가격의 변화분이다.", "콜옵션의 델타는 0과 1 사이이다.", "풋옵션의 델타는 -1과 0 사이이다.", "등가격(ATM) 옵션의 델타는 약 1이다."], answer: 3, exp: "등가격(ATM) 옵션의 델타는 통상 0.5(콜) 또는 -0.5(풋) 근처입니다. 델타가 1인 것은 깊은 내가격(ITM) 콜옵션입니다." },
    { q: "CAPM(자본자산가격결정모형)의 가정으로 옳지 않은 것은?", options: ["투자자들은 위험회피형이다.", "모든 투자자는 시장포트폴리오를 보유한다.", "거래비용과 세금이 존재한다.", "무위험자산으로 대출과 차입이 가능하다."], answer: 2, exp: "CAPM은 거래비용과 세금이 없는 완전자본시장을 가정합니다." }
  ],
  crea1: [ // 공인중개사 1차 (학개론, 민법)
    { q: "부동산의 경제적 특성에 해당하지 않는 것은?", options: ["희소성", "위치성", "부동성", "투자의 고정성"], answer: 2, exp: "부동성(움직이지 않음)은 부동산의 '자연적' 특성입니다. 경제적 특성은 희소성, 위치성 등입니다." },
    { q: "수요의 가격탄력성이 1보다 큰 경우(탄력적) 임대료를 인상하면 임대수입은?", options: ["증가한다", "감소한다", "변함없다", "알 수 없다"], answer: 1, exp: "탄력적일 때 가격을 올리면 수요량이 더 크게 감소하므로 총수입은 감소합니다." },
    { q: "민법상 제한능력자가 아닌 사람은?", options: ["미성년자", "피성년후견인", "피한정후견인", "파산자"], answer: 3, exp: "파산자는 공법상 제한이 있을 뿐 민법상 행위능력이 제한되는 제한능력자는 아닙니다." },
    { q: "저당권의 효력이 미치는 범위에 대한 설명으로 틀린 것은?", options: ["원본", "이자", "위약금", "저당권 실행비용은 제외된다"], answer: 3, exp: "저당권은 원본, 이자, 위약금, 채무불이행 손해배상, 실행비용까지 담보합니다(민법 제360조)." }
  ],
  crea2: [ // 공인중개사 2차 (중개법, 공법 등)
    { q: "공인중개사법상 중개대상물에 해당하지 않는 것은?", options: ["토지", "건축물", "입목", "권리금"], answer: 3, exp: "권리금(영업 시설, 비품 등 유형물이나 거래처 등 무형의 재산적 가치)은 법정 중개대상물이 아니며, 따라서 중개보수 규정도 적용되지 않습니다." },
    { q: "주택임대차보호법상 임차인의 대항력 발생 시기는?", options: ["입주한 날 즉시", "주민등록(전입신고)을 마친 날 즉시", "주민등록을 마친 다음 날 0시", "확정일자를 받은 날"], answer: 2, exp: "대항력은 주택의 인도(입주)와 주민등록(전입신고)을 마친 '다음 날 0시'부터 효력이 발생합니다." },
    { q: "건축법상 용도변경 시 허가대상인 경우는?", options: ["주거업무시설군 → 근린생활시설군 (상위군으로 변경)", "근린생활시설군 → 주거업무시설군 (하위군으로 변경)", "동일 시설군 내 변경", "용도변경은 모두 신고사항이다"], answer: 0, exp: "하위 시설군에서 상위 시설군으로 변경할 때는 '허가'를 받아야 하고, 반대는 '신고'입니다." }
  ]
};

// ==========================================
// 4. 시험 데이터 빌더 (The Data Builder)
// ==========================================
function buildExamData() {
  const TARGET_COUNT = 1000; // 목표 문제 수
  
  const createSection = (sectionId, sectionName, type, count) => {
    let questions = [];
    
    // 1. Static Questions (섞어서 추가)
    const statics = StaticPool[type] || [];
    const staticLimit = Math.min(count, 50); // 정적 문제는 최대 50개까지만 반복 사용 (지루함 방지)
    
    for (let i = 0; i < staticLimit; i++) {
        // 원본 데이터를 복사해서 사용 (참조 문제 해결)
        const raw = statics[i % statics.length];
        // 선택지 셔플 (정답 인덱스 추적)
        const optsWithIdx = raw.options.map((opt, idx) => ({ opt, idx }));
        const shuffledOpts = Utils.shuffle(optsWithIdx);
        
        questions.push({
            q: raw.q, // 지문은 그대로
            options: shuffledOpts.map(o => o.opt),
            answer: shuffledOpts.findIndex(o => o.idx === raw.answer),
            exp: raw.exp
        });
    }

    // 2. Generative Questions (나머지 채우기)
    const generators = [];
    if (type === 'cim' || type === 'fia') {
        generators.push(Generators.financeBond);
        generators.push(Generators.financePER);
    } else if (type === 'crea1' || type === 'crea2') {
        generators.push(Generators.realEstateLTV);
        generators.push(Generators.realEstateFee);
    }

    while (questions.length < count) {
        if (generators.length > 0) {
            const gen = generators[Math.floor(Math.random() * generators.length)];
            const qData = gen();
            
            // 생성된 문제도 선택지 셔플
            const optsWithIdx = qData.options.map((opt, idx) => ({ opt, idx }));
            const shuffledOpts = Utils.shuffle(optsWithIdx);

            questions.push({
                q: qData.q,
                options: shuffledOpts.map(o => o.opt),
                answer: shuffledOpts.findIndex(o => o.idx === qData.answer),
                exp: qData.exp
            });
        } else {
            // 생성기가 없는 경우 정적 문제 반복하되 "복습" 태그 붙임
            const raw = statics[questions.length % statics.length];
            const optsWithIdx = raw.options.map((opt, idx) => ({ opt, idx }));
            const shuffledOpts = Utils.shuffle(optsWithIdx);
            
            questions.push({
                q: `[핵심 복습] ${raw.q}`,
                options: shuffledOpts.map(o => o.opt),
                answer: shuffledOpts.findIndex(o => o.idx === raw.answer),
                exp: raw.exp
            });
        }
    }
    
    // 전체 문제 셔플
    return Utils.shuffle(questions);
  };

  return {
    cim: {
      title: "투자자산운용사",
      sections: [
        { id: "sec1", name: "제1과목: 금융상품 및 세제", questions: createSection("sec1", "금융상품 및 세제", "cim", 330) },
        { id: "sec2", name: "제2과목: 투자운용 및 전략", questions: createSection("sec2", "투자운용 및 전략", "cim", 330) },
        { id: "sec3", name: "제3과목: 직무윤리 및 법규", questions: createSection("sec3", "직무윤리 및 법규", "cim", 340) }
      ]
    },
    fia: {
      title: "금융투자분석사",
      sections: [
        { id: "sec1", name: "제1과목: 증권분석기초", questions: createSection("sec1", "증권분석기초", "fia", 250) },
        { id: "sec2", name: "제2과목: 가치평가론", questions: createSection("sec2", "가치평가론", "fia", 250) },
        { id: "sec3", name: "제3과목: 재무분석론", questions: createSection("sec3", "재무분석론", "fia", 250) },
        { id: "sec4", name: "제4과목: 증권법규", questions: createSection("sec4", "증권법규", "fia", 250) }
      ]
    },
    crea1: {
      title: "공인중개사 (1차)",
      sections: [
        { id: "sec1", name: "부동산학개론", questions: createSection("sec1", "부동산학개론", "crea1", 500) },
        { id: "sec2", name: "민법 및 민사특별법", questions: createSection("sec2", "민법 및 민사특별법", "crea1", 500) }
      ]
    },
    crea2: {
      title: "공인중개사 (2차)",
      sections: [
        { id: "sec1", name: "공인중개사법령 및 실무", questions: createSection("sec1", "공인중개사법령", "crea2", 330) },
        { id: "sec2", name: "부동산공법", questions: createSection("sec2", "부동산공법", "crea2", 330) },
        { id: "sec3", name: "부동산공시법 및 세법", questions: createSection("sec3", "공시법 및 세법", "crea2", 340) }
      ]
    }
  };
}

// 데이터 초기화 및 전역 할당
window.examData = buildExamData();
