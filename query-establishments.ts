import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema";

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection, { schema, mode: "default" });
  
  const establishments = await db.select({
    id: schema.establishments.id,
    userId: schema.establishments.userId,
    name: schema.establishments.name,
    menuSlug: schema.establishments.menuSlug,
    rating: schema.establishments.rating,
    reviewCount: schema.establishments.reviewCount,
  }).from(schema.establishments);
  
  console.log(JSON.stringify(establishments, null, 2));
  await connection.end();
}

main().catch(console.error);
