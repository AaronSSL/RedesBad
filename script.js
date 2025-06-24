// Tabla de hosts máximos por máscara CIDR (solo /24 a /30)
const MAX_HOSTS_BY_MASK = {
  "/30": 2,
  "/29": 6,
  "/28": 14,
  "/27": 30,
  "/26": 62,
  "/25": 126,
  "/24": 254,
}

// Tabla de direcciones totales por máscara CIDR (solo /24 a /30)
const TOTAL_ADDRESSES_BY_MASK = {
  "/30": 4,
  "/29": 8,
  "/28": 16,
  "/27": 32,
  "/26": 64,
  "/25": 128,
  "/24": 256,
}

// Variable global para almacenar la IP convertida
let convertedIP = ""

// Funciones de navegación
function showConverter() {
  document.querySelector("main").style.display = "none"
  document.getElementById("converter-section").style.display = "block"
  document.getElementById("subnet-section").style.display = "none"
}

function showSubnetGenerator() {
  document.querySelector("main").style.display = "none"
  document.getElementById("converter-section").style.display = "none"
  document.getElementById("subnet-section").style.display = "block"
}

function showHome() {
  document.querySelector("main").style.display = "block"
  document.getElementById("converter-section").style.display = "none"
  document.getElementById("subnet-section").style.display = "none"

  // Limpiar resultados
  document.getElementById("conversion-result").innerHTML = ""
  document.getElementById("subnet-tbody").innerHTML = ""
  document.getElementById("remaining-subnets").innerHTML = ""
  document.getElementById("use-ip-btn").style.display = "none"

  // Limpiar formularios
  document.getElementById("ip-input").value = ""
  document.getElementById("network-ip").value = ""
  document.getElementById("subnet-mask").value = ""
  document.getElementById("subnet-count").value = ""
  document.getElementById("host-count").value = ""
  document.getElementById("total-addresses").value = ""

  // Limpiar variable global
  convertedIP = ""
}

// Función para validar IP de red con restricciones de Clase C
function isValidNetworkIP(ip) {
  if (!isValidIPv4(ip)) return false
  
  const parts = ip.split(".")
  const firstOctet = parseInt(parts[0])
  
  // Verificar que esté en el rango 192.x.x.x a 223.x.x.x (Clase C)
  if (firstOctet < 192 || firstOctet > 223) {
    return false
  }
  
  return true
}

// Función para usar la IP convertida en el generador de subredes
function useIPForSubnets() {
  if (convertedIP) {
    // Verificar si la IP convertida cumple con las restricciones antes de usarla
    if (!isValidNetworkIP(convertedIP)) {
      alert("⚠️ La IP convertida no está en el rango permitido (192.x.x.x - 223.x.x.x) para el generador de subredes.")
      return
    }
    
    showSubnetGenerator()
    document.getElementById("network-ip").value = convertedIP
    // Agregar efecto visual
    const networkInput = document.getElementById("network-ip")
    networkInput.style.background = "rgba(0, 212, 170, 0.2)"
    networkInput.style.borderColor = "#00d4aa"
    setTimeout(() => {
      networkInput.style.background = ""
      networkInput.style.borderColor = ""
    }, 2000)
  }
}

// Función para calcular la potencia de 2 más cercana hacia adelante
function getNextPowerOfTwo(n) {
  if (n <= 0) return 1
  return Math.pow(2, Math.ceil(Math.log2(n)))
}

// Función para calcular la máscara CIDR basada en la cantidad de hosts
/*function calculateCIDRFromHosts(hostCount) {
  // Agregar 2 para dirección de red y broadcast
  const totalAddresses = hostCount + 2
  // Encontrar la potencia de 2 más cercana hacia adelante
  const powerOfTwo = getNextPowerOfTwo(totalAddresses)
  // Calcular los bits de host necesarios
  const hostBits = Math.log2(powerOfTwo)
  // Calcular CIDR (32 - bits de host)
  const cidr = 32 - Math.round(hostBits)
  
  // Verificar que el CIDR esté en el rango permitido (/24 a /30)
  if (cidr < 24 || cidr > 30) {
    // Si está fuera del rango, ajustar al más cercano
    if (cidr < 24) return "/24"
    if (cidr > 30) return "/30"
  }
  
  return `/${cidr}`
}*/

