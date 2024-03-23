class Photo {
    constructor({ color, url }) {
        this.color = color;
        this.url = url;
    }

    static fromJson(json) {
        return new Photo({
            color: json.color || '',
            url: json.url || '',
        });
    }

    toJson() {
        return {
            color: this.color,
            url: this.url,
        };
    }
}

module.exports = Photo;
