package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/spehlivan/price-list/backend/config"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func main() {
	cfg := config.Load()

	// Data directory path (relative to backend/)
	dataDir := "../data"
	for i := 1; i < len(os.Args); i++ {
		arg := os.Args[i]
		if arg == "-data" || arg == "--data" {
			if i+1 < len(os.Args) {
				dataDir = os.Args[i+1]
			}
			break
		} else if !strings.HasPrefix(arg, "-") {
			dataDir = arg
			break
		}
	}

	// Resolve absolute path
	absDataDir, err := filepath.Abs(dataDir)
	if err != nil {
		log.Fatalf("Failed to resolve data directory: %v", err)
	}
	log.Printf("Data directory: %s", absDataDir)

	// Connect to MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	client, err := mongo.Connect(options.Client().ApplyURI(cfg.MongoURI))
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer client.Disconnect(context.Background())

	if err := client.Ping(ctx, nil); err != nil {
		log.Fatalf("Failed to ping MongoDB: %v", err)
	}
	log.Println("Connected to MongoDB Atlas")

	db := client.Database(cfg.Database)

	// 1. Import vehicle data (data/YYYY/MM/brandId/DD.json)
	importVehicles(db, absDataDir)

	// 2. Import stats (data/stats/precomputed.json)
	importSingleFile(db, "stats", filepath.Join(absDataDir, "stats", "precomputed.json"))

	// 3. Import intel data
	intelFiles := map[string]string{
		"intel_events":       filepath.Join(absDataDir, "intel", "events.json"),
		"intel_architecture": filepath.Join(absDataDir, "intel", "architecture.json"),
		"intel_gaps":         filepath.Join(absDataDir, "intel", "gaps.json"),
		"intel_promos":       filepath.Join(absDataDir, "intel", "promos.json"),
		"intel_lifecycle":    filepath.Join(absDataDir, "intel", "lifecycle.json"),
	}
	for collection, filePath := range intelFiles {
		importSingleFile(db, collection, filePath)
	}

	// 4. Import errors
	importSingleFile(db, "errors", filepath.Join(absDataDir, "errors.json"))

	// 5. Import insights
	importSingleFile(db, "insights", filepath.Join(absDataDir, "insights", "latest.json"))

	// 6. Create indexes
	createIndexes(db)

	log.Println("Migration completed!")
}

func importVehicles(db *mongo.Database, dataDir string) {
	collection := db.Collection("vehicles")
	imported := 0
	skipped := 0

	// Walk through data/YYYY/MM/brandId/DD.json
	yearsDir := dataDir
	years, err := os.ReadDir(yearsDir)
	if err != nil {
		log.Printf("Warning: Could not read data directory: %v", err)
		return
	}

	for _, yearEntry := range years {
		if !yearEntry.IsDir() {
			continue
		}
		year := yearEntry.Name()
		// Only process year directories (e.g., "2026")
		if len(year) != 4 {
			continue
		}

		yearPath := filepath.Join(yearsDir, year)
		months, err := os.ReadDir(yearPath)
		if err != nil {
			continue
		}

		for _, monthEntry := range months {
			if !monthEntry.IsDir() {
				continue
			}
			month := monthEntry.Name()
			monthPath := filepath.Join(yearPath, month)

			brands, err := os.ReadDir(monthPath)
			if err != nil {
				continue
			}

			for _, brandEntry := range brands {
				if !brandEntry.IsDir() {
					continue
				}
				brandID := brandEntry.Name()
				brandPath := filepath.Join(monthPath, brandID)

				days, err := os.ReadDir(brandPath)
				if err != nil {
					continue
				}

				for _, dayEntry := range days {
					if dayEntry.IsDir() || !strings.HasSuffix(dayEntry.Name(), ".json") {
						continue
					}

					day := strings.TrimSuffix(dayEntry.Name(), ".json")
					date := fmt.Sprintf("%s-%s-%s", year, month, day)
					filePath := filepath.Join(brandPath, dayEntry.Name())

					// Read and parse JSON
					data, err := os.ReadFile(filePath)
					if err != nil {
						log.Printf("  Error reading %s: %v", filePath, err)
						continue
					}

					var doc bson.M
					if err := json.Unmarshal(data, &doc); err != nil {
						log.Printf("  Error parsing %s: %v", filePath, err)
						continue
					}

					// Add date field
					doc["date"] = date
					if _, ok := doc["brandId"]; !ok {
						doc["brandId"] = brandID
					}

					// Upsert: replace if already exists for this brand+date
					filter := bson.D{
						{Key: "brandId", Value: brandID},
						{Key: "date", Value: date},
					}
					opts := options.Replace().SetUpsert(true)
					_, err = collection.ReplaceOne(context.Background(), filter, doc, opts)
					if err != nil {
						log.Printf("  Error inserting %s/%s: %v", brandID, date, err)
						skipped++
						continue
					}
					imported++
				}
			}
		}
	}

	log.Printf("Vehicles: imported %d documents, skipped %d", imported, skipped)
}

func importSingleFile(db *mongo.Database, collectionName, filePath string) {
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		log.Printf("%s: file not found at %s, skipping", collectionName, filePath)
		return
	}

	data, err := os.ReadFile(filePath)
	if err != nil {
		log.Printf("%s: error reading file: %v", collectionName, err)
		return
	}

	var doc bson.M
	if err := json.Unmarshal(data, &doc); err != nil {
		log.Printf("%s: error parsing JSON: %v", collectionName, err)
		return
	}

	collection := db.Collection(collectionName)

	// Use date or generatedAt as unique key
	date, _ := doc["date"].(string)
	generatedAt, _ := doc["generatedAt"].(string)

	var filter bson.D
	if date != "" {
		filter = bson.D{{Key: "date", Value: date}}
	} else if generatedAt != "" {
		filter = bson.D{{Key: "generatedAt", Value: generatedAt}}
	} else {
		// No unique key, just insert
		_, err = collection.InsertOne(context.Background(), doc)
		if err != nil {
			log.Printf("%s: error inserting: %v", collectionName, err)
		} else {
			log.Printf("%s: inserted 1 document", collectionName)
		}
		return
	}

	opts := options.Replace().SetUpsert(true)
	_, err = collection.ReplaceOne(context.Background(), filter, doc, opts)
	if err != nil {
		log.Printf("%s: error upserting: %v", collectionName, err)
		return
	}
	log.Printf("%s: upserted 1 document", collectionName)
}

func createIndexes(db *mongo.Database) {
	log.Println("Creating indexes...")

	// vehicles: compound index on brandId + date
	vehiclesCol := db.Collection("vehicles")
	_, err := vehiclesCol.Indexes().CreateOne(context.Background(), mongo.IndexModel{
		Keys: bson.D{
			{Key: "brandId", Value: 1},
			{Key: "date", Value: -1},
		},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		log.Printf("Warning: vehicles index: %v", err)
	}

	// Date index for all collections that have date field
	dateCollections := []string{"stats", "intel_events", "intel_architecture", "intel_gaps", "intel_promos", "intel_lifecycle"}
	for _, name := range dateCollections {
		col := db.Collection(name)
		_, err := col.Indexes().CreateOne(context.Background(), mongo.IndexModel{
			Keys: bson.D{{Key: "date", Value: -1}},
		})
		if err != nil {
			log.Printf("Warning: %s index: %v", name, err)
		}
	}

	log.Println("Indexes created")
}
