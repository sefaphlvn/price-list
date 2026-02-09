package models

// === Events Data ===

type DateRange struct {
	Start     string `json:"start" bson:"start"`
	End       string `json:"end" bson:"end"`
	TotalDays int    `json:"totalDays" bson:"totalDays"`
}

type EventsSummary struct {
	TotalEvents          int     `json:"totalEvents" bson:"totalEvents"`
	NewVehicles          int     `json:"newVehicles" bson:"newVehicles"`
	RemovedVehicles      int     `json:"removedVehicles" bson:"removedVehicles"`
	PriceIncreases       int     `json:"priceIncreases" bson:"priceIncreases"`
	PriceDecreases       int     `json:"priceDecreases" bson:"priceDecreases"`
	AvgPriceChange       float64 `json:"avgPriceChange" bson:"avgPriceChange"`
	AvgPriceChangePercent float64 `json:"avgPriceChangePercent" bson:"avgPriceChangePercent"`
}

type PriceEvent struct {
	ID                  string   `json:"id" bson:"id"`
	Type                string   `json:"type" bson:"type"` // new, removed, price_increase, price_decrease
	VehicleID           string   `json:"vehicleId" bson:"vehicleId"`
	Brand               string   `json:"brand" bson:"brand"`
	BrandID             string   `json:"brandId" bson:"brandId"`
	Model               string   `json:"model" bson:"model"`
	Trim                string   `json:"trim" bson:"trim"`
	Engine              string   `json:"engine" bson:"engine"`
	Fuel                string   `json:"fuel" bson:"fuel"`
	Transmission        string   `json:"transmission" bson:"transmission"`
	OldPrice            *float64 `json:"oldPrice,omitempty" bson:"oldPrice,omitempty"`
	NewPrice            *float64 `json:"newPrice,omitempty" bson:"newPrice,omitempty"`
	OldPriceFormatted   *string  `json:"oldPriceFormatted,omitempty" bson:"oldPriceFormatted,omitempty"`
	NewPriceFormatted   *string  `json:"newPriceFormatted,omitempty" bson:"newPriceFormatted,omitempty"`
	PriceChange         *float64 `json:"priceChange,omitempty" bson:"priceChange,omitempty"`
	PriceChangePercent  *float64 `json:"priceChangePercent,omitempty" bson:"priceChangePercent,omitempty"`
	Date                string   `json:"date" bson:"date"`
	PreviousDate        *string  `json:"previousDate,omitempty" bson:"previousDate,omitempty"`
}

type VolatilityMetric struct {
	ID               string  `json:"id" bson:"id"`
	Name             string  `json:"name" bson:"name"`
	ChangeCount      int     `json:"changeCount" bson:"changeCount"`
	AvgChange        float64 `json:"avgChange" bson:"avgChange"`
	AvgChangePercent float64 `json:"avgChangePercent" bson:"avgChangePercent"`
	IncreaseCount    int     `json:"increaseCount" bson:"increaseCount"`
	DecreaseCount    int     `json:"decreaseCount" bson:"decreaseCount"`
}

type EventsData struct {
	GeneratedAt  string        `json:"generatedAt" bson:"generatedAt"`
	Date         string        `json:"date" bson:"date"`
	PreviousDate string        `json:"previousDate" bson:"previousDate"`
	DateRange    DateRange     `json:"dateRange" bson:"dateRange"`
	Summary      EventsSummary `json:"summary" bson:"summary"`
	Events       []PriceEvent  `json:"events" bson:"events"`
	Volatility   struct {
		ByBrand []VolatilityMetric `json:"byBrand" bson:"byBrand"`
		ByModel []VolatilityMetric `json:"byModel" bson:"byModel"`
	} `json:"volatility" bson:"volatility"`
	BigMoves struct {
		TopIncreases []PriceEvent `json:"topIncreases" bson:"topIncreases"`
		TopDecreases []PriceEvent `json:"topDecreases" bson:"topDecreases"`
	} `json:"bigMoves" bson:"bigMoves"`
}

