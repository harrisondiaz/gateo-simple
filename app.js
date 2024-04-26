require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
const { Pool } = require("pg");
const PDFDocument = require("pdfkit");
const PDFTable = require("pdfkit-table");
app.use(express.json());
app.use(cors("*"));

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
    console.log(result.rows);
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
    console.log(result.rows);
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
    const result = await client.query("SELECT name FROM provider");
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
    res.json(result.rows);
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
    width: 410,
    align: "center",
  });
  doc.moveDown();
  drawList(doc, listItems);

  doc.end();
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
