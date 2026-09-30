CREATE TABLE IF NOT EXISTS sales_users (
  id BIGSERIAL PRIMARY KEY,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(150),
  position VARCHAR(100),
  photo_url TEXT,
  aadhaar_document_url TEXT,
  pan_document_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stores (
  id BIGSERIAL PRIMARY KEY,
  store_name VARCHAR(200) NOT NULL,
  owner_name VARCHAR(150),
  phone VARCHAR(20),
  area VARCHAR(150),
  pincode VARCHAR(10),
  address TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  map_location TEXT,
  shop_photo_url TEXT,
  created_by BIGINT REFERENCES sales_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  product_name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  unit VARCHAR(50) DEFAULT 'piece',
  price DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_orders (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES stores(id),
  salesman_id BIGINT REFERENCES sales_users(id),
  order_date TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(30) DEFAULT 'pending',
  total_amount DECIMAL(12,2) DEFAULT 0,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS store_order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES store_orders(id) ON DELETE CASCADE,
product_id BIGINT NOT NULL REFERENCES products(id),
quantity INTEGER NOT NULL DEFAULT 1,
unit_price DECIMAL(12,2) DEFAULT 0,
total_price DECIMAL(12,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS visits (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT NOT NULL REFERENCES stores(id),
  salesman_id BIGINT REFERENCES sales_users(id),
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  check_out_time TIMESTAMPTZ,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  notes TEXT
);

INSERT INTO products (product_name, category)
VALUES
  ('Bathroom Cleaner', 'Cleaning'),
  ('Floor Cleaner', 'Cleaning'),
  ('Toilet Cleaner', 'Cleaning'),
  ('Dish Wash', 'Cleaning'),
  ('Glass Cleaner', 'Cleaning'),
  ('Detergent Liquid', 'Laundry'),
  ('Hand Wash', 'Personal Care'),
  ('Room Freshener', 'Home Care'),
  ('Car Wash', 'Automotive')
ON CONFLICT DO NOTHING;
