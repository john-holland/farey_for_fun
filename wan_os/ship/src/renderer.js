const { ipcRenderer } = require('electron');

// Chart instances
let cpuChart, memoryChart, dailianceChart;

// Initialize charts
function initCharts() {
    const cpuCtx = document.getElementById('cpuChart').getContext('2d');
    const memoryCtx = document.getElementById('memoryChart').getContext('2d');
    const dailianceCtx = document.getElementById('dailianceChart').getContext('2d');

    cpuChart = new Chart(cpuCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'CPU Usage %',
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    memoryChart = new Chart(memoryCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Memory Usage %',
                data: [],
                borderColor: 'rgb(153, 102, 255)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    dailianceChart = new Chart(dailianceCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Dailiance Response Time (ms)',
                data: [],
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Update system information
async function updateSystemInfo() {
    try {
        const [info, dailianceMetrics] = await Promise.all([
            ipcRenderer.invoke('get-system-info'),
            ipcRenderer.invoke('get-dailiance-metrics')
        ]);
        
        // Update CPU chart
        const cpuUsage = info.cpu.speed;
        cpuChart.data.labels.push(new Date().toLocaleTimeString());
        cpuChart.data.datasets[0].data.push(cpuUsage);
        if (cpuChart.data.labels.length > 20) {
            cpuChart.data.labels.shift();
            cpuChart.data.datasets[0].data.shift();
        }
        cpuChart.update();

        // Update memory chart
        const memoryUsage = (info.memory.used / info.memory.total) * 100;
        memoryChart.data.labels.push(new Date().toLocaleTimeString());
        memoryChart.data.datasets[0].data.push(memoryUsage);
        if (memoryChart.data.labels.length > 20) {
            memoryChart.data.labels.shift();
            memoryChart.data.datasets[0].data.shift();
        }
        memoryChart.update();

        // Update Dailiance chart if metrics are available
        if (dailianceMetrics) {
            dailianceChart.data.labels.push(new Date().toLocaleTimeString());
            dailianceChart.data.datasets[0].data.push(dailianceMetrics.responseTime);
            if (dailianceChart.data.labels.length > 20) {
                dailianceChart.data.labels.shift();
                dailianceChart.data.datasets[0].data.shift();
            }
            dailianceChart.update();

            // Update Dailiance status
            document.getElementById('dailianceStatus').innerHTML = `
                <div class="bg-white p-3 rounded shadow">
                    <h4 class="font-semibold">Dailiance Status</h4>
                    <p class="text-sm text-gray-600">Response Time: ${dailianceMetrics.responseTime}ms</p>
                    <p class="text-sm text-gray-600">Active Users: ${dailianceMetrics.activeUsers}</p>
                    <p class="text-sm text-gray-600">Requests/min: ${dailianceMetrics.requestsPerMinute}</p>
                </div>
            `;
        }

        // Update network interfaces
        const networkDiv = document.getElementById('networkInterfaces');
        networkDiv.innerHTML = info.network.map(iface => `
            <div class="bg-white p-3 rounded shadow">
                <h4 class="font-semibold">${iface.iface}</h4>
                <p class="text-sm text-gray-600">IP: ${iface.ip4 || 'N/A'}</p>
                <p class="text-sm text-gray-600">MAC: ${iface.mac || 'N/A'}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error updating system info:', error);
    }
}

// Initialize compute node controls
async function initComputeNode() {
    const status = await ipcRenderer.invoke('get-compute-node-status');
    const computeToggle = document.getElementById('computeToggle');
    computeToggle.checked = status.enabled;

    computeToggle.addEventListener('change', async (e) => {
        const enabled = e.target.checked;
        await ipcRenderer.invoke('toggle-compute-node', enabled);
    });

    // Resource limit controls
    const cpuLimit = document.getElementById('cpuLimit');
    const memoryLimit = document.getElementById('memoryLimit');
    const cpuLimitValue = document.getElementById('cpuLimitValue');
    const memoryLimitValue = document.getElementById('memoryLimitValue');

    cpuLimit.addEventListener('input', (e) => {
        cpuLimitValue.textContent = `${e.target.value}%`;
    });

    memoryLimit.addEventListener('input', (e) => {
        memoryLimitValue.textContent = `${e.target.value}%`;
    });
}

// Load release plan documentation
async function loadReleasePlan() {
    try {
        const content = await ipcRenderer.invoke('get-release-plan');
        document.getElementById('releasePlan').innerHTML = content;
    } catch (error) {
        console.error('Error loading release plan:', error);
    }
}

// Tab switching
function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update tab styles
            tabs.forEach(t => {
                t.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
                t.classList.add('text-gray-600');
            });
            tab.classList.remove('text-gray-600');
            tab.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');

            // Show selected content
            const tabId = tab.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Initialize everything
async function init() {
    initCharts();
    initTabs();
    await initComputeNode();
    await loadReleasePlan();
    
    // Update system info every second
    setInterval(updateSystemInfo, 1000);
    updateSystemInfo();
}

// Start the app
init(); 