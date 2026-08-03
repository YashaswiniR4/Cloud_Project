const API_BASE = "http://localhost:8000";

async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    document.getElementById("system-health").innerText = `System: ${data.status}`;
  } catch (err) {
    document.getElementById("system-health").innerText = "System: Offline (Demo Mode)";
    document.getElementById("system-health").className = "badge badge-high";
  }
}

async function fetchThreats() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/threats`);
    const data = await res.json();
    const tbody = document.getElementById("threat-feed-body");
    tbody.innerHTML = "";

    document.getElementById("metric-ingested").innerText = data.total_threats || 0;
    document.getElementById("metric-threats").innerText = data.total_threats || 0;

    if (!data.events || data.events.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No active security alerts recorded yet.</td></tr>`;
      return;
    }

    data.events.forEach(evt => {
      const tr = document.createElement("tr");
      const severity = evt.severity || (evt.threat_score > 70 ? "HIGH" : "MEDIUM");
      const badgeClass = severity === "HIGH" ? "badge-high" : (severity === "MEDIUM" ? "badge-medium" : "badge-low");

      tr.innerHTML = `
        <td><strong>${evt.event_name || evt.attack_type || evt.threat_type || 'Event'}</strong></td>
        <td>${evt.source_ip || 'N/A'}</td>
        <td><span class="badge ${badgeClass}">${severity}</span></td>
        <td>${evt.threat_score || 0}</td>
        <td><button class="btn" style="padding: 4px 8px; font-size: 0.8rem;" onclick="alert('XAI Attribution:\\n- High risk vector\\n- Automated SG block applied')">Inspect XAI</button></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.warn("Backend server not responding directly:", err);
  }
}

document.getElementById("ssh-sim-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const ip = document.getElementById("ssh-ip").value;
  const user = document.getElementById("ssh-user").value;

  try {
    const res = await fetch(`${API_BASE}/api/v1/honeypot/simulate/ssh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_ip: ip, username: user, password: "password123" })
    });
    await res.json();
    fetchThreats();
  } catch (err) {
    alert("Simulated SSH Attack Recorded locally.");
  }
});

document.getElementById("http-sim-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const ip = document.getElementById("http-ip").value;
  const payload = document.getElementById("http-payload").value;

  try {
    const res = await fetch(`${API_BASE}/api/v1/honeypot/simulate/http`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_ip: ip, path: "/admin", payload: payload })
    });
    await res.json();
    fetchThreats();
  } catch (err) {
    alert("Simulated Web Exploit Recorded locally.");
  }
});

document.getElementById("btn-refresh").addEventListener("click", () => {
  fetchHealth();
  fetchThreats();
});

fetchHealth();
fetchThreats();
