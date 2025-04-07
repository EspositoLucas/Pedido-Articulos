// Variables globales
const tableBody = document.getElementById('order-rows');
const STORAGE_KEY = 'pedidoAppData';

// --- Funciones de Mensajes ---
function showMessage(text, type = 'success') {
    const box = type === 'success' ? document.getElementById('message-box') : document.getElementById('error-box');
    if (!box) return;
    box.textContent = text;
    box.classList.remove('hidden');
    box.classList.add('opacity-100');
    setTimeout(() => {
        box.classList.add('hidden');
        box.classList.remove('opacity-100');
    }, 3500);
}

// --- Funciones de Manipulación de Filas ---
function createRowHtml(data = {}) {
    const article = data.article || '';
    const details = data.details || '';
    const imgSrc = data.imgSrc || 'https://placehold.co/100x100/e2e8f0/adb5bd?text=Foto';
    const sizes = data.sizes || { '35': '', '36': '', '37': '', '38': '', '39': '', '40': '', '41': '' };
    const total = data.total || 0;
    let sizeInputsHtml = '';
    
    for (let i = 35; i <= 41; i++) {
        const sizeValue = sizes[String(i)] || '';
        sizeInputsHtml += `<td class="py-3 px-2"><input type="number" min="0" value="${sizeValue}" class="w-12 p-1 border border-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 size-input" data-size="${i}" oninput="calculateTotal(this)"></td>`;
    }
    
    return `
        <tr class="border-b border-gray-200 hover:bg-gray-50 order-row">
            <td class="py-3 px-4"><textarea rows="3" class="article-input w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Ej: 4375 SUELA GRUPON NATURAL">${article}</textarea></td>
            <td class="py-3 px-4 details-cell"><textarea rows="5" class="details-input w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y" placeholder="* HORMA: ...&#10;* ARRIMADO: ...&#10;* TACO: ...">${details}</textarea></td>
            <td class="py-3 px-4">
                <input type="file" accept="image/*" class="image-input block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" onchange="previewImage(event)">
                <img src="${imgSrc}" alt="Previsualización" class="preview-image mt-2 rounded-md" data-imgsrc="${imgSrc}">
            </td>
            ${sizeInputsHtml}
            <td class="py-3 px-4"><input type="number" readonly value="${total}" class="total-output w-16 p-1 border-0 bg-gray-100 rounded-md text-center font-semibold"></td>
            <td class="py-3 px-2 actions-col"><button onclick="deleteRow(this)" class="text-red-500 hover:text-red-700 text-xl font-bold" title="Eliminar fila">&times;</button></td>
        </tr>`;
}

function addRow() {
    if (tableBody) {
        tableBody.insertAdjacentHTML('beforeend', createRowHtml());
    }
}

function deleteRow(buttonElement) {
    const row = buttonElement.closest('.order-row');
    if (row) {
        row.remove();
    }
}

// --- Funciones de Previsualización y Cálculo ---
function previewImage(event) {
    const input = event.target;
    const preview = input.closest('td')?.querySelector('.preview-image');
    if (!preview) return;
    
    const file = input.files ? input.files[0] : null;
    const reader = new FileReader();
    
    reader.onloadend = function () {
        const resultStr = reader.result?.toString() || '';
        preview.src = resultStr;
        preview.dataset.imgsrc = resultStr;
    }
    
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            showMessage('La imagen es demasiado grande (máx 5MB).', 'error');
            input.value = '';
            preview.src = preview.dataset.imgsrc || 'https://placehold.co/100x100/e2e8f0/adb5bd?text=Foto';
            return;
        }
        reader.readAsDataURL(file);
    } else {
        preview.src = 'https://placehold.co/100x100/e2e8f0/adb5bd?text=Foto';
        preview.dataset.imgsrc = preview.src;
    }
    
    preview.onerror = function() {
        preview.src = 'https://placehold.co/100x100/ff0000/ffffff?text=Error';
        preview.dataset.imgsrc = preview.src;
    };
}

function calculateTotal(inputElement) {
    const row = inputElement.closest('.order-row');
    if (!row) return;
    
    const sizeInputs = row.querySelectorAll('.size-input');
    let total = 0;
    
    sizeInputs.forEach(input => {
        total += parseInt(input.value) || 0;
    });
    
    const totalOutput = row.querySelector('.total-output');
    if (totalOutput instanceof HTMLInputElement) {
        totalOutput.value = total.toString();
    }
}

