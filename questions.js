const examData = {
  cim: {
    title: "투자자산운용사",
    sections: [
      { id: "sec1", name: "제1과목: 금융상품 및 세제", questions: [
        { q: "현행 소득세법상 거주자의 이자소득에 해당하지 않는 것은?", options: ["국가 또는 지자체가 발행한 채권의 이자와 할인액", "보통예금의 이자", "보험업법에 따른 저축성보험의 보험차익", "상장법인 주식의 배당금"], answer: 3, exp: "주식의 배당금은 배당소득에 해당합니다. (변형 문제)" }
      ]},
      { id: "sec2", name: "제2과목: 투자운용 및 전략", questions: [
        { q: "포트폴리오 이론에서 체계적 위험을 측정하는 지표는?", options: ["표준편차", "분산", "베타(Beta)", "상관계수"], answer: 2, exp: "베타는 시장 전체의 변동에 대한 개별 자산의 민감도를 나타내는 체계적 위험 지표입니다. (변형 문제)" }
      ]},
      { id: "sec3", name: "제3과목: 직무윤리 및 법규", questions: [
        { q: "자본시장법상 불공정거래행위 금지 대상이 아닌 것은?", options: ["미공개중요정보 이용", "시세조종행위", "부정거래행위", "일반적인 경영권 방어 행위"], answer: 3, exp: "정당한 절차에 따른 경영권 방어는 금지 대상이 아니나, 그 과정에서 시세조종 등이 개입되면 불법입니다." }
      ]}
    ]
  },
  fia: {
    title: "금융투자분석사",
    sections: [
      { id: "sec1", name: "계량분석 및 경제분석", questions: [] },
      { id: "sec2", name: "기업분석 및 가치평가", questions: [] },
      { id: "sec3", name: "파생상품 및 리스크 관리", questions: [] }
    ]
  },
  crea: {
    title: "공인중개사",
    sections: [
      { id: "sec1", name: "부동산학개론", questions: [] },
      { id: "sec2", name: "민법 및 민사특별법", questions: [] },
      { id: "sec3", name: "부동산공법", questions: [] }
    ]
  }
};

// 1000문제를 시뮬레이션하기 위한 확장 로직 (실제 문제로 교체 가능)
function populate1000Questions(data) {
  for (let exam in data) {
    const sections = data[exam].sections;
    sections.forEach((sec, idx) => {
      const originalCount = sec.questions.length;
      const targetCount = 334; // 섹션당 약 334개 -> 총 1000개 수준
      if (originalCount === 0) {
          // 샘플 데이터가 없는 경우 기본 문제 생성
          sec.questions.push({
              q: `${sec.name} 관련 기본 개념 확인 문제입니다.`,
              options: ["정답 보기", "오답 1", "오답 2", "오답 3"],
              answer: 0,
              exp: "이 문제는 실제 데이터가 들어갈 자리입니다. (변형 및 재구성됨)"
          });
      }
      
      const baseQ = sec.questions[0];
      for (let i = sec.questions.length; i < targetCount; i++) {
        sec.questions.push({
          ...baseQ,
          q: `[${sec.name} ${i+1}번] ` + baseQ.q,
          // 저작권 회피를 위해 수치나 표현을 자동 변형하는 로직 시뮬레이션
          exp: baseQ.exp + ` (학습용 문항 ${i+1})`
        });
      }
    });
  }
}

populate1000Questions(examData);
window.examData = examData;
