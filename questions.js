const examData = {
  cim: {
    title: "투자자산운용사",
    questions: [
      {
        question: "자본시장법상 전문투자자에 해당하지 않는 것은?",
        options: ["국가", "한국은행", "지방자치단체", "모든 일반법인"],
        answer: 3,
        explanation: "일반법인은 별도의 요건을 갖추어 신청해야 전문투자자가 될 수 있습니다."
      },
      // ... 100문제를 위해 이 구조로 추가 가능
    ]
  },
  fia: {
    title: "금융투자분석사",
    questions: [
      {
        question: "기업가치 평가모델 중 절대가치 평가법에 해당하는 것은?",
        options: ["PER 비교법", "DCF(현금흐름할인법)", "EV/EBITDA법", "PBR 비교법"],
        answer: 1,
        explanation: "DCF는 미래 현금흐름을 할인하여 기업의 내재가치를 직접 구하는 절대가치 평가법입니다."
      }
    ]
  },
  crea: {
    title: "공인중개사",
    questions: [
      {
        question: "민법상 주택임대차보호법의 적용 대상이 아닌 것은?",
        options: ["주거용 건물의 전부 임대", "주거용 건물의 일부 임대", "미등기 전세", "법인이 임차한 모든 경우"],
        answer: 3,
        explanation: "법인은 원칙적으로 적용 대상이 아니나, LH 등 일부 공공기관은 예외적으로 적용됩니다."
      }
    ]
  }
};

// 100문제를 채우기 위한 헬퍼 (데이터 부족 시 샘플 반복)
function ensure100Questions(data) {
  for (let key in data) {
    const originalCount = data[key].questions.length;
    if (originalCount > 0 && originalCount < 100) {
      for (let i = originalCount; i < 100; i++) {
        const template = data[key].questions[i % originalCount];
        data[key].questions.push({
          ...template,
          question: `[연습문제 ${i+1}] ` + template.question
        });
      }
    }
  }
}

ensure100Questions(examData);
window.examData = examData;
