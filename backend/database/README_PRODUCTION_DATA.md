# Production Electric Vehicle Data

This directory contains comprehensive, realistic production data for electric vehicles from major manufacturers. The data is designed to populate the enhanced database schema with accurate specifications and features.

## 📊 **Dataset Overview**

### **Manufacturers Included (12)**
- **Tesla** - Model 3, Model S, Model X, Model Y
- **BMW** - i4, iX, i7
- **Audi** - e-tron GT, Q4 e-tron, e-tron
- **Mercedes-Benz** - EQS, EQE, EQB
- **Ford** - Mustang Mach-E, F-150 Lightning
- **Nissan** - Leaf, Ariya
- **Hyundai** - IONIQ 5, IONIQ 6
- **Lucid Motors** - Air
- **Rivian** - R1T
- **Genesis** - GV60
- **Polestar** - Polestar 2
- **Cadillac** - LYRIQ

### **Vehicle Categories**
- **Sedans**: Luxury and compact electric sedans
- **SUVs**: Compact to full-size electric SUVs
- **Trucks**: Electric pickup trucks
- **Hatchbacks**: Compact electric hatchbacks

### **Detailed Specifications Included**
- **Performance**: EPA range, 0-60 acceleration, top speed, motor power, torque, drivetrain
- **Battery**: Capacity, DC/AC charging speeds, efficiency, warranty, chemistry
- **Dimensions**: Length, width, height, weight, cargo space, seating capacity
- **Safety**: NHTSA/IIHS ratings, safety features, airbag count
- **Environmental**: MPGe, CO₂ emissions, fuel costs, green scores
- **Features**: 40+ categorized features (technology, comfort, safety, charging)

## 🚀 **Installation Instructions**

### **Prerequisites**
1. PostgreSQL database with the enhanced schema installed
2. Supabase connection configured
3. Database user with INSERT permissions

### **Step 1: Install Enhanced Schema**
```bash
# First, install the enhanced schema if not already done
psql -h your-host -U your-user -d your-database -f enhanced_schema.sql
```

### **Step 2: Load Production Data**
```bash
# Load the production vehicle data
psql -h your-host -U your-user -d your-database -f production_vehicle_data.sql
```

### **Step 3: Verify Installation**
```sql
-- Check data was loaded correctly
SELECT COUNT(*) FROM vehicle_manufacturers; -- Should return 12
SELECT COUNT(*) FROM vehicle_models;        -- Should return 23
SELECT COUNT(*) FROM vehicle_listings;      -- Should return 10
SELECT COUNT(*) FROM features;              -- Should return 40+
SELECT COUNT(*) FROM vehicle_features;      -- Should return 200+

-- Test a sample query
SELECT 
  vl.name,
  vm.manufacturer->>'name' as manufacturer,
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

## 📋 **Data Sources & Accuracy**

All specifications are sourced from:
- **Official manufacturer websites** (Tesla, BMW, Audi, Mercedes-Benz, etc.)
- **EPA ratings** for range and efficiency
- **NHTSA and IIHS** for safety ratings
- **Automotive industry publications** for verified specifications

### **Data Validation**
- ✅ **EPA Range**: Official EPA-certified range ratings
- ✅ **Performance**: Manufacturer-verified acceleration and top speed
- ✅ **Battery**: Actual battery capacity and charging specifications
- ✅ **Dimensions**: Official manufacturer dimensions and weights
- ✅ **Safety**: Current NHTSA 5-star and IIHS Top Safety Pick ratings
- ✅ **Pricing**: Current MSRP base prices (as of 2024)

## 🔧 **Customization**

### **Adding More Vehicles**
To add additional vehicles, follow this pattern:

```sql
-- 1. Add manufacturer (if new)
INSERT INTO vehicle_manufacturers (id, name, slug, country, founded_year, description) 
VALUES ('new-manufacturer', 'New Manufacturer', 'new-manufacturer', 'Country', 2020, 'Description');

-- 2. Add model
INSERT INTO vehicle_models (id, manufacturer_id, name, slug, body_type, category, model_year_start, description)
VALUES ('new-model', 'new-manufacturer', 'Model Name', 'model-name', 'SUV', 'passenger', 2024, 'Description');

-- 3. Add listing with all specifications
INSERT INTO vehicle_listings (id, model_id, year, trim, name, description, msrp_base, availability_status, primary_image_url, is_featured, is_active)
VALUES ('new-listing', 'new-model', 2024, 'Trim', 'Full Name', 'Description', 50000, 'available', 'image-url', true, true);

-- 4. Add specifications (performance, battery, dimensions, safety, environmental)
-- 5. Add features
```

### **Updating Specifications**
```sql
-- Update performance specs
UPDATE vehicle_performance_specs 
SET range_epa = 400, acceleration_060 = 3.5 
WHERE listing_id = 'vehicle-id';

-- Update pricing
UPDATE vehicle_listings 
SET msrp_base = 55000 
WHERE id = 'vehicle-id';
```

## 🧪 **Testing the API**

After loading the data, test your API endpoints:

```bash
# Get all vehicle listings
curl http://localhost:4002/api/vehicle-listings

# Get specific vehicle details
curl http://localhost:4002/api/vehicle-listings/tesla-model-3-lr-2024

# Test filtering
curl "http://localhost:4002/api/vehicle-listings?manufacturer=Tesla&minRange=300"

# Test search
curl "http://localhost:4002/api/vehicle-listings?search=Model%203"
```

## 📈 **Performance Considerations**

- **Indexes**: The enhanced schema includes optimized indexes for common queries
- **Pagination**: API supports pagination for large datasets
- **Caching**: Consider implementing Redis caching for frequently accessed data
- **Images**: Image URLs point to manufacturer CDNs for optimal performance

## 🔄 **Maintenance**

### **Regular Updates**
- **Quarterly**: Update pricing and availability status
- **Annually**: Add new model years and refresh specifications
- **As needed**: Add new manufacturers and models

### **Data Integrity**
```sql
-- Check for missing specifications
SELECT vl.id, vl.name 
FROM vehicle_listings vl
LEFT JOIN vehicle_performance_specs vps ON vl.id = vps.listing_id
WHERE vps.listing_id IS NULL;

-- Verify feature assignments
SELECT COUNT(*) as feature_count, listing_id 
FROM vehicle_features 
GROUP BY listing_id 
ORDER BY feature_count;
```

## 📞 **Support**

For questions about the data structure or specifications:
1. Check the enhanced schema documentation
2. Verify against official manufacturer specifications
3. Test API endpoints with sample queries
4. Review the data validation queries above

This production dataset provides a solid foundation for a comprehensive electric vehicle information platform with realistic, accurate data that users can trust.
