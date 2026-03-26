(function(){
  if(!window.examData) window.examData = {};
  fetch('/data/crea1_exam.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: \${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      window.examData.crea1 = data;
      console.log("CREA1 exam data loaded successfully.");
      const event = new CustomEvent('dataLoaded', { detail: { examKey: 'crea1', success: true } });
      window.dispatchEvent(event);
    })
    .catch(error => {
      console.error("Error loading CREA1 exam data:", error);
      const event = new CustomEvent('dataLoaded', { detail: { examKey: 'crea1', success: false, error: error } });
      window.dispatchEvent(event);
    });
  // Data loaded from crea1_exam.json
})();