function calculateCIDRFromHosts(hostCount) {
  const totalNeeded = hostCount + 2; // Incluir red y broadcast

  // Ordenar las máscaras de /30 a /24 (menor a mayor capacidad)
  const sortedMasks = ["/30", "/29", "/28", "/27", "/26", "/25", "/24"];
  
  for (const cidr of sortedMasks) {
    const total = TOTAL_ADDRESSES_BY_MASK[cidr];
    if (total >= totalNeeded) {
      return cidr;
    }
  }

  // Si ningún CIDR puede cubrir el total, devolver /24 por defecto
  return "/24";
}

// Función para calcular hosts por subred dividiendo equitativamente
function calculateEqualSubnets(totalHosts, subnetCount) {
  // Obtener el total de direcciones disponibles desde la máscara seleccionada
  const selectedMask = document.getElementById("subnet-mask").value
  const totalAvailableAddresses = TOTAL_ADDRESSES_BY_MASK[selectedMask] || totalHosts + 2

  // Dividir direcciones equitativamente entre subredes
  const addressesPerSubnet = Math.floor(totalAvailableAddresses / subnetCount)

  // Los hosts por subred son las direcciones menos red y broadcast
  const hostsPerSubnet = addressesPerSubnet - 2

  // Para VLSM, necesitamos que las direcciones sean potencia de 2
  // Pero queremos usar exactamente las direcciones calculadas si ya son potencia de 2
  let actualAddressesPerSubnet = addressesPerSubnet

  // Verificar si addressesPerSubnet es potencia de 2
  const isPowerOfTwo = (n) => n > 0 && (n & (n - 1)) === 0

  if (!isPowerOfTwo(addressesPerSubnet)) {
    // Si no es potencia de 2, encontrar la potencia de 2 más cercana hacia abajo
    // que no exceda el total disponible
    actualAddressesPerSubnet = Math.pow(2, Math.floor(Math.log2(addressesPerSubnet)))
  }

  // Verificar que el total no exceda las direcciones disponibles
  const totalUsed = actualAddressesPerSubnet * subnetCount
  if (totalUsed > totalAvailableAddresses) {
    // Reducir a la siguiente potencia de 2 menor
    actualAddressesPerSubnet = actualAddressesPerSubnet / 2
  }

  const actualHostsPerSubnet = actualAddressesPerSubnet - 2

  const subnets = []

  // Crear subredes iguales
  for (let i = 0; i < subnetCount; i++) {
    subnets.push({
      name: String.fromCharCode(65 + i),
      requestedHosts: actualHostsPerSubnet,
      actualHosts: actualHostsPerSubnet,
      totalAddresses: actualAddressesPerSubnet,
      cidr: calculateCIDRFromHosts(actualHostsPerSubnet),
      subnetSize: actualAddressesPerSubnet,
    })
  }

  return subnets
}