// === Architecture Data ===

type TrimStep struct {
	Trim           string  `json:"trim" bson:"trim"`
	Price          float64 `json:"price" bson:"price"`
	PriceFormatted string  `json:"priceFormatted" bson:"priceFormatted"`
	StepFromBase   float64 `json:"stepFromBase" bson:"stepFromBase"`
	StepPercent    float64 `json:"stepPercent" bson:"stepPercent"`
	Engine         string  `json:"engine" bson:"engine"`
	Transmission   string  `json:"transmission" bson:"transmission"`
	Fuel           string  `json:"fuel" bson:"fuel"`
}

type TrimLadder struct {
	ID                 string     `json:"id" bson:"id"`
	Model              string     `json:"model" bson:"model"`
	Brand              string     `json:"brand" bson:"brand"`
	BrandID            string     `json:"brandId" bson:"brandId"`
	Trims              []TrimStep `json:"trims" bson:"trims"`
	BasePrice          float64    `json:"basePrice" bson:"basePrice"`
	TopPrice           float64    `json:"topPrice" bson:"topPrice"`
	PriceSpread        float64    `json:"priceSpread" bson:"priceSpread"`
	PriceSpreadPercent float64    `json:"priceSpreadPercent" bson:"priceSpreadPercent"`
	TrimCount          int        `json:"trimCount" bson:"trimCount"`
}

type CrossBrandEntry struct {
	Brand             string  `json:"brand" bson:"brand"`
	BrandID           string  `json:"brandId" bson:"brandId"`
	Model             string  `json:"model" bson:"model"`
	BasePrice         float64 `json:"basePrice" bson:"basePrice"`
	TopPrice          float64 `json:"topPrice" bson:"topPrice"`
	BasePriceFormatted string `json:"basePriceFormatted" bson:"basePriceFormatted"`
	TopPriceFormatted  string `json:"topPriceFormatted" bson:"topPriceFormatted"`
	TrimCount         int     `json:"trimCount" bson:"trimCount"`
}

type SegmentComparison struct {
	Segment     string            `json:"segment" bson:"segment"`
	Models      []CrossBrandEntry `json:"models" bson:"models"`
	AvgBasePrice float64          `json:"avgBasePrice" bson:"avgBasePrice"`
	AvgTopPrice  float64          `json:"avgTopPrice" bson:"avgTopPrice"`
}

type ArchitectureData struct {
	GeneratedAt          string              `json:"generatedAt" bson:"generatedAt"`
	Date                 string              `json:"date" bson:"date"`
	Ladders              []TrimLadder        `json:"ladders" bson:"ladders"`
	CrossBrandComparison []SegmentComparison `json:"crossBrandComparison" bson:"crossBrandComparison"`
	Summary              struct {
		TotalModels         int     `json:"totalModels" bson:"totalModels"`
		AvgTrimsPerModel    float64 `json:"avgTrimsPerModel" bson:"avgTrimsPerModel"`
		AvgPriceSpread      float64 `json:"avgPriceSpread" bson:"avgPriceSpread"`
		AvgPriceSpreadPercent float64 `json:"avgPriceSpreadPercent" bson:"avgPriceSpreadPercent"`
	} `json:"summary" bson:"summary"`
}

// === Gaps Data ===

type GapCell struct {
	Segment          string   `json:"segment" bson:"segment"`
	Fuel             string   `json:"fuel" bson:"fuel"`
	Transmission     string   `json:"transmission" bson:"transmission"`
	PriceRange       string   `json:"priceRange" bson:"priceRange"`
	PriceRangeMin    float64  `json:"priceRangeMin" bson:"priceRangeMin"`
	PriceRangeMax    float64  `json:"priceRangeMax" bson:"priceRangeMax"`
	VehicleCount     int      `json:"vehicleCount" bson:"vehicleCount"`
	Brands           []string `json:"brands" bson:"brands"`
	AvgPrice         float64  `json:"avgPrice" bson:"avgPrice"`
	HasGap           bool     `json:"hasGap" bson:"hasGap"`
	OpportunityScore float64  `json:"opportunityScore" bson:"opportunityScore"`
}

