const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { Pool } = require("pg");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "HALA Store Marketing API is running"
  });
});

app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products WHERE is_active = TRUE ORDER BY product_name"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/stores", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM stores ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/stores", async (req, res) => {
  try {
    const {
      store_name,
      owner_name,
      phone,
      area,
      pincode,
      address,
      latitude,
      longitude,
      map_location,
      shop_photo_url,
      created_by
    } = req.body;

    const result = await pool.query(
      `INSERT INTO stores
      (store_name, owner_name, phone, area, pincode, address,
       latitude, longitude, map_location, shop_photo_url, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`,
      [
        store_name,
        owner_name,
        phone,
        area,
        pincode,
        address,
        latitude,
        longitude,
        map_location,
        shop_photo_url,
        created_by
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/visits", async (req, res) => {
  try {
    const {
      store_id,
      salesman_id,
      latitude,
      longitude,
      notes
    } = req.body;

    const result = await pool.query(
      `INSERT INTO visits
      (store_id, salesman_id, latitude, longitude, notes)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *`,
      [
        store_id,
        salesman_id,
        latitude,
        longitude,
        notes
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/orders", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      store_id,
      salesman_id,
      notes,
      items
    } = req.body;

    await client.query("BEGIN");

    const orderResult = await client.query(
      `INSERT INTO store_orders
      (store_id, salesman_id, notes)
      VALUES ($1,$2,$3)
      RETURNING *`,
      [store_id, salesman_id, notes]
    );

    const order = orderResult.rows[0];

    let totalAmount = 0;

    for (const item of items || []) {
      const quantity = Number(item.quantity || 1);
      const unitPrice = Number(item.unit_price || 0);
      const totalPrice = quantity * unitPrice;

      totalAmount += totalPrice;

      await client.query(
        `INSERT INTO store_order_items
        (order_id, product_id, quantity, unit_price, total_price)
        VALUES ($1,$2,$3,$4,$5)`,
        [
          order.id,
          item.product_id,
          quantity,
          unitPrice,
          totalPrice
        ]
      );
    }

    const updatedOrder = await client.query(
      `UPDATE store_orders
       SET total_amount = $1
       WHERE id = $2
       RETURNING *`,
      [totalAmount, order.id]
    );

    await client.query("COMMIT");

    res.status(201).json(updatedOrder.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.get("/api/dashboard", async (req, res) => {
  try {
    const stores = await pool.query(
      "SELECT COUNT(*) FROM stores"
    );

    const orders = await pool.query(
      "SELECT COUNT(*) FROM store_orders"
    );

    const visits = await pool.query(
      "SELECT COUNT(*) FROM visits"
    );

    const sales = await pool.query(
      "SELECT COALESCE(SUM(total_amount),0) AS total FROM store_orders"
    );

    res.json({
      total_stores: Number(stores.rows[0].count),
      total_orders: Number(orders.rows[0].count),
      total_visits: Number(visits.rows[0].count),
      total_sales: Number(sales.rows[0].total)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`HALA Store Marketing API running on port ${PORT}`);
});
