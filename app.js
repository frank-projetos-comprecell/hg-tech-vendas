// --- State Management ---
const defaultProducts = [
    { id: '1', name: 'Celular Novo (Marca/Modelo)', category: 'Produtos', price: 1500.00 },
    { id: '2', name: 'Celular Semi-Novo (Marca/Modelo)', category: 'Produtos', price: 800.00 },
    { id: '3', name: 'Troca de Tela', category: 'Serviços', price: 350.00 },
    { id: '4', name: 'Troca de Bateria', category: 'Serviços', price: 150.00 },
    { id: '5', name: 'Troca de Conector de Carga', category: 'Serviços', price: 120.00 },
    { id: '6', name: 'Reparo de Placa', category: 'Serviços', price: 400.00 },
    { id: '7', name: 'Formatação com Backup', category: 'Serviços', price: 150.00 },
    { id: '8', name: 'Formatação sem Backup', category: 'Serviços', price: 100.00 },
    { id: '9', name: 'Limpeza Completa de PC/Notebook', category: 'Serviços', price: 120.00 },
    { id: '10', name: 'Troca/Upgrade de Memória RAM', category: 'Serviços', price: 80.00 },
    { id: '11', name: 'Troca/Upgrade de HD/SSD', category: 'Serviços', price: 100.00 },
    { id: '12', name: 'Capa de Celular', category: 'Produtos', price: 35.00 }
];

let state = {
    products: JSON.parse(localStorage.getItem('hg_tech_products')) || defaultProducts,
    sales: JSON.parse(localStorage.getItem('hg_tech_sales')) || [],
    cart: []
};

// Save initial default products to localStorage if it was empty
if (!localStorage.getItem('hg_tech_products')) {
    localStorage.setItem('hg_tech_products', JSON.stringify(defaultProducts));
}

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    updateDateTime();
    setupNavigation();
    setupEventListeners();
    renderDashboard();
    renderProducts();
    renderPDVProducts();
    renderHistory();

    // Auto-update clock
    setInterval(updateDateTime, 60000);
}

function updateDateTime() {
    const now = new Date();
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    document.getElementById('current-date').innerText = now.toLocaleDateString('pt-BR', options);
}

// --- Navigation ---
function setupNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav li');
    const pages = document.querySelectorAll('.page');
    const pageTitle = document.getElementById('page-title');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetPage = item.getAttribute('data-page');

            // Update active state in nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Switch page visibility
            pages.forEach(page => {
                if (page.id === `page-${targetPage}`) {
                    page.classList.add('active');
                } else {
                    page.classList.remove('active');
                }
            });

            // Update header title
            pageTitle.innerText = item.innerText.trim();

            // Refresh specific page data if needed
            if (targetPage === 'dashboard') renderDashboard();
            if (targetPage === 'relatorios') resetReport();
        });
    });
}

// --- Event Listeners ---
function setupEventListeners() {
    // Modal controls
    const modalProduct = document.getElementById('modal-product');
    const btnNewProduct = document.getElementById('btn-new-product');
    const closeModals = document.querySelectorAll('.close-modal, .close-modal-btn');

    btnNewProduct.onclick = () => {
        document.getElementById('modal-title').innerText = 'Novo Produto/Serviço';
        document.getElementById('form-product').reset();
        document.getElementById('prod-id').value = '';
        modalProduct.style.display = 'flex';
    };

    closeModals.forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        };
    });

    window.onclick = (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    };

    // Product Form
    document.getElementById('form-product').onsubmit = (e) => {
        e.preventDefault();
        saveProduct();
    };

    // PDV Actions
    document.getElementById('btn-new-item-pdv').onclick = () => {
        document.getElementById('btn-new-product').click();
    };

    document.getElementById('manual-item-form').onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('manual-name').value;
        const qty = parseInt(document.getElementById('manual-qty').value);
        const price = parseFloat(document.getElementById('manual-price').value);

        const manualItem = {
            id: 'm' + Date.now(),
            name: name,
            price: price,
            category: 'Manual',
            qty: qty
        };

        state.cart.push(manualItem);
        renderCart();
        e.target.reset();
        document.getElementById('manual-qty').value = 1;
    };

    // Report Generation
    document.getElementById('clear-cart').onclick = () => {
        state.cart = [];
        renderCart();
    };

    document.getElementById('checkout-btn').onclick = () => {
        processCheckout();
    };

    // Report Generation
    document.getElementById('btn-generate-report').onclick = () => {
        generateReport();
    };

    // Printing
    document.getElementById('btn-print-receipt').onclick = () => {
        window.print();
    };

    // WhatsApp Sharing
    document.getElementById('btn-whatsapp-receipt').onclick = () => {
        const saleId = document.getElementById('sale-details-content').getAttribute('data-sale-id');
        sendWhatsAppReceipt(saleId);
    };

    // Cart Item Form
    document.getElementById('form-cart-item').onsubmit = (e) => {
        e.preventDefault();
        saveCartItem();
    };
}