type SegmentSummary struct {
	Segment       string   `json:"segment" bson:"segment"`
	TotalVehicles int      `json:"totalVehicles" bson:"totalVehicles"`
	AvgPrice      float64  `json:"avgPrice" bson:"avgPrice"`
	MinPrice      float64  `json:"minPrice" bson:"minPrice"`
	MaxPrice      float64  `json:"maxPrice" bson:"maxPrice"`
	Brands        []string `json:"brands" bson:"brands"`
	FuelTypes     []string `json:"fuelTypes" bson:"fuelTypes"`
}

type PriceRangeInfo struct {
	Label string  `json:"label" bson:"label"`
	Min   float64 `json:"min" bson:"min"`
	Max   float64 `json:"max" bson:"max"`
}

type GapsData struct {
	GeneratedAt      string           `json:"generatedAt" bson:"generatedAt"`
	Date             string           `json:"date" bson:"date"`
	Summary          struct {
		TotalSegments        int     `json:"totalSegments" bson:"totalSegments"`
		TotalGaps            int     `json:"totalGaps" bson:"totalGaps"`
		TotalOpportunities   int     `json:"totalOpportunities" bson:"totalOpportunities"`
		AvgOpportunityScore  float64 `json:"avgOpportunityScore" bson:"avgOpportunityScore"`
	} `json:"summary" bson:"summary"`
	Segments         []SegmentSummary `json:"segments" bson:"segments"`
	HeatmapData      []GapCell        `json:"heatmapData" bson:"heatmapData"`
	TopOpportunities []GapCell        `json:"topOpportunities" bson:"topOpportunities"`
	PriceRanges      []PriceRangeInfo `json:"priceRanges" bson:"priceRanges"`
}

// === Promos Data ===

type PriceHistory struct {
	Date  string  `json:"date" bson:"date"`
	Price float64 `json:"price" bson:"price"`
}

type PriceDrop struct {
	ID                    string         `json:"id" bson:"id"`
	Brand                 string         `json:"brand" bson:"brand"`
	BrandID               string         `json:"brandId" bson:"brandId"`
	Model                 string         `json:"model" bson:"model"`
	Trim                  string         `json:"trim" bson:"trim"`
	Engine                string         `json:"engine" bson:"engine"`
	Fuel                  string         `json:"fuel" bson:"fuel"`
	Transmission          string         `json:"transmission" bson:"transmission"`
	CurrentPrice          float64        `json:"currentPrice" bson:"currentPrice"`
	CurrentPriceFormatted string         `json:"currentPriceFormatted" bson:"currentPriceFormatted"`
	PeakPrice             float64        `json:"peakPrice" bson:"peakPrice"`
	PeakPriceFormatted    string         `json:"peakPriceFormatted" bson:"peakPriceFormatted"`
	PeakDate              string         `json:"peakDate" bson:"peakDate"`
	DropAmount            float64        `json:"dropAmount" bson:"dropAmount"`
	DropPercent           float64        `json:"dropPercent" bson:"dropPercent"`
	DaysSincePeak         int            `json:"daysSincePeak" bson:"daysSincePeak"`
	PriceHistoryList      []PriceHistory `json:"priceHistory" bson:"priceHistory"`
	ListPrice             *float64       `json:"listPrice,omitempty" bson:"listPrice,omitempty"`
	CampaignPrice         *float64       `json:"campaignPrice,omitempty" bson:"campaignPrice,omitempty"`
	CampaignDiscount      *float64       `json:"campaignDiscount,omitempty" bson:"campaignDiscount,omitempty"`
	OtvRate               *float64       `json:"otvRate,omitempty" bson:"otvRate,omitempty"`
}

