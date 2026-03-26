(function(){
  if(!window.examData) window.examData = {};
  fetch('/data/fia_exam.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: \${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      window.examData.fia = data;
      console.log("FIA exam data loaded successfully.");
      const event = new CustomEvent('dataLoaded', { detail: { examKey: 'fia', success: true } });
      window.dispatchEvent(event);
    })
    .catch(error => {
      console.error("Error loading FIA exam data:", error);
      const event = new CustomEvent('dataLoaded', { detail: { examKey: 'fia', success: false, error: error } });
      window.dispatchEvent(event);
    });
  // Data loaded from fia_exam.json
})();
