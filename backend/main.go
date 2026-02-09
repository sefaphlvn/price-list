package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/spehlivan/price-list/backend/config"
	"github.com/spehlivan/price-list/backend/internal/handlers"
	"github.com/spehlivan/price-list/backend/internal/middleware"
	"github.com/spehlivan/price-list/backend/internal/repository"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Set Gin mode
	gin.SetMode(cfg.GinMode)

	// Connect to MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOpts := options.Client().ApplyURI(cfg.MongoURI)
	client, err := mongo.Connect(clientOpts)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}

	// Verify connection
	if err := client.Ping(ctx, nil); err != nil {
		log.Fatalf("Failed to ping MongoDB: %v", err)
	}
	log.Println("Connected to MongoDB")

	db := client.Database(cfg.Database)

	// Initialize repositories
	vehicleRepo := repository.NewVehicleRepository(db)
	statsRepo := repository.NewStatsRepository(db)
	intelRepo := repository.NewIntelRepository(db)

	// Ensure indexes
	if err := vehicleRepo.EnsureIndexes(context.Background()); err != nil {
		log.Printf("Warning: Failed to ensure indexes: %v", err)
	}

	// Initialize handlers
	healthHandler := handlers.NewHealthHandler()
	vehicleHandler := handlers.NewVehicleHandler(vehicleRepo)
	statsHandler := handlers.NewStatsHandler(statsRepo)
	intelHandler := handlers.NewIntelHandler(intelRepo)

	// Setup router
	r := gin.Default()

	// CORS middleware
	r.Use(middleware.CORSMiddleware(cfg.CORSOrigins))

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		v1.GET("/health", healthHandler.Health)
		v1.GET("/index", vehicleHandler.GetIndex)
		v1.GET("/latest", vehicleHandler.GetLatest)
		v1.GET("/vehicles", vehicleHandler.GetVehicles)
		v1.GET("/trend", vehicleHandler.GetTrend)
		v1.GET("/stats", statsHandler.GetStats)

		// Intel routes
		intel := v1.Group("/intel")
		{
			intel.GET("/events", intelHandler.GetEvents)
			intel.GET("/architecture", intelHandler.GetArchitecture)
			intel.GET("/gaps", intelHandler.GetGaps)
			intel.GET("/promos", intelHandler.GetPromos)
			intel.GET("/lifecycle", intelHandler.GetLifecycle)
		}

		v1.GET("/errors", intelHandler.GetErrors)
		v1.GET("/insights", intelHandler.GetInsights)
	}

	// Create HTTP server
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Server starting on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	if err := client.Disconnect(shutdownCtx); err != nil {
		log.Printf("Error disconnecting MongoDB: %v", err)
	}

	log.Println("Server exited")
}