type RecentDrop struct {
	ID               string   `json:"id" bson:"id"`
	Brand            string   `json:"brand" bson:"brand"`
	BrandID          string   `json:"brandId" bson:"brandId"`
	Model            string   `json:"model" bson:"model"`
	Trim             string   `json:"trim" bson:"trim"`
	Engine           string   `json:"engine" bson:"engine"`
	CurrentPrice     float64  `json:"currentPrice" bson:"currentPrice"`
	PreviousPrice    float64  `json:"previousPrice" bson:"previousPrice"`
	DropAmount       float64  `json:"dropAmount" bson:"dropAmount"`
	DropPercent      float64  `json:"dropPercent" bson:"dropPercent"`
	Date             string   `json:"date" bson:"date"`
	PreviousDate     string   `json:"previousDate" bson:"previousDate"`
	ListPrice        *float64 `json:"listPrice,omitempty" bson:"listPrice,omitempty"`
	CampaignPrice    *float64 `json:"campaignPrice,omitempty" bson:"campaignPrice,omitempty"`
	CampaignDiscount *float64 `json:"campaignDiscount,omitempty" bson:"campaignDiscount,omitempty"`
	OtvRate          *float64 `json:"otvRate,omitempty" bson:"otvRate,omitempty"`
}

type BrandDropSummary struct {
	BrandID       string  `json:"brandId" bson:"brandId"`
	Brand         string  `json:"brand" bson:"brand"`
	DropCount     int     `json:"dropCount" bson:"dropCount"`
	AvgDropPercent float64 `json:"avgDropPercent" bson:"avgDropPercent"`
}

type PromosData struct {
	GeneratedAt  string    `json:"generatedAt" bson:"generatedAt"`
	Date         string    `json:"date" bson:"date"`
	Summary      struct {
		TotalPriceDrops  int     `json:"totalPriceDrops" bson:"totalPriceDrops"`
		TotalRecentDrops int     `json:"totalRecentDrops" bson:"totalRecentDrops"`
		AvgDropPercent   float64 `json:"avgDropPercent" bson:"avgDropPercent"`
		MaxDropPercent   float64 `json:"maxDropPercent" bson:"maxDropPercent"`
		BrandsWithDrops  int     `json:"brandsWithDrops" bson:"brandsWithDrops"`
	} `json:"summary" bson:"summary"`
	PriceDrops   []PriceDrop        `json:"priceDrops" bson:"priceDrops"`
	RecentDrops  []RecentDrop       `json:"recentDrops" bson:"recentDrops"`
	BrandSummary []BrandDropSummary `json:"brandSummary" bson:"brandSummary"`
}

// === Lifecycle Data ===

type ModelYearTransition struct {
	ID               string  `json:"id" bson:"id"`
	Brand            string  `json:"brand" bson:"brand"`
	BrandID          string  `json:"brandId" bson:"brandId"`
	Model            string  `json:"model" bson:"model"`
	OldYear          string  `json:"oldYear" bson:"oldYear"`
	NewYear          string  `json:"newYear" bson:"newYear"`
	OldEntryPrice    float64 `json:"oldEntryPrice" bson:"oldEntryPrice"`
	NewEntryPrice    float64 `json:"newEntryPrice" bson:"newEntryPrice"`
	PriceDelta       float64 `json:"priceDelta" bson:"priceDelta"`
	PriceDeltaPercent float64 `json:"priceDeltaPercent" bson:"priceDeltaPercent"`
	TransitionDate   string  `json:"transitionDate" bson:"transitionDate"`
	TrimCount        int     `json:"trimCount" bson:"trimCount"`
}

