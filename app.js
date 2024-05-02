require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
const { Pool } = require("pg");
const PDFDocument = require("pdfkit");
const PDFTable = require("pdfkit-table");
const fs = require('fs');
const crypto = require('crypto');
app.use(express.json());
app.use(cors("*"));


const algorithm = 'aes-256-cbc';
const secretKey = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';
const iv = crypto.randomBytes(16);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

/**
 *  Para revisar la conección a la base de datos
 **/
app.get("/ping", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT 1");
    res.send("Database connection successful");
    client.release();
  } catch (error) {
    console.log();
    res.status(500).send("Database connection failed");
  }
});

// Get all products
// Get all products with the specified format
// Get all products with photos
app.get("/products", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
    SELECT
    p.id,
    p.classification,
    p.costwithvat,
    p.costwithoutvat,
    p.description,
    json_build_object('value', p.homepricevalue, 'utilityPercentage', p.homepriceutilitypercentage, 'utilityValue', p.homepriceutilityvalue) AS homePrice,
    (
        SELECT json_agg(json_build_object('color', pp.color, 'url', pp.url))
        FROM PhotoProduct pp
        WHERE pp.productoid = p.id
    ) AS photos,
    p.id AS "productid",
    p.productname,
    p.quantity,
    p.reference,
    p.stock,
    '' AS supplier,
    p.totalcost,
    p.type,
    p.vat
FROM
    Product p;

    `);
    res.json(result.rows);
    client.release();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all products with the specified format
app.get("/products/format", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(`
    SELECT
    p.id AS "_id",
    p.classification,
    p.costWithVAT,
    p.costWithoutVAT,
    p.description,
    json_build_object('value', p.homePriceValue, 'utilityPercentage', p.homePriceUtilityPercentage, 'utilityValue', p.homePriceUtilityValue) AS homePrice,
    (
        SELECT json_agg(json_build_object('color', pp.color, 'url', pp.url))
        FROM PhotoProduct pp
        WHERE pp.productoID = p.id
    ) AS photos,
    p.id AS "productID",
    p.productName,
    p.quantity,
    p.reference,
    p.stock,
    '' AS supplier,
    p.totalCost,
    p.type,
    p.vat
FROM
    Product p;
    
        `);
    res.json(result.rows);
    client.release();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all providers
app.get("/providers", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT * FROM provider");
    res.json(result.rows);
    client.release();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

//
app.get("/providers/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT * FROM provider WHERE id = $1", [
      id,
    ]);
    res.json(result.rows);
    client.release();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/provider/names", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT businessname, id FROM provider");
    res.json(result.rows);
    client.release();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/products/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT * FROM product WHERE id = $1", [
      id,
    ]);
    const product = result.rows[0];

    const photosResult = await client.query(
      "SELECT color, url FROM photoproduct WHERE productoid = $1",
      [id]
    );
    const photos = photosResult.rows;

    product.photos = photos;

    res.json(product);
    client.release();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/providers/:id", async (req, res) => {
  const id = req.params.id;
  const {
    nature,
    taxregime,
    documenttype,
    document,
    verificationdigit,
    firstname,
    othernames,
    lastname,
    secondlastname,
    businessname,
    department,
    city,
    address,
    neighborhood,
    phone,
    zone,
    email,
  } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query(
      "UPDATE provider SET nature = $1, taxRegime = $2, documentType = $3, document = $4, verificationDigit = $5, firstName = $6, otherNames = $7, lastName = $8, secondLastName = $9, businessName = $10, department = $11, city = $12, address = $13, neighborhood = $14, phone = $15, zone = $16, email = $17 WHERE id = $18 RETURNING *",
      [
        nature,
        taxregime,
        documenttype,
        document,
        verificationdigit,
        firstname,
        othernames,
        lastname,
        secondlastname,
        businessname,
        department,
        city,
        address,
        neighborhood,
        phone,
        zone,
        email,
        id,
      ]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ message: "Provider not found" });
    } else {
      res.json(result.rows[0]);
    }
    client.release();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/pdf", async (req, res) => {
  const providers = req.body;

  res.status(200).set({
    "Content-Type": "application/pdf",
    "Content-Disposition": 'attachment; filename="providers.pdf"',
  });
  const doc = new PDFDocument({ layout: "portrait" }); // Set layout to landscape
  doc.pipe(res); // Pipe the PDF output to the response

  // List
  const listItems = providers.map(
    (provider) =>
      `Naturaleza: ${provider.nature}\n` +
      `Régimen Tributario: ${provider.taxRegime}\n` +
      `Tipo de Documento: ${provider.documentType}\n` +
      `Documento: ${provider.document}\n` +
      `Dígito de Verificación: ${provider.verificationDigit}\n` +
      `Primer Nombre: ${provider.firstName}\n` +
      `Otros Nombres: ${provider.otherNames}\n` +
      `Apellido: ${provider.lastName}\n` +
      `Segundo Apellido: ${provider.secondLastName}\n` +
      `Nombre de la Empresa: ${provider.businessName}\n` +
      `Departamento: ${provider.department}\n` +
      `Ciudad: ${provider.city}\n` +
      `Dirección: ${provider.address}\n` +
      `Barrio: ${provider.neighborhood}\n` +
      `Teléfono: ${provider.phone}\n` +
      `Zona: ${provider.zone}\n` +
      `Correo Electrónico: ${provider.email}\n\n`
  );

  // Draw list
  doc.text("Proveedores", {
    underline: true,
    align: "center",
  });
  doc.moveDown();
  drawList(doc, listItems);

  doc.end();
});

app.post("/pdf/provider", async (req, res) => {
  const provider = req.body;
  res.status(200).set({
    "Content-Type": "application/pdf",
    "Content-Disposition": 'attachment; filename="providers.pdf"',
  });
  const doc = new PDFTable({ layout: "horizontal", size: "A3" });
  doc.pipe(res);
  const rows = provider.map((provider) => [
    provider.nature,
    provider.taxregime,
    provider.documenttype,
    provider.document,
    provider.verificationdigit,
    provider.firstname,
    provider.othernames,
    provider.lastname,
    provider.secondlastname,
    provider.businessname,
    provider.department,
    provider.city,
    provider.address,
    provider.neighborhood,
    provider.phone,
    provider.zone,
    provider.email,
  ]);
  const table = {
    title: "Proveedores",
    subtitle: "Información de proveedores",
    headers: [
      "Naturaleza",
      "Régimen Tributario",
      "Tipo de Documento",
      "Documento",
      "Dígito de Verificación",
      "Primer Nombre",
      "Otros Nombres",
      "Apellido",
      "Segundo Apellido",
      "Nombre de la Empresa",
      "Departamento",
      "Ciudad",
      "Dirección",
      "Barrio",
      "Teléfono",
      "Zona",
      "Correo Electrónico",
    ],
    rows: rows,
  };
  doc.table(table);
  doc.end();
});

app.post("/pdf/products", async (req, res) => {
  try {
    const products = req.body;

    const rows = products.map((product) => [
      product.productid,
      product.classification,
      product.costWithVAT,
      product.costWithoutVAT,
      product.description,
      product.homePrice,
      product.photos,
      product.productName,
      product.quantity,
      product.reference,
      product.stock,
      product.supplier,
      product.totalCost,
      product.type,
      product.vat,
    ]);

    res.status(200).set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="products.pdf"',
    });

    const doc = new PDFTable({ layout: "landscape" });
    doc.pipe(res);

    const table = {
      title: "Productos",
      subtitle: "Información de productos",
      headers: [
        "ID",
        "Clasificación",
        "Costo con IVA",
        "Costo sin IVA",
        "Descripción",
        "Precio de Venta",
        "Fotos",
        "Nombre",
        "Cantidad",
        "Referencia",
        "Stock",
        "Proveedor",
        "Costo Total",
        "Tipo",
        "IVA",
      ],
      rows: rows,
    };

    doc.table(table);
    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while generating the PDF.");
  }
});

function drawList(doc, listItems) {
  const { fontSize, startX, startY, bulletRadius } = {
    fontSize: 10,
    startX: 50,
    startY: 50,
    bulletRadius: 3,
  };

  doc.fontSize(fontSize);
  doc.list(listItems, startX, startY, { bulletRadius, bulletIndent: 10 });
}

app.post("/providers", async (req, res) => {
  const {
    nature,
    taxregime,
    documenttype,
    document,
    verificationdigit,
    firstname,
    othernames,
    lastname,
    secondLastname,
    businessname,
    department,
    city,
    address,
    neighborhood,
    phone,
    zone,
    email,
  } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query(
      "INSERT INTO provider (nature, taxRegime, documentType, document, verificationDigit, firstName, otherNames, lastName, secondLastName, businessName, department, city, address, neighborhood, phone, zone, email) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *",
      [
        nature,
        taxregime,
        documenttype,
        document,
        verificationdigit,
        firstname,
        othernames,
        lastname,
        secondLastname,
        businessname,
        department,
        city,
        address,
        neighborhood,
        phone,
        zone,
        email,
      ]
    );
    res.status(201).json(result.rows[0]);
    client.release();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/providers/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const client = await pool.connect();
    const result = await client.query("DELETE FROM provider WHERE id = $1", [
      id,
    ]);
    if (result.rowCount === 0) {
      res.status(404).json({ message: "Provider not found" });
    } else {
      res.status(204).json();
    }
    client.release();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/client", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT * FROM client");
    res.json(result.rows);
    client.release();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/products/:id/details", async (req, res) => {
  const id = req.params.id;
  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT p.homepricevalue, p.productname, p.description, p.classification, p.stock FROM product p LEFT JOIN photoproduct pp ON p.id = pp.productoid WHERE p.id = $1",
      [id]
    );
    const data = result.rows[0];

    res.json(data);
    client.release();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/products/details/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT p.id, p.reference, p.productname, p.stock, p.classification, json_build_object('value', p.homepricevalue) as homeprice, json_agg(json_build_object('color', pp.color, 'url', pp.url)) as photos, p.description FROM product p LEFT JOIN photoproduct pp ON p.id = pp.productoid WHERE p.id = $1 GROUP BY p.id",
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Product not found" });
    } else {
      const data = result.rows.map((row) => ({
        id: row.id,
        reference: row.reference,
        productname: row.productname,
        stock: row.stock,
        classification: row.classification,
        homeprice: row.homeprice,
        photos: row.photos,
        description: row.description,
      }));
      res.json(data[0]); // Return the first (and only) element in the array
    }

    client.release();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/products/details", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query(
      "SELECT p.id, p.reference, p.productname, p.stock, p.classification, json_build_object('value', p.homepricevalue) as homeprice, json_agg(json_build_object('color', pp.color, 'url', pp.url)) as photos, p.description FROM product p LEFT JOIN photoproduct pp ON p.id = pp.productoid GROUP BY p.id"
    );

    const data = result.rows.map((row) => ({
      id: row.id,
      reference: row.reference,
      productname: row.productname,
      stock: row.stock,
      classification: row.classification,
      homeprice: row.homeprice,
      photos: row.photos,
      description: row.description,
    }));
    res.json(data);

    client.release();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

const decrypt = (hash) => {
    const parts = hash.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString();
};

app.get("/user/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const encryptedData = fs.readFileSync('encrypted.txt', 'utf8');
    const data = decrypt(encryptedData);
    const users = data.split('\n').map(line => {
      const [name, email] = line.split(',');
      return { name: name.trim(), email: email.trim() };
    });
    const user = users.find(user => user.email === email);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
