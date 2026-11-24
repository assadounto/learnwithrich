CREATE TABLE "project_ideas" (
    "slug" VARCHAR(120) NOT NULL PRIMARY KEY,
    "title" VARCHAR(180) NOT NULL,
    "discipline" VARCHAR(32) NOT NULL,
    "abstract" VARCHAR(3000) NOT NULL,
    "tags" TEXT[] NOT NULL,
    "status" "ResourceStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL
);

CREATE INDEX "project_ideas_status_discipline_title_idx" ON "project_ideas"("status", "discipline", "title");

INSERT INTO "project_ideas" ("slug", "title", "discipline", "abstract", "tags", "status", "updated_at") VALUES
    ('solar-pump-monitor', 'Solar Pump Performance Monitor', 'electrical', 'Design a low voltage prototype that logs pump current, water flow and light intensity. Compare how flow changes across lighting conditions and test whether a simple threshold can distinguish low sunlight from a blocked inlet. Evaluate the readings against manual measurements.', ARRAY['solar', 'sensors', 'energy'], 'PUBLISHED', CURRENT_TIMESTAMP),
    ('motor-condition-monitor', 'Motor Vibration Condition Monitor', 'electrical', 'Use an accelerometer to compare vibration patterns from a small DC motor at different speeds. Test whether features such as peak amplitude or frequency can flag a loose mount. Report which conditions the prototype can distinguish and where it gives false alarms.', ARRAY['motors', 'signals', 'embedded'], 'PUBLISHED', CURRENT_TIMESTAMP),
    ('solar-dryer-airflow', 'Solar Dryer Airflow Study', 'mechanical', 'Build a small passive solar dryer with adjustable air vents. Measure air temperature, humidity and sample mass over time, compare vent layouts with an open air baseline, and explain how weather changes affect the results.', ARRAY['heat transfer', 'prototyping', 'sustainability'], 'PUBLISHED', CURRENT_TIMESTAMP),
    ('gravity-fed-sorter', 'Gravity Fed Parts Sorter', 'mechanical', 'Design a chute that sorts small parts by size without a powered actuator. Compare several slopes and slot spacings. Measure accuracy and jams per batch, then document how tolerances and surface finish affect the design.', ARRAY['cad', 'mechanisms', 'testing'], 'PUBLISHED', CURRENT_TIMESTAMP),
    ('offline-campus-map', 'Offline Campus Accessibility Map', 'software', 'Prototype a campus map that works offline and lets users compare routes by steps, ramps and distance. Use a small verified dataset, test routing and offline recovery, and evaluate how clearly the interface communicates uncertain or incomplete accessibility information.', ARRAY['web apps', 'accessibility', 'mapping'], 'PUBLISHED', CURRENT_TIMESTAMP),
    ('lab-equipment-booking', 'Lab Equipment Booking System', 'software', 'Design a booking tool for shared equipment with availability, reservations and a maintenance calendar. Test how the system handles simultaneous requests and measure task completion time against a spreadsheet workflow using synthetic data.', ARRAY['databases', 'web apps', 'usability'], 'PUBLISHED', CURRENT_TIMESTAMP),
    ('rainwater-demand-estimator', 'Rainwater Harvesting Feasibility Study', 'civil', 'Estimate how much water a campus roof can collect for nonpotable use. Compare tank sizes using historical rainfall and demand scenarios, and quantify how assumptions about roof area, runoff and dry spells affect reliability.', ARRAY['water', 'modeling', 'sustainability'], 'PUBLISHED', CURRENT_TIMESTAMP),
    ('campus-waste-audit', 'Campus Waste Sorting Audit', 'environmental', 'Design an observational audit of recycling contamination using approved sampling and aggregate counts. Compare bin labels or layouts across locations, and evaluate whether a change improves sorting without collecting personal information.', ARRAY['waste', 'field research', 'data analysis'], 'PUBLISHED', CURRENT_TIMESTAMP),
    ('repair-survey', 'Repair or Replace? A Student Decision Study', 'interdisciplinary', 'Explore how repair cost, time and access to spare parts shape students’ decisions about broken devices. Use a short voluntary survey or synthetic pilot, compare patterns across device types, and discuss sampling limits before proposing an intervention.', ARRAY['survey', 'circular economy', 'research methods'], 'PUBLISHED', CURRENT_TIMESTAMP);
