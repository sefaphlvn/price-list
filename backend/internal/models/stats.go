package models

// OverallStats represents aggregate price statistics
type OverallStats struct {
	AvgPrice    float64 `json:"avgPrice" bson:"avgPrice"`
	MinPrice    float64 `json:"minPrice" bson:"minPrice"`
	MaxPrice    float64 `json:"maxPrice" bson:"maxPrice"`
	MedianPrice float64 `json:"medianPrice" bson:"medianPrice"`
}

// BrandStats represents statistics for a single brand
type BrandStats struct {
	Name         string  `json:"name" bson:"name"`
	VehicleCount int     `json:"vehicleCount" bson:"vehicleCount"`
	AvgPrice     float64 `json:"avgPrice" bson:"avgPrice"`
	MinPrice     float64 `json:"minPrice" bson:"minPrice"`
	MaxPrice     float64 `json:"maxPrice" bson:"maxPrice"`
	MedianPrice  float64 `json:"medianPrice" bson:"medianPrice"`
}

// StatsData represents the precomputed statistics document
type StatsData struct {
	GeneratedAt   string       `json:"generatedAt" bson:"generatedAt"`
	TotalVehicles int          `json:"totalVehicles" bson:"totalVehicles"`
	OverallStats  OverallStats `json:"overallStats" bson:"overallStats"`
	BrandStats    []BrandStats `json:"brandStats" bson:"brandStats"`
}
