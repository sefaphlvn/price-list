package models

// OptionalEquipment represents optional equipment with prices (VW-specific)
type OptionalEquipment struct {
	Name  string  `json:"name" bson:"name"`
	Price float64 `json:"price" bson:"price"`
}

// PriceListRow mirrors the TypeScript PriceListRow interface exactly
type PriceListRow struct {
	// Core fields (required)
	Model        string  `json:"model" bson:"model"`
	Trim         string  `json:"trim" bson:"trim"`
	Engine       string  `json:"engine" bson:"engine"`
	Transmission string  `json:"transmission" bson:"transmission"`
	Fuel         string  `json:"fuel" bson:"fuel"`
	PriceRaw     string  `json:"priceRaw" bson:"priceRaw"`
	PriceNumeric float64 `json:"priceNumeric" bson:"priceNumeric"`
	Brand        string  `json:"brand" bson:"brand"`

	// Extended fields (optional)
	ModelYear            interface{} `json:"modelYear,omitempty" bson:"modelYear,omitempty"`                       // number | string
	OtvRate              *float64    `json:"otvRate,omitempty" bson:"otvRate,omitempty"`                           // OTV tax rate
	PriceListNumeric     *float64    `json:"priceListNumeric,omitempty" bson:"priceListNumeric,omitempty"`         // Original list price
	PriceCampaignNumeric *float64    `json:"priceCampaignNumeric,omitempty" bson:"priceCampaignNumeric,omitempty"` // Campaign price
	FuelConsumption      *string     `json:"fuelConsumption,omitempty" bson:"fuelConsumption,omitempty"`
	MonthlyLease         *float64    `json:"monthlyLease,omitempty" bson:"monthlyLease,omitempty"`

	// VW-specific
	NetPrice               *float64             `json:"netPrice,omitempty" bson:"netPrice,omitempty"`
	OtvAmount              *float64             `json:"otvAmount,omitempty" bson:"otvAmount,omitempty"`
	KdvAmount              *float64             `json:"kdvAmount,omitempty" bson:"kdvAmount,omitempty"`
	MtvAmount              *float64             `json:"mtvAmount,omitempty" bson:"mtvAmount,omitempty"`
	TrafficRegistrationFee *float64             `json:"trafficRegistrationFee,omitempty" bson:"trafficRegistrationFee,omitempty"`
	NotaryFee              *float64             `json:"notaryFee,omitempty" bson:"notaryFee,omitempty"`
	Origin                 *string              `json:"origin,omitempty" bson:"origin,omitempty"`
	OptionalEquipment      []OptionalEquipment  `json:"optionalEquipment,omitempty" bson:"optionalEquipment,omitempty"`

	// Toyota-specific
	OtvIncentivePrice *float64 `json:"otvIncentivePrice,omitempty" bson:"otvIncentivePrice,omitempty"`

	// EV/Powertrain fields
	BatteryCapacity    *float64 `json:"batteryCapacity,omitempty" bson:"batteryCapacity,omitempty"`
	PowerKW            *float64 `json:"powerKW,omitempty" bson:"powerKW,omitempty"`
	PowerHP            *float64 `json:"powerHP,omitempty" bson:"powerHP,omitempty"`
	EngineDisplacement *string  `json:"engineDisplacement,omitempty" bson:"engineDisplacement,omitempty"`
	EngineType         *string  `json:"engineType,omitempty" bson:"engineType,omitempty"`
	HasGSR             *bool    `json:"hasGSR,omitempty" bson:"hasGSR,omitempty"`
	HasTractionPlus    *bool    `json:"hasTractionPlus,omitempty" bson:"hasTractionPlus,omitempty"`
	IsElectric         *bool    `json:"isElectric,omitempty" bson:"isElectric,omitempty"`
	IsHybrid           *bool    `json:"isHybrid,omitempty" bson:"isHybrid,omitempty"`

	// Peugeot-specific & commercial
	TransmissionType *string  `json:"transmissionType,omitempty" bson:"transmissionType,omitempty"`
	EmissionStandard *string  `json:"emissionStandard,omitempty" bson:"emissionStandard,omitempty"`
	VehicleCategory  *string  `json:"vehicleCategory,omitempty" bson:"vehicleCategory,omitempty"`
	VehicleLength    *string  `json:"vehicleLength,omitempty" bson:"vehicleLength,omitempty"`
	CargoVolume      *float64 `json:"cargoVolume,omitempty" bson:"cargoVolume,omitempty"`
	SeatingCapacity  *string  `json:"seatingCapacity,omitempty" bson:"seatingCapacity,omitempty"`
	HasPanoramicRoof *bool    `json:"hasPanoramicRoof,omitempty" bson:"hasPanoramicRoof,omitempty"`

	// BYD-specific & EV
	DriveType *string  `json:"driveType,omitempty" bson:"driveType,omitempty"`
	WltpRange *float64 `json:"wltpRange,omitempty" bson:"wltpRange,omitempty"`

	// Opel-specific
	HasLongRange *bool `json:"hasLongRange,omitempty" bson:"hasLongRange,omitempty"`

	// BMW-specific & hybrid
	PowerHPSecondary *float64 `json:"powerHPSecondary,omitempty" bson:"powerHPSecondary,omitempty"`
	IsMildHybrid     *bool    `json:"isMildHybrid,omitempty" bson:"isMildHybrid,omitempty"`
	IsPlugInHybrid   *bool    `json:"isPlugInHybrid,omitempty" bson:"isPlugInHybrid,omitempty"`

	// Mercedes-specific
	IsAMG *bool `json:"isAMG,omitempty" bson:"isAMG,omitempty"`
}

// StoredData represents a brand's data for a specific date (MongoDB document)
type StoredData struct {
	CollectedAt string         `json:"collectedAt" bson:"collectedAt"`
	Brand       string         `json:"brand" bson:"brand"`
	BrandID     string         `json:"brandId" bson:"brandId"`
	RowCount    int            `json:"rowCount" bson:"rowCount"`
	Rows        []PriceListRow `json:"rows" bson:"rows"`
}

// VehicleDocument is the MongoDB document for the vehicles collection
type VehicleDocument struct {
	BrandID     string         `json:"brandId" bson:"brandId"`
	Brand       string         `json:"brand" bson:"brand"`
	Date        string         `json:"date" bson:"date"`
	CollectedAt string         `json:"collectedAt" bson:"collectedAt"`
	RowCount    int            `json:"rowCount" bson:"rowCount"`
	Rows        []PriceListRow `json:"rows" bson:"rows"`
}

// BrandIndexData represents index info for a single brand
type BrandIndexData struct {
	Name           string   `json:"name"`
	AvailableDates []string `json:"availableDates"`
	LatestDate     string   `json:"latestDate"`
	TotalRecords   int      `json:"totalRecords"`
}

// IndexData represents the full index response
type IndexData struct {
	LastUpdated string                    `json:"lastUpdated"`
	Brands      map[string]BrandIndexData `json:"brands"`
}

// LatestData represents the latest data response
type LatestData struct {
	GeneratedAt   string                       `json:"generatedAt"`
	TotalVehicles int                          `json:"totalVehicles"`
	Brands        map[string]LatestBrandData   `json:"brands"`
}

// LatestBrandData represents a brand's latest data in the latest response
type LatestBrandData struct {
	Name     string         `json:"name"`
	Date     string         `json:"date"`
	Vehicles []PriceListRow `json:"vehicles"`
}
