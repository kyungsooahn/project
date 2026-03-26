(function(){
  if(!window.examData) window.examData = {};
  fetch('/data/cim_exam.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: \${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      window.examData.cim = data;
      console.log("CIM exam data loaded successfully.");
      // Dispatch custom event after data is loaded
      const event = new CustomEvent('dataLoaded', { detail: { examKey: 'cim', success: true } });
      window.dispatchEvent(event);
    })
    .catch(error => {
      console.error("Error loading CIM exam data:", error);
      const event = new CustomEvent('dataLoaded', { detail: { examKey: 'cim', success: false, error: error } });
      window.dispatchEvent(event);
    });
  // Data loaded from cim_exam.json
})();
