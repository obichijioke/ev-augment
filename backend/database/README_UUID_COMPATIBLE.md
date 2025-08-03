# UUID-Compatible Production Vehicle Data

This file contains the same comprehensive production vehicle data, but adapted to work with the UUID-based enhanced database schema that uses `gen_random_uuid()` for primary keys.

## 🔧 **Key Differences from Original**

### **UUID Compatibility**
- ✅ **Auto-generated UUIDs**: All primary keys use `gen_random_uuid()`
- ✅ **Proper Foreign Keys**: All relationships use UUID references
- ✅ **Referential Integrity**: Maintains proper relationships between tables
- ✅ **Temporary Tables**: Uses temp tables to capture and reuse generated UUIDs

### **Technical Approach**
The script uses a sophisticated approach to handle UUID generation:

1. **Temporary ID Storage**: Creates temporary tables to store generated UUIDs
2. **Cascading Inserts**: Inserts data in dependency order (manufacturers → models → listings → specs)
3. **UUID Capture**: Uses `RETURNING` clauses to capture generated UUIDs
4. **Reference Resolution**: Uses subqueries to resolve UUID references

## 📊 **Dataset Contents**

### **Complete Data Included**
- **12 Manufacturers**: Tesla, BMW, Audi, Mercedes-Benz, Ford, Nissan, Hyundai, Lucid, Rivian, Genesis, Polestar, Cadillac
- **23 Vehicle Models**: Covering sedans, SUVs, trucks, and hatchbacks
- **10 Featured Vehicles**: With complete specifications and features
- **6 Feature Categories**: Technology, Comfort, Safety, Charging, Performance, Exterior
- **30+ Features**: Categorized features with proper assignments
- **Complete Specifications**: Performance, battery, dimensions, safety, environmental

### **Sample Vehicles Included**
1. **Tesla Model 3 Long Range** - 358 mi range, $47,240
2. **Tesla Model S Plaid** - 396 mi range, $89,880
3. **Tesla Model Y Long Range** - 330 mi range, $50,490
4. **BMW i4 M50** - 270 mi range, $67,300
5. **BMW iX xDrive50** - 324 mi range, $87,100
6. **Audi e-tron GT** - 238 mi range, $106,500
7. **Mercedes EQS 450+** - 453 mi range, $104,400
8. **Ford Mustang Mach-E GT** - 260 mi range, $59,400
9. **Hyundai IONIQ 5 Limited** - 303 mi range, $56,500
10. **Lucid Air Dream Edition** - 516 mi range, $169,000

## 🚀 **Installation Instructions**

### **Prerequisites**
1. PostgreSQL database with UUID extensions enabled
2. Enhanced schema installed (`enhanced_schema.sql`)
3. Database user with CREATE and INSERT permissions

### **Step 1: Install Enhanced Schema**
```bash
# Install the enhanced schema first
psql -h your-host -U your-user -d your-database -f enhanced_schema.sql
```

### **Step 2: Load UUID-Compatible Data**
```bash
# Load the UUID-compatible production data
psql -h your-host -U your-user -d your-database -f production_vehicle_data_uuid.sql
```

### **Step 3: Verify Installation**
```sql
-- Check data was loaded correctly
SELECT COUNT(*) FROM vehicle_manufacturers; -- Should return 12
SELECT COUNT(*) FROM vehicle_models;        -- Should return 23
SELECT COUNT(*) FROM vehicle_listings;      -- Should return 10
SELECT COUNT(*) FROM features;              -- Should return 30+
SELECT COUNT(*) FROM vehicle_features;      -- Should return 25+

-- Test a sample query with UUIDs
SELECT 
  vl.name,
  vm.name as model_name,
  vps.range_epa,
  vbs.battery_capacity_kwh,
  vl.msrp_base
FROM vehicle_listings vl
JOIN vehicle_models vm ON vl.model_id = vm.id
LEFT JOIN vehicle_performance_specs vps ON vl.id = vps.listing_id
LEFT JOIN vehicle_battery_specs vbs ON vl.id = vbs.listing_id
WHERE vl.is_active = true
ORDER BY vps.range_epa DESC;
```

