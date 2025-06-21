// Tabla de hosts máximos por máscara CIDR
const MAX_HOSTS_BY_MASK = {
    '/30': 2,
    '/29': 6,
    '/28': 14,
    '/27': 30,
    '/26': 62,
    '/25': 126,
    '/24': 254,
    '/23': 510,
    '/22': 1022,
    '/21': 2046,
    '/20': 4094,
    '/19': 8190,
    '/18': 16382,
    '/17': 32766,
    '/16': 65534,
    '/15': 131070,
    '/14': 262142,
    '/13': 524286,
    '/12': 1048574,
    '/11': 2097150,
    '/10': 4194302,
    '/9': 8388606,
    '/8': 16777214
};

// Variable global para almacenar la IP convertida
let convertedIP = '';

// Funciones de navegación
function showConverter() {
    document.querySelector('main').style.display = 'none';
    document.getElementById('converter-section').style.display = 'block';
    document.getElementById('subnet-section').style.display = 'none';
}

function showSubnetGenerator() {
    document.querySelector('main').style.display = 'none';
    document.getElementById('converter-section').style.display = 'none';
    document.getElementById('subnet-section').style.display = 'block';
}

function showHome() {
    document.querySelector('main').style.display = 'block';
    document.getElementById('converter-section').style.display = 'none';
    document.getElementById('subnet-section').style.display = 'none';
    
    // Limpiar resultados
    document.getElementById('conversion-result').innerHTML = '';
    document.getElementById('subnet-tbody').innerHTML = '';
    document.getElementById('remaining-subnets').innerHTML = '';
    document.getElementById('use-ip-btn').style.display = 'none';
    
    // Limpiar formularios
    document.getElementById('ip-input').value = '';
    document.getElementById('network-ip').value = '';
    document.getElementById('subnet-mask').value = '';
    document.getElementById('subnet-count').value = '';
    document.getElementById('host-count').value = '';
    
    // Limpiar variable global
    convertedIP = '';
}

// Función para usar la IP convertida en el generador de subredes
function useIPForSubnets() {
    if (convertedIP) {
        showSubnetGenerator();
        document.getElementById('network-ip').value = convertedIP;
        // Agregar efecto visual
        const networkInput = document.getElementById('network-ip');
        networkInput.style.background = 'rgba(0, 212, 170, 0.2)';
        networkInput.style.borderColor = '#00d4aa';
        setTimeout(() => {
            networkInput.style.background = '';
            networkInput.style.borderColor = '';
        }, 2000);
    }
}

// Función para calcular la potencia de 2 más cercana
function getNextPowerOfTwo(n) {
    if (n <= 0) return 1;
    return Math.pow(2, Math.ceil(Math.log2(n)));
}

// Funciones del conversor IP
function isValidIPv4(ip) {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Regex.test(ip)) return false;
    
    const parts = ip.split('.');
    return parts.every(part => {
        const num = parseInt(part);
        return num >= 0 && num <= 255;
    });
}

function isValidIPv6(ip) {
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
    return ipv6Regex.test(ip) || ip.includes('::');
}

function ipv4ToIPv6(ipv4) {
    const parts = ipv4.split('.');
    const hex1 = (parseInt(parts[0]) * 256 + parseInt(parts[1])).toString(16).padStart(4, '0');
    const hex2 = (parseInt(parts[2]) * 256 + parseInt(parts[3])).toString(16).padStart(4, '0');
    return `::ffff:${hex1}:${hex2}`;
}

function ipv6ToIPv4(ipv6) {
    // Simplificado para IPv6 mapeadas a IPv4
    if (ipv6.includes('::ffff:')) {
        const hex = ipv6.split('::ffff:')[1];
        const parts = hex.split(':');
        if (parts.length === 2) {
            const part1 = parseInt(parts[0], 16);
            const part2 = parseInt(parts[1], 16);
            const octet1 = Math.floor(part1 / 256);
            const octet2 = part1 % 256;
            const octet3 = Math.floor(part2 / 256);
            const octet4 = part2 % 256;
            return `${octet1}.${octet2}.${octet3}.${octet4}`;
        }
    }
    return null;
}

