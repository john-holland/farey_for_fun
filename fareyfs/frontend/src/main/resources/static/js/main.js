// API endpoints
const API_BASE = '/api/filesystem';

// File browser functionality
function loadFileBrowser(nodeId = null) {
    const url = nodeId ? `${API_BASE}/nodes/${nodeId}/children` : `${API_BASE}/root`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const browser = document.querySelector('.file-browser');
            browser.innerHTML = '';
            
            data.forEach(node => {
                const item = createFileItem(node);
                browser.appendChild(item);
            });
        })
        .catch(error => console.error('Error loading files:', error));
}

function createFileItem(node) {
    const div = document.createElement('div');
    div.className = 'file-item';
    
    const icon = document.createElement('i');
    icon.className = getNodeIcon(node.nodeType);
    
    const name = document.createElement('span');
    name.textContent = node.name;
    
    const metadata = document.createElement('small');
    metadata.className = 'text-muted';
    metadata.textContent = `Farey: ${node.leftDenominator}/${node.rightDenominator}`;
    
    div.appendChild(icon);
    div.appendChild(name);
    div.appendChild(metadata);
    
    if (node.nodeType === 'DIRECTORY') {
        div.addEventListener('click', () => loadFileBrowser(node.id));
    } else if (node.nodeType === 'FILE') {
        div.addEventListener('click', () => openFile(node.id));
    }
    
    return div;
}

function getNodeIcon(nodeType) {
    const icons = {
        'ROOT': 'fas fa-home',
        'IP': 'fas fa-network-wired',
        'COMPUTER': 'fas fa-desktop',
        'DRIVE': 'fas fa-hdd',
        'DIRECTORY': 'fas fa-folder',
        'FILE': 'fas fa-file',
        'CONTENT': 'fas fa-file-alt'
    };
    return icons[nodeType] || 'fas fa-question';
}

// Search functionality
function searchFiles() {
    const query = document.getElementById('searchInput').value;
    const type = document.getElementById('searchType').value;
    
    let url;
    switch (type) {
        case 'name':
            url = `${API_BASE}/search/name?name=${query}`;
            break;
        case 'type':
            url = `${API_BASE}/search/type?type=${query}`;
            break;
        case 'farey':
            const [left, right] = query.split('/');
            url = `${API_BASE}/search/farey?left=${left}&right=${right}`;
            break;
        case 'prime-log':
            url = `${API_BASE}/search/prime-log?encoding=${query}`;
            break;
    }
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const results = document.querySelector('.search-results');
            results.innerHTML = '';
            
            data.forEach(node => {
                const item = createFileItem(node);
                results.appendChild(item);
            });
        })
        .catch(error => console.error('Error searching files:', error));
}

// Tree visualization
function visualizeTree() {
    const width = document.querySelector('.tree-container').offsetWidth;
    const height = 500;
    
    const svg = d3.select('.tree-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    fetch(`${API_BASE}/root`)
        .then(response => response.json())
        .then(root => {
            const tree = d3.tree()
                .size([width - 40, height - 40]);
            
            const rootNode = d3.hierarchy(root);
            const treeData = tree(rootNode);
            
            // Draw links
            svg.selectAll('.link')
                .data(treeData.links())
                .enter()
                .append('path')
                .attr('class', 'link')
                .attr('d', d3.linkVertical()
                    .x(d => d.x)
                    .y(d => d.y));
            
            // Draw nodes
            const node = svg.selectAll('.node')
                .data(treeData.descendants())
                .enter()
                .append('g')
                .attr('class', 'node')
                .attr('transform', d => `translate(${d.x},${d.y})`);
            
            node.append('circle')
                .attr('r', 5);
            
            node.append('text')
                .attr('dy', '.31em')
                .attr('x', d => d.children ? -6 : 6)
                .attr('text-anchor', d => d.children ? 'end' : 'start')
                .text(d => d.data.name);
        })
        .catch(error => console.error('Error visualizing tree:', error));
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize file browser if on browser page
    if (document.querySelector('.file-browser')) {
        loadFileBrowser();
    }
    
    // Initialize search if on search page
    if (document.querySelector('.search-container')) {
        document.getElementById('searchButton').addEventListener('click', searchFiles);
    }
    
    // Initialize tree visualizer if on visualizer page
    if (document.querySelector('.tree-container')) {
        visualizeTree();
    }
}); 