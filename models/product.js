const Photo = require('./photo');
const HomePrice = require('./homePrice');

class Product {
    constructor({
        productID,
        reference,
        productName,
        quantity,
        costWithoutVAT,
        costWithVAT,
        vat = 19,
        totalCost,
        stock,
        classification,
        supplier,
        homePrice,
        photos,
        description,
        type,
    }) {
        this.productID = productID || 0;
        this.reference = reference || '';
        this.productName = productName || '';
        this.quantity = quantity || 0;
        this.costWithoutVAT = costWithoutVAT || 0;
        this.costWithVAT = costWithVAT || 0;
        this.vat = vat || 19;
        this.totalCost = totalCost || 0;
        this.stock = stock || 0;
        this.classification = classification || '';
        this.supplier = supplier || '';
        this.homePrice = homePrice ? new HomePrice(homePrice) : {};
        this.photos = Array.isArray(photos) ? photos.map(photoJson => Photo.fromJson(photoJson)) : [];
        this.description = description || '';
        this.type = type || '';
    }

    static fromJson(json) {
        return new Product({
            productID: json.productID,
            reference: json.reference,
            productName: json.productName,
            quantity: json.quantity,
            costWithoutVAT: json.costWithoutVAT,
            costWithVAT: json.costWithVAT,
            vat: json.vat,
            totalCost: json.totalCost,
            stock: json.stock,
            classification: json.classification,
            supplier: json.supplier,
            homePrice: json.homePrice || {},
            photos: json.photos || [],
            description: json.description,
            type: json.type,
        });
    }

    toJson() {
        return {
            productID: this.productID,
            reference: this.reference,
            productName: this.productName,
            quantity: this.quantity,
            costWithoutVAT: this.costWithoutVAT,
            costWithVAT: this.costWithVAT,
            vat: this.vat,
            totalCost: this.totalCost,
            stock: this.stock,
            classification: this.classification,
            supplier: this.supplier,
            homePrice: this.homePrice ? this.homePrice.toJson() : {},
            photos: this.photos.map(photo => photo.toJson()),
            description: this.description,
            type: this.type,
        };
    }
}

module.exports = Product;
