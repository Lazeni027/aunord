document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let cart = JSON.parse(localStorage.getItem('korhogoShopCart')) || [];
    const elements = {
        cartIcon: document.getElementById('cart-icon'),
        floatingCart: document.getElementById('floating-cart'),
        closeCart: document.getElementById('close-cart'),
        cartItemsContainer: document.getElementById('cart-items'),
        cartTotalPrice: document.getElementById('cart-total-price'),
        checkoutBtn: document.getElementById('checkout-btn'),
        orderModal: document.getElementById('order-modal'),
        closeModal: document.querySelector('.close-modal'),
        menuBurger: document.getElementById('menu-burger'),
        navLinks: document.querySelector('.nav-links'),
        cartCount: document.querySelector('.cart-count'),
        whatsappBtn: document.getElementById('whatsapp-btn'),
        smsBtn: document.getElementById('sms-btn'),
        callBtn: document.getElementById('call-btn'),
        orderItemsList: document.getElementById('order-items-list'),
        modalTotalPrice: document.getElementById('modal-total-price')
    };

    // Initialisation
    init();

    function init() {
        setupEventListeners();
        updateCart();
    }

    function setupEventListeners() {
        // Menu Burger
        if (elements.menuBurger) {
            elements.menuBurger.addEventListener('click', toggleMenu);
            document.addEventListener('click', closeMenuOnClickOutside);
            
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', closeMenu);
            });
        }

        // Panier
        elements.cartIcon.addEventListener('click', openCart);
        elements.closeCart.addEventListener('click', closeCart);
        elements.checkoutBtn.addEventListener('click', openOrderModal);
        elements.closeModal.addEventListener('click', closeOrderModal);

        // Produits
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', addToCart);
        });

        // Options de commande
        if (elements.whatsappBtn) {
            elements.whatsappBtn.addEventListener('click', sendViaWhatsApp);
        }
        if (elements.smsBtn) {
            elements.smsBtn.addEventListener('click', sendViaSMS);
        }
        if (elements.callBtn) {
            elements.callBtn.addEventListener('click', makePhoneCall);
        }

        // Gestion du panier
        elements.cartItemsContainer.addEventListener('click', function(e) {
            const id = parseInt(e.target.dataset.id);
            if (!id) return;

            if (e.target.classList.contains('cart-item-remove')) {
                cart = cart.filter(item => item.id !== id);
            } 
            else if (e.target.classList.contains('cart-item-decrease')) {
                const item = cart.find(item => item.id === id);
                item.quantity > 1 ? item.quantity-- : cart = cart.filter(i => i.id !== id);
            }
            else if (e.target.classList.contains('cart-item-increase')) {
                cart.find(item => item.id === id).quantity++;
            }

            updateCart();
        });
    }

    function toggleMenu(e) {
        e.stopPropagation();
        elements.menuBurger.classList.toggle('active');
        elements.navLinks.classList.toggle('active');
        document.body.classList.toggle('no-scroll');
    }

    function closeMenu() {
        elements.menuBurger.classList.remove('active');
        elements.navLinks.classList.remove('active');
        document.body.classList.remove('no-scroll');
    }

    function closeMenuOnClickOutside(e) {
        if (!elements.navLinks.contains(e.target) && 
            !elements.menuBurger.contains(e.target)) {
            closeMenu();
        }
    }

    function addToCart() {
        const product = {
            id: parseInt(this.dataset.id),
            name: this.dataset.name,
            price: parseInt(this.dataset.price)
        };

        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }

        updateCart();
        showNotification(`${product.name} ajouté au panier`);
    }

    function updateCart() {
        elements.cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
        elements.cartItemsContainer.innerHTML = cart.length ? '' : '<p class="empty-cart">Votre panier est vide</p>';
        
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <img src="images/${getProductImagePath(item.id)}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <p class="cart-item-price">${item.price} FCFA x ${item.quantity}</p>
                    <div class="cart-item-actions">
                        <button class="cart-item-decrease" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="cart-item-increase" data-id="${item.id}">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" data-id="${item.id}">&times;</button>
            `;
            elements.cartItemsContainer.appendChild(itemElement);
        });

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        elements.cartTotalPrice.textContent = total.toLocaleString();
        elements.checkoutBtn.disabled = cart.length === 0;
        localStorage.setItem('korhogoShopCart', JSON.stringify(cart));
    }

    function getProductImagePath(id) {
        const productElement = document.querySelector(`.add-to-cart[data-id="${id}"]`)?.closest('.product-card');
        
        if (productElement) {
            const imgElement = productElement.querySelector('.product-image');
            if (imgElement) {
                const imgSrc = imgElement.getAttribute('src');
                return imgSrc.startsWith('images/') ? imgSrc.substring(7) : imgSrc;
            }
        }
        
        if (id <= 1) return `a${id}.jpg`;
        if (id <= 15) return `b${id-3}.jpg`;
        return `c${id-15}.jpg`;
    }

    function openCart(e) {
        e.stopPropagation();
        elements.floatingCart.classList.add('active');
        document.body.classList.add('no-scroll');
    }

    function closeCart() {
        elements.floatingCart.classList.remove('active');
        document.body.classList.remove('no-scroll');
    }

    function openOrderModal() {
        if (cart.length > 0) {
            elements.orderItemsList.innerHTML = '';
            
            cart.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'order-item';
                itemElement.innerHTML = `
                    <span>${item.name} (${item.quantity}x)</span>
                    <span>${item.price.toLocaleString()} FCFA</span>
                `;
                elements.orderItemsList.appendChild(itemElement);
            });
            
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            elements.modalTotalPrice.textContent = total.toLocaleString();
            
            setupContactLinks();
            
            elements.orderModal.classList.add('active');
            document.body.classList.add('no-scroll');
        }
    }

    function closeOrderModal() {
        elements.orderModal.classList.remove('active');
        document.body.classList.remove('no-scroll');
    }

    function setupContactLinks() {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const itemsText = cart.map(item => 
            `➤ ${item.name} (${item.quantity} x ${item.price.toLocaleString()} FCFA)`
        ).join('\n');

        const phoneNumber = "2250554101873"; // Votre numéro ici
        const formattedPhone = phoneNumber.replace(/\D/g, '');

        // WhatsApp
        const whatsappMessage = `Bonjour KORHOGO-SHOP,\n\nJe souhaite commander :\n${itemsText}\n\nTotal : ${total.toLocaleString()} FCFA\n\nCordialement`;
        elements.whatsappBtn.href = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappMessage)}`;

        // SMS
        const smsMessage = `CMD KORHOGO-SHOP\n\n${itemsText}\nTotal: ${total.toLocaleString()} FCFA`;
        elements.smsBtn.href = `sms:${formattedPhone}?body=${encodeURIComponent(smsMessage)}`;

        // Appel
        elements.callBtn.href = `tel:${formattedPhone}`;
    }

    function sendViaWhatsApp(e) {
        e.preventDefault();
        window.open(elements.whatsappBtn.href, '_blank');
        completeOrder();
    }

    function sendViaSMS(e) {
        e.preventDefault();
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            window.open(elements.smsBtn.href.replace('?', '&'));
        } else {
            window.open(elements.smsBtn.href);
        }
        completeOrder();
    }

    function makePhoneCall(e) {
        e.preventDefault();
        window.open(elements.callBtn.href);
        showNotification("Prêt à confirmer votre commande par téléphone...");
    }

    function completeOrder() {
        const order = {
            date: new Date().toISOString(),
            items: [...cart],
            total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        };
        localStorage.setItem('lastOrder', JSON.stringify(order));

        cart = [];
        localStorage.removeItem('korhogoShopCart');
        updateCart();
        closeOrderModal();
        showNotification('Commande envoyée avec succès !');
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, 3000);
        }, 100);
    }
});