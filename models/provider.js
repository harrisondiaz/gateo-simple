class Provider {
    constructor({
        nature,
        taxRegime,
        documentType,
        document,
        verificationDigit,
        firstName,
        otherNames,
        lastName,
        secondLastName,
        businessName,
        department,
        city,
        address,
        neighborhood,
        phone,
        zone,
        email,
    }) {
        this.nature = nature || '';
        this.taxRegime = taxRegime || '';
        this.documentType = documentType || '';
        this.document = document || '';
        this.verificationDigit = verificationDigit || '';
        this.firstName = firstName || '';
        this.otherNames = otherNames || '';
        this.lastName = lastName || '';
        this.secondLastName = secondLastName || '';
        this.businessName = businessName || '';
        this.department = department || '';
        this.city = city || '';
        this.address = address || '';
        this.neighborhood = neighborhood || '';
        this.phone = phone || '';
        this.zone = zone || '';
        this.email = email || '';
    }

    static fromJson(json) {
        return new Provider({
            nature: json.nature,
            taxRegime: json.taxRegime,
            documentType: json.documentType,
            document: json.document,
            verificationDigit: json.verificationDigit,
            firstName: json.firstName,
            otherNames: json.otherNames,
            lastName: json.lastName,
            secondLastName: json.secondLastName,
            businessName: json.businessName,
            department: json.department,
            city: json.city,
            address: json.address,
            neighborhood: json.neighborhood,
            phone: json.phone,
            zone: json.zone,
            email: json.email,
        });
    }

    toJson() {
        return {
            nature: this.nature,
            taxRegime: this.taxRegime,
            documentType: this.documentType,
            document: this.document,
            verificationDigit: this.verificationDigit,
            firstName: this.firstName,
            otherNames: this.otherNames,
            lastName: this.lastName,
            secondLastName: this.secondLastName,
            businessName: this.businessName,
            department: this.department,
            city: this.city,
            address: this.address,
            neighborhood: this.neighborhood,
            phone: this.phone,
            zone: this.zone,
            email: this.email,
        };
    }
}

module.exports = Provider;
