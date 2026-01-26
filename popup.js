// Popup script for sync-cookies-shared extension

document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const syncBtn = document.getElementById('syncBtn');
  const statusIndicator = document.getElementById('statusIndicator');
  const cookieCountElement = document.getElementById('cookieCount');
  const domainFilter = document.getElementById('domainFilter');
  const cookiesTableBody = document.getElementById('cookiesTableBody');
  const selectAllCheckbox = document.getElementById('selectAll');
  const pushSelectedBtn = document.getElementById('pushSelectedBtn');
  const selectedCountSpan = document.getElementById('selectedCount');
  const encryptionPassword = document.getElementById('encryptionPassword');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const openActivityLogBtn = document.getElementById('openActivityLog');

  // Store all cookies for filtering
  let allCookies = [];
  let selectedCookies = new Set();
  let backendSettings = null;

  // Initialize status
  setStatus('ready', 'Ready');

  // Add initial log entry
  addLog('Extension loaded and ready');
  
  // Load backend settings
  loadBackendSettings();
  
  // Load saved state
  loadSavedState();

  // Update cookie count and table on load
  loadCookies();

  // Filter cookies when typing in the domain filter
  domainFilter.addEventListener('input', function() {
    const filterValue = domainFilter.value.trim().toLowerCase();
    filterCookies(filterValue);
    // Save filter value to storage
    chrome.storage.local.set({ domainFilter: domainFilter.value });
  });

  // Toggle password visibility
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', function() {
      const type = encryptionPassword.type === 'password' ? 'text' : 'password';
      encryptionPassword.type = type;
      
      // Update icon (add strike-through for "hidden" state)
      const eyeIcon = document.getElementById('eyeIcon');
      if (type === 'text') {
        eyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle><line x1="1" y1="1" x2="23" y2="23"></line>';
      } else {
        eyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
      }
    });
  }

  // Open activity log window
  if (openActivityLogBtn) {
    openActivityLogBtn.addEventListener('click', function(e) {
      e.preventDefault();
      chrome.windows.create({
        url: 'activity-log.html',
        type: 'popup',
        width: 600,
        height: 500
      });
    });
  }

  // Select all checkbox handler
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', function() {
      const checkboxes = cookiesTableBody.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(cb => {
        cb.checked = selectAllCheckbox.checked;
        const cookieId = cb.dataset.cookieId;
        if (selectAllCheckbox.checked) {
          selectedCookies.add(cookieId);
        } else {
          selectedCookies.delete(cookieId);
        }
      });
      updateSelectedCount();    saveSelectedCookies();  });
  }

  // Push selected cookies
  if (pushSelectedBtn) {
    pushSelectedBtn.addEventListener('click', async function() {
    if (selectedCookies.size === 0) return;
    
    // Check if backend is configured
    if (!backendSettings) {
      // Set default to local if not configured
      backendSettings = { backendProvider: 'local' };
      chrome.storage.sync.set({ backendSettings: backendSettings });
      addLog('Using default backend: Local Download');
    }
    
    const password = encryptionPassword.value.trim();
    
    // Validate password is provided
    if (!password) {
      setStatus('warning', 'Password is required for encryption!');
      addLog('Push failed: Password is required');
      showErrorPopup('An error has occurred, check logs');
      encryptionPassword.focus();
      encryptionPassword.style.borderColor = '#f44336';
      setTimeout(() => {
        encryptionPassword.style.borderColor = '';
        setStatus('ready', 'Ready');
      }, 10000);
      return;
    }
    
    try {
      setStatus('processing', 'Encrypting and creating file...');
      pushSelectedBtn.disabled = true;
      
      const cookiesToPush = allCookies.filter(cookie => 
        selectedCookies.has(getCookieId(cookie))
      );
      
      addLog(`[Encryption] Step 1: Creating JSON with ${cookiesToPush.length} cookie entries`);
      
      // Generate browser ID
      const browserId = await generateBrowserId();
      addLog(`[Encryption] Browser ID generated: ${browserId.substring(0, 16)}...`);
      
      // Create JSON data
      const cookieData = {
        cookies: cookiesToPush,
        timestamp: Date.now(),
        count: cookiesToPush.length,
        browserId: browserId
      };
      
      const jsonString = JSON.stringify(cookieData, null, 2);
      addLog(`[Encryption] JSON size: ${jsonString.length} bytes`);
      
      addLog('[Encryption] Step 2: Encrypting with AES-256-GCM...');
      
      // Encrypt the data
      const encryptedData = await encryptAES(jsonString, password);
      
      addLog(`[Encryption] Encrypted size: ${encryptedData.length} bytes`);
      
      // Convert to base64
      addLog('[Encryption] Step 3: Encoding to Base64...');
      const base64Data = btoa(String.fromCharCode.apply(null, encryptedData));
      addLog(`[Encryption] Final size: ${base64Data.length} bytes`);
      addLog('[Encryption] ✓ Encryption complete');
      
      const filename = 'cookies-encrypted.enc.base64';
      
      // Save to backend
      const success = await saveToBackend(filename, base64Data);
      
      if (success) {
        const providerName = backendSettings.backendProvider === 'github' ? 'GitHub Gist' : 'Local Download';
        addLog(`✓ Successfully saved to ${providerName}`);
        addLog(`✓ ${cookiesToPush.length} cookies encrypted and pushed`);
        setStatus('success', `Encrypted ${cookiesToPush.length} cookies and saved to backend!`);
        setTimeout(() => setStatus('ready', 'Ready'), 3000);
      } else {
        addLog('[ERROR] Backend returned false - save operation failed');
        addLog('[ERROR] Check previous log entries for specific error details');
        throw new Error('Backend save operation returned false');
      }
    } catch (error) {
      console.error('Push error:', error);
      console.error('Error stack:', error.stack);
      addLog(`[ERROR] Push failed: ${error.message}`);
      if (error.stack) {
        addLog(`[ERROR] Stack trace: ${error.stack.split('\n')[1] || ''}`);
      }
      setStatus('warning', 'Encryption failed: ' + error.message);
      showErrorPopup('An error has occurred, check logs');
      setTimeout(() => setStatus('ready', 'Ready'), 10000);
    } finally {
      pushSelectedBtn.disabled = false;
    }
  });
  }

  // Sync cookies - Import from backend
  if (syncBtn) {
    syncBtn.addEventListener('click', async function() {
    try {
      syncBtn.disabled = true;
      setStatus('processing', 'Fetching encrypted cookies...');
      addLog('Starting import operation...');
      
      // Get backend settings
      const result = await chrome.storage.sync.get(['backendSettings']);
      const backendSettings = result.backendSettings;
      
      if (!backendSettings) {
        setStatus('warning', 'Backend not configured');
        addLog('Import failed: No backend configured');
        showErrorPopup('Please configure backend settings first');
        setTimeout(() => setStatus('ready', 'Ready'), 3000);
        return;
      }
      
      addLog(`Backend provider: ${backendSettings.provider}`);
      
      // Get password from input
      const password = encryptionPassword.value.trim();
      if (!password) {
        setStatus('warning', 'Password required');
        addLog('Import failed: No password provided');
        showErrorPopup('Please enter the encryption password');
        setTimeout(() => setStatus('ready', 'Ready'), 3000);
        return;
      }
      
      let encryptedData = null;
      let sourceName = '';
      
      // Log provider info
      addLog(`Provider: ${backendSettings.backendProvider || 'NOT SET'}`);
      addLog(`Backend settings: ${JSON.stringify(backendSettings).substring(0, 100)}`);
      
      // Fetch based on provider
      if (backendSettings.backendProvider === 'github') {
        let { apiUrl, token, gistId } = backendSettings.github || {};
        
        addLog(`[GitHub Gist] API URL: ${apiUrl ? 'SET' : 'MISSING'}`);
        addLog(`[GitHub Gist] Token: ${token ? 'SET (' + token.length + ' chars)' : 'MISSING'}`);
        addLog(`[GitHub Gist] Gist ID: ${gistId ? 'SET (' + gistId + ')' : 'MISSING'}`);
        
        if (!apiUrl || !token) {
          setStatus('warning', 'GitHub settings incomplete');
          addLog('Import failed: GitHub settings incomplete');
          addLog(`Missing: ${!apiUrl ? 'API URL ' : ''}${!token ? 'Token' : ''}`);
          showErrorPopup('Please complete GitHub Gist configuration in Settings');
          setTimeout(() => setStatus('ready', 'Ready'), 3000);
          return;
        }
        
        // If no gist ID, search for it by filename
        if (!gistId) {
          addLog('[GitHub Gist] No Gist ID configured, searching...');
          setStatus('processing', 'Searching for gist...');
          try {
            gistId = await searchGistByFilename(apiUrl, token, 'cookies-encrypted.enc.base64');
            if (gistId) {
              addLog(`[GitHub Gist] Found gist ID: ${gistId}`);
              // Save the found gist ID
              backendSettings.github.gistId = gistId;
              await chrome.storage.sync.set({ backendSettings: backendSettings });
              addLog('[GitHub Gist] Gist ID saved to settings');
            } else {
              setStatus('warning', 'No gist found');
              addLog('Import failed: No gist found with cookies file');
              showErrorPopup('No gist found. Please push cookies first or configure Gist ID manually.');
              setTimeout(() => setStatus('ready', 'Ready'), 5000);
              return;
            }
          } catch (searchError) {
            addLog(`[GitHub Gist] Search error: ${searchError.message}`);
            throw new Error(`Failed to search for gist: ${searchError.message}`);
          }
        }
        
        addLog('[GitHub Gist] Fetching encrypted file...');
        addLog(`[GitHub Gist] Using Gist ID: ${gistId}`);
        setStatus('processing', 'Fetching encrypted cookies...');
        try {
          addLog('[GitHub Gist] Calling fetchFromGitHub...');
          encryptedData = await fetchFromGitHub(apiUrl, token, gistId);
          addLog('[GitHub Gist] fetchFromGitHub returned');
          
          if (!encryptedData) {
            addLog('[GitHub Gist] ERROR: Empty data returned');
            throw new Error('fetchFromGitHub returned empty data');
          }
          sourceName = 'GitHub Gist';
          addLog(`[GitHub Gist] Data retrieved successfully: ${encryptedData.length} characters`);
          
          // Try to peek at the data structure without full decryption
          try {
            const previewBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
            addLog(`[GitHub Gist] Encrypted data size: ${(previewBytes.length / 1024).toFixed(2)} KB`);
          } catch (previewError) {
            addLog(`[GitHub Gist] Could not preview encrypted data: ${previewError.message}`);
          }
          
          addLog('[GitHub Gist] Preparing to open import window...');
        } catch (fetchError) {
          addLog(`[GitHub Gist] Fetch error: ${fetchError.message}`);
          addLog(`[GitHub Gist] Error type: ${fetchError.name}`);
          if (fetchError.stack) {
            addLog(`[GitHub Gist] Stack: ${fetchError.stack.split('\n')[0]}`);
          }
          throw new Error(`Failed to fetch from GitHub: ${fetchError.message}`);
        }
        
      } else if (backendSettings.backendProvider === 'local') {
        setStatus('warning', 'Manual import required');
        addLog('Local Download provider: Cannot auto-fetch');
        showErrorPopup('For Local Download, please import the file manually');
        setTimeout(() => setStatus('ready', 'Ready'), 5000);
        return;
      } else {
        setStatus('warning', 'Unknown provider');
        addLog(`Import failed: Unknown provider "${backendSettings.backendProvider}"`);
        showErrorPopup(`Unknown backend provider: ${backendSettings.backendProvider}`);
        setTimeout(() => setStatus('ready', 'Ready'), 3000);
        return;
      }
      
      addLog(`Import source: ${sourceName}`);
      addLog(`Data to transfer: ${(encryptedData.length / 1024).toFixed(2)} KB`);
      if (!encryptedData) {
        setStatus('warning', 'No data retrieved');
        addLog('Import failed: No encrypted data received');
        showErrorPopup('Failed to retrieve encrypted cookies');
        setTimeout(() => setStatus('ready', 'Ready'), 3000);
        return;
      }
      
      addLog('Encrypted data retrieved successfully');
      addLog('Opening import window...');
      
      // Open import window with data
      const importUrl = chrome.runtime.getURL('import.html') +
        `?data=${encodeURIComponent(encryptedData)}` +
        `&password=${encodeURIComponent(password)}` +
        `&source=${encodeURIComponent(sourceName)}`;
      
      await chrome.windows.create({
        url: importUrl,
        type: 'popup',
        width: 900,
        height: 700
      });
      
      setStatus('success', 'Import window opened');
      addLog('Import window opened successfully');
      setTimeout(() => setStatus('ready', 'Ready'), 2000);
    } catch (error) {
      console.error('Sync error:', error);
      addLog(`Sync error: ${error.message}`);
      addLog(`Error name: ${error.name}`);
      if (error.stack) {
        addLog(`Error stack: ${error.stack.split('\n').slice(0, 3).join(' | ')}`);
      }
      setStatus('warning', 'Sync failed!');
      showErrorPopup('An error has occurred, check logs');
      setTimeout(() => setStatus('ready', 'Ready'), 10000);
    } finally {
      syncBtn.disabled = false;
    }
  });
  }

  // Update cookie count
  async function updateCookieCount() {
    try {
      const cookies = await chrome.cookies.getAll({});
      cookieCountElement.textContent = `Cookies: ${cookies.length}`;
    } catch (error) {
      console.error('Error getting cookie count:', error);
      cookieCountElement.textContent = 'Cookies: Error';
    }
  }

  // Load all cookies and display in table
  async function loadCookies() {
    try {
      allCookies = await chrome.cookies.getAll({});
      cookieCountElement.textContent = `Cookies: ${allCookies.length}`;
      
      // Apply saved filter if it exists
      const filterValue = domainFilter.value.trim().toLowerCase();
      if (filterValue) {
        filterCookies(filterValue);
      } else {
        displayCookies(allCookies);
      }
      
      addLog(`Loaded ${allCookies.length} cookies`);
    } catch (error) {
      console.error('Error loading cookies:', error);
      addLog(`Error loading cookies: ${error.message}`);
      cookieCountElement.textContent = 'Cookies: Error';
      cookiesTableBody.innerHTML = '<tr><td colspan="2" class="no-cookies">Error loading cookies</td></tr>';      setStatus('warning', 'Failed to load cookies');
      showErrorPopup('An error has occurred, check logs');
      setTimeout(() => setStatus('ready', 'Ready'), 10000);    }
  }

  // Display cookies in the table
  function displayCookies(cookies) {
    if (cookies.length === 0) {
      cookiesTableBody.innerHTML = '<tr><td colspan="3" class="no-cookies">No cookies found</td></tr>';
      selectAllCheckbox.checked = false;
      return;
    }

    cookiesTableBody.innerHTML = '';
    
    cookies.forEach(cookie => {
      const row = document.createElement('tr');
      const cookieId = getCookieId(cookie);
      
      // Checkbox cell
      const checkboxCell = document.createElement('td');
      checkboxCell.className = 'checkbox-cell';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.cookieId = cookieId;
      checkbox.checked = selectedCookies.has(cookieId);
      checkbox.addEventListener('change', function() {
        if (this.checked) {
          selectedCookies.add(cookieId);
        } else {
          selectedCookies.delete(cookieId);
          selectAllCheckbox.checked = false;
        }
        updateSelectedCount();
        saveSelectedCookies();
      });
      checkboxCell.appendChild(checkbox);
      
      const nameCell = document.createElement('td');
      nameCell.textContent = cookie.name;
      nameCell.title = cookie.name; // Tooltip for long names
      
      const domainCell = document.createElement('td');
      domainCell.textContent = cookie.domain;
      domainCell.title = cookie.domain; // Tooltip for long domains
      
      row.appendChild(checkboxCell);
      row.appendChild(nameCell);
      row.appendChild(domainCell);
      cookiesTableBody.appendChild(row);
    });
    
    // Update select all checkbox state
    const allDisplayed = cookies.every(c => selectedCookies.has(getCookieId(c)));
    selectAllCheckbox.checked = cookies.length > 0 && allDisplayed;
  }
  
  // Generate unique ID for a cookie
  function getCookieId(cookie) {
    return `${cookie.domain}|${cookie.name}|${cookie.path}`;
  }
  
  // Update selected count display
  function updateSelectedCount() {
    selectedCountSpan.textContent = selectedCookies.size;
    pushSelectedBtn.disabled = selectedCookies.size === 0;
  }

  // Filter cookies by domain with wildcard support
  function filterCookies(filterText) {
    if (!filterText) {
      displayCookies(allCookies);
      return;
    }

    // Convert wildcard pattern to regex
    // * matches any characters, ? matches single character
    const regexPattern = filterText
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars except * and ?
      .replace(/\*/g, '.*') // Convert * to .*
      .replace(/\?/g, '.'); // Convert ? to .
    
    try {
      const regex = new RegExp(regexPattern, 'i'); // Case insensitive
      
      const filtered = allCookies.filter(cookie => {
        return regex.test(cookie.domain);
      });

      displayCookies(filtered);
    } catch (error) {
      // If regex is invalid, fall back to simple includes
      const filtered = allCookies.filter(cookie => {
        return cookie.domain.toLowerCase().includes(filterText);
      });
      displayCookies(filtered);
    }
  }
  
  // Update status indicator
  function setStatus(status, message) {
    statusIndicator.title = message;
    statusIndicator.className = 'status-indicator';
    
    if (status === 'error') {
      statusIndicator.classList.add('error');
    } else if (status === 'processing') {
      statusIndicator.classList.add('processing');
    } else if (status === 'warning') {
      statusIndicator.classList.add('warning');
    }
    // Default is green (ready/success)
  }
  
  // Encrypt data using AES-GCM
  async function encryptAES(text, password) {
    // Convert password to key
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    
    // Create a key from password using PBKDF2
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      passwordData,
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    // Generate a random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Derive encryption key
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    // Generate a random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the data
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encoder.encode(text)
    );
    
    // Combine salt + iv + encrypted data
    const encryptedArray = new Uint8Array(encryptedData);
    const result = new Uint8Array(salt.length + iv.length + encryptedArray.length);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(encryptedArray, salt.length + iv.length);
    
    return result;
  }
  
  // Generate unique browser ID
  async function generateBrowserId() {
    const ua = navigator.userAgent;
    const platform = navigator.platform;
    const language = navigator.language;
    const hardwareConcurrency = navigator.hardwareConcurrency || 0;
    const screenResolution = `${screen.width}x${screen.height}`;
    
    const fingerprint = `${ua}|${platform}|${language}|${hardwareConcurrency}|${screenResolution}`;
    
    // Hash it
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }
  
  // Add log entry
  function addLog(message) {
    const timestamp = new Date();
    const timeStr = timestamp.toLocaleTimeString('en-US', { hour12: false });
    
    const logEntry = {
      time: timeStr,
      message: message,
      timestamp: timestamp.getTime()
    };
    
    // Get existing logs from storage
    chrome.storage.local.get(['activityLogs'], function(result) {
      let logs = result.activityLogs || [];
      logs.unshift(logEntry); // Add to beginning
      
      // Keep only last 100 entries
      if (logs.length > 100) {
        logs = logs.slice(0, 100);
      }
      
      // Save back to storage
      chrome.storage.local.set({ activityLogs: logs });
    });
  }
  
  // Show error popup notification
  function showErrorPopup(message) {
    // Create notification using browser's built-in alert (simple but effective)
    // For a more sophisticated approach, we could create a custom modal
    if (confirm(message + '\n\nClick OK to continue.')) {
      // User acknowledged
    }
  }
  
  // Load saved state from storage
  function loadSavedState() {
    chrome.storage.local.get(['domainFilter', 'selectedCookies'], function(result) {
      // Restore filter
      if (result.domainFilter) {
        domainFilter.value = result.domainFilter;
      }
      
      // Restore selected cookies
      if (result.selectedCookies && Array.isArray(result.selectedCookies)) {
        selectedCookies = new Set(result.selectedCookies);
      }
    });
  }
  
  // Save selected cookies to storage
  function saveSelectedCookies() {
    chrome.storage.local.set({ 
      selectedCookies: Array.from(selectedCookies) 
    });
  }
  
  // Load backend settings
  function loadBackendSettings() {
    chrome.storage.sync.get(['backendSettings'], function(result) {
      if (result.backendSettings) {
        backendSettings = result.backendSettings;
        const providerName = backendSettings.backendProvider === 'github' ? 'GitHub Gist' : 'Local Download';
        addLog(`Backend configured: ${providerName}`);
      } else {
        addLog('No backend provider configured');
      }
    });
  }
  
  // Save file to configured backend
  async function saveToBackend(filename, content) {
    const provider = backendSettings.backendProvider;
    const providerName = provider === 'github' ? 'GitHub Gist' : 'Local Download';
    addLog(`[${providerName}] Preparing to save ${filename}...`);
    addLog(`[${providerName}] Content size: ${content.length} bytes`);
    
    try {
      if (provider === 'github') {
        addLog('[GitHub Gist] Calling saveToGitHub...');
        const result = await saveToGitHub(filename, content);
        addLog(`[GitHub Gist] saveToGitHub returned: ${result}`);
        return result;
      } else if (provider === 'local') {
        addLog('[Local Download] Calling saveToLocal...');
        const result = await saveToLocal(filename, content);
        addLog(`[Local Download] saveToLocal returned: ${result}`);
        return result;
      }
      addLog(`[ERROR] Unknown provider: ${provider}`);
      return false;
    } catch (error) {
      const providerName = backendSettings.backendProvider === 'github' ? 'GitHub Gist' : 'Local Download';
      addLog(`[${providerName}] Exception caught: ${error.message}`);
      addLog(`[${providerName}] Error type: ${error.name}`);
      if (error.stack) {
        addLog(`[${providerName}] Stack: ${error.stack.split('\n').slice(0, 2).join(' ')}`);
      }
      return false;
    }
  }
  
  // Save to GitHub Gist
  async function saveToGitHub(filename, content) {
    addLog('[GitHub Gist] Starting saveToGitHub function...');
    
    const apiUrl = backendSettings.github.apiUrl || 'https://api.github.com';
    const token = backendSettings.github.token;
    let gistId = backendSettings.github.gistId;
    const description = backendSettings.github.description || 'sync-your-cookie';
    
    addLog(`[GitHub Gist] API URL: ${apiUrl}`);
    addLog(`[GitHub Gist] Token present: ${!!token}`);
    addLog(`[GitHub Gist] Gist ID: ${gistId || '(none - will search/create)'}`);
    
    if (!token) {
      addLog('[GitHub Gist] Error: Token not configured');
      return false;
    }
    
    const serverUrl = apiUrl.replace('/api/v3', '').replace('https://api.github.com', 'github.com');
    addLog(`[GitHub Gist] Server: ${serverUrl}`);
    
    // If no gist ID, try to find it
    if (!gistId) {
      addLog('[GitHub Gist] No Gist ID, searching for existing gist...');
      try {
        gistId = await searchGistByFilename(apiUrl, token, filename);
        if (gistId) {
          addLog(`[GitHub Gist] Found existing gist: ${gistId}`);
          backendSettings.github.gistId = gistId;
          await chrome.storage.sync.set({ backendSettings: backendSettings });
        }
      } catch (searchError) {
        addLog(`[GitHub Gist] Search failed: ${searchError.message}`);
      }
    }
    
    // If gist ID exists, verify it exists and is accessible
    if (gistId) {
      addLog(`[GitHub Gist] Verifying gist exists: ${gistId}`);
      try {
        const checkResponse = await fetch(`${apiUrl}/gists/${gistId}`, {
          method: 'GET',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (checkResponse.ok) {
          addLog('[GitHub Gist] Gist exists, will update it');
        } else if (checkResponse.status === 404) {
          addLog('[GitHub Gist] Gist not found (404), will create new one');
          gistId = null;
        } else {
          addLog(`[GitHub Gist] Gist check failed: ${checkResponse.status}`);
          gistId = null;
        }
      } catch (checkError) {
        addLog(`[GitHub Gist] Gist verification failed: ${checkError.message}`);
        gistId = null;
      }
    }
    
    addLog(`[GitHub Gist] Uploading encrypted file...`);
    
    const gistData = {
      description: description,
      public: false,
      files: {
        [filename]: {
          content: content
        }
      }
    };
    
    let url = `${apiUrl}/gists`;
    let method = 'POST';
    
    // If gist ID exists, update existing gist
    if (gistId) {
      url = `${apiUrl}/gists/${gistId}`;
      method = 'PATCH';
      addLog(`[GitHub Gist] Updating existing gist ID: ${gistId}`);
    } else {
      addLog('[GitHub Gist] Creating new gist...');
    }
    
    addLog(`[GitHub Gist] Making ${method} request to: ${url}`);
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(gistData)
    });
    
    addLog(`[GitHub Gist] Response status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      addLog(`[GitHub Gist] Successfully uploaded`);
      addLog(`[GitHub Gist] URL: ${result.html_url}`);
      addLog(`[GitHub Gist] File: ${filename}`);
      
      // Save gist ID for future updates
      if (!backendSettings.github.gistId || backendSettings.github.gistId !== result.id) {
        backendSettings.github.gistId = result.id;
        await chrome.storage.sync.set({ backendSettings: backendSettings });
        addLog(`[GitHub Gist] Gist ID saved: ${result.id}`);
      }
      
      return true;
    } else {
      const error = await response.text();
      addLog(`[GitHub Gist] API error: ${response.status} - ${error}`);
      return false;
    }
  }
  
  // Save to local directory (via downloads)
  async function saveToLocal(filename, content) {
    addLog('[Local Download] Starting saveToLocal function...');
    addLog('[Local Download] Preparing file for download...');
    addLog(`[Local Download] Filename: ${filename}`);
    addLog(`[Local Download] Content size: ${content.length} bytes`);
    addLog(`[Local Download] Target: Downloads/${filename}`);
    
    // Create blob and download
    const blob = new Blob([content], { type: 'application/octet-stream' });
    addLog(`[Local Download] Blob created, size: ${blob.size} bytes`);
    
    const url = URL.createObjectURL(blob);
    addLog(`[Local Download] Blob URL created: ${url.substring(0, 50)}...`);
    
    try {
      addLog('[Local Download] Calling chrome.downloads.download...');
      const downloadId = await chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: false,
        conflictAction: 'overwrite'
      });
      
      addLog(`[Local Download] Download initiated, ID: ${downloadId}`);
      URL.revokeObjectURL(url);
      addLog(`[Local Download] Successfully saved to Downloads folder`);
      addLog(`[Local Download] File: ${filename}`);
      return true;
    } catch (error) {
      URL.revokeObjectURL(url);
      addLog(`[Local Download] Exception: ${error.message}`);
      addLog(`[Local Download] Error name: ${error.name}`);
      if (error.stack) {
        addLog(`[Local Download] Stack: ${error.stack.split('\n')[0]}`);
      }
      return false;
    }
  }

  // Search for gist by filename
  async function searchGistByFilename(apiUrl, token, filename) {
    try {
      addLog('[GitHub Gist] Searching for gist by filename...');
      addLog(`[GitHub Gist] Looking for file: ${filename}`);
      addLog(`[GitHub Gist] Fetching list of all gists...`);
      
      const response = await fetch(`${apiUrl}/gists`, {
        method: 'GET',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      addLog(`[GitHub Gist] List response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const gists = await response.json();
      addLog(`[GitHub Gist] Found ${gists.length} total gists in account`);
      
      // Search for gist containing the filename
      let foundCount = 0;
      for (const gist of gists) {
        const gistFiles = gist.files ? Object.keys(gist.files) : [];
        addLog(`[GitHub Gist] Checking gist ${gist.id}: files=[${gistFiles.join(', ')}]`);
        
        if (gist.files && gist.files[filename]) {
          foundCount++;
          addLog(`[GitHub Gist] ✓ MATCH FOUND! Gist ID: ${gist.id}`);
          addLog(`[GitHub Gist] Gist description: ${gist.description || 'No description'}`);
          addLog(`[GitHub Gist] Gist URL: ${gist.html_url}`);
          return gist.id;
        }
      }
      
      addLog(`[GitHub Gist] Search complete: ${foundCount} matches found`);
      if (foundCount === 0) {
        addLog(`[GitHub Gist] No gist found with file: ${filename}`);
      }
      return null;
    } catch (error) {
      addLog(`[GitHub Gist] Search failed: ${error.message}`);
      throw error;
    }
  }

  // Fetch encrypted cookies from GitHub Gist
  async function fetchFromGitHub(apiUrl, token, gistId) {
    try {
      addLog('[GitHub Gist] Starting fetch operation...');
      addLog(`[GitHub Gist] API URL: ${apiUrl}`);
      addLog(`[GitHub Gist] Gist ID: ${gistId}`);
      
      const response = await fetch(`${apiUrl}/gists/${gistId}`, {
        method: 'GET',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      addLog(`[GitHub Gist] Response status: ${response.status} ${response.statusText}`);
      addLog(`[GitHub Gist] Response headers: ${Array.from(response.headers.entries()).map(([k,v]) => `${k}=${v}`).slice(0, 5).join('; ')}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        addLog(`[GitHub Gist] Error response: ${errorText.substring(0, 200)}`);
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      
      addLog('[GitHub Gist] Parsing JSON response...');
      const data = await response.json();
      addLog(`[GitHub Gist] JSON parsed successfully`);
      addLog(`[GitHub Gist] Data type: ${typeof data}`);
      addLog(`[GitHub Gist] Data is null: ${data === null}`);
      addLog(`[GitHub Gist] Data is undefined: ${data === undefined}`);
      
      if (!data) {
        addLog('[GitHub Gist] ERROR: Response data is null or undefined');
        throw new Error('Empty response from GitHub API');
      }
      
      addLog(`[GitHub Gist] Gist retrieved successfully`);
      addLog(`[GitHub Gist] Response keys: ${Object.keys(data).join(', ')}`);
      addLog(`[GitHub Gist] Gist ID: ${data.id || 'MISSING'}`);
      addLog(`[GitHub Gist] Gist description: ${data.description || 'No description'}`);
      addLog(`[GitHub Gist] Gist public: ${data.public}`);
      addLog(`[GitHub Gist] Gist URL: ${data.html_url || 'MISSING'}`);
      addLog(`[GitHub Gist] Created at: ${data.created_at || 'MISSING'}`);
      addLog(`[GitHub Gist] Updated at: ${data.updated_at || 'MISSING'}`);
      addLog(`[GitHub Gist] Files object exists: ${!!data.files}`);
      addLog(`[GitHub Gist] Files count: ${data.files ? Object.keys(data.files).length : 0}`);
      addLog(`[GitHub Gist] Files list: ${data.files ? Object.keys(data.files).join(', ') : 'NONE'}`);
      
      // Log each file's metadata
      if (data.files) {
        Object.keys(data.files).forEach(filename => {
          const file = data.files[filename];
          addLog(`[GitHub Gist]   - ${filename}: size=${file.size}, type=${file.type || 'unknown'}, truncated=${file.truncated}`);
        });
      } else {
        addLog('[GitHub Gist] WARNING: No files object in response');
      }
      
      const filename = 'cookies-encrypted.enc.base64';
      if (!data.files || !data.files[filename]) {
        addLog(`[GitHub Gist] File not found: ${filename}`);
        addLog(`[GitHub Gist] Available files: ${Object.keys(data.files || {}).join(', ')}`);
        throw new Error(`File ${filename} not found in gist`);
      }
      
      const fileData = data.files[filename];
      addLog(`[GitHub Gist] Target file loaded: ${filename}`);
      addLog(`[GitHub Gist] File size: ${fileData.size || 'unknown'} bytes (${(fileData.size / 1024).toFixed(2)} KB)`);
      addLog(`[GitHub Gist] File truncated: ${fileData.truncated ? 'YES - CONTENT INCOMPLETE!' : 'NO'}`);
      addLog(`[GitHub Gist] File language: ${fileData.language || 'unknown'}`);
      addLog(`[GitHub Gist] File raw_url: ${fileData.raw_url || 'none'}`);
      
      const content = fileData.content;
      addLog(`[GitHub Gist] Content length: ${content.length} characters`);
      addLog(`[GitHub Gist] Content preview (first 100 chars): ${content.substring(0, 100)}`);
      addLog(`[GitHub Gist] Content preview (last 50 chars): ...${content.substring(content.length - 50)}`);
      
      return content;
    } catch (error) {
      addLog(`[GitHub Gist] Fetch failed: ${error.message}`);
      if (error.stack) {
        addLog(`[GitHub Gist] Stack: ${error.stack.split('\n')[0]}`);
      }
      throw error;
    }
  }
});