// Función para recalcular todas las subredes dinámicamente
function recalculateAllSubnets() {
  const networkIp = document.getElementById("network-ip").value.trim()
  const totalHosts = parseInt(document.getElementById("host-count").value)
  const tbody = document.getElementById("subnet-tbody")

  if (!networkIp || !totalHosts || tbody.rows.length === 0) return

  // Validar IP de red con restricciones
  if (!isValidNetworkIP(networkIp)) {
    alert("❌ Error: La IP de red debe estar en el rango 192.x.x.x a 223.x.x.x (Clase C)")
    return
  }

  // Separar la IP base en octetos
  const ipParts = networkIp.split(".")
  const baseOctets = [
    parseInt(ipParts[0]),
    parseInt(ipParts[1]),
    parseInt(ipParts[2]),
    parseInt(ipParts[3]),
  ]

  let currentOffset = 0
  let totalUsedHosts = 0

  // Recalcular cada subred basándose en la anterior
  for (let i = 0; i < tbody.rows.length; i++) {
    const row = tbody.rows[i]
    const hostsCell = row.cells[2] // La columna de hosts
    const requestedHosts = parseInt(hostsCell.textContent)

    // Aproximar a la potencia de 2 más cercana hacia adelante SOLO para direccionamiento
    const actualHosts = getNextPowerOfTwo(requestedHosts)
    const totalAddresses = actualHosts //+ 2

    // Verificar que no exceda el total de hosts disponibles
    if (totalUsedHosts + actualHosts > totalHosts) {
      alert(
        `❌ Error: La subred ${String.fromCharCode(65 + i)} requiere ${actualHosts} hosts, pero solo quedan ${totalHosts - totalUsedHosts} hosts disponibles.`,
      )
      return
    }

    // Calcular la máscara CIDR basada en los hosts reales
    //const cidr = calculateCIDRFromHosts(actualHosts) 
    // Calcular la máscara CIDR basada en los hosts solicitados
    const cidr = calculateCIDRFromHosts(requestedHosts)

    // Calcular direcciones para esta subred
    const networkAddr = `${baseOctets[0]}.${baseOctets[1]}.${baseOctets[2]}.${baseOctets[3] + currentOffset}`
    const finalAddr = `${baseOctets[0]}.${baseOctets[1]}.${baseOctets[2]}.${baseOctets[3] + currentOffset + actualHosts - 1}`
    const broadcastAddr = `${baseOctets[0]}.${baseOctets[1]}.${baseOctets[2]}.${baseOctets[3] + currentOffset + actualHosts - 1}`
    const firstHost = `${baseOctets[0]}.${baseOctets[1]}.${baseOctets[2]}.${baseOctets[3] + currentOffset + 1}`
    const lastHost = `${baseOctets[0]}.${baseOctets[1]}.${baseOctets[2]}.${baseOctets[3] + currentOffset + actualHosts - 2}`
    const routerAddr = firstHost

    // Actualizar la fila
    row.cells[1].textContent = `${networkAddr}${cidr}`
    row.cells[2].textContent = requestedHosts // Hosts solicitados
    row.cells[3].textContent = totalAddresses // Total de direcciones
    row.cells[4].textContent = finalAddr
    row.cells[5].textContent = routerAddr
    row.cells[6].textContent = broadcastAddr
    row.cells[7].textContent = firstHost
    row.cells[8].textContent = lastHost

    // Incrementar por el total de direcciones
    currentOffset += totalAddresses
    totalUsedHosts += actualHosts
  }

  // Actualizar información de hosts restantes
  updateRemainingHostsInfo(totalHosts, totalUsedHosts)
}

// Función para actualizar información de hosts restantes
function updateRemainingHostsInfo(totalHosts, usedHosts) {
  const remainingDiv = document.getElementById("remaining-subnets")
  const remainingHosts = totalHosts - usedHosts

  remainingDiv.innerHTML = `
        <div style="text-align: center;">
            <div style="margin-bottom: 8px;">📊 <strong>Total de hosts:</strong> ${totalHosts}</div>
            <div style="margin-bottom: 8px;">✅ <strong>Hosts utilizados:</strong> ${usedHosts}</div>
            <div style="color: ${remainingHosts >= 0 ? "#00d4aa" : "#ff4757"};">✨ <strong>Hosts restantes:</strong> ${remainingHosts}</div>
        </div>
    `
}

// Función para editar nombre de subred
function editSubnetName(rowIndex) {
  const row = document.getElementById("subnet-table").rows[rowIndex + 1]
  const nameCell = row.cells[0]
  const currentName = nameCell.textContent.trim()

  const newName = prompt("Editar nombre de subred:", currentName)
  if (newName && newName.trim() !== "") {
    nameCell.innerHTML = `<strong>${newName.trim()}</strong>`
  }
}

