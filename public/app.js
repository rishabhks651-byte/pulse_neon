const monitorsGrid = document.getElementById('monitors-grid');
const monitorForm = document.getElementById('monitor-form');
const urlInput = document.getElementById('url-input');
const targetCount = document.getElementById('target-count');

async function fetchTargets() {
  try {
    const response = await fetch('/api/targets');
    const targets = await response.json();
    renderTargets(targets);
  } catch (error) {
    console.error('Failed to fetch monitoring targets:', error);
  }
}

function renderTargets(targets) {
  targetCount.textContent = `${targets.length} TARGET${targets.length !== 1 ? 'S' : ''}`;
  monitorsGrid.innerHTML = '';

  targets.forEach(target => {
    const card = document.createElement('div');
    card.className = `monitor-card ${target.status}`;

    const formattedTime = target.lastChecked 
      ? new Date(target.lastChecked).toLocaleTimeString() 
      : 'INITIALIZING...';

    card.innerHTML = `
      <div class="card-header">
        <div class="card-url" title="${target.url}">${cleanUrl(target.url)}</div>
        <div class="status-indicator ${target.status}">${target.status}</div>
      </div>
      <div class="card-body">
        <div class="metric-row">
          <span class="metric-label">Latency:</span>
          <span class="metric-val" style="color: ${target.status === 'UP' ? 'var(--neon-green)' : 'var(--neon-pink)'}">
            ${target.latency !== null ? target.latency + 'ms' : '--'}
          </span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Last Check:</span>
          <span class="metric-val">${formattedTime}</span>
        </div>
      </div>
      <button class="delete-btn" onclick="deleteTarget('${target.id}')">DESTROY</button>
    `;
    monitorsGrid.appendChild(card);
  });
}

function cleanUrl(url) {
  return url.replace(/^https?:\/\//i, '');
}

monitorForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const url = urlInput.value.trim();
  if (!url) return;

  try {
    const response = await fetch('/api/targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (response.ok) {
      urlInput.value = '';
      fetchTargets();
    }
  } catch (error) {
    console.error('Failed to add target:', error);
  }
});

async function deleteTarget(id) {
  try {
    const response = await fetch(`/api/targets/${id}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      fetchTargets();
    }
  } catch (error) {
    console.error('Failed to delete target:', error);
  }
}

// Initial fetch and 5s polling sequence
fetchTargets();
setInterval(fetchTargets, 5000);
