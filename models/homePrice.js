class HomePrice {
    constructor({ value, utilityPercentage, utilityValue }) {
        this.value = value;
        this.utilityPercentage = utilityPercentage;
        this.utilityValue = utilityValue;
    }

    static fromJson(json) {
        return new HomePrice({
            value: json.value || 0,
            utilityPercentage: json.utilityPercentage || 0,
            utilityValue: json.utilityValue || 0,
        });
    }

    toJson() {
        return {
            value: this.value,
            utilityPercentage: this.utilityPercentage,
            utilityValue: this.utilityValue,
        };
    }
}

module.exports = HomePrice;