// --- Funciones de Guardado y Carga (localStorage) ---
function saveOrder() {
    const orderData = [];
    const rows = tableBody ? tableBody.querySelectorAll('.order-row') : [];
    
    rows.forEach(row => {
        const articleInput = row.querySelector('.article-input');
        const detailsInput = row.querySelector('.details-input');
        const previewImage = row.querySelector('.preview-image');
        const sizeInputs = row.querySelectorAll('.size-input');
        const totalOutput = row.querySelector('.total-output');
        const sizes = {};
        
        sizeInputs.forEach(input => {
            if (input instanceof HTMLInputElement && input.dataset.size) {
                sizes[input.dataset.size] = input.value || '';
            }
        });
        
        orderData.push({
            article: articleInput instanceof HTMLTextAreaElement ? articleInput.value : '',
            details: detailsInput instanceof HTMLTextAreaElement ? detailsInput.value : '',
            imgSrc: previewImage instanceof HTMLImageElement ? previewImage.dataset.imgsrc || previewImage.src : 'https://placehold.co/100x100/e2e8f0/adb5bd?text=Foto',
            sizes: sizes,
            total: totalOutput instanceof HTMLInputElement ? totalOutput.value : 0
        });
    });
    
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orderData));
        showMessage('Pedido guardado localmente.');
    } catch (e) {
        console.error("Error saving to localStorage:", e);
        showMessage('Error al guardar: posible límite de almacenamiento excedido.', 'error');
    }
}

function loadOrder() {
    if (!tableBody) return;
    
    const savedData = localStorage.getItem(STORAGE_KEY);
    tableBody.innerHTML = '';
    
    if (savedData) {
        try {
            const orderData = JSON.parse(savedData);
            if (Array.isArray(orderData) && orderData.length > 0) {
                orderData.forEach(itemData => {
                    tableBody.insertAdjacentHTML('beforeend', createRowHtml(itemData));
                });
            } else {
                addRow();
            }
        } catch (e) {
            console.error("Error parsing saved data:", e);
            showMessage('Error al cargar datos guardados.', 'error');
            addRow();
        }
    } else {
        addRow();
    }
}

// --- Funciones de Exportación (Método Estándar) ---

// Prepara la tabla para exportación (oculta elementos no deseados)
function prepareTableForExport(isExporting) {
    const table = document.getElementById('order-table');
    if (!table) return;
    
    const fileInputs = table.querySelectorAll('.image-input');
    const deleteButtons = table.querySelectorAll('.actions-col button');
    
    // Ocultar/Mostrar elementos
    fileInputs.forEach(input => {
        if(input instanceof HTMLElement) input.style.display = isExporting ? 'none' : '';
    });
    
    deleteButtons.forEach(button => {
        if(button instanceof HTMLElement) button.style.display = isExporting ? 'none' : '';
    });
    
    // Quitar/Restaurar bordes y fondos de inputs/textarea
    table.querySelectorAll('textarea, input:not([type=file])').forEach(el => {
        if (el instanceof HTMLElement) {
            el.style.border = isExporting ? 'none' : '';
            el.style.backgroundColor = isExporting ? 'transparent' : '';
        }
    });
}

// Descarga el contenido como un archivo usando Blob y Object URL
function downloadFile(blob, defaultFilename) {
    // Crear una URL temporal para el Blob
    const url = URL.createObjectURL(blob);
    
    // Crear un enlace temporal
    const link = document.createElement('a');
    link.href = url;
    link.download = defaultFilename; // Nombre de archivo sugerido
    
    // Añadir, simular clic y remover el enlace
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Liberar la memoria de la URL temporal (importante)
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Guarda la tabla como imagen PNG (Método Estándar)
async function saveAsImage(button) {
    const tableElement = document.getElementById('order-table');
    if (!tableElement || !button || button.classList.contains('button-loading')) return;

    button.classList.add('button-loading');
    button.disabled = true;
    showMessage('Generando imagen...');
    prepareTableForExport(true); // Ocultar elementos no deseados

    try {
        // 1. Generar canvas
        const canvas = await html2canvas(tableElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        });
        prepareTableForExport(false); // Restaurar tabla

        // 2. Convertir canvas a Blob
        canvas.toBlob(function(blob) {
            if (!blob) {
                throw new Error("No se pudo crear el Blob de la imagen.");
            }
            // 3. Iniciar descarga
            downloadFile(blob, 'pedido.png');
            showMessage('Descarga de imagen iniciada. Revisa tu carpeta de descargas.');
        }, 'image/png');

    } catch (error) {
        console.error('Error al generar/guardar la imagen:', error);
        showMessage(`Error al generar la imagen: ${error.message || 'Error desconocido'}`, 'error');
        prepareTableForExport(false); // Asegurarse de restaurar en caso de error
    } finally {
        button.classList.remove('button-loading');
        button.disabled = false;
    }
}

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', loadOrder);