// Función para editar hosts de subred
function editSubnetHosts(rowIndex) {
  const row = document.getElementById("subnet-table").rows[rowIndex + 1]
  const hostsCell = row.cells[2] // Columna de hosts
  const currentHosts = hostsCell.textContent

  const newHosts = prompt("Ingrese nueva cantidad de hosts para esta subred:", currentHosts)

  if (newHosts && !isNaN(newHosts) && parseInt(newHosts) > 0) {
    const requestedHosts = parseInt(newHosts)

    // Verificar límites según las máscaras permitidas
    if (requestedHosts > 254) {
      alert("❌ Error: El máximo de hosts permitido es 254 (máscara /24)")
      return
    }

    if (requestedHosts < 2) {
      alert("❌ Error: El mínimo de hosts permitido es 2 (máscara /30)")
      return
    }

    // Aproximar a la potencia de 2 más cercana hacia adelante
    const actualHosts = getNextPowerOfTwo(requestedHosts)

    // Mostrar al usuario la aproximación si es diferente
    if (actualHosts !== requestedHosts) {
      const confirm = window.confirm(
        `Los ${requestedHosts} hosts solicitados se aproximarán a ${actualHosts} hosts (potencia de 2).\n¿Desea continuar?`,
      )
      if (!confirm) return
    }

    // Calcular la nueva máscara CIDR basada en los hosts reales
    const newCIDR = calculateCIDRFromHosts(actualHosts)

    // Validar que la máscara esté en el rango permitido
    const cidrNumber = parseInt(newCIDR.substring(1))
    if (cidrNumber < 24 || cidrNumber > 30) {
      alert(`❌ Error: La máscara calculada ${newCIDR} está fuera del rango permitido (/24 a /30)`)
      return
    }

    // Validar hosts máximos por máscara
    const maxHosts = MAX_HOSTS_BY_MASK[newCIDR]
    if (maxHosts && actualHosts > maxHosts) {
      alert(`❌ Error: La cantidad máxima de hosts para la máscara ${newCIDR} es ${maxHosts.toLocaleString()}.`)
      return
    }

    // Actualizar la cantidad de hosts en la celda (mantener los hosts solicitados)
    hostsCell.textContent = requestedHosts

    // Recalcular todas las subredes dinámicamente
    recalculateAllSubnets()
  }
}

// Agregar funciones para editar desde la cabecera
function editAllSubnetNames() {
  const tbody = document.getElementById("subnet-tbody")
  for (let i = 0; i < tbody.rows.length; i++) {
    const row = tbody.rows[i]
    const nameCell = row.cells[0]
    const currentName = nameCell.textContent.trim()

    const newName = prompt(`Editar nombre de subred ${i + 1}:`, currentName)
    if (newName && newName.trim() !== "") {
      nameCell.innerHTML = `<strong>${newName.trim()}</strong>`
    }
  }
}

// Función para editar hosts desde la cabecera
function editAllSubnetHosts() {
  const tbody = document.getElementById("subnet-tbody")
  const totalHosts = parseInt(document.getElementById("host-count").value)
  let totalUsedHosts = 0

  for (let i = 0; i < tbody.rows.length; i++) {
    const row = tbody.rows[i]
    const hostsCell = row.cells[2]
    const currentHosts = hostsCell.textContent

    const newHosts = prompt(`Ingrese cantidad de hosts para subred ${i + 1}:`, currentHosts)

    if (newHosts && !isNaN(newHosts) && parseInt(newHosts) > 0) {
      const requestedHosts = parseInt(newHosts)

      // Verificar límites según las máscaras permitidas
      if (requestedHosts > 254) {
        alert(`❌ Error: El máximo de hosts permitido es 254 (máscara /24) para la subred ${i + 1}`)
        continue
      }

      if (requestedHosts < 2) {
        alert(`❌ Error: El mínimo de hosts permitido es 2 (máscara /30) para la subred ${i + 1}`)
        continue
      }

      const actualHosts = getNextPowerOfTwo(requestedHosts)

      // Verificar que no exceda el total
      if (totalUsedHosts + actualHosts > totalHosts) {
        alert(
          `❌ Error: La subred ${String.fromCharCode(65 + i)} requiere ${actualHosts} hosts, pero solo quedan ${totalHosts - totalUsedHosts} hosts disponibles.`,
        )
        continue
      }

      // Calcular la nueva máscara CIDR basada en los hosts reales
      const newCIDR = calculateCIDRFromHosts(actualHosts)

      // Validar que la máscara esté en el rango permitido
      const cidrNumber = parseInt(newCIDR.substring(1))
      if (cidrNumber < 24 || cidrNumber > 30) {
        alert(`❌ Error: La máscara calculada ${newCIDR} para la subred ${i + 1} está fuera del rango permitido (/24 a /30)`)
        continue
      }

      // Validar hosts máximos por máscara
      const maxHosts = MAX_HOSTS_BY_MASK[newCIDR]
      if (maxHosts && actualHosts > maxHosts) {
        alert(`❌ Error: La cantidad máxima de hosts para la máscara ${newCIDR} es ${maxHosts.toLocaleString()}.`)
        continue
      }

      // Actualizar la cantidad de hosts en la celda (mantener los hosts solicitados)
      hostsCell.textContent = requestedHosts
      totalUsedHosts += actualHosts
    }
  }

  // Recalcular todas las subredes dinámicamente
  recalculateAllSubnets()
}

