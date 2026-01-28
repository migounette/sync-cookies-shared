document.addEventListener('DOMContentLoaded', async function() {
  const sourceInfo = document.getElementById('sourceInfo');
  const totalCount = document.getElementById('totalCount');
  const exportDate = document.getElementById('exportDate');
  const browserInfo = document.getElementById('browserInfo');
  const warningBox = document.getElementById('warningBox');
  const warningMessage = document.getElementById('warningMessage');
  const domainFilter = document.getElementById('domainFilter');
  const selectAll = document.getElementById('selectAll');
  const selectAllHeader = document.getElementById('selectAllHeader');
  const selectedCount = document.getElementById('selectedCount');
  const cookiesTableBody = document.getElementById('cookiesTableBody');
  const cancelBtn = document.getElementById('cancelBtn');
  const applyBtn = document.getElementById('applyBtn');

  // Check if all required elements exist
  if (!sourceInfo || !totalCount || !exportDate || !browserInfo || !warningBox || 
      !warningMessage || !domainFilter || !selectAll || !selectAllHeader || 
      !selectedCount || !cookiesTableBody || !cancelBtn || !applyBtn) {
    console.error('Missing required DOM elements');
    console.error('Elements found:', {
      sourceInfo: !!sourceInfo,
      totalCount: !!totalCount,
      exportDate: !!exportDate,
      browserInfo: !!browserInfo,
      warningBox: !!warningBox,
      warningMessage: !!warningMessage,
      domainFilter: !!domainFilter,
      selectAll: !!selectAll,
      selectAllHeader: !!selectAllHeader,
      selectedCount: !!selectedCount,
      cookiesTableBody: !!cookiesTableBody,
      cancelBtn: !!cancelBtn,
      applyBtn: !!applyBtn
    });
    return;
  }

  let allCookies = [];
  let selectedCookies = new Set();
  let decryptedData = null;
  let currentBrowserId = null;

  // Get import data from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const encryptedData = urlParams.get('data');
  const password = urlParams.get('password');
  const source = urlParams.get('source') || 'Unknown';

  sourceInfo.textContent = source;

  // Generate current browser ID
  currentBrowserId = await generateBrowserId();
  
  // Try to decrypt the data
  try {
    if (!encryptedData || !password) {
      throw new Error('Missing encrypted data or password');
    }

    console.log('Encrypted data length:', encryptedData.length);
    console.log('Password length:', password.length);

    // Decode base64
    const encryptedBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    console.log('Encrypted bytes length:', encryptedBytes.length);
    
    // Log to activity log
    chrome.storage.local.get(['activityLog'], function(result) {
      const logs = result.activityLog || [];
      logs.push({ time: new Date().toISOString(), message: `[Import] Starting decryption, data size: ${(encryptedBytes.length / 1024).toFixed(2)} KB` });
      chrome.storage.local.set({ activityLog: logs });
    });
    
    // Decrypt
    const decryptedJson = await decryptAES(encryptedBytes, password);
    console.log('Decrypted JSON length:', decryptedJson.length);
    console.log('Decrypted JSON preview:', decryptedJson.substring(0, 200));
    
    // Log to activity log
    chrome.storage.local.get(['activityLog'], function(result) {
      const logs = result.activityLog || [];
      logs.push({ time: new Date().toISOString(), message: `[Import] Decryption successful, JSON size: ${(decryptedJson.length / 1024).toFixed(2)} KB` });
      chrome.storage.local.set({ activityLog: logs });
    });
    
    decryptedData = JSON.parse(decryptedJson);
    console.log('Parsed data:', decryptedData);
    console.log('Cookies count:', decryptedData.cookies?.length);

    // Log to activity log
    chrome.storage.local.get(['activityLog'], function(result) {
      const logs = result.activityLog || [];
      logs.push({ time: new Date().toISOString(), message: `[Import] Found ${decryptedData.cookies?.length || 0} cookies in encrypted file` });
      if (decryptedData.timestamp) {
        logs.push({ time: new Date().toISOString(), message: `[Import] Export date: ${new Date(decryptedData.timestamp).toLocaleString()}` });
      }
      chrome.storage.local.set({ activityLog: logs });
    });

    // Display info
    totalCount.textContent = decryptedData.count || decryptedData.cookies?.length || 0;
    
    if (decryptedData.timestamp) {
      const date = new Date(decryptedData.timestamp);
      exportDate.textContent = date.toLocaleString();
    }

    if (decryptedData.browserId) {
      browserInfo.textContent = decryptedData.browserId.substring(0, 16) + '...';
      
      // Check if same browser
      if (decryptedData.browserId === currentBrowserId) {
        warningBox.style.display = 'block';
        warningMessage.textContent = 'These cookies were exported from this browser. Importing them may cause conflicts or duplicate cookies.';
      }
    }

    // Load cookies
    allCookies = decryptedData.cookies || [];
    console.log('All cookies array length:', allCookies.length);
    displayCookies(allCookies);

  } catch (error) {
    console.error('Decryption error:', error);
    cookiesTableBody.innerHTML = `<tr><td colspan="5" class="no-cookies">Failed to decrypt: ${error.message}</td></tr>`;
    
    // Log error to activity log
    chrome.storage.local.get(['activityLog'], function(result) {
      const logs = result.activityLog || [];
      logs.push({ time: new Date().toISOString(), message: `[Import] Decryption failed: ${error.message}` });
      chrome.storage.local.set({ activityLog: logs });
    });
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

  // Decrypt function
  async function decryptAES(encryptedData, password) {
    // Format: salt(16 bytes) + iv(12 bytes) + ciphertext
    const salt = encryptedData.slice(0, 16);
    const iv = encryptedData.slice(16, 28);
    const ciphertext = encryptedData.slice(28);

    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  }

  // Display cookies in table
  function displayCookies(cookies) {
    if (cookies.length === 0) {
      cookiesTableBody.innerHTML = '<tr><td colspan="5" class="no-cookies">No cookies found</td></tr>';
      return;
    }

    cookiesTableBody.innerHTML = '';
    
    cookies.forEach((cookie, index) => {
      const row = document.createElement('tr');
      
      const checkboxCell = document.createElement('td');
      checkboxCell.className = 'checkbox-col';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.index = index;
      checkbox.addEventListener('change', function() {
        if (this.checked) {
          selectedCookies.add(index);
        } else {
          selectedCookies.delete(index);
        }
        updateSelectedCount();
      });
      checkboxCell.appendChild(checkbox);
      
      const nameCell = document.createElement('td');
      nameCell.textContent = cookie.name || '';
      
      const domainCell = document.createElement('td');
      domainCell.textContent = cookie.domain || '';
      
      const pathCell = document.createElement('td');
      pathCell.textContent = cookie.path || '/';
      
      const expiresCell = document.createElement('td');
      if (cookie.expirationDate) {
        const date = new Date(cookie.expirationDate * 1000);
        expiresCell.textContent = date.toLocaleDateString();
      } else {
        expiresCell.textContent = 'Session';
      }
      
      row.appendChild(checkboxCell);
      row.appendChild(nameCell);
      row.appendChild(domainCell);
      row.appendChild(pathCell);
      row.appendChild(expiresCell);
      
      cookiesTableBody.appendChild(row);
    });
  }

  // Filter cookies
  if (domainFilter) {
    domainFilter.addEventListener('input', function() {
      const filterValue = domainFilter.value.trim().toLowerCase();
      const rows = cookiesTableBody.querySelectorAll('tr');
      
      rows.forEach(row => {
        const domainCell = row.cells[2];
        if (domainCell) {
          const domain = domainCell.textContent.toLowerCase();
          if (domain.includes(filterValue) || filterValue === '') {
            row.style.display = '';
          } else {
            row.style.display = 'none';
          }
        }
      });
    });
  }

  // Select all
  function setupSelectAll(checkbox) {
    if (!checkbox) return;
    checkbox.addEventListener('change', function() {
      const checkboxes = cookiesTableBody.querySelectorAll('input[type="checkbox"]');
      const visibleCheckboxes = Array.from(checkboxes).filter(cb => cb.closest('tr').style.display !== 'none');
      
      visibleCheckboxes.forEach(cb => {
        cb.checked = checkbox.checked;
        const index = parseInt(cb.dataset.index);
        if (checkbox.checked) {
          selectedCookies.add(index);
        } else {
          selectedCookies.delete(index);
        }
      });
      
      updateSelectedCount();
    });
  }

  setupSelectAll(selectAll.querySelector('input'));
  setupSelectAll(selectAllHeader);

  // Update selected count
  function updateSelectedCount() {
    if (selectedCount) {
      selectedCount.textContent = selectedCookies.size;
    }
    if (applyBtn) {
      applyBtn.disabled = selectedCookies.size === 0;
    }
  }

  // Cancel button
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      window.close();
    });
  }

  // Apply button
  if (applyBtn) {
    applyBtn.addEventListener('click', async function() {
      if (selectedCookies.size === 0) return;

      applyBtn.disabled = true;
      applyBtn.textContent = 'Applying...';
      
      // Log to activity log
      const cookiesToApply = Array.from(selectedCookies).map(index => allCookies[index]);
    chrome.storage.local.get(['activityLog'], function(result) {
      const logs = result.activityLog || [];
      logs.push({ time: new Date().toISOString(), message: `[Import] Starting import of ${cookiesToApply.length} selected cookies` });
      chrome.storage.local.set({ activityLog: logs });
    });

    try {
      let successCount = 0;
      let failCount = 0;
      let failedCookies = [];

      for (const cookie of cookiesToApply) {
        try {
          // Prepare cookie for Chrome API
          const isSecure = cookie.secure || false;
          
          // SameSite handling: 'no_restriction' requires secure=true
          let sameSite = cookie.sameSite || 'lax';
          if (sameSite === 'no_restriction' && !isSecure) {
            // Fallback to 'lax' if cookie is not secure but wants no_restriction
            sameSite = 'lax';
          }
          
          const cookieDetails = {
            url: `http${isSecure ? 's' : ''}://${cookie.domain.replace(/^\./, '')}${cookie.path}`,
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            secure: isSecure,
            httpOnly: cookie.httpOnly || false,
            sameSite: sameSite
          };

          if (cookie.expirationDate) {
            cookieDetails.expirationDate = cookie.expirationDate;
          }

          await chrome.cookies.set(cookieDetails);
          successCount++;
        } catch (error) {
          console.error('Failed to set cookie:', cookie.name, error);
          failCount++;
          failedCookies.push({ name: cookie.name, domain: cookie.domain, error: error.message });
        }
      }

      // Log results to activity log
      chrome.storage.local.get(['activityLog'], function(result) {
        const logs = result.activityLog || [];
        logs.push({ time: new Date().toISOString(), message: `[Import] Import completed: ${successCount} successful, ${failCount} failed` });
        
        // Log failed cookie names if any
        if (failedCookies.length > 0) {
          const failedNames = failedCookies.slice(0, 5).map(c => `${c.name} (${c.domain})`).join(', ');
          logs.push({ time: new Date().toISOString(), message: `[Import] Failed cookies: ${failedNames}${failedCookies.length > 5 ? ` and ${failedCookies.length - 5} more...` : ''}` });
        }
        
        chrome.storage.local.set({ activityLog: logs });
      });

      // Build alert message with failed cookie details
      let alertMessage = `Import complete!\n\nSuccess: ${successCount}\nFailed: ${failCount}`;
      
      if (failedCookies.length > 0) {
        alertMessage += '\n\nFailed cookies:';
        const displayCount = Math.min(5, failedCookies.length);
        for (let i = 0; i < displayCount; i++) {
          const fc = failedCookies[i];
          alertMessage += `\n  • ${fc.name} (${fc.domain})`;
        }
        if (failedCookies.length > 5) {
          alertMessage += `\n  ... and ${failedCookies.length - 5} more`;
        }
      }

      alert(alertMessage);
      
      if (successCount > 0) {
        window.close();
      } else {
        applyBtn.disabled = false;
        applyBtn.textContent = 'Apply Selected Cookies';
      }

    } catch (error) {
      console.error('Apply error:', error);
      alert('Failed to apply cookies: ' + error.message);
      applyBtn.disabled = false;
      applyBtn.textContent = 'Apply Selected Cookies';
    }
    });
  }

  updateSelectedCount();
});