## 🔍 **How It Works**

### **UUID Generation Strategy**
```sql
-- Example of the UUID capture pattern used:
CREATE TEMP TABLE temp_manufacturer_ids (
  slug VARCHAR(100) PRIMARY KEY,
  uuid UUID
);

WITH inserted_manufacturers AS (
  INSERT INTO vehicle_manufacturers (name, slug, country, founded_year, description) 
  VALUES ('Tesla', 'tesla', 'United States', 2003, 'Description')
  RETURNING id, slug
)
INSERT INTO temp_manufacturer_ids (slug, uuid)
SELECT slug, id FROM inserted_manufacturers;

-- Later reference the UUID:
INSERT INTO vehicle_models (manufacturer_id, name, slug, body_type) VALUES
((SELECT uuid FROM temp_manufacturer_ids WHERE slug = 'tesla'), 'Model 3', 'model-3', 'Sedan');
```

### **Benefits of This Approach**
- ✅ **Maintains Referential Integrity**: All foreign keys are properly resolved
- ✅ **Uses Auto-Generated UUIDs**: No hardcoded IDs that might conflict
- ✅ **Scalable**: Easy to add more data using the same pattern
- ✅ **Clean**: Temporary tables are dropped after use

## 🧪 **Testing the Data**

### **API Testing**
```bash
# Test the vehicle listings API
curl http://localhost:4002/api/vehicle-listings

# Test specific vehicle details (use actual UUID from database)
curl http://localhost:4002/api/vehicle-listings/{uuid}

# Test filtering
curl "http://localhost:4002/api/vehicle-listings?manufacturer=Tesla&minRange=300"
```

### **Database Queries**
```sql
-- Get all Tesla vehicles with specifications
SELECT 
  vl.name,
  vl.year,
  vl.trim,
  vps.range_epa,
  vps.acceleration_0_60,
  vbs.battery_capacity_kwh,
  vl.msrp_base
FROM vehicle_listings vl
JOIN vehicle_models vm ON vl.model_id = vm.id
JOIN vehicle_manufacturers vmf ON vm.manufacturer_id = vmf.id
LEFT JOIN vehicle_performance_specs vps ON vl.id = vps.listing_id
LEFT JOIN vehicle_battery_specs vbs ON vl.id = vbs.listing_id
WHERE vmf.name = 'Tesla'
ORDER BY vps.range_epa DESC;

-- Get feature counts by vehicle
SELECT 
  vl.name,
  COUNT(vf.id) as feature_count
FROM vehicle_listings vl
LEFT JOIN vehicle_features vf ON vl.id = vf.listing_id
GROUP BY vl.id, vl.name
ORDER BY feature_count DESC;
```

## 🔄 **Adding More Data**

To add additional vehicles using the same UUID-compatible pattern:

```sql
-- 1. Add to temporary tables (if they exist)
-- 2. Insert new data using UUID references
-- 3. Use the same pattern for maintaining relationships

-- Example: Adding a new manufacturer
WITH inserted_manufacturer AS (
  INSERT INTO vehicle_manufacturers (name, slug, country, founded_year, description)
  VALUES ('New Manufacturer', 'new-manufacturer', 'Country', 2020, 'Description')
  RETURNING id, slug
)
INSERT INTO temp_manufacturer_ids (slug, uuid)
SELECT slug, id FROM inserted_manufacturer;
```

## ⚠️ **Important Notes**

1. **Run Complete Script**: The script must be run as a complete transaction to maintain UUID relationships
2. **Temporary Tables**: The script creates and drops temporary tables - don't interrupt mid-execution
3. **UUID References**: All foreign key relationships use proper UUID references
4. **Data Integrity**: The script maintains all referential integrity constraints

This UUID-compatible version provides the same comprehensive vehicle data while working seamlessly with your enhanced database schema that uses auto-generated UUIDs.