// Funciones del conversor IP
function isValidIPv4(ip) {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (!ipv4Regex.test(ip)) return false

  const parts = ip.split(".")
  return parts.every((part) => {
    const num = parseInt(part)
    return num >= 0 && num <= 255
  })
}

function isValidIPv6(ip) {
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/
  return ipv6Regex.test(ip) || ip.includes("::")
}

function ipv4ToIPv6(ipv4) {
  const parts = ipv4.split(".")
  const hex1 = (parseInt(parts[0]) * 256 + parseInt(parts[1])).toString(16).padStart(4, "0")
  const hex2 = (parseInt(parts[2]) * 256 + parseInt(parts[3])).toString(16).padStart(4, "0")
  return `::ffff:${hex1}:${hex2}`
}

function ipv6ToIPv4(ipv6) {
  // Simplificado para IPv6 mapeadas a IPv4
  if (ipv6.includes("::ffff:")) {
    const hex = ipv6.split("::ffff:")[1]
    const parts = hex.split(":")
    if (parts.length === 2) {
      const part1 = parseInt(parts[0], 16)
      const part2 = parseInt(parts[1], 16)
      const octet1 = Math.floor(part1 / 256)
      const octet2 = part1 % 256
      const octet3 = Math.floor(part2 / 256)
      const octet4 = part2 % 256
      return `${octet1}.${octet2}.${octet3}.${octet4}`
    }
  }
  return null
}

function convertIP() {
  const input = document.getElementById("ip-input").value.trim()
  const resultDiv = document.getElementById("conversion-result")
  const useIpBtn = document.getElementById("use-ip-btn")

  if (!input) {
    resultDiv.innerHTML = '<div class="error">⚠️ Por favor, ingrese una dirección IP.</div>'
    useIpBtn.style.display = "none"
    convertedIP = ""
    return
  }

  let result = ""

  if (isValidIPv4(input)) {
    const ipv6 = ipv4ToIPv6(input)
    convertedIP = input // Guardar la IP original para usar en subredes
    
    // Verificar si la IP está en el rango permitido para mostrar el botón
    const showButton = isValidNetworkIP(input)
    
    result = `
            <div class="success">
                <h3>✅ Conversión IPv4 → IPv6</h3>
                <p><strong>📱 IPv4 Original:</strong> ${input}</p>
                <p><strong>🌍 IPv6 Equivalente:</strong> ${ipv6}</p>
                <p><strong>🔍 IPv6 Expandido:</strong> 0000:0000:0000:0000:0000:ffff:${ipv6.split("::ffff:")[1]}</p>
                ${!showButton ? '<p><strong>⚠️ Nota:</strong> Esta IP no está en el rango 192.x.x.x - 223.x.x.x requerido para el generador de subredes.</p>' : ''}
            </div>
        `
    useIpBtn.style.display = showButton ? "flex" : "none"
  } else if (isValidIPv6(input)) {
    const ipv4 = ipv6ToIPv4(input)
    if (ipv4) {
      convertedIP = ipv4 // Guardar la IP convertida para usar en subredes
      
      // Verificar si la IP convertida está en el rango permitido
      const showButton = isValidNetworkIP(ipv4)
      
      result = `
                <div class="success">
                    <h3>✅ Conversión IPv6 → IPv4</h3>
                    <p><strong>🌍 IPv6 Original:</strong> ${input}</p>
                    <p><strong>📱 IPv4 Equivalente:</strong> ${ipv4}</p>
                    ${!showButton ? '<p><strong>⚠️ Nota:</strong> La IP convertida no está en el rango 192.x.x.x - 223.x.x.x requerido para el generador de subredes.</p>' : ''}
                </div>
            `
      useIpBtn.style.display = showButton ? "flex" : "none"
    } else {
      convertedIP = ""
      result = `
                <div class="error">
                    <h3>🌍 IPv6 Pura</h3>
                    <p>Esta dirección IPv6 no tiene equivalente directo en IPv4.</p>
                    <p><strong>IPv6:</strong> ${input}</p>
                    <p>Las direcciones IPv6 puras no pueden convertirse a IPv4.</p>
                </div>
            `
      useIpBtn.style.display = "none"
    }
  } else {
    result = '<div class="error">❌ Dirección IP no válida. Ingrese una dirección IPv4 o IPv6 válida.</div>'
    useIpBtn.style.display = "none"
    convertedIP = ""
  }

  resultDiv.innerHTML = result
}

