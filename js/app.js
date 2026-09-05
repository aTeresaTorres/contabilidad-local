// Variables globales
let movements = [];
let totalBalance = 0;
let currentType = 'income';
let filteredMovements = [];
let selectedMonth = '';

// Referencias a Firestore
const movementsRef = db.collection('movements');

// Cargar movimientos del usuario
async function loadMovements() {
    if (!currentUser) return;
    
    try {
        const snapshot = await movementsRef
            .where('userId', '==', currentUser.uid)
            .orderBy('date', 'desc')
            .get();
        
        movements = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const date = data.date?.toDate ? data.date.toDate() : new Date(data.date);
            movements.push({ 
                id: doc.id, 
                ...data,
                date: date
            });
        });
        
        // Inicializar el filtro con el mes actual
        if (!selectedMonth) {
            const now = new Date();
            selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            document.getElementById('monthFilter').value = selectedMonth;
        }
        
        // Llenar el selector de meses
        populateMonthSelector();
        updateUI();
    } catch (error) {
        console.error('Error cargando movimientos:', error);
        if (error.code === 'failed-precondition') {
            alert('⚠️ Necesitas crear un índice en Firebase. Revisa la consola para más detalles.');
        }
    }
}

// Filtrar movimientos por mes (SOLO para el historial)
function filterMovementsByMonth() {
    if (!selectedMonth) {
        filteredMovements = movements;
        return;
    }
    
    const [year, month] = selectedMonth.split('-').map(Number);
    
    filteredMovements = movements.filter(mov => {
        const movDate = mov.date instanceof Date ? mov.date : new Date(mov.date);
        return movDate.getFullYear() === year && movDate.getMonth() === month - 1;
    });
}

// Actualizar toda la interfaz
function updateUI() {
    filterMovementsByMonth();
    updateBalance();      // ← Balance con TODOS los movimientos
    renderMovements();    // ← Historial con movimientos filtrados por mes
}

// 🔥 NUEVA VERSIÓN: Calcular balance con TODOS los movimientos
function updateBalance() {
    let totalIncome = 0;
    let totalExpense = 0;
    
    // 👇 Usamos movements (TODOS), NO filteredMovements
    movements.forEach(mov => {
        if (mov.type === 'income') {
            totalIncome += mov.amount;
        } else {
            totalExpense += mov.amount;
        }
    });
    
    totalBalance = totalIncome - totalExpense;
    
    const balanceElement = document.getElementById('totalBalance');
    const statusElement = document.getElementById('resultStatus');
    const cardElement = document.getElementById('resultCard');
    
    balanceElement.textContent = `$${totalBalance.toFixed(2)}`;
    
    if (totalBalance > 0) {
        balanceElement.className = 'result-number positive';
        statusElement.textContent = '📈 ¡Estás en verde!';
        statusElement.style.color = '#a0f6b8';
        cardElement.style.background = 'linear-gradient(135deg, #1e7e34, #146c2e)';
    } else if (totalBalance < 0) {
        balanceElement.className = 'result-number negative';
        statusElement.textContent = '📉 Estás en números rojos';
        statusElement.style.color = '#ffb4ab';
        cardElement.style.background = 'linear-gradient(135deg, #b71c1c, #8b0000)';
    } else {
        balanceElement.className = 'result-number';
        statusElement.textContent = '⚖️ Estás en cero';
        statusElement.style.color = '#ffffff';
        cardElement.style.background = 'linear-gradient(135deg, #6750a4, #7f67be)';
    }
    
    // 🔥 NUEVO: Mostrar información adicional del balance
    const balanceInfo = document.getElementById('balanceInfo');
    if (balanceInfo) {
        const totalMovements = movements.length;
        const monthsWithData = new Set();
        movements.forEach(mov => {
            const date = mov.date instanceof Date ? mov.date : new Date(mov.date);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            monthsWithData.add(key);
        });
        balanceInfo.textContent = `${totalMovements} movimientos en ${monthsWithData.size} meses`;
    }
}

