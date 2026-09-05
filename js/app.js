// Variables globales
let movements = [];
let totalBalance = 0;
let currentType = 'income'; // 'income' o 'expense'

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
            movements.push({ id: doc.id, ...doc.data() });
        });
        
        updateUI();
    } catch (error) {
        console.error('Error cargando movimientos:', error);
    }
}

// Actualizar toda la interfaz
function updateUI() {
    updateBalance();
    renderMovements();
}

// Calcular y mostrar balance
function updateBalance() {
    let totalIncome = 0;
    let totalExpense = 0;
    
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
        statusElement.style.color = '#2ed573';
        cardElement.style.borderLeft = '4px solid #2ed573';
    } else if (totalBalance < 0) {
        balanceElement.className = 'result-number negative';
        statusElement.textContent = '📉 Estás en números rojos';
        statusElement.style.color = '#ff4757';
        cardElement.style.borderLeft = '4px solid #ff4757';
    } else {
        balanceElement.className = 'result-number';
        statusElement.textContent = '⚖️ Estás en cero';
        statusElement.style.color = '#666';
        cardElement.style.borderLeft = '4px solid #666';
    }
}

// Renderizar historial
function renderMovements() {
    const list = document.getElementById('movementsList');
    
    if (movements.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">No hay movimientos registrados</p>';
        return;
    }
    
    list.innerHTML = movements.map(mov => `
        <div class="movement-item">
            <div class="movement-info">
                <span class="movement-amount ${mov.type === 'income' ? 'movement-income' : 'movement-expense'}">
                    ${mov.type === 'income' ? '+' : '-'}$${mov.amount.toFixed(2)}
                </span>
                <span class="movement-description">${mov.description || 'Sin descripción'}</span>
                <span class="movement-date">${formatDate(mov.date)}</span>
            </div>
            <button onclick="deleteMovement('${mov.id}')" style="background: none; border: none; color: #ff4757; cursor: pointer; font-size: 20px;">🗑️</button>
        </div>
    `).join('');
}

// Formatear fecha
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
        submitBtn.style.background = '#2ed573';
    } else {
        title.textContent = '💸 Registrar Pérdida';
        submitBtn.style.background = '#ff4757';
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
    
    try {
        await movementsRef.add({
            userId: currentUser.uid,
            type: currentType,
            amount: amount,
            date: new Date(date + 'T00:00:00'),
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

// Mostrar info del usuario (añadir después de loadMovements)
function updateUserInfo() {
    const user = firebase.auth().currentUser;
    if (user) {
        // Si tiene foto de perfil (Google)
        if (user.photoURL) {
            console.log('👤 Usuario:', user.displayName);
            console.log('🖼️ Foto:', user.photoURL);
        }
    }
}

// Llamar esta función en onAuthStateChanged
// En auth.js, dentro del if(user):
if (user) {
    currentUser = user;
    showDashboard();
    loadMovements();
    updateUserInfo(); // 👈 AÑADE ESTA LÍNEA
}