// Funciones del generador de subredes
function generateSubnets() {
  const networkIp = document.getElementById("network-ip").value.trim()
  const subnetMask = document.getElementById("subnet-mask").value
  const subnetCount = parseInt(document.getElementById("subnet-count").value)
  const hostCount = parseInt(document.getElementById("host-count").value)
  const tbody = document.getElementById("subnet-tbody")
  const remainingDiv = document.getElementById("remaining-subnets")

  // Limpiar información anterior
  remainingDiv.innerHTML = ""

  // Validaciones básicas
  if (!networkIp || !subnetMask || !subnetCount || !hostCount) {
    alert("⚠️ Por favor, complete todos los campos.")
    return
  }

  // Validar IP de red con restricciones de Clase C
  if (!isValidNetworkIP(networkIp)) {
    alert("❌ Error: La IP de red debe estar en el rango 192.x.x.x a 223.x.x.x (Clase C)")
    return
  }

  // Validar máscara en rango permitido
  const allowedMasks = ["/24", "/25", "/26", "/27", "/28", "/29", "/30"]
  if (!allowedMasks.includes(subnetMask)) {
    alert("❌ Error: Solo se permiten máscaras de /24 a /30")
    return
  }

  if (subnetCount <= 0 || subnetCount > 26) {
    alert("⚠️ El número de subredes debe estar entre 1 y 26.")
    return
  }

  if (hostCount <= 0 || hostCount > 254) {
    alert("⚠️ El número de hosts debe estar entre 1 y 254 (máximo para Clase C).")
    return
  }

  // Validación de hosts máximos por máscara
  const maxHosts = MAX_HOSTS_BY_MASK[subnetMask]
  if (maxHosts && hostCount > maxHosts) {
    alert(`❌ Error: La cantidad máxima de hosts para la máscara ${subnetMask} es ${maxHosts.toLocaleString()}.`)
    return
  }

  // Validación adicional: verificar que las subredes no excedan las direcciones totales
  const totalAvailableAddresses = TOTAL_ADDRESSES_BY_MASK[subnetMask]
  if (totalAvailableAddresses) {
    const minAddressesNeeded = subnetCount * 4 // Mínimo 4 direcciones por subred (/30)
    if (minAddressesNeeded > totalAvailableAddresses) {
      alert(`❌ Error: No es posible crear ${subnetCount} subredes con la máscara ${subnetMask}. 
Direcciones disponibles: ${totalAvailableAddresses}
Direcciones mínimas necesarias: ${minAddressesNeeded}`)
      return
    }
  }

  // Calcular subredes dividiendo equitativamente
  const equalSubnets = calculateEqualSubnets(hostCount, subnetCount)

  // Limpiar tabla anterior
  tbody.innerHTML = ""

  // Separar la IP base en octetos
  const ipParts = networkIp.split(".")
  const baseOctets = [
    parseInt(ipParts[0]),
    parseInt(ipParts[1]),
    parseInt(ipParts[2]),
    parseInt(ipParts[3]),
  ]

  let currentOffset = 0
  let totalUsedHosts = 0

  try {
    // Generar subredes iguales
    for (let i = 0; i < equalSubnets.length; i++) {
      const subnet = equalSubnets[i]

      // Calcular direcciones para esta subred
      const networkAddr = `${baseOctets[0]}.${baseOctets[1]}.${baseOctets[2]}.${baseOctets[3] + currentOffset}`
      const finalAddr = `${baseOctets[0]}.${baseOctets[1]}.${baseOctets[2]}.${baseOctets[3] + currentOffset + subnet.actualHosts + 1}`
      const broadcastAddr = `${baseOctets[0]}.${baseOctets[1]}.${baseOctets[2]}.${baseOctets[3] + currentOffset + subnet.actualHosts + 1}`
      const firstHost = `${baseOctets[0]}.${baseOctets[1]}.${baseOctets[2]}.${baseOctets[3] + currentOffset + 2}`
      const lastHost = `${baseOctets[0]}.${baseOctets[1]}.${baseOctets[2]}.${baseOctets[3] + currentOffset + subnet.actualHosts}`
      const routerAddr = `${baseOctets[0]}.${baseOctets[1]}.${baseOctets[2]}.${baseOctets[3] + currentOffset + 1}`

      const row = tbody.insertRow()
      row.innerHTML = `
<td><strong>${subnet.name}</strong></td>
<td>${networkAddr}${subnet.cidr}</td>
<td>${subnet.requestedHosts}</td>
<td>${subnet.totalAddresses}</td>
<td>${finalAddr}</td>
<td>${routerAddr}</td>
<td>${broadcastAddr}</td>
<td>${firstHost}</td>
<td>${lastHost}</td>
`

      // Incrementar por el número total de direcciones
      currentOffset += subnet.totalAddresses
      totalUsedHosts += subnet.actualHosts
    }

    // Mostrar información de hosts restantes
    updateRemainingHostsInfo(hostCount, totalUsedHosts)
  } catch (error) {
    alert("❌ Error al generar las subredes. Verifique los datos ingresados.")
    console.error(error)
  }
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Permitir conversión con Enter en el campo de IP
  document.getElementById("ip-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      convertIP()
    }
  })

  // Permitir generación con Enter en los campos de subnet (excepto el select)
  const subnetInputs = ["network-ip", "subnet-count", "host-count"]
  subnetInputs.forEach((id) => {
    document.getElementById(id).addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        generateSubnets()
      }
    })
  })

  // Validación en tiempo real para IP de red
  document.getElementById("network-ip").addEventListener("blur", (e) => {
    const ip = e.target.value.trim()
    if (ip && !isValidNetworkIP(ip)) {
      alert("⚠️ La IP de red debe estar en el rango 192.x.x.x a 223.x.x.x (Clase C)")
      e.target.focus()
    }
  })

  // Autocompletar hosts y direcciones totales según máscara seleccionada
  document.getElementById("subnet-mask").addEventListener("change", (e) => {
    const selectedMask = e.target.value
    const hostCountField = document.getElementById("host-count")
    const totalAddressesField = document.getElementById("total-addresses")

    if (selectedMask && MAX_HOSTS_BY_MASK[selectedMask]) {
      hostCountField.value = MAX_HOSTS_BY_MASK[selectedMask]
    }

    if (selectedMask && TOTAL_ADDRESSES_BY_MASK[selectedMask]) {
      totalAddressesField.value = TOTAL_ADDRESSES_BY_MASK[selectedMask]
    }
  })

  // Validación para cantidad de hosts
  document.getElementById("host-count").addEventListener("blur", (e) => {
    const hosts = parseInt(e.target.value)
    if (hosts && (hosts < 2 || hosts > 254)) {
      alert("⚠️ La cantidad de hosts debe estar entre 2 y 254 (rango de Clase C)")
      e.target.focus()
    }
  })
})