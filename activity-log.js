document.addEventListener('DOMContentLoaded', function() {
  const logTableBody = document.getElementById('logTableBody');
  const clearLogBtn = document.getElementById('clearLog');

  // Load logs from storage
  function loadLogs() {
    chrome.storage.local.get(['activityLogs'], function(result) {
      const logs = result.activityLogs || [];
      
      if (logs.length === 0) {
        logTableBody.innerHTML = '<tr><td colspan="2" class="no-logs">No activity yet</td></tr>';
        return;
      }
      
      logTableBody.innerHTML = '';
      
      logs.forEach(log => {
        const row = document.createElement('tr');
        
        const timeCell = document.createElement('td');
        timeCell.className = 'col-time';
        timeCell.textContent = log.time;
        
        const messageCell = document.createElement('td');
        messageCell.className = 'col-message';
        messageCell.textContent = log.message;
        
        row.appendChild(timeCell);
        row.appendChild(messageCell);
        logTableBody.appendChild(row);
      });
    });
  }

  // Clear all logs
  if (clearLogBtn) {
    clearLogBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to clear all activity logs?')) {
        chrome.storage.local.set({ activityLogs: [] }, function() {
          logTableBody.innerHTML = '<tr><td colspan="2" class="no-logs">No activity yet</td></tr>';
          
          // Add a log entry about clearing (meta!)
          const logEntry = {
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            message: 'All logs cleared',
            timestamp: Date.now()
          };
          chrome.storage.local.set({ activityLogs: [logEntry] }, loadLogs);
        });
      }
    });
  }

  // Listen for storage changes to update in real-time
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local' && changes.activityLogs) {
      loadLogs();
    }
  });

  // Initial load
  loadLogs();
});