// --- Product Logic ---
function saveProduct() {
    const id = document.getElementById('prod-id').value;
    const name = document.getElementById('prod-name').value;
    const category = document.getElementById('prod-category').value;
    const price = parseFloat(document.getElementById('prod-price').value);

    if (id) {
        // Edit
        const index = state.products.findIndex(p => p.id === id);
        state.products[index] = { id, name, category, price };
    } else {
        // New
        const newProduct = {
            id: Date.now().toString(),
            name,
            category,
            price
        };
        state.products.push(newProduct);
    }

    localStorage.setItem('hg_tech_products', JSON.stringify(state.products));
    document.getElementById('modal-product').style.display = 'none';
    renderProducts();
    renderPDVProducts();
}

function deleteProduct(id) {
    if (confirm('Deseja excluir este produto?')) {
        state.products = state.products.filter(p => p.id !== id);
        localStorage.setItem('hg_tech_products', JSON.stringify(state.products));
        renderProducts();
        renderPDVProducts();
    }
}

function editProduct(id) {
    const product = state.products.find(p => p.id === id);
    document.getElementById('modal-title').innerText = 'Editar Produto/Serviço';
    document.getElementById('prod-id').value = product.id;
    document.getElementById('prod-name').value = product.name;
    document.getElementById('prod-category').value = product.category;
    document.getElementById('prod-price').value = product.price;
    document.getElementById('modal-product').style.display = 'flex';
}

