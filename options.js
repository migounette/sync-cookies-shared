// Options script for sync-cookies-shared extension

document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const backendProvider = document.getElementById('backendProvider');
  const githubSettings = document.getElementById('githubSettings');
  const localSettings = document.getElementById('localSettings');
  const githubApiUrl = document.getElementById('githubApiUrl');
  const githubToken = document.getElementById('githubToken');
  const githubGistId = document.getElementById('githubGistId');
  const githubGistDescription = document.getElementById('githubGistDescription');
  const saveBackendBtn = document.getElementById('saveBackendBtn');
  const resetBackendBtn = document.getElementById('resetBackendBtn');
  const testConnectionBtn = document.getElementById('testConnectionBtn');
  const backendStatus = document.getElementById('backendStatus');
  const clearStorageBtn = document.getElementById('clearStorage');
  const storedCountSpan = document.getElementById('storedCount');
  const lastSyncSpan = document.getElementById('lastSync');

  // Show/hide provider settings based on selection
  if (backendProvider) {
    backendProvider.addEventListener('change', function() {
      const selected = backendProvider.value;
      
      githubSettings.style.display = 'none';
      localSettings.style.display = 'none';
      
      if (selected === 'github') {
        githubSettings.style.display = 'block';
      } else if (selected === 'local') {
        localSettings.style.display = 'block';
      }
    });
  }

  // Load backend settings on page load (must be after event listener setup)
  loadBackendSettings();
  updateStorageInfo();

  // Save backend settings
  if (saveBackendBtn) {
    saveBackendBtn.addEventListener('click', function() {
      const settings = {
        backendProvider: backendProvider.value,
        github: {
          apiUrl: githubApiUrl.value.trim() || 'https://api.github.com',
          token: githubToken.value.trim(),
          gistId: githubGistId.value.trim(),
          description: githubGistDescription.value.trim() || 'sync-your-cookie'
        }
      };

      chrome.storage.sync.set({ backendSettings: settings }, function() {
        showStatus('Backend settings saved successfully!', 'success');
      });
    });
  }

  // Reset backend configuration
  if (resetBackendBtn) {
    resetBackendBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to reset the backend configuration? This will clear all backend settings.')) {
        // Reset to default values
        backendProvider.value = 'local';
        backendProvider.dispatchEvent(new Event('change'));
        
        githubApiUrl.value = 'https://api.github.com';
        githubToken.value = '';
        githubGistId.value = '';
        githubGistDescription.value = 'sync-your-cookie';
        
        // Clear from storage
        chrome.storage.sync.remove('backendSettings', function() {
          showStatus('Backend configuration reset successfully!', 'success');
        });
      }
    });
  }

  // Test connection
  if (testConnectionBtn) {
    testConnectionBtn.addEventListener('click', async function() {
      const provider = backendProvider.value;
      
      testConnectionBtn.disabled = true;
      showStatus('Testing connection...', '');
      
      try {
        if (provider === 'github') {
          const token = githubToken.value.trim();
          const apiUrl = githubApiUrl.value.trim() || 'https://api.github.com';
          if (!token) {
            showStatus('GitHub token is required', 'error');
            testConnectionBtn.disabled = false;
            return;
          }
          
          // Test GitHub API
          const response = await fetch(`${apiUrl}/user`, {
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          
          if (response.ok) {
            const user = await response.json();
            showStatus(`Connected to GitHub as ${user.login}`, 'success');
          } else {
            showStatus('GitHub authentication failed. Check your token.', 'error');
          }
        } else if (provider === 'local') {
          showStatus('Local storage ready. Files will be saved to Downloads folder.', 'success');
        }
      } catch (error) {
        showStatus('Connection test failed: ' + error.message, 'error');
      } finally {
        testConnectionBtn.disabled = false;
      }
    });
  }

  // Load backend settings
  function loadBackendSettings() {
    chrome.storage.sync.get(['backendSettings'], function(result) {
      if (result.backendSettings) {
        const settings = result.backendSettings;
        
        backendProvider.value = settings.backendProvider || 'local';
        backendProvider.dispatchEvent(new Event('change')); // Trigger show/hide
        
        if (settings.github) {
          githubApiUrl.value = settings.github.apiUrl || 'https://api.github.com';
          githubToken.value = settings.github.token || '';
          githubGistId.value = settings.github.gistId || '';
          githubGistDescription.value = settings.github.description || 'sync-your-cookie';
        }
      } else {
        // No settings exist, use default local
        backendProvider.value = 'local';
        backendProvider.dispatchEvent(new Event('change'));
      }
    });
  }

  // Show status message
  function showStatus(message, type) {
    backendStatus.textContent = message;
    backendStatus.className = 'status ' + type;
    
    if (message) {
      setTimeout(function() {
        backendStatus.textContent = '';
        backendStatus.className = 'status';
      }, 5000);
    }
  }

  // Clear storage
  if (clearStorageBtn) {
    clearStorageBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to clear all stored cookies? This cannot be undone.')) {
        chrome.storage.local.clear(function() {
          alert('Storage cleared successfully!');
          updateStorageInfo();
        });
      }
    });
  }

  // Update storage info
  function updateStorageInfo() {
    chrome.storage.local.get(['cookies_metadata'], function(result) {
      if (result.cookies_metadata) {
        storedCountSpan.textContent = result.cookies_metadata.count || 0;
        
        const lastSync = result.cookies_metadata.timestamp;
        if (lastSync) {
          const date = new Date(lastSync);
          lastSyncSpan.textContent = date.toLocaleString();
        } else {
          lastSyncSpan.textContent = 'Never';
        }
      } else {
        storedCountSpan.textContent = '0';
        lastSyncSpan.textContent = 'Never';
      }
    });
  }
});