function convertIP() {
    const input = document.getElementById('ip-input').value.trim();
    const resultDiv = document.getElementById('conversion-result');
    const useIpBtn = document.getElementById('use-ip-btn');
    
    if (!input) {
        resultDiv.innerHTML = '<div class="error">⚠️ Por favor, ingrese una dirección IP.</div>';
        useIpBtn.style.display = 'none';
        convertedIP = '';
        return;
    }
    
    let result = '';
    
    if (isValidIPv4(input)) {
        const ipv6 = ipv4ToIPv6(input);
        convertedIP = input; // Guardar la IP original para usar en subredes
        result = `
            <div class="success">
                <h3>✅ Conversión IPv4 → IPv6</h3>
                <p><strong>📱 IPv4 Original:</strong> ${input}</p>
                <p><strong>🌍 IPv6 Equivalente:</strong> ${ipv6}</p>
                <p><strong>🔍 IPv6 Expandido:</strong> 0000:0000:0000:0000:0000:ffff:${ipv6.split('::ffff:')[1]}</p>
            </div>
        `;
        useIpBtn.style.display = 'flex';
    } else if (isValidIPv6(input)) {
        const ipv4 = ipv6ToIPv4(input);
        if (ipv4) {
            convertedIP = ipv4; // Guardar la IP convertida para usar en subredes
            result = `
                <div class="success">
                    <h3>✅ Conversión IPv6 → IPv4</h3>
                    <p><strong>🌍 IPv6 Original:</strong> ${input}</p>
                    <p><strong>📱 IPv4 Equivalente:</strong> ${ipv4}</p>
                </div>
            `;
            useIpBtn.style.display = 'flex';
        } else {
            convertedIP = '';
            result = `
                <div class="error">
                    <h3>🌍 IPv6 Pura</h3>
                    <p>Esta dirección IPv6 no tiene equivalente directo en IPv4.</p>
                    <p><strong>IPv6:</strong> ${input}</p>
                    <p>Las direcciones IPv6 puras no pueden convertirse a IPv4.</p>
                </div>
            `;
            useIpBtn.style.display = 'none';
        }
    } else {
        result = '<div class="error">❌ Dirección IP no válida. Ingrese una dirección IPv4 o IPv6 válida.</div>';
        useIpBtn.style.display = 'none';
        convertedIP = '';
    }
    
    resultDiv.innerHTML = result;
}