function renderProducts() {
    const tbody = document.getElementById('products-body');
    tbody.innerHTML = '';

    state.products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${p.id.slice(-4)}</td>
            <td>${p.name}</td>
            <td><span class="badge ${p.category.toLowerCase()}">${p.category}</span></td>
            <td>R$ ${p.price.toFixed(2)}</td>
            <td>
                <button onclick="editProduct('${p.id}')" class="btn-icon"><i class="fas fa-edit"></i></button>
                <button onclick="deleteProduct('${p.id}')" class="btn-icon"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- PDV Logic ---
function renderPDVProducts(search = '') {
    const grid = document.getElementById('product-list');
    grid.innerHTML = '';

    const filtered = state.products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    filtered.forEach(p => {
        const div = document.createElement('div');
        div.className = 'product-pills-container'; // Wrapper for pill and edit icon
        div.style.position = 'relative';
        div.style.display = 'inline-block';

        div.innerHTML = `
            <div class="product-item" onclick="addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')})">
                <h4>${p.name}</h4>
                <p class="price">R$ ${p.price.toFixed(2)}</p>
            </div>
            <button class="pill-edit-btn" onclick="editProduct('${p.id}')" title="Editar Produto">
                <i class="fas fa-pen"></i>
            </button>
        `;
        grid.appendChild(div);
    });
}

function addToCart(product) {
    const existing = state.cart.find(item => item.id === product.id);
    if (existing) {
        existing.qty++;
    } else {
        state.cart.push({ ...product, qty: 1 });
    }
    renderCart();
}

function removeFromCart(id) {
    state.cart = state.cart.filter(item => item.id !== id);
    renderCart();
}

function renderCart() {
    const list = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total-value');
    list.innerHTML = '';

    let total = 0;
    state.cart.forEach(item => {
        const subtotal = item.price * item.qty;
        total += subtotal;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-info">
                <h5>${item.name}</h5>
                <span>${item.qty}x R$ ${item.price.toFixed(2)}</span>
            </div>
            <div class="cart-item-actions">
                <strong>R$ ${subtotal.toFixed(2)}</strong>
                <div class="item-btns">
                    <button onclick="editCartItem('${item.id}')" class="btn-icon" title="Editar preço/qtd"><i class="fas fa-edit"></i></button>
                    <button onclick="removeFromCart('${item.id}')" class="btn-icon danger"><i class="fas fa-times"></i></button>
                </div>
            </div>
        `;
        list.appendChild(div);
    });

    totalEl.innerText = `R$ ${total.toFixed(2)}`;
}

function editCartItem(id) {
    const item = state.cart.find(i => i.id === id);
    if (!item) return;

    document.getElementById('cart-item-id').value = item.id;
    document.getElementById('cart-item-name').value = item.name;
    document.getElementById('cart-item-qty').value = item.qty;
    document.getElementById('cart-item-price').value = item.price;
    document.getElementById('modal-cart-item').style.display = 'flex';
}

function saveCartItem() {
    const id = document.getElementById('cart-item-id').value;
    const qty = parseInt(document.getElementById('cart-item-qty').value);
    const price = parseFloat(document.getElementById('cart-item-price').value);

    const index = state.cart.findIndex(i => i.id === id);
    if (index !== -1) {
        state.cart[index].qty = qty;
        state.cart[index].price = price;
        renderCart();
    }

    document.getElementById('modal-cart-item').style.display = 'none';
}

function processCheckout() {
    if (state.cart.length === 0) {
        alert('Carrinho vazio!');
        return;
    }

    const clientName = document.getElementById('checkout-client-name').value.trim() || 'Consumidor Final';
    const clientCpf = document.getElementById('checkout-client-cpf').value.trim();
    const clientWa = document.getElementById('checkout-client-wa').value.trim();
    const paymentMethod = document.getElementById('checkout-payment-method').value;

    const sale = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        items: [...state.cart],
        total: state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0),
        client: clientName,
        cpf: clientCpf,
        whatsapp: clientWa,
        payment: paymentMethod
    };

    state.sales.push(sale);
    localStorage.setItem('hg_tech_sales', JSON.stringify(state.sales));

    // Clear form
    document.getElementById('checkout-client-name').value = '';
    document.getElementById('checkout-client-cpf').value = '';
    document.getElementById('checkout-client-wa').value = '';

    // Refresh UI
    state.cart = [];
    renderCart();
    renderDashboard();
    renderHistory();

    // Show sale details immediately for printing/sharing
    viewSaleDetails(sale.id);
}

// --- History & Dashboard ---
function renderDashboard() {
    const salesToday = state.sales.filter(s => {
        const saleDate = new Date(s.date).toDateString();
        return saleDate === new Date().toDateString();
    });

    const totalToday = salesToday.reduce((sum, s) => sum + s.total, 0);
    const totalAll = state.sales.reduce((sum, s) => sum + s.total, 0);

    // Current month calculation
    const now = new Date();
    const salesMonth = state.sales.filter(s => {
        const d = new Date(s.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const totalMonth = salesMonth.reduce((sum, s) => sum + s.total, 0);

    document.getElementById('stat-sales-today').innerText = `R$ ${totalToday.toFixed(2)}`;
    document.getElementById('stat-sales-month').innerText = `R$ ${totalMonth.toFixed(2)}`;
    document.getElementById('stat-sales-total').innerText = `R$ ${totalAll.toFixed(2)}`;

    // Recent Sales table
    const tbody = document.querySelector('#recent-sales-table tbody');
    tbody.innerHTML = '';

    state.sales.slice(-5).reverse().forEach(s => {
        const tr = document.createElement('tr');
        const date = new Date(s.date).toLocaleDateString('pt-BR');
        tr.innerHTML = `
            <td>${date}</td>
            <td>${s.client}</td>
            <td>R$ ${s.total.toFixed(2)}</td>
            <td><span class="badge success">Concluída</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderHistory() {
    const tbody = document.getElementById('history-body');
    tbody.innerHTML = '';

    state.sales.slice().reverse().forEach(s => {
        const tr = document.createElement('tr');
        const dateTime = new Date(s.date).toLocaleString('pt-BR');
        const itemsList = s.items.map(i => `${i.qty}x ${i.name}`).join(', ');

        tr.innerHTML = `
            <td>${dateTime}</td>
            <td>
                <strong>${s.client}</strong><br>
                <small class="muted">${s.payment || 'Não inf.'}</small>
            </td>
            <td><span class="items-cell" title="${itemsList}">${itemsList.slice(0, 30)}${itemsList.length > 30 ? '...' : ''}</span></td>
            <td><strong>R$ ${s.total.toFixed(2)}</strong></td>
            <td>
                <button onclick="viewSaleDetails('${s.id}')" class="btn-icon" title="Ver Detalhes/Imprimir"><i class="fas fa-eye"></i></button>
                <button onclick="quickPrint('${s.id}')" class="btn-icon" title="Imprimir Rápido"><i class="fas fa-print"></i></button>
                <button onclick="sendWhatsAppReceipt('${s.id}')" class="btn-icon" title="Enviar WhatsApp"><i class="fab fa-whatsapp"></i></button>
                <button onclick="deleteSale('${s.id}')" class="btn-icon" title="Excluir Venda"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function quickPrint(id) {
    viewSaleDetails(id);
    setTimeout(() => {
        window.print();
    }, 500);
}

function deleteSale(id) {
    if (confirm('Tem certeza que deseja excluir esta venda do histórico?')) {
        state.sales = state.sales.filter(s => s.id !== id);
        localStorage.setItem('hg_tech_sales', JSON.stringify(state.sales));
        renderHistory();
        renderDashboard();
    }
}

function viewSaleDetails(id) {
    const sale = state.sales.find(s => s.id === id);
    const container = document.getElementById('sale-details-content');
    container.setAttribute('data-sale-id', id);

    const fullDate = new Date(sale.date);
    const dateStr = fullDate.toLocaleDateString('pt-BR');
    const timeStr = fullDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    container.innerHTML = `
        <div class="sale-receipt">
            <div class="receipt-header-main">
                <h2>HG Tech Sorocaba</h2>
                <div class="company-details">
                    <p>CNPJ: 50.467.688/0001-92</p>
                    <p>Inscrição Estadual: 798.820.211.112</p>
                    <p>Rua Doutor Arthur Gomes, 36 - Centro</p>
                    <p>Sorocaba - SP, CEP: 18035-490</p>
                    <p>WhatsApp: (15) 99629-2221</p>
                </div>
            </div>
            
            <div class="receipt-title">
                <h3>RECIBO DE VENDA</h3>
            </div>

            <div class="receipt-meta-grid">
                <div>
                    <label>Data:</label>
                    <p>${dateStr}</p>
                    <p>${timeStr}</p>
                </div>
                <div>
                    <label>Recibo #:</label>
                    <p>${sale.id}</p>
                </div>
            </div>

            <div class="receipt-section-info">
                <p><strong>Cliente:</strong> ${sale.client}</p>
                ${sale.cpf ? `<p><strong>CPF:</strong> ${sale.cpf}</p>` : ''}
                <p><strong>Forma de Pagamento:</strong> ${sale.payment || 'Dinheiro'}</p>
            </div>

            <div class="receipt-section-info">
                <label>Endereço:</label>
                <p>Rua Doutor Arthur Gomes, 36</p>
                <p>Centro - Sorocaba, SP</p>
                <p>CEP: 18035490</p>
            </div>

            <table class="receipt-table-refined">
                <thead>
                    <tr>
                        <th align="left">Descrição</th>
                        <th align="center">Qtd.</th>
                        <th align="center">Preço Unit.</th>
                        <th align="right">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${sale.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td align="center">${item.qty}</td>
                            <td align="center">R$ ${item.price.toFixed(2)}</td>
                            <td align="right">R$ ${(item.price * item.qty).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="receipt-total-refined">
                TOTAL: R$ ${sale.total.toFixed(2)}
            </div>

            <div class="receipt-footer-refined">
                <p>www.hgtechsorocaba.com.br</p>
                <p>Obrigado pela preferência!</p>
                <p>HG Tech - A tecnologia ao seu alcance</p>
            </div>
        </div>
    `;

    document.getElementById('modal-sale-details').style.display = 'flex';
}

function sendWhatsAppReceipt(saleId) {
    const sale = state.sales.find(s => s.id === saleId);
    if (!sale) return;

    let message = `*HG TECH - RECIBO DE VENDA*\n`;
    message += `----------------------------\n`;
    message += `*Data:* ${new Date(sale.date).toLocaleString('pt-BR')}\n`;
    message += `*Cliente:* ${sale.client}\n`;
    if (sale.cpf) message += `*CPF:* ${sale.cpf}\n`;
    message += `*Pagamento:* ${sale.payment || 'Não informado'}\n`;
    message += `----------------------------\n`;
    message += `*ITENS:*\n`;

    sale.items.forEach(item => {
        message += `${item.qty}x ${item.name} - R$ ${(item.price * item.qty).toFixed(2)}\n`;
    });

    message += `----------------------------\n`;
    message += `*TOTAL: R$ ${sale.total.toFixed(2)}*\n\n`;
    message += `Obrigado pela preferência!`;

    const encodedMessage = encodeURIComponent(message);
    const phone = sale.whatsapp ? sale.whatsapp.replace(/\D/g, '') : '';

    let url = `https://wa.me/`;
    if (phone) {
        // Enviar para o número do cliente se existir
        url += `${phone.length <= 11 ? '55' + phone : phone}?text=${encodedMessage}`;
    } else {
        // Abrir seleção de contato se não tiver número
        url += `?text=${encodedMessage}`;
    }

    window.open(url, '_blank');
}

// --- Reports ---
function resetReport() {
    document.getElementById('report-result').innerHTML = '<p class="muted">Selecione o período e clique em Gerar Relatório.</p>';
}

function generateReport() {
    const type = document.getElementById('report-type').value;
    const period = document.getElementById('report-period').value; // YYYY-MM

    if (!period) {
        alert('Selecione um período!');
        return;
    }

    const filteredSales = state.sales.filter(s => {
        const d = new Date(s.date);
        const y = d.getFullYear();
        const m = (d.getMonth() + 1).toString().padStart(2, '0');
        return `${y}-${m}` === period;
    });

    const total = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const count = filteredSales.length;

    // Group by category
    const byCategory = { 'Produtos': 0, 'Serviços': 0 };
    filteredSales.forEach(s => {
        s.items.forEach(item => {
            if (byCategory[item.category] !== undefined) {
                byCategory[item.category] += (item.price * item.qty);
            }
        });
    });

    const res = document.getElementById('report-result');
    res.innerHTML = `
        <div class="report-header">
            <h3>Relatório ${type === 'daily' ? 'Diário' : 'Mensal'} - ${period}</h3>
            <button class="btn btn-secondary" onclick="window.print()"><i class="fas fa-print"></i> Imprimir</button>
        </div>
        <div class="report-summary-grid">
            <div class="stat-card">
                <div class="stat-info">
                    <h3>Vendas Realizadas</h3>
                    <p class="stat-value">${count}</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-info">
                    <h3>Faturamento Total</h3>
                    <p class="stat-value">R$ ${total.toFixed(2)}</p>
                </div>
            </div>
        </div>
        <div class="report-details">
            <div class="chart-container">
                <h4>Faturamento por Categoria</h4>
                <div class="simple-bar-chart">
                    <div class="bar-group">
                        <label>Produtos</label>
                        <div class="bar-bg">
                            <div class="bar-fill" style="width: ${total > 0 ? (byCategory['Produtos'] / total * 100) : 0}%"></div>
                        </div>
                        <span>R$ ${byCategory['Produtos'].toFixed(2)}</span>
                    </div>
                    <div class="bar-group">
                        <label>Serviços</label>
                        <div class="bar-bg">
                            <div class="bar-fill" style="width: ${total > 0 ? (byCategory['Serviços'] / total * 100) : 0}%"></div>
                        </div>
                        <span>R$ ${byCategory['Serviços'].toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}
