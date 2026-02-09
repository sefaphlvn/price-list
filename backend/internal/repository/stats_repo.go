package repository

import (
	"context"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type StatsRepository struct {
	collection *mongo.Collection
}

func NewStatsRepository(db *mongo.Database) *StatsRepository {
	return &StatsRepository{
		collection: db.Collection("stats"),
	}
}

// EnsureIndexes creates the required MongoDB indexes for stats
func (r *StatsRepository) EnsureIndexes(ctx context.Context) error {
	_, err := r.collection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "generatedAt", Value: -1}},
	})
	return err
}

// GetLatest returns the most recent stats document as raw bson.M
func (r *StatsRepository) GetLatest(ctx context.Context) (bson.M, error) {
	opts := options.FindOne().SetSort(bson.D{{Key: "generatedAt", Value: -1}})

	var data bson.M
	err := r.collection.FindOne(ctx, bson.D{}, opts).Decode(&data)
	if err != nil {
		return nil, err
	}
	delete(data, "_id")
	return data, nil
}
