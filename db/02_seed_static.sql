-- =========================================================
-- Jones Care HMS — Static seed data
-- Services, drugs, integrations
-- =========================================================


INSERT INTO services (name, price) VALUES
  ('General Consultation', 500.00),
  ('Nurse Vitals',         100.00),
  ('Malaria Test',         300.00),
  ('Full Blood Count',     700.00),
  ('Dressing',             400.00)
ON DUPLICATE KEY UPDATE price = VALUES(price);

INSERT INTO drugs (name, price, stock_qty, reorder_level) VALUES
  ('Paracetamol 500mg',             10.00, 500, 50),
  ('Amoxicillin 250mg',             25.00, 200, 30),
  ('Artemether/Lumefantrine',      150.00,  80, 20),
  ('ORS Sachet',                    30.00, 300, 40)
ON DUPLICATE KEY UPDATE price = VALUES(price);

INSERT INTO integrations (name, status) VALUES
  ('POS',        'DISABLED'),
  ('AGENTIC_AI', 'DISABLED'),
  ('SHA',        'DISABLED'),
  ('SMS',        'DISABLED')
ON DUPLICATE KEY UPDATE name = VALUES(name);