
#Folder structure(patient side)
/patient
│
├── index.html                ← Landing page (Home)
├── about.html                ← About page
├── contact.html              ← Contact page
│
├── /auth
│   ├── loginUser.html
│   └── registerUser.html
│
├── /pages
│   ├── shop.html             ← Drug listing / product page
│   ├── productDetails.html   ← Individual drug info
│   ├── cart.html             ← Cart page
│   ├── checkout.html         ← Checkout + M-Pesa payment
│   ├── orders.html           ← View all past orders
│   ├── uploadPrescription.html ← Upload prescription photo
│   └── profile.html          ← User info + address management
│
├── /scripts
│   ├── app.js                ← General site interactivity
│   ├── cart.js               ← Cart logic
│   ├── checkout.js           ← Payment + order submission logic
│   ├── prescription.js       ← Upload prescription handling
│   └── userAuth.js           ← Login/register logic
│
└── /assets
    ├── images/
    ├── styles.css
    └── logo.png



#Pharmacist
/pharmacist
│
├── dashboard.html            ← Main dashboard after login
├── loginPharmacist.html      ← Pharmacist login
│
├── /pages
│   ├── prescriptions.html    ← View + verify uploaded prescriptions
│   ├── stock.html            ← Manage medicine inventory
│   ├── orders.html           ← See incoming orders & mark them as ready
│   ├── analytics.html        ← See daily/weekly sales stats
│   ├── profile.html          ← Pharmacist info/settings
│   └── chatSupport.html      ← Optional live chat/helpdesk
│
├── /scripts
│   ├── dashboard.js
│   ├── prescriptions.js
│   ├── stock.js
│   ├── orders.js
│   ├── analytics.js
│   └── authPharmacist.js
│
└── /assets
    ├── styles.css
    └── icons/

#Admin
/admin
│
├── dashboard.html            ← Admin overview (sales, user stats, etc.)
├── loginAdmin.html           ← Admin login
│
├── /pages
│   ├── manageUsers.html      ← Add/remove clients, pharmacists
│   ├── manageProducts.html   ← Add/remove/edit medicine catalog
│   ├── manageOrders.html     ← Track all orders system-wide
│   ├── payments.html         ← See M-Pesa transactions
│   ├── deliveries.html       ← View/update delivery status
│   ├── reports.html          ← Downloadable sales/stock reports
│   ├── notifications.html    ← Broadcast updates or alerts
│   └── settings.html         ← System configuration (tax, fees, delivery charges)
│
├── /scripts
│   ├── dashboard.js
│   ├── manageUsers.js
│   ├── manageProducts.js
│   ├── manageOrders.js
│   ├── payments.js
│   ├── reports.js
│   ├── notifications.js
│   └── authAdmin.js
│
└── /assets
    ├── styles.css
    └── logo-admin.png
