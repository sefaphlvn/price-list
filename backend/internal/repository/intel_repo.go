package repository

import (
	"context"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type IntelRepository struct {
	events       *mongo.Collection
	architecture *mongo.Collection
	gaps         *mongo.Collection
	promos       *mongo.Collection
	lifecycle    *mongo.Collection
	errors       *mongo.Collection
}

func NewIntelRepository(db *mongo.Database) *IntelRepository {
	return &IntelRepository{
		events:       db.Collection("intel_events"),
		architecture: db.Collection("intel_architecture"),
		gaps:         db.Collection("intel_gaps"),
		promos:       db.Collection("intel_promos"),
		lifecycle:    db.Collection("intel_lifecycle"),
		errors:       db.Collection("errors"),
	}
}

var latestSort = options.FindOne().SetSort(bson.D{{Key: "date", Value: -1}})

// getLatestRaw returns the latest document from a collection as raw bson.M
// This avoids struct decode issues and proxies data as-is to the frontend
func getLatestRaw(ctx context.Context, col *mongo.Collection, sort *options.FindOneOptionsBuilder) (bson.M, error) {
	var data bson.M
	err := col.FindOne(ctx, bson.D{}, sort).Decode(&data)
	if err != nil {
		return nil, err
	}
	// Remove MongoDB internal _id field from response
	delete(data, "_id")
	return data, nil
}

func (r *IntelRepository) GetEvents(ctx context.Context) (bson.M, error) {
	return getLatestRaw(ctx, r.events, latestSort)
}

func (r *IntelRepository) GetArchitecture(ctx context.Context) (bson.M, error) {
	return getLatestRaw(ctx, r.architecture, latestSort)
}

func (r *IntelRepository) GetGaps(ctx context.Context) (bson.M, error) {
	return getLatestRaw(ctx, r.gaps, latestSort)
}

func (r *IntelRepository) GetPromos(ctx context.Context) (bson.M, error) {
	return getLatestRaw(ctx, r.promos, latestSort)
}

func (r *IntelRepository) GetLifecycle(ctx context.Context) (bson.M, error) {
	return getLatestRaw(ctx, r.lifecycle, latestSort)
}

func (r *IntelRepository) GetErrors(ctx context.Context) (bson.M, error) {
	return getLatestRaw(ctx, r.errors, options.FindOne().SetSort(bson.D{{Key: "generatedAt", Value: -1}}))
}
