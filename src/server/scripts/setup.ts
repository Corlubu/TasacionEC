import { minioClient } from "../minio";
import { db } from "../db";
import bcryptjs from "bcryptjs";
import { env } from "../env";

async function setup() {
  // Setup MinIO buckets
  const buckets = ["property-photos", "legal-documents", "reports"];
  
  for (const bucket of buckets) {
    const exists = await minioClient.bucketExists(bucket);
    if (!exists) {
      await minioClient.makeBucket(bucket, "us-east-1");
      console.log(`Created bucket: ${bucket}`);
    }
  }
  
  // Set public read policy for property-photos bucket
  const publicReadPolicy = {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: { AWS: ["*"] },
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::property-photos/*`],
      },
    ],
  };
  
  try {
    await minioClient.setBucketPolicy(
      "property-photos",
      JSON.stringify(publicReadPolicy)
    );
    console.log("Set public read policy for property-photos bucket");
  } catch (error) {
    console.error("Error setting bucket policy:", error);
  }
  
  // Create default admin user if doesn't exist
  const adminEmail = "admin@tasacionec.com";
  const existingAdmin = await db.user.findUnique({
    where: { email: adminEmail },
  });
  
  if (!existingAdmin) {
    const hashedPassword = await bcryptjs.hash(env.ADMIN_PASSWORD, 10);
    await db.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: "Administrator",
        role: "ADMIN",
      },
    });
    console.log(`Created admin user: ${adminEmail}`);
  }
  
  // Setup PostGIS extension and spatial index for geospatial queries
  try {
    await db.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS postgis;`);
    console.log("PostGIS extension enabled");
    
    // Create GIST spatial index for efficient geospatial queries
    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS prop_geo_idx 
      ON "Property" 
      USING GIST (ST_MakePoint(longitude, latitude));
    `);
    console.log("Created GIST spatial index for Property geolocation");
  } catch (error) {
    console.error("Error setting up PostGIS:", error);
  }
}

setup()
  .then(() => {
    console.log("setup.ts complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
