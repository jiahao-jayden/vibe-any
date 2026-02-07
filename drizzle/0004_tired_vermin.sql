CREATE TABLE "waitlist" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);
