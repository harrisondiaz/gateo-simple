const express = require('express');
const app = express();
const port = process.env.PORT||3000;
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');

const Product = require('./models/product');
const uri = "mongodb+srv://harrisondiaz:Meliodassama01@products.og4vryj.mongodb.net/?retryWrites=true&w=majority&appName=products";
app.use(express.json());
app.use(cors("*"));

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

  async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error(err);
    }
}

connectToDatabase();

app.get('/products', async (req, res) => {
    try {
        const database = client.db("pasitos_traviesos"); 
        const collection = database.collection("product"); 
        const products = await collection.find().toArray();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/products', async (req, res) => {
    const productData = req.body;
    const product = new Product(productData);
    try {
        const database = client.db("pasitos_traviesos"); 
        const collection = database.collection("product"); 
        const lastProduct = await collection.find().sort({ productID: -1 }).limit(1).toArray();
        let nextProductID = 1;
        if (lastProduct.length > 0) {
            nextProductID = lastProduct[0].productID + 1;
        }
        productData.productID = nextProductID;
        const product = new Product(productData);
        const result = await collection.insertOne(product.toJson());
        res.status(201).json("Product created successfully");
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.get('/api/hello', (req, res) => {
    res.json({ message: '¡Hola, mundo!' });
});



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})