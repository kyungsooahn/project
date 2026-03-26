(function(){
  if(!window.examData) window.examData = {};
  fetch('/data/crea2_exam.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: \${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      window.examData.crea2 = data;
      console.log("CREA2 exam data loaded successfully.");
      const event = new CustomEvent('dataLoaded', { detail: { examKey: 'crea2', success: true } });
      window.dispatchEvent(event);
    })
    .catch(error => {
      console.error("Error loading CREA2 exam data:", error);
      const event = new CustomEvent('dataLoaded', { detail: { examKey: 'crea2', success: false, error: error } });
      window.dispatchEvent(event);
    });
  // Data loaded from crea2_exam.json
})();