type EntryPriceDelta struct {
	ID                 string  `json:"id" bson:"id"`
	Brand              string  `json:"brand" bson:"brand"`
	BrandID            string  `json:"brandId" bson:"brandId"`
	Model              string  `json:"model" bson:"model"`
	CurrentEntryPrice  float64 `json:"currentEntryPrice" bson:"currentEntryPrice"`
	PreviousEntryPrice float64 `json:"previousEntryPrice" bson:"previousEntryPrice"`
	Delta              float64 `json:"delta" bson:"delta"`
	DeltaPercent       float64 `json:"deltaPercent" bson:"deltaPercent"`
	CurrentDate        string  `json:"currentDate" bson:"currentDate"`
	PreviousDate       string  `json:"previousDate" bson:"previousDate"`
	DaysBetween        int     `json:"daysBetween" bson:"daysBetween"`
}

type StaleModel struct {
	ID               string  `json:"id" bson:"id"`
	Brand            string  `json:"brand" bson:"brand"`
	BrandID          string  `json:"brandId" bson:"brandId"`
	Model            string  `json:"model" bson:"model"`
	LastUpdateDate   string  `json:"lastUpdateDate" bson:"lastUpdateDate"`
	DaysSinceUpdate  int     `json:"daysSinceUpdate" bson:"daysSinceUpdate"`
	CurrentEntryPrice float64 `json:"currentEntryPrice" bson:"currentEntryPrice"`
	TrimCount        int     `json:"trimCount" bson:"trimCount"`
}

type ModelInfo struct {
	Brand       string   `json:"brand" bson:"brand"`
	BrandID     string   `json:"brandId" bson:"brandId"`
	Model       string   `json:"model" bson:"model"`
	EntryPrice  float64  `json:"entryPrice" bson:"entryPrice"`
	TopPrice    float64  `json:"topPrice" bson:"topPrice"`
	TrimCount   int      `json:"trimCount" bson:"trimCount"`
	FuelTypes   []string `json:"fuelTypes" bson:"fuelTypes"`
	LastUpdated string   `json:"lastUpdated" bson:"lastUpdated"`
}

type LifecycleData struct {
	GeneratedAt          string                `json:"generatedAt" bson:"generatedAt"`
	Date                 string                `json:"date" bson:"date"`
	Summary              struct {
		TotalModels        int     `json:"totalModels" bson:"totalModels"`
		TotalTransitions   int     `json:"totalTransitions" bson:"totalTransitions"`
		TotalStaleModels   int     `json:"totalStaleModels" bson:"totalStaleModels"`
		AvgEntryPriceDelta float64 `json:"avgEntryPriceDelta" bson:"avgEntryPriceDelta"`
	} `json:"summary" bson:"summary"`
	ModelYearTransitions []ModelYearTransition `json:"modelYearTransitions" bson:"modelYearTransitions"`
	EntryPriceDeltas     []EntryPriceDelta     `json:"entryPriceDeltas" bson:"entryPriceDeltas"`
	StaleModels          []StaleModel          `json:"staleModels" bson:"staleModels"`
	AllModels            []ModelInfo           `json:"allModels" bson:"allModels"`
}

// === Errors Data ===

type ErrorEntry struct {
	Timestamp string `json:"timestamp" bson:"timestamp"`
	Category  string `json:"category" bson:"category"`
	Severity  string `json:"severity" bson:"severity"`
	Source    string `json:"source" bson:"source"`
	Message   string `json:"message" bson:"message"`
}

type ErrorsData struct {
	GeneratedAt string `json:"generatedAt" bson:"generatedAt"`
	ClearedAt   string `json:"clearedAt" bson:"clearedAt"`
	Errors      []ErrorEntry `json:"errors" bson:"errors"`
	Summary     struct {
		Total      int            `json:"total" bson:"total"`
		ByCategory map[string]int `json:"byCategory" bson:"byCategory"`
		BySeverity map[string]int `json:"bySeverity" bson:"bySeverity"`
		BySource   map[string]int `json:"bySource" bson:"bySource"`
	} `json:"summary" bson:"summary"`
}