// Funciones del generador de subredes
function ipToNumber(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

function numberToIp(num) {
    return [
        (num >>> 24) & 255,
        (num >>> 16) & 255,
        (num >>> 8) & 255,
        num & 255
    ].join('.');
}

function cidrToMask(cidr) {
    const mask = (0xffffffff << (32 - cidr)) >>> 0;
    return numberToIp(mask);
}

function maskToCidr(mask) {
    const maskNum = ipToNumber(mask);
    return 32 - Math.log2((~maskNum >>> 0) + 1);
}

function calculateSubnetInfo(networkIp, subnetMask, subnetIndex, hostsNeeded) {
    let cidr;
    
    // Determinar si la máscara está en formato CIDR o decimal
    if (subnetMask.startsWith('/')) {
        cidr = parseInt(subnetMask.substring(1));
    } else if (subnetMask.includes('.')) {
        cidr = maskToCidr(subnetMask);
    } else {
        cidr = parseInt(subnetMask);
    }
    
    // Calcular bits necesarios para hosts
    const hostBits = Math.ceil(Math.log2(hostsNeeded + 2)); // +2 para red y broadcast
    const newCidr = 32 - hostBits;
    const subnetSize = Math.pow(2, hostBits);
    
    // Calcular dirección de red base
    const networkNum = ipToNumber(networkIp);
    const subnetStart = networkNum + (subnetIndex * subnetSize);
    
    // Calcular direcciones
    const networkAddr = subnetStart;
    const broadcastAddr = subnetStart + subnetSize - 1;
    const firstHost = subnetStart + 1;
    const lastHost = broadcastAddr - 1;
    const routerAddr = firstHost; // Generalmente el primer host es el router
    
    return {
        subnetName: String.fromCharCode(65 + subnetIndex), // A, B, C, D...
        networkAddr: numberToIp(networkAddr),
        broadcastAddr: numberToIp(broadcastAddr),
        firstHost: numberToIp(firstHost),
        lastHost: numberToIp(lastHost),
        routerAddr: numberToIp(routerAddr),
        cidr: newCidr
    };
}

function generateSubnets() {
    const networkIp = document.getElementById('network-ip').value.trim();
    const subnetMask = document.getElementById('subnet-mask').value;
    const subnetCount = parseInt(document.getElementById('subnet-count').value);
    const hostCount = parseInt(document.getElementById('host-count').value);
    const tbody = document.getElementById('subnet-tbody');
    const remainingDiv = document.getElementById('remaining-subnets');
    
    // Limpiar información anterior
    remainingDiv.innerHTML = '';
    
    // Validaciones
    if (!networkIp || !subnetMask || !subnetCount || !hostCount) {
        alert('⚠️ Por favor, complete todos los campos.');
        return;
    }
    
    if (!isValidIPv4(networkIp)) {
        alert('❌ Ingrese una dirección IP de red válida.');
        return;
    }
    
    if (subnetCount <= 0 || subnetCount > 26) {
        alert('⚠️ El número de subredes debe estar entre 1 y 26.');
        return;
    }
    
    if (hostCount <= 0 || hostCount > 65534) {
        alert('⚠️ El número de hosts debe estar entre 1 y 65534.');
        return;
    }
    
    // Validación de hosts máximos por máscara
    const maxHosts = MAX_HOSTS_BY_MASK[subnetMask];
    if (maxHosts && hostCount > maxHosts) {
        alert(`❌ Error: La cantidad máxima de hosts para la máscara ${subnetMask} es ${maxHosts.toLocaleString()}.`);
        return;
    }
    
    // Calcular direcciones sobrantes
    const nextPowerOfTwo = getNextPowerOfTwo(subnetCount);
    const remainingSubnets = nextPowerOfTwo - subnetCount;
    
    // Mostrar información de direcciones sobrantes
    remainingDiv.innerHTML = `
        <div style="text-align: center;">
            <div style="margin-bottom: 8px;">📊 <strong>Direcciones generadas:</strong> ${nextPowerOfTwo} (2^${Math.log2(nextPowerOfTwo)})</div>
            <div style="margin-bottom: 8px;">📋 <strong>Subredes solicitadas:</strong> ${subnetCount}</div>
            <div>✨ <strong>Direcciones sobrantes:</strong> ${remainingSubnets}</div>
        </div>
    `;
    
    // Limpiar tabla anterior
    tbody.innerHTML = '';
    
    try {
        // Generar subredes
        for (let i = 0; i < subnetCount; i++) {
            const subnetInfo = calculateSubnetInfo(networkIp, subnetMask, i, hostCount);
            
            const row = tbody.insertRow();
            row.innerHTML = `
                <td><strong>${subnetInfo.subnetName}</strong></td>
                <td>${subnetInfo.networkAddr}/${subnetInfo.cidr}</td>
                <td>${subnetInfo.broadcastAddr}</td>
                <td>${subnetInfo.routerAddr}</td>
                <td>${subnetInfo.broadcastAddr}</td>
                <td>${subnetInfo.firstHost}</td>
                <td>${subnetInfo.lastHost}</td>
            `;
        }
    } catch (error) {
        alert('❌ Error al generar las subredes. Verifique los datos ingresados.');
        console.error(error);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Permitir conversión con Enter en el campo de IP
    document.getElementById('ip-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            convertIP();
        }
    });
    
    // Permitir generación con Enter en los campos de subnet (excepto el select)
    const subnetInputs = ['network-ip', 'subnet-count', 'host-count'];
    subnetInputs.forEach(id => {
        document.getElementById(id).addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                generateSubnets();
            }
        });
    });
});