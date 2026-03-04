import { integer, pgTable, varchar, text, uuid } from "drizzle-orm/pg-core";


export const users = pgTable("users", {
  userId: uuid("userId").defaultRandom().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  projects: text().array().default([]).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(), 
  accessPointId: varchar({ length: 255 }).notNull(), 
  refreshToken: varchar({length: 255})
});
