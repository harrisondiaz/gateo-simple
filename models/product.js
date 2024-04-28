const Photo = require('./photo');
const HomePrice = require('./homePrice');

class Product {
    constructor({
        id,
        reference,
        productname,
        quantity,
        costwithoutvat,
        costwithvat,
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
        this.id = id;
        this.reference = reference || '';
        this.productname = productname || '';
        this.quantity = quantity || 0;
        this.costwithoutvat = costwithoutvat || 0;
        this.costwithvat = costwithvat || 0;
        this.vat = vat;
        this.totalCost = totalCost || 0;
        this.stock = stock || 0;
        this.classification = classification || '';
        this.supplier = supplier || '';
        this.homePrice = homePrice ? new HomePrice(homePrice) : null;
        this.photos = photos.map(photo => new Photo(photo));
        this.description = description || '';
        this.type = type || '';
    }

    static fromJson(json) {
        return new Product({
            id: json.productID,
            reference: json.reference,
            productname: json.productName,
            quantity: json.quantity,
            costwithoutvat: json.costWithoutVAT,
            costwithvat: json.costWithVAT,
            vat: json.vat,
            totalCost: json.totalCost,
            stock: json.stock,
            classification: json.classification,
            supplier: json.supplier,
            homePrice: json.homePrice,
            photos: json.photos.map(photo => Photo.fromJson(photo)),
            description: json.description,
            type: json.type,
        });
    }

    toJson() {
        return {
            productID: this.id,
            reference: this.reference,
            productName: this.productname,
            quantity: this.quantity,
            costWithoutVAT: this.costwithoutvat,
            costWithVAT: this.costwithvat,
            vat: this.vat,
            totalCost: this.totalCost,
            stock: this.stock,
            classification: this.classification,
            supplier: this.supplier,
            homePrice: this.homePrice ? this.homePrice.toJson() : null,
            photos: this.photos.map(photo => photo.toJson()),
            description: this.description,
            type: this.type,
        };
    }
}

module.exports = Product;
