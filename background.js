// Background service worker for sync-cookies-shared extension

// Listen for extension installation
chrome.runtime.onInstalled.addListener(function(details) {
  console.log('Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.sync.set({
      syncEnabled: true,
      autoSync: false,
      syncInterval: 60 // minutes
    });
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'sync') {
    performSync().then(function(result) {
      sendResponse({ success: true, result: result });
    }).catch(function(error) {
      console.error('Sync error:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Will respond asynchronously
  }
  
  if (request.action === 'getCookies') {
    chrome.cookies.getAll({}, function(cookies) {
      sendResponse({ cookies: cookies });
    });
    return true;
  }
});

// Perform sync operation
async function performSync() {
  try {
    const settings = await chrome.storage.sync.get(['syncEnabled', 'autoSync']);
    
    if (!settings.syncEnabled) {
      console.log('Sync is disabled');
      return { message: 'Sync is disabled' };
    }
    
    // Get all cookies
    const cookies = await chrome.cookies.getAll({});
    
    // Store cookies in chrome.storage.sync for cross-device sync
    // Note: chrome.storage.sync has size limits (8KB per item, 100KB total)
    // For large cookie sets, consider using chrome.storage.local or external storage
    
    const cookieData = {
      timestamp: Date.now(),
      count: cookies.length,
      cookies: cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
        secure: c.secure,
        httpOnly: c.httpOnly,
        sameSite: c.sameSite,
        expirationDate: c.expirationDate
      }))
    };
    
    // Split into chunks if needed (due to storage limits)
    const chunks = chunkArray(cookieData.cookies, 50);
    
    for (let i = 0; i < chunks.length; i++) {
      await chrome.storage.local.set({
        [`cookies_chunk_${i}`]: chunks[i]
      });
    }
    
    await chrome.storage.local.set({
      'cookies_metadata': {
        timestamp: cookieData.timestamp,
        count: cookieData.count,
        chunks: chunks.length
      }
    });
    
    console.log('Sync completed:', cookieData.count, 'cookies');
    return { message: 'Sync completed', count: cookieData.count };
    
  } catch (error) {
    console.error('Sync error:', error);
    throw error;
  }
}

// Helper function to chunk array
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Auto-sync if enabled
chrome.alarms.create('autoSync', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === 'autoSync') {
    chrome.storage.sync.get(['autoSync'], function(result) {
      if (result.autoSync) {
        performSync();
      }
    });
  }
});
