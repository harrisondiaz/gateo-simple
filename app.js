const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
const { MongoClient, ServerApiVersion,ObjectId  } = require("mongodb");
const bcrypt = require("bcrypt");
const Product = require("./models/product");
const uri =
  "mongodb+srv://harrisondiaz:Meliodassama01@products.og4vryj.mongodb.net/?retryWrites=true&w=majority&appName=products";
app.use(express.json());
app.use(cors("*"));

const jwt = require("jsonwebtoken");

const secretKey =
  "rEaC0fU8v1wBfHLg60B0ZEyWq7z4h8aeboxcdYuexIZv/Annu8E6CGjtj7B+2QtzTwAM9xup6S1dO94yHEh+0g==";

const expiresIn = 3600;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const usersCollection = client.db("login").collection("users");

    const saltRounds = 10;
    const plainTextPassword = "empleado123";
    const hashedPassword = await bcrypt.hash(plainTextPassword, saltRounds);

    // Check if the pre-defined user already exists (optional)
    const existingUser = await usersCollection.findOne({
      email: "empleado@empleado.com",
    });

    if (!existingUser) {
      await usersCollection.insertOne({
        name: "Empleado 🌟",
        email: "empleado@empleado.com",
        password: hashedPassword,
      });
      console.log("Pre-defined user created successfully!");
    } else {
      console.log("Pre-defined user already exists.");
    }
  } finally {
    await client.close();
  }
}

run().catch(console.dir);

app.get("/api/users/:email", async (req, res) => {
  const email = req.params.email;

  try {
    await client.connect();
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    const usersCollection = client.db("login").collection("users");
    const user = await usersCollection.findOne({ email }, { projection: { _id: 0, email: 1, name: 1 } });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.post("/api/login", async (req, res) => {
  
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Falta el email o contraseña" });
  }

  try {
    await client.connect();
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    const usersCollection = client.db("login").collection("users");
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(200).json({ message: "Email o contraseña invalidos" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(200).json({ message: "Email o contraseña invalidos" });
    }

    const payload = {
      username: user.email,
      role: "admin",
    };

    const token = jwt.sign(payload, secretKey, { expiresIn });

    res.json({ message: "Login successful!", token: token }); // Replace with actual JWT
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get('/api/products', async (req, res) => {
    try {
        await client.connect();
        const productsCollection = client.db("pasitos_traviesos").collection("product");
        const products = await productsCollection.find().toArray();

        const response = products.map(product => ({
            reference: product.reference,
            productName: product.productName,
            homePrice: product.homePrice.value,
            photos: product.photos,
            description: product.description
        }));

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.get("/products", async (req, res) => {
  try {
    await client.connect();
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    const database = client.db("pasitos_traviesos");
    const collection = database.collection("product");
    const products = await collection.find().toArray();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/providers", async (req, res) => {
  try {
    await client.connect();
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    const database = client.db("pasitos_traviesos");
    const collection = database.collection("provider");
    const providers = await collection.find().toArray();
    res.json(providers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/providers", async (req, res) => {
  const providerData = req.body;
  try {
    await client.connect();
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    const database = client.db("pasitos_traviesos");
    const collection = database.collection("provider");
    const result = await collection.insertOne(providerData);
    res.status(201).json("Provider created successfully");
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


app.post("/products", async (req, res) => {
  const productData = req.body;
  const product = new Product(productData);
  try {
    await client.connect();
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    const database = client.db("pasitos_traviesos");
    const collection = database.collection("product");
    const lastProduct = await collection
      .find()
      .sort({ productID: -1 })
      .limit(1)
      .toArray();
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

//Borrar el primer proveedor por el _id
app.delete("/providers/:id", async (req, res) => {
  const id = req.params.id;
  try {
    await client.connect();
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    const database = client.db("pasitos_traviesos");
    const collection = database.collection("provider");
    const result = await collection.deleteOne({ "_id": new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }
    res.json("Proveedor eliminado exitosamente");
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


app.get("/api/hello", (req, res) => {
  res.json({ message: "¡Hola, mundo!" });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