// Renderizar historial (SOLO del mes seleccionado)
function renderMovements() {
    const list = document.getElementById('movementsList');
    
    // Mostrar información del mes seleccionado
    const monthInfo = document.getElementById('monthInfo');
    if (monthInfo) {
        const [year, month] = selectedMonth.split('-').map(Number);
        const monthName = new Date(year, month - 1).toLocaleString('es-ES', { month: 'long' });
        monthInfo.textContent = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
    }
    
    // Contador de movimientos del mes
    const countInfo = document.getElementById('movementCount');
    if (countInfo) {
        countInfo.textContent = `${filteredMovements.length} movimientos en este mes`;
    }
    
    if (filteredMovements.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; padding:30px 10px; color:#79747e;">
                <p style="font-size:40px; margin-bottom:10px;">📭</p>
                <p>No hay movimientos en este mes</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = filteredMovements.map(mov => {
        const date = mov.date instanceof Date ? mov.date : new Date(mov.date);
        const formattedDate = date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        return `
        <div class="movement-item">
            <div class="movement-info">
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                    <span class="movement-amount ${mov.type === 'income' ? 'movement-income' : 'movement-expense'}">
                        ${mov.type === 'income' ? '+' : '−'}$${mov.amount.toFixed(2)}
                    </span>
                    <span style="font-size:11px; color:#79747e; background:#f5f5f7; padding:2px 10px; border-radius:12px;">
                        ${formattedDate}
                    </span>
                </div>
                <span class="movement-description">${mov.description || 'Sin descripción'}</span>
            </div>
            <button onclick="deleteMovement('${mov.id}')" class="delete-btn" title="Eliminar">
                🗑️
            </button>
        </div>
    `}).join('');
}

// Cambiar mes seleccionado
function changeMonth() {
    const select = document.getElementById('monthFilter');
    selectedMonth = select.value;
    updateUI();
}

// Formatear fecha (ya no se usa directamente, pero lo mantengo)
function formatDate(timestamp) {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Abrir modal
function openRegisterModal(type) {
    currentType = type;
    const modal = document.getElementById('registerModal');
    const title = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('submitMovement');
    
    if (type === 'income') {
        title.textContent = '💰 Registrar Ganancia';
        submitBtn.style.background = '#146c2e';
        submitBtn.style.color = 'white';
    } else {
        title.textContent = '💸 Registrar Pérdida';
        submitBtn.style.background = '#ba1a1a';
        submitBtn.style.color = 'white';
    }
    
    // Establecer fecha actual por defecto
    document.getElementById('movementDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('movementAmount').value = '';
    document.getElementById('movementDescription').value = '';
    
    modal.style.display = 'flex';
}

// Cerrar modal
function closeModal() {
    document.getElementById('registerModal').style.display = 'none';
}

// Guardar movimiento
document.getElementById('movementForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('movementAmount').value);
    const date = document.getElementById('movementDate').value;
    const description = document.getElementById('movementDescription').value.trim() || 'Sin descripción';
    
    if (!amount || amount <= 0) {
        alert('Por favor, ingresa un monto válido');
        return;
    }
    
    if (!date) {
        alert('Por favor, selecciona una fecha');
        return;
    }
    
    // Verificar que la fecha sea válida
    const dateObj = new Date(date + 'T00:00:00');
    if (isNaN(dateObj.getTime())) {
        alert('Fecha inválida');
        return;
    }
    
    try {
        await movementsRef.add({
            userId: currentUser.uid,
            type: currentType,
            amount: amount,
            date: firebase.firestore.Timestamp.fromDate(dateObj),
            description: description,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        closeModal();
        loadMovements(); // Recargar datos
    } catch (error) {
        console.error('Error guardando movimiento:', error);
        alert('Error al guardar: ' + error.message);
    }
});

// Eliminar movimiento
async function deleteMovement(id) {
    if (!confirm('¿Seguro que quieres eliminar este movimiento?')) return;
    
    try {
        await movementsRef.doc(id).delete();
        loadMovements();
    } catch (error) {
        console.error('Error eliminando:', error);
        alert('Error al eliminar: ' + error.message);
    }
}

// Cerrar modal al hacer click fuera
window.onclick = function(event) {
    const modal = document.getElementById('registerModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Inicializar selector de mes con los meses disponibles
function populateMonthSelector() {
    const select = document.getElementById('monthFilter');
    
    // Obtener todos los meses únicos de los movimientos
    const months = new Set();
    movements.forEach(mov => {
        const date = mov.date instanceof Date ? mov.date : new Date(mov.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(key);
    });
    
    // Si no hay movimientos, usar el mes actual
    if (months.size === 0) {
        const now = new Date();
        months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    }
    
    // Ordenar meses (más reciente primero)
    const sortedMonths = Array.from(months).sort((a, b) => b.localeCompare(a));
    
    // Limpiar y llenar el select
    select.innerHTML = '';
    sortedMonths.forEach(month => {
        const [year, monthNum] = month.split('-').map(Number);
        const monthName = new Date(year, monthNum - 1).toLocaleString('es-ES', { month: 'long' });
        const option = document.createElement('option');
        option.value = month;
        option.textContent = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
        select.appendChild(option);
    });
    
    // Seleccionar el mes más reciente
    if (sortedMonths.length > 0) {
        selectedMonth = sortedMonths[0];
        select.value = selectedMonth;
    }
}

// Modificar loadMovements para que después de cargar, llene el selector
// Reemplaza la función loadMovements con esta versión mejorada
async function loadMovements() {
    if (!currentUser) return;
    
    try {
        const snapshot = await movementsRef
            .where('userId', '==', currentUser.uid)
            .orderBy('date', 'desc')
            .get();
        
        movements = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const date = data.date?.toDate ? data.date.toDate() : new Date(data.date);
            movements.push({ 
                id: doc.id, 
                ...data,
                date: date
            });
        });
        
        // Llenar el selector de meses
        populateMonthSelector();
        updateUI();
    } catch (error) {
        console.error('Error cargando movimientos:', error);
        if (error.code === 'failed-precondition') {
            alert('⚠️ Necesitas crear un índice en Firebase. Revisa la consola para más detalles.');
        }
    }
}