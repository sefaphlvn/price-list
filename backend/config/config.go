package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	MongoURI    string
	Database    string
	Port        string
	GinMode     string
	CORSOrigins string
}

func Load() *Config {
	// Load .env file if it exists (ignore error if not found)
	_ = godotenv.Load()

	// Build MongoDB Atlas connection string from user/pass env vars
	mongoUser := getEnv("MONGO_USER", "pricelist")
	mongoPass := getEnv("MONGO_PASS", "")
	mongoURI := getEnv("MONGO_URI", "")

	// If MONGO_URI is not set directly, build it from user/pass
	if mongoURI == "" && mongoPass != "" {
		mongoURI = fmt.Sprintf(
			"mongodb+srv://%s:%s@pricelist.qzaqcnd.mongodb.net/?appName=pricelist",
			mongoUser, mongoPass,
		)
	} else if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}

	return &Config{
		MongoURI:    mongoURI,
		Database:    getEnv("MONGO_DATABASE", "pricelist"),
		Port:        getEnv("PORT", "8080"),
		GinMode:     getEnv("GIN_MODE", "debug"),
		CORSOrigins: getEnv("CORS_ORIGINS", "http://localhost:5173"),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
